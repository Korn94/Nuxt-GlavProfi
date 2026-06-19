// server/middleware/auth.ts
/**
 * Централизованный middleware для проверки авторизации и прав доступа
 * 
 * 🆕 Новая архитектура (без legacy):
 * - Читает права из БД (permissions_role_access + permissions_user_overrides)
 * - Использует кэширование для производительности (5 минут)
 * - Детализированные страницы: comings, expenses, materials, works, contractors, price, portfolio
 * - Упрощённые действия: view, create, edit, delete, special
 * 
 * ⚠️ Права определяются ТОЛЬКО на сервере — клиент не может их обойти.
 */

import { defineEventHandler, createError } from 'h3'
import { verifyAuth } from '../utils/auth'
import { db } from '../db'
import { permissionsRoleAccess, permissionsUserOverrides } from '../db/schema'
import { eq, and, or, isNull, gt, sql } from 'drizzle-orm'
import type { users } from '../db/schema'

// Тип пользователя из БД
type DbUser = typeof users.$inferSelect

// ============================================
// 1. ИЕРАРХИЯ РОЛЕЙ (локально, без legacy импортов)
// ============================================
const ROLE_LEVELS: Record<string, number> = {
  worker: 1,
  master: 2,
  foreman: 3,
  manager: 4,
  admin: 5
}

// ============================================
// 2. ТИПЫ ДЛЯ КОНФИГУРАЦИИ ПРАВ
// ============================================

export type PageAction = 'view' | 'create' | 'edit' | 'delete' | 'special'

export interface PathRequirement {
  type: 'page' | 'role' | 'custom'
  value: string | ((user: DbUser) => boolean | Promise<boolean>)
  action?: PageAction // Для type: 'page'
  message?: string
}

// ============================================
// 3. КЭШИРОВАНИЕ ПРАВ
// ============================================

interface CachedPermissions {
  permissions: Record<string, any>
  timestamp: number
}

const permissionsCache = new Map<number, CachedPermissions>()
const CACHE_TTL = 5 * 60 * 1000 // 5 минут

/**
 * Получить права пользователя из БД с кэшированием
 * Упрощённая система: canView, canCreate, canEdit, canDelete, canSpecial
 */
async function getUserPermissionsFromDb(user: DbUser): Promise<Record<string, any>> {
  const now = Date.now()
  const cached = permissionsCache.get(user.id)
  
  // Возвращаем из кэша если не истёк
  if (cached && now - cached.timestamp < CACHE_TTL) {
    return cached.permissions
  }

  // Получаем права роли из БД
  const roleAccess = await db
    .select({
      pageSlug: permissionsRoleAccess.pageSlug,
      canView: permissionsRoleAccess.canView,
      canCreate: permissionsRoleAccess.canCreate,
      canEdit: permissionsRoleAccess.canEdit,
      canDelete: permissionsRoleAccess.canDelete,
      canSpecial: permissionsRoleAccess.canSpecial,
    })
    .from(permissionsRoleAccess)
    .where(
      and(
        eq(permissionsRoleAccess.role, user.role as any),
        eq(permissionsRoleAccess.isActive, true)
      )
    )

  const permissions: Record<string, any> = {}
  for (const access of roleAccess) {
    permissions[access.pageSlug] = {
      canView: access.canView,
      canCreate: access.canCreate,
      canEdit: access.canEdit,
      canDelete: access.canDelete,
      canSpecial: access.canSpecial,
    }
  }

  // Получаем переопределения пользователя
  const overrides = await db
    .select({
      pageSlug: permissionsUserOverrides.pageSlug,
      canView: permissionsUserOverrides.canView,
      canCreate: permissionsUserOverrides.canCreate,
      canEdit: permissionsUserOverrides.canEdit,
      canDelete: permissionsUserOverrides.canDelete,
      canSpecial: permissionsUserOverrides.canSpecial,
    })
    .from(permissionsUserOverrides)
    .where(
      and(
        eq(permissionsUserOverrides.userId, user.id),
        eq(permissionsUserOverrides.isActive, true),
        or(
          isNull(permissionsUserOverrides.expiresAt),
          gt(permissionsUserOverrides.expiresAt, sql`NOW()`)
        )
      )
    )

  // Применяем переопределения (null = использовать права роли)
  for (const override of overrides) {
    if (!permissions[override.pageSlug]) {
      permissions[override.pageSlug] = {
        canView: false,
        canCreate: false,
        canEdit: false,
        canDelete: false,
        canSpecial: false,
      }
    }

    const target = permissions[override.pageSlug]
    if (override.canView !== null) target.canView = override.canView
    if (override.canCreate !== null) target.canCreate = override.canCreate
    if (override.canEdit !== null) target.canEdit = override.canEdit
    if (override.canDelete !== null) target.canDelete = override.canDelete
    if (override.canSpecial !== null) target.canSpecial = override.canSpecial
  }

  // Сохраняем в кэш
  permissionsCache.set(user.id, { permissions, timestamp: now })
  
  return permissions
}

/**
 * Проверить право пользователя на действие для страницы
 */
async function checkPagePermission(
  user: DbUser,
  pageSlug: string,
  action: PageAction
): Promise<boolean> {
  const permissions = await getUserPermissionsFromDb(user)
  const pagePerms = permissions[pageSlug]
  
  if (!pagePerms) return false

  switch (action) {
    case 'view':
      return pagePerms.canView
    case 'create':
      return pagePerms.canView && pagePerms.canCreate
    case 'edit':
      return pagePerms.canView && pagePerms.canEdit
    case 'delete':
      return pagePerms.canView && pagePerms.canDelete
    case 'special':
      return pagePerms.canView && pagePerms.canSpecial
    default:
      return false
  }
}

/**
 * Инвалидировать кэш прав пользователя (вызывать после изменения прав)
 */
export function invalidatePermissionsCache(userId: number) {
  permissionsCache.delete(userId)
}

/**
 * 🆕 Инвалидировать кэш прав для ВСЕХ пользователей с определённой ролью
 * Вызывается после обновления прав роли через UI
 */
export async function invalidatePermissionsCacheByRole(role: string) {
  const { db } = await import('../db')
  const { users } = await import('../db/schema')
  const { eq } = await import('drizzle-orm')
  
  // Получаем всех пользователей с этой ролью
  const usersWithRole = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.role, role as any))
  
  // Инвалидируем кэш для каждого
  let invalidatedCount = 0
  for (const user of usersWithRole) {
    if (permissionsCache.has(user.id)) {
      permissionsCache.delete(user.id)
      invalidatedCount++
    }
  }
  
  console.log(`[Permissions Cache] 🧹 Инвалидирован кэш для ${invalidatedCount}/${usersWithRole.length} пользователей роли ${role}`)
  return { total: usersWithRole.length, invalidated: invalidatedCount }
}

// ============================================
// 4. БЕЛЫЙ СПИСОК ПУБЛИЧНЫХ ENDPOINT'ОВ
// ============================================

const PUBLIC_PATHS = [
  '/api/auth/login',
  '/api/auth/telegram',
  '/api/auth/check',
  '/api/auth/logout',
  '/api/permissions',
  '/api/me',
  // Публичные endpoints прайс-листа (для калькулятора на сайте)
  '/api/price/list',
  '/api/price/list/',
  '/api/price/calc/',
  '/api/price/categories',
  '/api/price/subcategories',
  '/api/price/items',
  '/api/price/pages',
  '/api/price/details',
  '/api/price/dopworks',
  // Публичная страница портфолио
  '/api/portfolio',
  '/api/portfolio/**',
  // Служебные
  '/api/send-message',
  '/api/_nuxt_icon',
  '/api/_nuxt_icon/**',
  '/api/**/*.map',
  '/**/*.map',
]

// ============================================
// 5. КОНФИГУРАЦИЯ ПРАВ ПО ENDPOINT'AM (НОВАЯ ДЕТАЛИЗИРОВАННАЯ СИСТЕМА)
// ============================================

const PROTECTED_PATHS: Record<string, PathRequirement> = {
  // 🔐 Авторизация
  '/api/auth/logout': { type: 'page', value: 'dashboard', action: 'view' },

  // 📊 Дашборд
  '/api/analytics': { type: 'page', value: 'dashboard', action: 'view' },

  // ═══════════════════════════════════════════════════════════════
  // 🏗️ ОБЪЕКТЫ (objects)
  // ═══════════════════════════════════════════════════════════════
  '/api/objects': { type: 'page', value: 'objects', action: 'view' },
  '/api/objects/': { type: 'page', value: 'objects', action: 'create' },
  '/api/objects/[id]': { type: 'page', value: 'objects', action: 'view' },
  '/api/objects/[id]/full': { type: 'page', value: 'objects', action: 'view' },
  '/api/objects/[id]/contract': { type: 'page', value: 'objects', action: 'view' },
  '/api/objects/[id]/balance': { type: 'page', value: 'objects', action: 'view' },
  '/api/objects/[id]/operations': { type: 'page', value: 'objects', action: 'view' },
  '/api/objects/[id]/comings': { type: 'page', value: 'objects', action: 'view' },
  '/api/objects/[id]/expenses': { type: 'page', value: 'objects', action: 'view' },
  '/api/objects/contract/[id]': { type: 'page', value: 'objects', action: 'edit' },

  // Смета (budget) — часть объектов
  '/api/objects/[id]/budget': { type: 'page', value: 'objects', action: 'view' },
  '/api/objects/budget/[id]': { type: 'page', value: 'objects', action: 'edit' },
  '/api/objects/budget/[id]/status': { type: 'page', value: 'objects', action: 'edit' },

  // Акты (acts) — часть объектов
  '/api/objects/[id]/acts': { type: 'page', value: 'objects', action: 'view' },
  '/api/objects/acts/[id]': { type: 'page', value: 'objects', action: 'edit' },

  // Счета (invoices) — часть объектов
  '/api/objects/[id]/invoices': { type: 'page', value: 'objects', action: 'view' },
  '/api/objects/invoices/[id]': { type: 'page', value: 'objects', action: 'edit' },

  // ═══════════════════════════════════════════════════════════════
  // 💰 ПРИХОДЫ (comings) — выделено из finance
  // ═══════════════════════════════════════════════════════════════
  '/api/comings': { type: 'page', value: 'comings', action: 'view' },
  '/api/comings/[id]': { type: 'page', value: 'comings', action: 'view' },

  // ═══════════════════════════════════════════════════════════════
  // 💸 РАСХОДЫ (expenses) — выделено из finance
  // ═══════════════════════════════════════════════════════════════
  '/api/expenses': { type: 'page', value: 'expenses', action: 'view' },
  '/api/expenses/[id]': { type: 'page', value: 'expenses', action: 'view' },
  '/api/expenses/stats': { type: 'page', value: 'expenses', action: 'view' },
  '/api/balance': { type: 'page', value: 'expenses', action: 'view' },
  '/api/salary-deductions': { type: 'page', value: 'expenses', action: 'view' },

  // ═══════════════════════════════════════════════════════════════
  // 📦 МАТЕРИАЛЫ (materials) — выделено из finance
  // ═══════════════════════════════════════════════════════════════
  '/api/materials': { type: 'page', value: 'materials', action: 'view' },
  '/api/materials/[id]': { type: 'page', value: 'materials', action: 'view' },
  '/api/materials/toggle-check/[id]': { type: 'page', value: 'materials', action: 'special' },

  // ═══════════════════════════════════════════════════════════════
  // 🔨 РАБОТЫ (works) — выделено из objects/workers
  // ═══════════════════════════════════════════════════════════════
  '/api/works': { type: 'page', value: 'works', action: 'view' },
  '/api/works/[id]': { type: 'page', value: 'works', action: 'view' },
  '/api/works/daily-work/active-objects': { type: 'page', value: 'works', action: 'view' },
  '/api/works/daily-work/daily-assignments': { type: 'page', value: 'works', action: 'view' },
  '/api/works/daily-work/workers-with-daily-rate': { type: 'page', value: 'works', action: 'view' },
  '/api/works/daily-work/bulk': { type: 'page', value: 'works', action: 'create' },
  
  // Специфичные операции (hasSpecial)
  '/api/works/accept/[id]': { type: 'page', value: 'works', action: 'special' },
  '/api/works/reject/[id]': { type: 'page', value: 'works', action: 'special' },
  '/api/works/pay-work/[id]': { type: 'page', value: 'works', action: 'special' },
  '/api/works/create-and-pay': { type: 'page', value: 'works', action: 'special' },

  // ═══════════════════════════════════════════════════════════════
  // 👥 КОНТРАГЕНТЫ (contractors) — выделено из workers
  // ═══════════════════════════════════════════════════════════════
  '/api/contractors/[type]': { type: 'page', value: 'contractors', action: 'view' },
  '/api/contractors/[type]/[id]': { type: 'page', value: 'contractors', action: 'view' },
  '/api/contractors/[type]/[id]/expenses': { type: 'page', value: 'contractors', action: 'view' },
  '/api/contractors/[type]/[id]/incomes': { type: 'page', value: 'contractors', action: 'view' },
  '/api/contractors/[type]/[id]/recalculate-balance': { type: 'page', value: 'contractors', action: 'special' },

  // ═══════════════════════════════════════════════════════════════
  // 💲 ПРАЙС-ЛИСТ (price)
  // ═══════════════════════════════════════════════════════════════
  '/api/price/[entity]': { type: 'page', value: 'price', action: 'create' },
  '/api/price/[entity]/[id]': { type: 'page', value: 'price', action: 'edit' },
  '/api/price/[entity]/reorder': { type: 'page', value: 'price', action: 'special' },

  // ═══════════════════════════════════════════════════════════════
  // 📁 ПОРТФОЛИО (portfolio)
  // ═══════════════════════════════════════════════════════════════
  '/api/portfolio/[slug]': { type: 'page', value: 'portfolio', action: 'view' },
  '/api/portfolio/[slug]/images': { type: 'page', value: 'portfolio', action: 'view' },
  '/api/portfolio/[slug]/works': { type: 'page', value: 'portfolio', action: 'view' },
  '/api/portfolio/[slug]/size': { type: 'page', value: 'portfolio', action: 'view' },

  // ═══════════════════════════════════════════════════════════════
  // 📋 ДОСКИ ЗАДАЧ (boards) — привязаны к objects
  // ═══════════════════════════════════════════════════════════════
  '/api/boards': { type: 'page', value: 'dashboard', action: 'view' },
  '/api/boards/folders': { type: 'page', value: 'dashboard', action: 'view' },
  '/api/boards/folders/[id]': { type: 'page', value: 'dashboard', action: 'view' },
  '/api/boards/folders/[id]/boards': { type: 'page', value: 'dashboard', action: 'view' },
  '/api/boards/folders/order': { type: 'page', value: 'objects', action: 'edit' },
  '/api/boards/tags': { type: 'page', value: 'dashboard', action: 'view' },
  '/api/boards/[id]': { type: 'page', value: 'dashboard', action: 'view' },
  '/api/boards/[id]/columns': { type: 'page', value: 'dashboard', action: 'view' },
  '/api/boards/[id]/columns/order': { type: 'page', value: 'objects', action: 'edit' },
  '/api/boards/[id]/tasks': { type: 'page', value: 'dashboard', action: 'view' },
  '/api/boards/[id]/tasks/order': { type: 'page', value: 'objects', action: 'edit' },
  '/api/boards/tasks/[id]': { type: 'page', value: 'dashboard', action: 'view' },
  '/api/boards/tasks/[id]/subtasks': { type: 'page', value: 'dashboard', action: 'view' },
  '/api/boards/tasks/[id]/attachments': { type: 'page', value: 'dashboard', action: 'view' },
  '/api/boards/tasks/[id]/comments': { type: 'page', value: 'dashboard', action: 'view' },
  '/api/boards/tasks/[id]/tags': { type: 'page', value: 'dashboard', action: 'view' },
  '/api/boards/subtasks/[id]': { type: 'page', value: 'dashboard', action: 'view' },
  '/api/boards/subtasks/[id]/complete': { type: 'page', value: 'dashboard', action: 'view' },
  '/api/boards/subtasks/[id]/reorder': { type: 'page', value: 'objects', action: 'edit' },

  // 📎 Вложения и комментарии
  '/api/attachments': { type: 'page', value: 'dashboard', action: 'view' },
  '/api/comments': { type: 'page', value: 'dashboard', action: 'view' },

  // ═══════════════════════════════════════════════════════════════
  // 👤 ПОЛЬЗОВАТЕЛИ (users)
  // ═══════════════════════════════════════════════════════════════
  '/api/users': { type: 'page', value: 'users', action: 'view' },
  '/api/users/[id]': { type: 'page', value: 'users', action: 'view' },

  // ═══════════════════════════════════════════════════════════════
  // ⚙️ НАСТРОЙКИ ПРАВ (settings)
  // ═══════════════════════════════════════════════════════════════
  '/api/permissions/pages': { type: 'page', value: 'settings', action: 'view' },
  '/api/permissions/pages/[slug]': { type: 'page', value: 'settings', action: 'edit' },
  '/api/permissions/roles': { type: 'page', value: 'settings', action: 'view' },
  '/api/permissions/roles/[role]': { type: 'page', value: 'settings', action: 'edit' },
  '/api/permissions/roles/copy': { type: 'page', value: 'settings', action: 'special' },
  '/api/permissions/roles/[role]/reset': { type: 'page', value: 'settings', action: 'special' },
  '/api/permissions/users': { type: 'page', value: 'settings', action: 'view' },
  '/api/permissions/users/[id]/overrides': { type: 'page', value: 'settings', action: 'edit' },
  '/api/permissions/users/[id]/overrides/[pageSlug]': { type: 'page', value: 'settings', action: 'edit' },
  '/api/permissions/init': { type: 'role', value: 'admin' },

  // ═══════════════════════════════════════════════════════════════
  // 🟢 ОНЛАЙН (online) — привязан к users.canView
  // ═══════════════════════════════════════════════════════════════
  '/api/online': { type: 'page', value: 'users', action: 'view' },

  // ═══════════════════════════════════════════════════════════════
  // 🛡️ АДМИН-ПАНЕЛЬ
  // ═══════════════════════════════════════════════════════════════
  '/api/admin/**': { type: 'role', value: 'manager' },
}

// ============================================
// 6. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================

function getPathWithoutQuery(path: string): string {
  return path.split('?')[0] || ''
}

function matchPath(pattern: string, path: string): boolean {
  if (!pattern.includes('**') && !pattern.includes('[')) {
    return path === pattern || path.startsWith(pattern + '/') || path.startsWith(pattern)
  }

  let escaped = pattern.replace(/[-\/\\^$+?.()|{}]/g, '\\$&')
  escaped = escaped.replace(/\[[^\]]+\]/g, '[^/]+')
  escaped = escaped.replace(/\*\*/g, '.*')

  const regex = new RegExp(`^${escaped}$`)
  return regex.test(path)
}

function isPublicPath(path: string): boolean {
  for (const publicPath of PUBLIC_PATHS) {
    if (publicPath.includes('**')) {
      if (matchPath(publicPath, path)) return true
      continue
    }
    
    if (publicPath.includes('[')) {
      if (matchPath(publicPath, path)) return true
      continue
    }
    
    if (path === publicPath) return true
    if (path.startsWith(publicPath + '?')) return true
    
    if (publicPath.endsWith('/') && path.startsWith(publicPath)) return true
  }
  return false
}

function getRequirementForPath(path: string): PathRequirement | null {
  for (const [pattern, requirement] of Object.entries(PROTECTED_PATHS)) {
    if (matchPath(pattern, path)) {
      return requirement
    }
  }
  return null
}

// ============================================
// ОСНОВНОЙ ОБРАБОТЧИК (С ЛОГИРОВАНИЕМ ДЛЯ ДИАГНОСТИКИ)
// ============================================

export default defineEventHandler(async (event) => {
  const path = getPathWithoutQuery(event.path)

  // Логируем все /api/permissions/* запросы для диагностики
  const isPermissionsPath = path.startsWith('/api/permissions')
  if (isPermissionsPath) {
    console.log(`[AuthMiddleware] 🔍 Запрос: ${path}`)
  }

  if (!path.startsWith('/api/')) {
    return
  }

  if (isPublicPath(path)) {
    if (isPermissionsPath) console.log(`[AuthMiddleware] ⏭️  Пропущен как публичный`)
    return
  }

  try {
    // ============================================
    // 1. ПРОВЕРКА АВТОРИЗАЦИИ
    // ============================================
    if (isPermissionsPath) console.log(`[AuthMiddleware] 🔐 Проверка авторизации...`)
    
    const user = await verifyAuth(event)
    event.context.user = user
    
    if (isPermissionsPath) console.log(`[AuthMiddleware] ✅ Пользователь: ID=${user.id}, роль=${user.role}`)

    // ============================================
    // 2. ПОИСК ТРЕБОВАНИЙ К ПУТИ
    // ============================================
    const requirement = getRequirementForPath(path)

    if (!requirement) {
      if (isPermissionsPath) console.log(`[AuthMiddleware] ℹ️  Нет требований к пути`)
      return
    }

    if (isPermissionsPath) console.log(`[AuthMiddleware] 📋 Требование: type=${requirement.type}, value=${requirement.value}, action=${requirement.action || '-'}`)

    // ============================================
    // 3. ПРОВЕРКА ПРАВ
    // ============================================
    if (requirement.type === 'page') {
      const pageSlug = requirement.value as string
      const action = requirement.action || 'view'
      
      if (isPermissionsPath) console.log(`[AuthMiddleware] 🔎 Проверка: ${pageSlug}.${action}`)
      
      const hasAccess = await checkPagePermission(user, pageSlug, action)
      
      if (isPermissionsPath) console.log(`[AuthMiddleware] ${hasAccess ? '✅ Доступ разрешён' : '❌ Доступ запрещён'}`)
      
      if (!hasAccess) {
        throw createError({
          statusCode: 403,
          message: requirement.message || `Доступ запрещён. Требуется право: ${pageSlug}.${action}`
        })
      }
    }
    else if (requirement.type === 'role') {
      const requiredRole = requirement.value as string
      
      if (isPermissionsPath) console.log(`[AuthMiddleware] 🎭 Проверка роли: требуется ${requiredRole}, у пользователя ${user.role}`)
      
      const userLevel = ROLE_LEVELS[user.role] || 0
      const requiredLevel = ROLE_LEVELS[requiredRole] || 0
      
      if (isPermissionsPath) console.log(`[AuthMiddleware] 📊 Уровни: user=${userLevel}, required=${requiredLevel}`)
      
      if (userLevel < requiredLevel) {
        throw createError({
          statusCode: 403,
          message: requirement.message || `Доступ запрещён. Требуется роль не ниже: ${requiredRole}`
        })
      }
      
      if (isPermissionsPath) console.log(`[AuthMiddleware] ✅ Роль подходит`)
    }
    else if (requirement.type === 'custom' && typeof requirement.value === 'function') {
      const customCheck = requirement.value as (user: DbUser) => boolean | Promise<boolean>
      const result = await customCheck(user)
      if (!result) {
        throw createError({
          statusCode: 403,
          message: requirement.message || 'Доступ запрещён'
        })
      }
    }

  } catch (error: any) {
    if (isPermissionsPath) {
      console.error(`[AuthMiddleware] ❌ ОШИБКА:`, {
        statusCode: error.statusCode,
        message: error.message,
        stack: error.stack?.split('\n').slice(0, 5).join('\n')
      })
    }

    if (error instanceof Error && 'statusCode' in error && (error.statusCode === 401 || error.statusCode === 403)) {
      throw error
    }

    console.error('[AuthMiddleware] Непредвиденная ошибка:', error)
    throw createError({
      statusCode: 401,
      message: 'Требуется авторизация'
    })
  }
})

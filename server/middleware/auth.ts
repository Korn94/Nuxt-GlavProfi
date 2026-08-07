/**
 * 🛡️ Централизованный middleware для проверки авторизации и прав доступа на сервере
 *
 * Архитектура:
 * - Работает для ВСЕХ запросов к /api/* (кроме PUBLIC_PATHS)
 * - Извлекает JWT из cookie/Authorization header
 * - Находит требование к пути в PROTECTED_PATHS (или пропускает если нет)
 * - Делегирует проверку прав в server/utils/permissions (единый источник логики)
 *
 * Три типа требований:
 * - page:  проверка права на страницу через hasUserPermission()
 * - role:  иерархическая проверка через hasRequiredRoleLevel()
 * - custom: произвольная функция (user) => boolean
 *
 * ⚠️ Защита ТОЛЬКО на сервере. Клиентские v-if — это только UX, не безопасность.
 */

import { defineEventHandler, createError } from 'h3'
import { verifyAuth } from '../utils/auth'

import {
  ROLE_LEVELS,
  hasRequiredRoleLevel,
  type Role
} from 'shared/constants/roles'

import type { PageAction } from 'shared/constants/permissions'

import {
  hasUserPermission,
  type DbUser
} from '../utils/permissions'

// ============================================
// 1. ТИПЫ ДЛЯ КОНФИГУРАЦИИ ТРЕБОВАНИЙ К ПУТИ
// ============================================

export interface PathRequirement {
  type: 'page' | 'role' | 'custom'
  value: string | ((user: DbUser) => boolean | Promise<boolean>)
  action?: PageAction   // Только для type: 'page'
  methods?: string[]    // 👈 HTTP-методы, к которым применяется (GET, POST, PATCH, PUT, DELETE)
  message?: string      // Кастомное сообщение об ошибке (для 403)
}

// ============================================
// 2. БЕЛЫЙ СПИСОК ПУБЛИЧНЫХ ENDPOINT'ОВ
// ============================================

const PUBLIC_PATHS = [
  '/api/auth/login',
  '/api/auth/telegram',
  '/api/auth/check',
  '/api/auth/logout',

  '/api/permissions',
  '/api/me',

  '/api/price/list',
  '/api/price/list/',
  '/api/price/calc/',
  '/api/price/categories',
  '/api/price/subcategories',
  '/api/price/items',
  '/api/price/pages',
  '/api/price/details',
  '/api/price/dopworks',

  '/api/portfolio',
  '/api/portfolio/**',

  '/api/send-message',
  '/api/_nuxt_icon',
  '/api/_nuxt_icon/**',
  '/api/**/*.map',
  '/**/*.map',
]

// ============================================
// 3. КОНФИГУРАЦИЯ ПРАВ ПО ENDPOINT'АМ
// ============================================

/**
 * Является ли пользователь контрагентом (мастер/рабочий/прораб со своей записью).
 * Используется для доступа к self-эндпоинтам «только свои данные»:
 * владелец определяется на сервере по event.context.user, а не по URL,
 * поэтому подставить чужой contractorId невозможно.
 */
function isContractor(user: DbUser): boolean {
  return Boolean(
    user &&
    ['master', 'worker', 'foreman'].includes(user.contractorType || '') &&
    Number(user.contractorId || 0) > 0
  )
}

/**
 * Доступ к «Моим договорённостям»: контрагент (свои данные) ИЛИ
 * пользователь с правом objects.view (админ/менеджер — сохраняем прежнее поведение).
 */
async function hasMineAgreementsAccess(user: DbUser): Promise<boolean> {
  if (isContractor(user)) return true
  return hasUserPermission(user, 'objects', 'view')
}

// ✅ Исправлено: тип теперь допускает массив требований для разных HTTP-методов
const PROTECTED_PATHS: Record<string, PathRequirement | PathRequirement[]> = {
  // ═══════════════════════════════════════════════════════════════
  // 🔐 АВТОРИЗАЦИЯ
  // ═══════════════════════════════════════════════════════════════
  '/api/auth/logout': { type: 'page', value: 'dashboard', action: 'view' },

  // ═══════════════════════════════════════════════════════════════
  // 📊 ДАШБОРД
  // ═══════════════════════════════════════════════════════════════
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

  '/api/objects/[id]/budget': { type: 'page', value: 'objects', action: 'view' },
  '/api/objects/budget/[id]': { type: 'page', value: 'objects', action: 'edit' },
  '/api/objects/budget/[id]/status': { type: 'page', value: 'objects', action: 'edit' },

  '/api/objects/[id]/acts': { type: 'page', value: 'objects', action: 'view' },
  '/api/objects/acts/[id]': { type: 'page', value: 'objects', action: 'edit' },

  '/api/objects/[id]/invoices': { type: 'page', value: 'objects', action: 'view' },
  '/api/objects/invoices/[id]': { type: 'page', value: 'objects', action: 'edit' },

  // ═══════════════════════════════════════════════════════════════
  // 💰 ФИНАНСОВЫЕ ОПЕРАЦИИ (operations = comings + expenses)
  // ═══════════════════════════════════════════════════════════════
  '/api/comings': { type: 'page', value: 'operations', action: 'view' },
  '/api/comings/[id]': { type: 'page', value: 'operations', action: 'view' },
  '/api/expenses': { type: 'page', value: 'operations', action: 'view' },
  '/api/expenses/[id]': { type: 'page', value: 'operations', action: 'view' },
  '/api/expenses/stats': { type: 'page', value: 'operations', action: 'view' },
  '/api/balance': { type: 'page', value: 'operations', action: 'view' },
  '/api/salary-deductions': { type: 'page', value: 'operations', action: 'view' },

  // ═══════════════════════════════════════════════════════════════
  // 📦 МАТЕРИАЛЫ (materials)
  // ═══════════════════════════════════════════════════════════════
  '/api/materials': { type: 'page', value: 'materials', action: 'view' },
  '/api/materials/[id]': { type: 'page', value: 'materials', action: 'view' },
  '/api/materials/toggle-check/[id]': { type: 'page', value: 'materials', action: 'special' },

  // ═══════════════════════════════════════════════════════════════
  // 🔨 РАБОТЫ (works)
  // ═══════════════════════════════════════════════════════════════
  // ✅ Self-эндпоинт «Мои договорённости» (только свои данные): контрагент
  //    получает доступ по isContractor (ID определяется на сервере), а админ/менеджер —
  //    по праву objects.view (как раньше). ВАЖНО: этот паттерн ДОЛЖЕН идти ДО `/api/works`,
  //    т.к. `/api/works` матчит любой вложенный путь через startsWith
  //    (иначе `/api/works/agreements/mine` попадёт под требование `works.view`).
  '/api/works/agreements/mine': { type: 'custom', value: hasMineAgreementsAccess, methods: ['GET'] },

  '/api/works': { type: 'page', value: 'works', action: 'view' },
  '/api/works/[id]': { type: 'page', value: 'works', action: 'view' },
  '/api/works/daily-work/active-objects': { type: 'page', value: 'works', action: 'view' },
  '/api/works/daily-work/daily-assignments': { type: 'page', value: 'works', action: 'view' },
  '/api/works/daily-work/workers-with-daily-rate': { type: 'page', value: 'works', action: 'view' },
  '/api/works/daily-work/bulk': { type: 'page', value: 'works', action: 'create' },

  '/api/works/accept/[id]': { type: 'page', value: 'works', action: 'special' },
  '/api/works/reject/[id]': { type: 'page', value: 'works', action: 'special' },
  '/api/works/pay-work/[id]': { type: 'page', value: 'works', action: 'special' },
  '/api/works/create-and-pay': { type: 'page', value: 'works', action: 'special' },

  // Договорённости (agreements) — привязаны к objects
  // ✅ Теперь разные методы проверяются по разным правилам
  '/api/works/agreements': [
    { type: 'page', value: 'objects', action: 'view', methods: ['GET'] },
    { type: 'page', value: 'objects', action: 'create', methods: ['POST'] }
  ],
  '/api/works/agreements/[id]': [
    { type: 'page', value: 'objects', action: 'view', methods: ['GET'] },
    { type: 'page', value: 'objects', action: 'edit', methods: ['PATCH', 'PUT'] },
    { type: 'page', value: 'objects', action: 'delete', methods: ['DELETE'] }
  ],
  '/api/works/agreements/[id]/accept': { 
    type: 'page', 
    value: 'objects', 
    action: 'special' 
  },

  // ═══════════════════════════════════════════════════════════════
  // 👥 КОНТРАГЕНТЫ (contractors)
  // ═══════════════════════════════════════════════════════════════
  // ✅ Self-эндпоинты «только свои данные»: доступ для контрагента (master/worker/foreman).
  //    id/type определяются на сервере из авторизованного пользователя, а не из URL,
  //    поэтому дать доступ к ним безопасно и без широких прав `contractors.view`.
  //    ВАЖНО: эти записи должны идти ДО `/api/contractors/[type]`, т.к. первый match выигрывает.
  '/api/contractors/me': { type: 'custom', value: isContractor },
  '/api/contractors/me/incomes': { type: 'custom', value: isContractor },
  '/api/contractors/me/expenses': { type: 'custom', value: isContractor },
  '/api/contractors/me/daily-stats': { type: 'custom', value: isContractor },
  '/api/contractors/me/daily-recent': { type: 'custom', value: isContractor },

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
  // 📋 ДОСКИ ЗАДАЧ (boards)
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
  // 🟢 ОНЛАЙН (online)
  // ═══════════════════════════════════════════════════════════════
  '/api/online': { type: 'page', value: 'users', action: 'view' },

  // ═══════════════════════════════════════════════════════════════
  // 🛡️ АДМИН-ПАНЕЛЬ
  // ═══════════════════════════════════════════════════════════════
  '/api/admin/**': { type: 'role', value: 'manager' },
}

// ============================================
// 4. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ РОУТИНГА
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

// ✅ Исправлено: принимает method и корректно обрабатывает массивы
function getRequirementForPath(path: string, method: string): PathRequirement | null {
  for (const [pattern, requirement] of Object.entries(PROTECTED_PATHS)) {
    if (!matchPath(pattern, path)) continue

    // Если requirement — массив, ищем подходящий по методу
    if (Array.isArray(requirement)) {
      const matched = requirement.find(r => 
        !r.methods || r.methods.includes(method.toUpperCase())
      )
      if (matched) return matched
    } else {
      // Если не массив и нет restrictions по методам — подходит
      if (!requirement.methods || requirement.methods.includes(method.toUpperCase())) {
        return requirement
      }
    }
  }
  return null
}

// ============================================
// 5. ОСНОВНОЙ ОБРАБОТЧИК
// ============================================

export default defineEventHandler(async (event) => {
  const path = getPathWithoutQuery(event.path)
  const method = event.method

  const isPermissionsPath = path.startsWith('/api/permissions')

  // Пропускаем не-API запросы (страницы, статика, etc.)
  if (!path.startsWith('/api/')) {
    return
  }

  // Пропускаем публичные эндпоинты
  if (isPublicPath(path)) {
    if (isPermissionsPath) {
      console.log(`[AuthMiddleware] ⏭️  Пропущен как публичный: ${path}`)
    }
    return
  }

  // ✅ Исправлено: убран дублирующий вызов до try
  // ✅ Исправлено: передаётся method
  const requirement = getRequirementForPath(path, method)

  try {
    // ============================================
    // 1. ПРОВЕРКА АВТОРИЗАЦИИ
    // ============================================
    const user = await verifyAuth(event)
    event.context.user = user

    if (isPermissionsPath) {
      console.log(`[AuthMiddleware] 🔐 Запрос: ${path} [${method}] | User: ID=${user.id}, роль=${user.role}`)
    }

    // ============================================
    // 2. ПРОВЕРКА НАЛИЧИЯ ТРЕБОВАНИЙ
    // ============================================

    // Если требований нет — доступ разрешён (эндпоинт не защищён правами)
    if (!requirement) {
      if (isPermissionsPath) {
        console.log(`[AuthMiddleware] ℹ️  Нет требований к пути, доступ разрешён`)
      }
      return
    }

    // ============================================
    // 3. ПРОВЕРКА ПРАВ (делегирование в utils)
    // ============================================
    if (requirement.type === 'page') {
      const pageSlug = requirement.value as string
      const action = requirement.action || 'view'

      const hasAccess = await hasUserPermission(user, pageSlug, action)

      if (isPermissionsPath) {
        console.log(`[AuthMiddleware] 🔎 Проверка: ${pageSlug}.${action} → ${hasAccess ? '✅' : '❌'}`)
      }

      if (!hasAccess) {
        throw createError({
          statusCode: 403,
          statusMessage: requirement.message || `Доступ запрещён. Требуется право: ${pageSlug}.${action}`
        })
      }
    }
    else if (requirement.type === 'role') {
      const requiredRole = requirement.value as Role

      if (!hasRequiredRoleLevel(user.role, requiredRole)) {
        if (isPermissionsPath) {
          const userLevel = ROLE_LEVELS[user.role as Role] ?? 0
          const requiredLevel = ROLE_LEVELS[requiredRole] ?? 0
          console.log(`[AuthMiddleware] ❌ Роль: ${user.role}(${userLevel}) < ${requiredRole}(${requiredLevel})`)
        }
        throw createError({
          statusCode: 403,
          statusMessage: requirement.message || `Доступ запрещён. Требуется роль не ниже: ${requiredRole}`
        })
      }

      if (isPermissionsPath) {
        console.log(`[AuthMiddleware] ✅ Роль подходит: ${user.role} ≥ ${requiredRole}`)
      }
    }
    else if (requirement.type === 'custom' && typeof requirement.value === 'function') {
      const customCheck = requirement.value as (user: DbUser) => boolean | Promise<boolean>
      const result = await customCheck(user)

      if (!result) {
        throw createError({
          statusCode: 403,
          statusMessage: requirement.message || 'Доступ запрещён'
        })
      }
    }
  }
  catch (error: any) {
    if (isPermissionsPath) {
      console.error(`[AuthMiddleware] ❌ Ошибка:`, {
        statusCode: error.statusCode,
        message: error.message,
      })
    }

    if (error instanceof Error && 'statusCode' in error) {
      if (error.statusCode === 401 || error.statusCode === 403) {
        throw error
      }
    }

    console.error('[AuthMiddleware] Непредвиденная ошибка:', error)
    throw createError({
      statusCode: 401,
      statusMessage: 'Требуется авторизация'
    })
  }
})

// server/middleware/auth.ts
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
  message?: string      // Кастомное сообщение об ошибке (для 403)
}

// ============================================
// 2. БЕЛЫЙ СПИСОК ПУБЛИЧНЫХ ENDPOINT'ОВ
// ============================================
// Эти пути НЕ требуют авторизации и пропускаются middleware'ом

const PUBLIC_PATHS = [
  // 🔓 Авторизация
  '/api/auth/login',
  '/api/auth/telegram',
  '/api/auth/check',
  '/api/auth/logout',

  // 🔓 Получение прав (сам проверяет токен через extractJwt)
  '/api/permissions',
  '/api/me',

  // 🔓 Публичный прайс-лист (для калькулятора на сайте)
  '/api/price/list',
  '/api/price/list/',
  '/api/price/calc/',
  '/api/price/categories',
  '/api/price/subcategories',
  '/api/price/items',
  '/api/price/pages',
  '/api/price/details',
  '/api/price/dopworks',

  // 🔓 Публичная страница портфолио (для сайта)
  '/api/portfolio',
  '/api/portfolio/**',

  // 🔓 Служебные
  '/api/send-message',
  '/api/_nuxt_icon',
  '/api/_nuxt_icon/**',
  '/api/**/*.map',
  '/**/*.map',
]

// ============================================
// 3. КОНФИГУРАЦИЯ ПРАВ ПО ENDPOINT'АМ
// ============================================
// Каждая запись — требование к конкретному URL-паттерну.
// Поддерживаются placeholders:
//   [id]      — один сегмент пути (например, /api/users/[id])
//   [entity]  — один сегмент пути (например, /api/price/[entity])
//   **        — любое количество сегментов (например, /api/admin/**)

const PROTECTED_PATHS: Record<string, PathRequirement> = {
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
  // 💰 ФИНАНСОВЫЕ ОПЕРАЦИИ (operations = comings + expenses)
  // ═══════════════════════════════════════════════════════════════
  // В новой системе прав comings и expenses объединены в 'operations'
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
  // 👥 КОНТРАГЕНТЫ (contractors)
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
  // 📋 ДОСКИ ЗАДАЧ (boards) — привязаны к dashboard/objects
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
  // 🛡️ АДМИН-ПАНЕЛЬ (для всех /api/admin/**)
  // ═══════════════════════════════════════════════════════════════
  '/api/admin/**': { type: 'role', value: 'manager' },
}

// ============================================
// 4. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ РОУТИНГА
// ============================================

/**
 * Убрать query-string из пути (для сравнения с паттернами)
 */
function getPathWithoutQuery(path: string): string {
  return path.split('?')[0] || ''
}

/**
 * Проверить, что путь соответствует паттерну.
 * Поддерживает:
 * - Точные совпадения: '/api/users' === '/api/users'
 * - Placeholders [param]: '/api/users/[id]' совпадёт с '/api/users/123'
 * - Wildcard **: '/api/admin/**' совпадёт с '/api/admin/anything/deep/nested'
 * - Префиксные матчи: '/api/portfolio' совпадёт с '/api/portfolio/some-slug'
 */
function matchPath(pattern: string, path: string): boolean {
  // Быстрый путь: без плейсхолдеров и wildcard
  if (!pattern.includes('**') && !pattern.includes('[')) {
    return path === pattern || path.startsWith(pattern + '/') || path.startsWith(pattern)
  }

  // Медленный путь: компилируем паттерн в RegExp
  let escaped = pattern.replace(/[-\/\\^$+?.()|{}]/g, '\\$&')
  escaped = escaped.replace(/\[[^\]]+\]/g, '[^/]+') // [param] → [^/]+
  escaped = escaped.replace(/\*\*/g, '.*')          // ** → .*

  const regex = new RegExp(`^${escaped}$`)
  return regex.test(path)
}

/**
 * Проверить, является ли путь публичным (в белом списке)
 */
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

/**
 * Найти требование к пути в PROTECTED_PATHS
 * Возвращает null, если путь не защищён
 */
function getRequirementForPath(path: string): PathRequirement | null {
  for (const [pattern, requirement] of Object.entries(PROTECTED_PATHS)) {
    if (matchPath(pattern, path)) {
      return requirement
    }
  }
  return null
}

// ============================================
// 5. ОСНОВНОЙ ОБРАБОТЧИК
// ============================================

export default defineEventHandler(async (event) => {
  const path = getPathWithoutQuery(event.path)

  // Логируем только запросы к /api/permissions/* (для диагностики системы прав)
  const isPermissionsPath = path.startsWith('/api/permissions')

  // Пропускаем не-API запросы (страницы, статика, etc.)
  if (!path.startsWith('/api/')) {
    return
  }

  // Пропускаем публичные эндпоинты (логин, публичный прайс, etc.)
  if (isPublicPath(path)) {
    if (isPermissionsPath) {
      console.log(`[AuthMiddleware] ⏭️  Пропущен как публичный: ${path}`)
    }
    return
  }

  try {
    // ============================================
    // 1. ПРОВЕРКА АВТОРИЗАЦИИ (извлечение JWT + верификация)
    // ============================================
    // Делегируем в verifyAuth — он сам извлекает токен и находит user в БД
    const user = await verifyAuth(event)
    event.context.user = user

    if (isPermissionsPath) {
      console.log(`[AuthMiddleware] 🔐 Запрос: ${path} | User: ID=${user.id}, роль=${user.role}`)
    }

    // ============================================
    // 2. ПОИСК ТРЕБОВАНИЯ К ПУТИ
    // ============================================
    const requirement = getRequirementForPath(path)

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

      // ✅ Делегируем проверку в hasUserPermission (единая функция в utils)
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

      // ✅ Делегируем проверку в hasRequiredRoleLevel из shared
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
    // Диагностические логи только для /api/permissions/*
    if (isPermissionsPath) {
      console.error(`[AuthMiddleware] ❌ Ошибка:`, {
        statusCode: error.statusCode,
        message: error.message,
      })
    }

    // Пробрасываем наши 401/403 как есть
    if (error instanceof Error && 'statusCode' in error) {
      if (error.statusCode === 401 || error.statusCode === 403) {
        throw error
      }
    }

    // Неожиданные ошибки маскируем под 401 (не раскрываем детали)
    console.error('[AuthMiddleware] Непредвиденная ошибка:', error)
    throw createError({
      statusCode: 401,
      statusMessage: 'Требуется авторизация'
    })
  }
})

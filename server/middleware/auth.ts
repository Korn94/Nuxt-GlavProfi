// server/middleware/auth.ts
/**
 * Централизованный middleware для проверки авторизации и прав доступа
 *
 * Архитектура:
 * - Автоматическая проверка авторизации для всех /api/* запросов
 * - Проверка прав на основе конфигурации путей (PROTECTED_PATHS)
 * - Белый список публичных endpoint'ов
 * - Поддержка проверок по роли и кастомной логики
 *
 * ⚠️ Права определяются ТОЛЬКО на сервере — клиент не может их обойти.
 */

import { defineEventHandler, createError } from 'h3'
import { verifyAuth } from '../utils/auth'
import { getUserPermissions, hasRoleLevel, requirePermission } from '../utils/permissions'
import type { Role, Permissions } from '~/types/permissions'
import type { users } from '../db/schema'

// Тип пользователя из БД
type DbUser = typeof users.$inferSelect

// ============================================
// 1. ТИПЫ ДЛЯ КОНФИГУРАЦИИ ПРАВ
// ============================================
/**
 * Формат требования прав для пути
 */
export interface PathRequirement {
  type: 'permission' | 'role' | 'custom'
  value: keyof Permissions | Role | ((user: DbUser) => boolean)
  message?: string // Кастомное сообщение об ошибке
}

// ============================================
// 2. БЕЛЫЙ СПИСОК ПУБЛИЧНЫХ ENDPOINT'ОВ
// ============================================
/**
 * Пути, доступные без авторизации.
 * ⚠️ Добавляйте сюда только те эндпоинты, которые действительно публичные.
 */
const PUBLIC_PATHS = [
  // 🔐 Авторизация
  '/api/auth/login',
  '/api/auth/telegram',
  '/api/auth/check',     // ✅ Нужен для фоновой проверки токена
  '/api/permissions',

  // 👤 Профиль пользователя (возвращает { user: null } для гостей)
  '/api/me',

  // 🟢 Публичные данные
  '/api/online',         // ✅ Публичный список онлайн-пользователей

  // ✅ Иконки
  '/api/_nuxt_icon',
  '/api/_nuxt_icon/**',
]

// ============================================
// 3. КОНФИГУРАЦИЯ ПРАВ ПО ENDPOINT'AM
// ============================================
/**
 * Карта required permissions для конкретных путей.
 *
 * Форматы значений:
 * - { type: 'permission', value: 'canEditObjects' } — требует конкретное право
 * - { type: 'role', value: 'manager' } — требует роль не ниже указанной
 * - { type: 'custom', value: (user) => boolean } — кастомная проверка
 *
 * ✅ Поддерживает wildcard '**' для группировки путей
 * ✅ Поддерживает параметры маршрута '[id]'
 *
 * 📋 Полная карта всех API endpoint'ов проекта:
 *
 * ПУБЛИЧНЫЕ (без авторизации):
 * - /api/auth/login, /api/auth/telegram, /api/auth/check, /api/auth/logout
 * - /api/me
 * - /api/online
 *
 * АВТОРИЗОВАННЫЕ (требуется вход):
 * - /api/analytics — аналитика и дашборды
 * - /api/balance — балансы объектов
 * - /api/boards — доски задач (канбан)
 * - /api/comings — приходы/поступления
 * - /api/comments — комментарии
 * - /api/contractors — контрагенты
 * - /api/expenses — расходы
 * - /api/materials — материалы
 * - /api/objects — объекты строительства
 * - /api/portfolio — портфолио
 * - /api/price — прайс-листы, калькуляции
 * - /api/salary-deductions — удержания из зарплаты
 * - /api/send-message — отправка сообщений
 * - /api/users — пользователи
 * - /api/works — работы, задания
 * - /api/attachments — вложения
 */
const PROTECTED_PATHS: Record<string, PathRequirement> = {
  // ============================================
  // 🔐 АВТОРИЗАЦИЯ И ПРОФИЛЬ
  // ============================================
  '/api/auth/logout': { type: 'permission', value: 'canViewDashboard' },

  // ============================================
  // 👤 ПРОФИЛЬ И ДАННЫЕ ПОЛЬЗОВАТЕЛЯ
  // ============================================
  // '/api/me': { type: 'permission', value: 'canViewDashboard' },

  // ============================================
  // 📊 АНАЛИТИКА И ДАШБОРДЫ
  // ============================================
  '/api/analytics': { type: 'permission', value: 'canViewDashboard' },

  // ============================================
  // 💰 ФИНАНСЫ
  // ============================================
  // Балансы
  '/api/balance': { type: 'permission', value: 'canViewFinance' },

  // Расходы
  '/api/expenses': { type: 'permission', value: 'canViewFinance' },
  '/api/expenses/stats': { type: 'permission', value: 'canViewFinance' },

  // Приходы/поступления
  '/api/comings': { type: 'permission', value: 'canViewFinance' },

  // Удержания из зарплаты
  '/api/salary-deductions': { type: 'permission', value: 'canViewSalary' },

  // ============================================
  // 👥 КОНТРАГЕНТЫ И ПОЛЬЗОВАТЕЛИ
  // ============================================
  // Контрагенты
  '/api/contractors': { type: 'permission', value: 'canViewWorkers' },

  // Пользователи
  '/api/users': { type: 'role', value: 'manager' },

  // ============================================
  // 🏗️ ОБЪЕКТЫ СТРОИТЕЛЬСТВА
  // ============================================
  '/api/objects/[id]/budget': { type: 'permission', value: 'canViewFinance' },
  '/api/objects/[id]/balance': { type: 'permission', value: 'canViewFinance' },
  '/api/objects/[id]/comings': { type: 'permission', value: 'canViewFinance' },
  '/api/objects/[id]/expenses': { type: 'permission', value: 'canViewFinance' },
  '/api/objects/[id]/invoices': { type: 'permission', value: 'canViewFinance' },
  '/api/objects/[id]/acts': { type: 'permission', value: 'canViewFinance' },
  '/api/objects/[id]/operations': { type: 'permission', value: 'canViewFinance' },
  '/api/objects/[id]/full': { type: 'permission', value: 'canViewObjects' },
  '/api/objects/[id]/contract': { type: 'permission', value: 'canViewObjects' },
  '/api/objects/budget/[id]': { type: 'permission', value: 'canViewFinance' },
  '/api/objects/budget/[id]/status': { type: 'permission', value: 'canEditFinance' },
  '/api/objects/contract/[id]': { type: 'permission', value: 'canEditObjects' },
  '/api/objects/invoices/[id]': { type: 'permission', value: 'canViewFinance' },
  '/api/objects/acts/[id]': { type: 'permission', value: 'canViewFinance' },
  '/api/objects': { type: 'permission', value: 'canViewObjects' },

  // ============================================
  // 📋 ДОСКИ ЗАДАЧ (KANBAN)
  // ============================================
  '/api/boards': { type: 'permission', value: 'canViewDashboard' },
  '/api/boards/folders': { type: 'permission', value: 'canViewDashboard' },
  '/api/boards/folders/[id]': { type: 'permission', value: 'canViewDashboard' },
  '/api/boards/folders/[id]/boards': { type: 'permission', value: 'canViewDashboard' },
  '/api/boards/folders/order': { type: 'permission', value: 'canEditObjects' },
  '/api/boards/tags': { type: 'permission', value: 'canViewDashboard' },
  '/api/boards/[id]': { type: 'permission', value: 'canViewDashboard' },
  '/api/boards/[id]/columns': { type: 'permission', value: 'canViewDashboard' },
  '/api/boards/[id]/columns/order': { type: 'permission', value: 'canEditObjects' },
  '/api/boards/[id]/tasks': { type: 'permission', value: 'canViewDashboard' },
  '/api/boards/[id]/tasks/order': { type: 'permission', value: 'canEditObjects' },
  '/api/boards/tasks/[id]': { type: 'permission', value: 'canViewDashboard' },
  '/api/boards/tasks/[id]/subtasks': { type: 'permission', value: 'canViewDashboard' },
  '/api/boards/tasks/[id]/attachments': { type: 'permission', value: 'canViewDashboard' },
  '/api/boards/tasks/[id]/comments': { type: 'permission', value: 'canViewDashboard' },
  '/api/boards/tasks/[id]/tags': { type: 'permission', value: 'canViewDashboard' },
  '/api/boards/subtasks/[id]': { type: 'permission', value: 'canViewDashboard' },
  '/api/boards/subtasks/[id]/complete': { type: 'permission', value: 'canViewDashboard' },
  '/api/boards/subtasks/[id]/reorder': { type: 'permission', value: 'canEditObjects' },

  // ============================================
  // 🔨 РАБОТЫ И ЗАДАНИЯ
  // ============================================
  '/api/works': { type: 'permission', value: 'canViewObjects' },
  '/api/works/[id]': { type: 'permission', value: 'canViewObjects' },
  '/api/works/accept/[id]': { type: 'permission', value: 'canApproveWorks' },
  '/api/works/reject/[id]': { type: 'permission', value: 'canApproveWorks' },
  '/api/works/pay-work/[id]': { type: 'permission', value: 'canViewSalary' },
  '/api/works/create-and-pay': { type: 'permission', value: 'canViewSalary' },
  '/api/works/daily-work/active-objects': { type: 'permission', value: 'canViewObjects' },
  '/api/works/daily-work/workers-with-daily-rate': { type: 'permission', value: 'canViewSalary' },
  '/api/works/daily-work/daily-assignments': { type: 'permission', value: 'canViewObjects' },
  '/api/works/daily-work/bulk': { type: 'permission', value: 'canEditObjects' },

  // ============================================
  // 📦 МАТЕРИАЛЫ
  // ============================================
  '/api/materials': { type: 'permission', value: 'canViewObjects' },
  '/api/materials/[id]/toggle-check': { type: 'permission', value: 'canEditObjects' },

  // ============================================
  // 💵 ПРАЙС-ЛИСТЫ И КАЛЬКУЛЯЦИИ
  // ============================================
  '/api/price/list': { type: 'permission', value: 'canViewObjects' },
  '/api/price/list/[slug]': { type: 'permission', value: 'canViewObjects' },
  '/api/price/calc/[slug]': { type: 'permission', value: 'canViewObjects' },
  '/api/price/categories': { type: 'permission', value: 'canViewObjects' },
  '/api/price/subcategories': { type: 'permission', value: 'canViewObjects' },
  '/api/price/items': { type: 'permission', value: 'canViewObjects' },
  '/api/price/pages': { type: 'permission', value: 'canViewObjects' },
  '/api/price/details': { type: 'permission', value: 'canViewObjects' },
  '/api/price/dopworks': { type: 'permission', value: 'canViewObjects' },

  // ============================================
  // 🖼️ ПОРТФОЛИО
  // ============================================
  '/api/portfolio': { type: 'permission', value: 'canViewObjects' },
  '/api/portfolio/[slug]': { type: 'permission', value: 'canViewObjects' },
  '/api/portfolio/[slug]/images': { type: 'permission', value: 'canViewObjects' },
  '/api/portfolio/[slug]/works': { type: 'permission', value: 'canViewObjects' },
  '/api/portfolio/[slug]/size': { type: 'permission', value: 'canViewObjects' },

  // ============================================
  // 📎 ВЛОЖЕНИЯ И КОММЕНТАРИИ
  // ============================================
  '/api/attachments': { type: 'permission', value: 'canViewDashboard' },
  '/api/comments': { type: 'permission', value: 'canViewDashboard' },

  // ============================================
  // ✉️ СООБЩЕНИЯ
  // ============================================
  '/api/send-message': { type: 'permission', value: 'canViewDashboard' },

  // ============================================
  // 🗑️ УДАЛЕНИЕ ЗАПИСЕЙ — общее правило
  // ============================================
  '/api/**/delete': { type: 'permission', value: 'canDeleteRecords' },

  // ============================================
  // ⚙️ АДМИН-ПАНЕЛЬ — только для менеджеров и выше
  // ============================================
  '/api/admin/**': { type: 'role', value: 'manager' },
}

// ============================================
// 4. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================

/**
 * Извлечь путь без query-параметров
 */
function getPathWithoutQuery(path: string): string {
  return path.split('?')[0] || ''
}

/**
 * Проверить, соответствует ли путь шаблону
 * ✅ Безопасно экранирует спецсимволы RegExp
 * ✅ Поддерживает ** (любые сегменты) и [param] (один сегмент)
 */
function matchPath(pattern: string, path: string): boolean {
  // Если нет динамических элементов, используем быструю проверку префикса
  if (!pattern.includes('**') && !pattern.includes('[')) {
    return path === pattern || path.startsWith(pattern + '/') || path.startsWith(pattern)
  }

  // Экранируем все спецсимволы RegExp, кроме * и [ ]
  let escaped = pattern.replace(/[-\/\\^$+?.()|{}]/g, '\\$&')
  
  // Заменяем [param] на паттерн для одного сегмента пути (без /)
  escaped = escaped.replace(/\[[^\]]+\]/g, '[^/]+')
  
  // Заменяем ** на .* (любые символы, включая /)
  escaped = escaped.replace(/\*\*/g, '.*')
  
  const regex = new RegExp(`^${escaped}$`)
  return regex.test(path)
}

/**
 * Получить требуемые права для пути из конфигурации
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
// ОСНОВНОЙ ОБРАБОТЧИК
// ============================================
export default defineEventHandler(async (event) => {
  const path = getPathWithoutQuery(event.path)

  // ✅ Пропускаем не-API запросы
  if (!path.startsWith('/api/')) {
    return
  }

  // ✅ Пропускаем публичные endpoint'ы
  if (PUBLIC_PATHS.some(publicPath => path.startsWith(publicPath))) {
    return
  }

  try {
    // ============================================
    // 1. ПРОВЕРКА АВТОРИЗАЦИИ
    // ============================================
    const user = await verifyAuth(event)

    // Сохраняем пользователя в контекст для использования в хендлере
    event.context.user = user

    // ============================================
    // 2. ОПРЕДЕЛЯЕМ ТРЕБУЕМЫЕ ПРАВА
    // ============================================
    const requirement = getRequirementForPath(path)

    // Если для пути нет требований — пропускаем (эндпоинт публичен для авторизованных)
    if (!requirement) {
      return
    }

    // ============================================
    // 3. ПРОВЕРКА ПРАВ
    // ============================================
    if (requirement.type === 'permission') {
      // Проверка конкретного права
      const permission = requirement.value as keyof Permissions
      if (!getUserPermissions(user.role as Role)[permission]) {
        throw createError({
          statusCode: 403,
          statusMessage: requirement.message || `Доступ запрещён. Требуется право: ${permission}`
        })
      }
    }
    else if (requirement.type === 'role') {
      // Проверка минимального уровня роли
      const requiredRole = requirement.value as Role
      if (!hasRoleLevel(user.role as Role, requiredRole)) {
        throw createError({
          statusCode: 403,
          statusMessage: requirement.message || `Доступ запрещён. Требуется роль не ниже: ${requiredRole}`
        })
      }
    }
    else if (requirement.type === 'custom' && typeof requirement.value === 'function') {
      // Кастомная проверка
      const customCheck = requirement.value as (user: DbUser) => boolean
      if (!customCheck(user)) {
        throw createError({
          statusCode: 403,
          statusMessage: requirement.message || 'Доступ запрещён'
        })
      }
    }

    // ✅ Все проверки пройдены — разрешаем доступ

  } catch (error) {
    // Если это уже наша ошибка 401/403 — пробрасываем дальше
    if (error instanceof Error && 'statusCode' in error && (error.statusCode === 401 || error.statusCode === 403)) {
      throw error
    }

    // Иначе — ошибка верификации токена или БД
    console.error('[AuthMiddleware] Ошибка проверки авторизации:', error)
    throw createError({
      statusCode: 401,
      statusMessage: 'Требуется авторизация'
    })
  }
})

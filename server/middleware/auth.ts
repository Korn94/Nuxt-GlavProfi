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
import { verifyAuth, getUserPermissions, hasRoleLevel, requirePermission } from '../utils/permissions'
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
  '/api/auth/login',
  '/api/auth/telegram',
  '/api/auth/check',     // ✅ Нужен для фоновой проверки токена
  '/api/me',             // ✅ Возвращает { user: null } для гостей
  '/api/online',         // ✅ Публичный список онлайн-пользователей
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
 */
const PROTECTED_PATHS: Record<string, PathRequirement> = {
  // 💰 Финансы — только для тех, у кого есть право просмотра финансов
  '/api/balance': { type: 'permission', value: 'canViewFinance' },
  '/api/salary': { type: 'permission', value: 'canViewSalary' },
  '/api/expenses': { type: 'permission', value: 'canViewFinance' },

  // 👥 Пользователи — просмотр списка рабочих
  '/api/contractors': { type: 'permission', value: 'canViewWorkers' },

  // 🗑️ Удаление записей — общее правило для всех delete-запросов
  '/api/**/delete': { type: 'permission', value: 'canDeleteRecords' },

  // ⚙️ Админ-панель — только для менеджеров и выше
  '/api/admin/**': { type: 'role', value: 'manager' },

  // 📊 Отчёты — экспорт только для foreman+
  '/api/reports/export': { type: 'role', value: 'foreman' },
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
 * Поддерживает wildcard '**' для группировки
 */
function matchPath(pattern: string, path: string): boolean {
  if (pattern.includes('**')) {
    const regex = new RegExp('^' + pattern.replace(/\*\*/g, '.*') + '$')
    return regex.test(path)
  }
  return path.startsWith(pattern)
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
      if (!hasRoleLevel(user.role, requiredRole)) {
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

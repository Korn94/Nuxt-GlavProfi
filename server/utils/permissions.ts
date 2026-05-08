// server/utils/permissions.ts
/**
 * Серверная логика системы прав доступа (ACL)
 * 
 * ⚠️ Импортирует типы из ~/types/permissions.ts — не дублируйте их здесь!
 * При изменении прав обновляйте только этот файл.
 */

import { createError, type H3Event } from 'h3'
import type { Role, Permissions, UserPermissionsResponse } from '~/types/permissions'
import { ROLE_LEVELS } from '~/types/permissions'
import { verifyAuth } from './auth'
import type { users } from '../db/schema'

// Тип пользователя из БД (для внутренних проверок)
export type DbUser = typeof users.$inferSelect

// ============================================
// КОНФИГУРАЦИЯ ПРАВ ПО РОЛЯМ
// ============================================
/**
 * Карта прав для каждой роли.
 * 
 * ✅ Это единственный файл, где определяются права.
 * Клиент может запрашивать их через /api/permissions для синхронизации.
 */
export const ROLE_PERMISSIONS: Record<Role, Permissions> = {
  // 🟢 Рабочий — минимальные права
  worker: {
    canViewDashboard: true,
    canViewObjects: true,
    canCreateObjects: false,
    canEditObjects: false,
    canDeleteObjects: false,
    canViewFinance: false,
    canEditFinance: false,
    canViewWorkers: false,
    canEditWorkers: false,
    canViewReports: false,
    canExportReports: false,
    canManageUsers: false,
    canDeleteRecords: false,
    canViewAllObjects: false,
    canAssignWorkers: false,
    canApproveWorks: false,
    canViewSalary: false,
    canEditSalary: false
  },

  // 🔵 Мастер — может редактировать свои объекты и подтверждать работы
  master: {
    canViewDashboard: true,
    canViewObjects: true,
    canCreateObjects: false,
    canEditObjects: true,
    canDeleteObjects: false,
    canViewFinance: false,
    canEditFinance: false,
    canViewWorkers: true,
    canEditWorkers: false,
    canViewReports: true,
    canExportReports: false,
    canManageUsers: false,
    canDeleteRecords: false,
    canViewAllObjects: false,
    canAssignWorkers: false,
    canApproveWorks: true,
    canViewSalary: true,
    canEditSalary: false
  },

  // 🟡 Прораб — управление объектами и рабочими
  foreman: {
    canViewDashboard: true,
    canViewObjects: true,
    canCreateObjects: true,
    canEditObjects: true,
    canDeleteObjects: false,
    canViewFinance: true,
    canEditFinance: false,
    canViewWorkers: true,
    canEditWorkers: true,
    canViewReports: true,
    canExportReports: true,
    canManageUsers: false,
    canDeleteRecords: false,
    canViewAllObjects: false,
    canAssignWorkers: true,
    canApproveWorks: true,
    canViewSalary: true,
    canEditSalary: false
  },

  // 🟠 Менеджер — полный доступ к объектам и финансам
  manager: {
    canViewDashboard: true,
    canViewObjects: true,
    canCreateObjects: true,
    canEditObjects: true,
    canDeleteObjects: true,
    canViewFinance: true,
    canEditFinance: true,
    canViewWorkers: true,
    canEditWorkers: true,
    canViewReports: true,
    canExportReports: true,
    canManageUsers: false,
    canDeleteRecords: true,
    canViewAllObjects: true,
    canAssignWorkers: true,
    canApproveWorks: true,
    canViewSalary: true,
    canEditSalary: true
  },

  // 🔴 Админ — все права
  admin: {
    canViewDashboard: true,
    canViewObjects: true,
    canCreateObjects: true,
    canEditObjects: true,
    canDeleteObjects: true,
    canViewFinance: true,
    canEditFinance: true,
    canViewWorkers: true,
    canEditWorkers: true,
    canViewReports: true,
    canExportReports: true,
    canManageUsers: true,
    canDeleteRecords: true,
    canViewAllObjects: true,
    canAssignWorkers: true,
    canApproveWorks: true,
    canViewSalary: true,
    canEditSalary: true
  }
}

// ============================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================

/**
 * Получить права пользователя по его роли
 */
export function getUserPermissions(role: Role): Permissions {
  // Защита от неизвестной роли в БД
  return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.worker
}

/**
 * Проверить, имеет ли пользователь требуемое право
 * @param user - Пользователь из БД
 * @param permission - Ключ права из Permissions
 */
export function hasPermission(user: DbUser, permission: keyof Permissions): boolean {
  const permissions = getUserPermissions(user.role as Role)
  return permissions[permission] || false
}

/**
 * Проверить минимальный уровень роли (для иерархических операций)
 * @param userRole - Текущая роль пользователя (строго тип Role)
 * @param requiredLevel - Требуемая минимальная роль
 */
export function hasRoleLevel(userRole: Role, requiredLevel: Role): boolean {
  const userLevel = ROLE_LEVELS[userRole] || 0
  const requiredLevelValue = ROLE_LEVELS[requiredLevel]
  return userLevel >= requiredLevelValue
}

// ============================================
// | MIDDLEWARE-ФУНКЦИИ ДЛЯ API
// ============================================

/**
 * Универсальная проверка авторизации + прав
 * 
 * @example
 * export default eventHandler(async (event) => {
 *   const user = await requireAuth(event)
 *   requirePermission(event, user, 'canEditFinance')
 *   // ... логика хендлера
 * })
 */
export async function requireAuth(event: H3Event): Promise<DbUser> {
  return await verifyAuth(event)
}

/**
 * Выбросить ошибку 403, если у пользователя нет права
 */
export function requirePermission(
  event: H3Event,
  user: DbUser,
  permission: keyof Permissions,
  customMessage?: string
): void {
  if (!hasPermission(user, permission)) {
    throw createError({
      statusCode: 403,
      statusMessage: customMessage || `Доступ запрещён. Требуется право: ${permission}`
    })
  }
}

/**
 * Проверка минимального уровня роли для доступа к эндпоинту
 */
export function requireRoleLevel(
  event: H3Event,
  user: DbUser,
  requiredLevel: Role,
  customMessage?: string
): void {
  // Приводим роль пользователя к типу Role (так как в БД это строка)
  if (!hasRoleLevel(user.role as Role, requiredLevel)) {
    throw createError({
      statusCode: 403,
      statusMessage: customMessage || `Требуется роль не ниже ${requiredLevel}`
    })
  }
}

// ============================================
// | ЭКСПОРТ ДЛЯ СИНХРОНИЗАЦИИ С КЛИЕНТОМ
// ============================================

/**
 * Получить полные права пользователя для ответа API
 * Используется в /api/permissions для синхронизации с клиентом
 */
export function getUserPermissionsResponse(user: DbUser): UserPermissionsResponse {
  const role = user.role as Role
  return {
    role,
    permissions: getUserPermissions(role),
    level: ROLE_LEVELS[role]
  }
}

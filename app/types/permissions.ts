// app/types/permissions.ts
/**
 * Типы для системы прав доступа (ACL)
 * ⚠️ Этот файл импортируется и на клиенте, и на сервере.
 *
 * Новая система (без legacy):
 * - Права определяются на уровне страниц (pages)
 * - Каждое действие: canView, canCreate, canEdit, canDelete, canSpecial
 * - UI использует authStore.pages для проверки прав
 */

// ============================================
// РОЛИ
// ============================================
export type Role = 'worker' | 'master' | 'foreman' | 'manager' | 'admin'

// ============================================
// УРОВНИ РОЛЕЙ (для иерархии)
// ============================================
export const ROLE_LEVELS: Record<Role, number> = {
  worker: 1,
  master: 2,
  foreman: 3,
  manager: 4,
  admin: 5
} as const

// ============================================
// ПРАВА НА СТРАНИЦЕ (новая система)
// ============================================
export interface PagePermissions {
  canView: boolean
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
  canSpecial: boolean
}

// ============================================
// ДЕЙСТВИЯ НА СТРАНИЦЕ
// ============================================
export type PageAction = 'view' | 'create' | 'edit' | 'delete' | 'special'

// ============================================
// SLUG СТРАНИЦ СИСТЕМЫ (все доступные разделы)
// ============================================
export type PageSlug =
  | 'dashboard'
  | 'objects'
  | 'comings'
  | 'expenses'
  | 'materials'
  | 'works'
  | 'contractors'
  | 'portfolio'
  | 'price'
  | 'users'
  | 'settings'
  | 'online'

// ============================================
// ОТВЕТ API /api/permissions
// ============================================
export interface UserPermissionsResponse {
  role: Role
  level: number
  pages: Record<PageSlug, PagePermissions>
}

// ============================================
// ВСПОМОГАТЕЛЬНЫЕ ТИПЫ
// ============================================

/**
 * Проверить что строка является валидной ролью
 */
export function isValidRole(role: string): role is Role {
  return Object.keys(ROLE_LEVELS).includes(role)
}

/**
 * Получить уровень роли (для сравнения)
 */
export function getRoleLevel(role: Role | string): number {
  return ROLE_LEVELS[role as Role] || 0
}

/**
 * Проверить что у пользователя роль не ниже требуемой
 */
export function hasRequiredRole(userRole: Role | string, requiredRole: Role): boolean {
  return getRoleLevel(userRole) >= getRoleLevel(requiredRole)
}

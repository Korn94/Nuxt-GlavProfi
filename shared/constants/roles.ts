// shared/constants/roles.ts

/**
 * 🎭 Иерархия ролей системы (единый источник истины)
 * 
 * Используется:
 * - В middleware (server/middleware/auth.ts, app/middleware/role.ts)
 * - В проверках прав (usePermissions composable)
 * - В валидаторах (zod schemas)
 * - В типах (Role, RoleLevel)
 *
 * ⚠️ ВАЖНО: При добавлении новой роли нужно обновить ОДНО место — здесь.
 * Остальные места (enum в БД, UI формы) синхронизируются через тип Role.
 */

export const ROLE_LEVELS = {
  worker: 1,    // Рабочий — минимальные права
  master: 2,    // Мастер — работа на объекте
  foreman: 3,   // Прораб — управление объектом
  manager: 4,   // Менеджер — управление финансами и людьми
  admin: 5      // Администратор — полный доступ
} as const

/**
 * Тип всех валидных ролей (извлекается из константы автоматически)
 */
export type Role = keyof typeof ROLE_LEVELS

/**
 * Массив всех ролей (удобно для zod.enum и UI dropdown)
 */
export const VALID_ROLES = Object.keys(ROLE_LEVELS) as Role[]

/**
 * Уровни ролей как значения (для zod.enum в числовых проверках)
 */
export type RoleLevel = (typeof ROLE_LEVELS)[Role]

/**
 * Получить числовой уровень роли
 * @returns уровень (1-5) или 0 если роль неизвестна
 */
export function getRoleLevel(role: string | Role): number {
  return ROLE_LEVELS[role as Role] ?? 0
}

/**
 * Проверить, что у пользователя уровень не ниже требуемого
 * 
 * @example
 * hasRequiredRoleLevel('manager', 'foreman') // true (4 >= 3)
 * hasRequiredRoleLevel('worker', 'manager')  // false (1 < 4)
 */
export function hasRequiredRoleLevel(
  userRole: string | Role,
  requiredRole: string | Role
): boolean {
  return getRoleLevel(userRole) >= getRoleLevel(requiredRole)
}

/**
 * Получить список всех ролей, которые имеют такой же или более высокий уровень
 * (удобно для "кто может видеть это действие")
 * 
 * @example
 * getRolesWithMinLevel('foreman') // ['foreman', 'manager', 'admin']
 */
export function getRolesWithMinLevel(minRole: Role): Role[] {
  const minLevel = getRoleLevel(minRole)
  return VALID_ROLES.filter(role => getRoleLevel(role) >= minLevel)
}

/**
 * Получить русское название роли (для UI)
 */
export const ROLE_LABELS: Record<Role, string> = {
  worker: 'Рабочий',
  master: 'Мастер',
  foreman: 'Прораб',
  manager: 'Менеджер',
  admin: 'Администратор'
} as const

/**
 * Получить цвет роли (для бейджей в UI)
 */
export const ROLE_COLORS: Record<Role, string> = {
  worker: '#6c757d',    // серый
  master: '#17a2b8',    // бирюзовый
  foreman: '#ffc107',   // жёлтый
  manager: '#28a745',   // зелёный
  admin: '#dc3545'      // красный
} as const

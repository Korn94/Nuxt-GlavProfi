// server/utils/permissions/validators.ts
/**
* Валидаторы входящих данных для API системы прав
* Использует zod для строгой типизации и валидации
*
* Упрощённая система действий: create, edit, delete, special
*/
import { z } from 'zod'
import { createError } from 'h3'

// ============================================
// КОНСТАНТЫ
// ============================================
export const VALID_ROLES = ['admin', 'manager', 'foreman', 'master', 'worker'] as const
export type Role = typeof VALID_ROLES[number]

// ============================================
// ХЕЛПЕРЫ
// ============================================

/**
* Проверить что строка является валидной ролью
*/
export function isValidRole(role: string): role is Role {
  return VALID_ROLES.includes(role as Role)
}

/**
* Обернуть zod ошибку в HTTP 400
*/
function throwZodError(error: z.ZodError, context?: string): never {
  const issues = error.issues.map(issue => {
    const path = issue.path.join('.')
    return `${path}: ${issue.message}`
  })
  throw createError({
    statusCode: 400,
    statusMessage: `Ошибка валидации${context ? ` (${context})` : ''}: ${issues.join('; ')}`
  })
}

// ============================================
// ZOD СХЕМЫ
// ============================================

/**
* Схема для прав на странице (упрощённая: create, edit, delete, special)
*/
export const PagePermissionsSchema = z.object({
  canView: z.boolean().optional(),
  canCreate: z.boolean().optional(),
  canEdit: z.boolean().optional(),
  canDelete: z.boolean().optional(),
  canSpecial: z.boolean().optional()
})

/**
* Схема для обновления прав роли
*/
export const UpdateRolePermissionsSchema = z.object({
  description: z.string().max(500).optional(),
  permissions: z.record(z.string(), PagePermissionsSchema).refine(
    (perms) => Object.keys(perms).length > 0,
    { message: 'Необходимо указать хотя бы одну страницу' }
  )
})

/**
* Схема для копирования прав между ролями
*/
export const CopyRolePermissionsSchema = z.object({
  from: z.enum(VALID_ROLES),
  to: z.enum(VALID_ROLES)
}).refine(
  (data) => data.from !== data.to,
  { message: 'Нельзя копировать роль в саму себя', path: ['to'] }
)

/**
* Схема для одного переопределения пользователя
*/
export const UserOverrideSchema = z.object({
  pageSlug: z.string().min(1).max(50),
  canView: z.boolean().optional(),
  canCreate: z.boolean().optional(),
  canEdit: z.boolean().optional(),
  canDelete: z.boolean().optional(),
  canSpecial: z.boolean().optional(),
  reason: z.string().max(500).optional(),
  expiresAt: z.string().datetime().optional()
})

/**
* Схема для batch применения переопределений
*/
export const UserOverridesSchema = z.object({
  overrides: z.array(UserOverrideSchema).min(1, {
    message: 'Необходимо указать хотя бы одно переопределение'
  })
})

/**
* Схема для query параметров списка пользователей
*/
export const UsersQuerySchema = z.object({
  role: z.enum(VALID_ROLES).optional(),
  search: z.string().max(100).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  withOverrides: z.coerce.boolean().default(false)
})

// ============================================
// ВАЛИДАТОРЫ (обёртки над zod)
// ============================================

/**
* Валидация для PUT /api/permissions/roles/[role]
*/
export function validateUpdateRolePermissions(data: unknown) {
  const result = UpdateRolePermissionsSchema.safeParse(data)
  if (!result.success) {
    throwZodError(result.error, 'обновление прав роли')
  }
  return result.data
}

/**
* Валидация для POST /api/permissions/roles/copy
*/
export function validateCopyRolePermissions(data: unknown) {
  const result = CopyRolePermissionsSchema.safeParse(data)
  if (!result.success) {
    throwZodError(result.error, 'копирование прав')
  }
  return result.data
}

/**
* Валидация для POST /api/permissions/users/[id]/overrides
*/
export function validateUserOverrides(data: unknown) {
  const result = UserOverridesSchema.safeParse(data)
  if (!result.success) {
    throwZodError(result.error, 'переопределения пользователя')
  }
  return result.data
}

/**
* Валидация query параметров для GET /api/permissions/users
*/
export function validateUsersQuery(query: Record<string, string | undefined>) {
  const result = UsersQuerySchema.safeParse(query)
  if (!result.success) {
    throwZodError(result.error, 'параметры запроса')
  }
  return result.data
}

// ============================================
// ЭКСПОРТ ТИПОВ (для использования в коде)
// ============================================
export type UpdateRolePermissionsInput = z.infer<typeof UpdateRolePermissionsSchema>
export type CopyRolePermissionsInput = z.infer<typeof CopyRolePermissionsSchema>
export type UserOverride = z.infer<typeof UserOverrideSchema>
export type UserOverridesInput = z.infer<typeof UserOverridesSchema>
export type UsersQueryInput = z.infer<typeof UsersQuerySchema>

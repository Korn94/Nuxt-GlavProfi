// server/utils/permissions/validators.ts
/**
 * Валидаторы входящих данных для API системы прав
 *
 * Использует:
 * - Zod-схемы из shared/types/permissions (PagePermissionsSchema)
 * - Enum-валидаторы из shared/constants (PageSlugSchema, PageActionSchema)
 * - Константы ролей из shared/constants/roles (VALID_ROLES, Role)
 *
 * Архитектурный принцип: все переиспользуемые схемы живут в shared/,
 * здесь только специфичные для серверных API схемы.
 */

import { z } from 'zod'
import { createError } from 'h3'

import {
  VALID_ROLES,
  type Role
} from 'shared/constants/roles'

import {
  PageSlugSchema,
  PageActionSchema
} from 'shared/constants/permissions'

import {
  PagePermissionsSchema
} from 'shared/types/permissions'

// ============================================
// РОЛЕВАЯ СХЕМА (используется в валидаторах ниже)
// ============================================

/**
 * Zod-схема для валидации роли
 * Автоматически синхронизируется с VALID_ROLES через z.enum
 */
export const RoleSchema = z.enum(VALID_ROLES)

// ============================================
// ХЕЛПЕРЫ
// ============================================

/**
 * Проверить что строка является валидной ролью (type guard)
 * Делегирует проверку в zod — единый источник истины
 */
export function isValidRole(role: string): role is Role {
  return RoleSchema.safeParse(role).success
}

/**
 * Обернуть zod-ошибку в HTTP 400
 * Формирует человекочитаемое сообщение из всех issues
 */
function throwZodError(error: z.ZodError, context?: string): never {
  const issues = error.issues.map((issue) => {
    const path = issue.path.join('.')
    return `${path}: ${issue.message}`
  })
  throw createError({
    statusCode: 400,
    statusMessage: `Ошибка валидации${context ? ` (${context})` : ''}: ${issues.join('; ')}`
  })
}

// ============================================
// ZOD-СХЕМЫ (специфичные для серверных API)
// ============================================

/**
 * Схема для обновления прав роли
 * permissions: Record<PageSlug, PagePermissions>
 */
export const UpdateRolePermissionsSchema = z.object({
  description: z.string().max(500).optional(),
  permissions: z.record(PageSlugSchema, PagePermissionsSchema).refine(
    (perms) => Object.keys(perms).length > 0,
    { message: 'Необходимо указать хотя бы одну страницу' }
  )
})

/**
 * Схема для копирования прав между ролями
 * from и to должны быть валидными ролями и различаться
 */
export const CopyRolePermissionsSchema = z.object({
  from: RoleSchema,
  to: RoleSchema
}).refine(
  (data) => data.from !== data.to,
  { message: 'Нельзя копировать роль в саму себя', path: ['to'] }
)

/**
 * Схема для одного переопределения прав пользователя
 * pageSlug валидируется через PageSlugSchema (enum из shared)
 */
export const UserOverrideSchema = z.object({
  pageSlug: PageSlugSchema,
  canView: z.boolean().optional(),
  canCreate: z.boolean().optional(),
  canEdit: z.boolean().optional(),
  canDelete: z.boolean().optional(),
  canSpecial: z.boolean().optional(),
  reason: z.string().max(500).optional(),
  expiresAt: z.string().datetime().optional()
})

/**
 * Схема для batch-применения переопределений
 */
export const UserOverridesSchema = z.object({
  overrides: z.array(UserOverrideSchema).min(1, {
    message: 'Необходимо указать хотя бы одно переопределение'
  })
})

/**
 * Схема для query-параметров списка пользователей
 */
export const UsersQuerySchema = z.object({
  role: RoleSchema.optional(),
  search: z.string().max(100).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  withOverrides: z.coerce.boolean().default(false)
})

/**
 * Схема для создания новой страницы (только для админов)
 */
export const CreatePageSchema = z.object({
  slug: PageSlugSchema,
  name: z.string().min(1).max(255),
  description: z.string().max(500).optional(),
  icon: z.string().max(50).optional(),
  order: z.number().int().min(0).default(0),
  hasCreate: z.boolean().default(false),
  hasEdit: z.boolean().default(false),
  hasDelete: z.boolean().default(false),
  hasSpecial: z.boolean().default(false)
})

/**
 * Схема для обновления существующей страницы
 */
export const UpdatePageSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(500).nullable().optional(),
  icon: z.string().max(50).nullable().optional(),
  order: z.number().int().min(0).optional(),
  hasCreate: z.boolean().optional(),
  hasEdit: z.boolean().optional(),
  hasDelete: z.boolean().optional(),
  hasSpecial: z.boolean().optional(),
  isActive: z.boolean().optional()
})

// ============================================
// ВАЛИДАТОРЫ (обёртки над zod для API endpoints)
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
 * Валидация query-параметров для GET /api/permissions/users
 */
export function validateUsersQuery(query: Record<string, string | undefined>) {
  const result = UsersQuerySchema.safeParse(query)
  if (!result.success) {
    throwZodError(result.error, 'параметры запроса')
  }
  return result.data
}

/**
 * Валидация тела запроса для POST /api/permissions/pages
 */
export function validateCreatePage(data: unknown) {
  const result = CreatePageSchema.safeParse(data)
  if (!result.success) {
    throwZodError(result.error, 'создание страницы')
  }
  return result.data
}

/**
 * Валидация тела запроса для PUT /api/permissions/pages/[slug]
 */
export function validateUpdatePage(data: unknown) {
  const result = UpdatePageSchema.safeParse(data)
  if (!result.success) {
    throwZodError(result.error, 'обновление страницы')
  }
  return result.data
}

/**
 * Валидация slug страницы из URL-параметра
 */
export function validatePageSlugParam(slug: unknown) {
  const result = PageSlugSchema.safeParse(slug)
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: `Некорректный slug страницы: ${String(slug)}`
    })
  }
  return result.data
}

/**
 * Валидация роли из URL-параметра
 */
export function validateRoleParam(role: unknown) {
  const result = RoleSchema.safeParse(role)
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: `Некорректная роль: ${String(role)}`
    })
  }
  return result.data
}

// ============================================
// ЭКСПОРТ ТИПОВ (type inference из zod)
// ============================================

export type UpdateRolePermissionsInput = z.infer<typeof UpdateRolePermissionsSchema>
export type CopyRolePermissionsInput = z.infer<typeof CopyRolePermissionsSchema>
export type UserOverrideInput = z.infer<typeof UserOverrideSchema>
export type UserOverridesInput = z.infer<typeof UserOverridesSchema>
export type UsersQueryInput = z.infer<typeof UsersQuerySchema>
export type CreatePageInput = z.infer<typeof CreatePageSchema>
export type UpdatePageInput = z.infer<typeof UpdatePageSchema>

// shared/types/permissions.ts
/**
 * 📋 Типы системы прав доступа (ACL)
 * 
 * Единый файл с типами для клиента и сервера
 * Использует zod inference для автоматической синхронизации с валидаторами
 * 
 * Импорт:
 *   import type { PagePermissions, UserPermissionsResponse } from 'shared/types/permissions'
 */

import { z } from 'zod'
import type { PageSlug, PageAction } from 'shared/constants/permissions'

// ============================================
// ПРАВА НА СТРАНИЦЕ
// ============================================

/**
 * Zod-схема для прав на странице
 * Используется для валидации на сервере и type inference
 */
export const PagePermissionsSchema = z.object({
  canView: z.boolean(),
  canCreate: z.boolean(),
  canEdit: z.boolean(),
  canDelete: z.boolean(),
  canSpecial: z.boolean()
})

/**
 * Права пользователя на конкретную страницу
 * 
 * @example
 * const objectsPerms: PagePermissions = {
 *   canView: true,
 *   canCreate: true,
 *   canEdit: true,
 *   canDelete: false,
 *   canSpecial: false
 * }
 */
export type PagePermissions = z.infer<typeof PagePermissionsSchema>

// ============================================
// ОТВЕТ API /api/permissions
// ============================================

/**
 * Zod-схема для ответа API прав пользователя
 */
export const UserPermissionsResponseSchema = z.object({
  role: z.string(),
  level: z.number(),
  pages: z.record(z.string(), PagePermissionsSchema)
})

/**
 * Ответ эндпоинта GET /api/permissions
 * Содержит все права пользователя на уровне страниц
 */
export type UserPermissionsResponse = z.infer<typeof UserPermissionsResponseSchema>

// ============================================
// СТРАНИЦА СИСТЕМЫ (из БД)
// ============================================

/**
 * Zod-схема для страницы системы (из таблицы permissions_pages)
 */
export const SystemPageSchema = z.object({
  id: z.number(),
  slug: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  icon: z.string().nullable(),
  parentId: z.number().nullable(),
  order: z.number(),
  hasCreate: z.boolean(),
  hasEdit: z.boolean(),
  hasDelete: z.boolean(),
  hasSpecial: z.boolean(),
  isActive: z.boolean(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional()
})

/**
 * Страница системы из БД (полная информация)
 */
export type SystemPage = z.infer<typeof SystemPageSchema>

// ============================================
// ПЕРЕОПРЕДЕЛЕНИЕ ПРАВ ПОЛЬЗОВАТЕЛЯ
// ============================================

/**
 * Zod-схема для переопределения прав пользователя
 * null = использовать права роли
 */
export const UserPermissionOverrideSchema = z.object({
  userId: z.number(),
  pageSlug: z.string(),
  canView: z.boolean().nullable(),
  canCreate: z.boolean().nullable(),
  canEdit: z.boolean().nullable(),
  canDelete: z.boolean().nullable(),
  canSpecial: z.boolean().nullable(),
  reason: z.string().nullable(),
  expiresAt: z.string().datetime().nullable(),
  createdBy: z.number().nullable().optional(),
  isActive: z.boolean().optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional()
})

/**
 * Переопределение прав для конкретного пользователя
 * Позволяет дать/забрать права независимо от роли
 */
export type UserPermissionOverride = z.infer<typeof UserPermissionOverrideSchema>

// ============================================
// ПРАВА РОЛИ НА СТРАНИЦУ
// ============================================

/**
 * Zod-схема для базовых прав роли на страницу
 */
export const RolePageAccessSchema = z.object({
  role: z.string(),
  pageSlug: z.string(),
  canView: z.boolean(),
  canCreate: z.boolean(),
  canEdit: z.boolean(),
  canDelete: z.boolean(),
  canSpecial: z.boolean(),
  comment: z.string().nullable(),
  updatedBy: z.number().nullable().optional(),
  isActive: z.boolean().optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional()
})

/**
 * Запись прав роли на конкретную страницу
 */
export type RolePageAccess = z.infer<typeof RolePageAccessSchema>

// ============================================
// SEED ДАННЫЕ (для инициализации)
// ============================================

/**
 * Данные для создания страницы при seed
 */
export interface PageSeedData {
  slug: string
  name: string
  description?: string
  icon?: string
  parentId?: string | null
  order?: number
  hasCreate?: boolean
  hasEdit?: boolean
  hasDelete?: boolean
  hasSpecial?: boolean
  children?: PageSeedData[]
}

/**
 * Структура seed данных прав ролей
 * { role: { pageSlug: Partial<PagePermissions> } }
 */
export interface RolePermissionsSeed {
  [role: string]: {
    [pageSlug: string]: Partial<PagePermissions>
  }
}

// ============================================
// ВСПОМОГАТЕЛЬНЫЕ ТИПЫ
// ============================================

/**
 * Конфигурация пути в middleware
 */
export interface PathRequirement {
  type: 'page' | 'role' | 'custom'
  value: string | ((user: any) => boolean | Promise<boolean>)
  action?: PageAction
  message?: string
}

/**
 * Кэшированные права пользователя
 */
export interface CachedPermissions {
  permissions: Record<string, PagePermissions>
  timestamp: number
}

// shared/types/permissions.ts
import { z } from 'zod'

/**
 * Права на действия для одной страницы
 *
 * Модель прав:
 * - canView — доступ на чтение (Read-Only Access)
 * - canCreate — создание записей
 * - canEdit — редактирование записей
 * - canDelete — удаление записей
 * - canSpecial — специфичные бизнес-операции (accept/pay/reorder/toggle-check)
 *
 * Видимость раздела в меню:
 * isVisible = canView || canCreate || canEdit || canDelete || canSpecial
 */
export const PagePermissionsSchema = z.object({
  canView: z.boolean(),
  canCreate: z.boolean(),
  canEdit: z.boolean(),
  canDelete: z.boolean(),
  canSpecial: z.boolean()
})

export type PagePermissions = z.infer<typeof PagePermissionsSchema>

/**
 * Данные для seed страниц (из shared/constants/permissions + описания)
 */
export interface PageSeedData {
  slug: string
  name: string
  description?: string
  icon?: string
  order?: number
  hasCreate?: boolean
  hasEdit?: boolean
  hasDelete?: boolean
  hasSpecial?: boolean
}

/**
 * Матрица прав ролей для seed
 * Record<role, Record<pageSlug, Partial<PagePermissions>>>
 */
export type RolePermissionsSeed = Record<string, Record<string, Partial<PagePermissions>>>

/**
 * Ответ API с правами пользователя
 */
export interface UserPermissionsResponse {
  role: string
  level: number
  pages: Record<string, PagePermissions>
}

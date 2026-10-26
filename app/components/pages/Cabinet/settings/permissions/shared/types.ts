// app/components/pages/Cabinet/settings/permissions/shared/types.ts
/**
 * Общие типы раздела «Права доступа».
 *
 * `SystemPage`, `UserOverride`, `RoleWithPermissions`, `UserWithPermissions`
 * живут в `~/composables/usePermissionsApi` (это типы ответа API — единственный
 * источник истины). Здесь — только UI-абстракции, которых в API нет.
 */
import type { SystemPage } from '~/composables/usePermissionsApi'

/**
 * Строк действия переопределения (для бейджей и сортировки по срочности).
 */
export type ExpirationStatus = 'active' | 'expiring' | 'expired' | 'permanent'

/**
 * Поддерживаемые страницей действия — определяют, какие чекбоксы/теги рендерить.
 * Выводится из `SystemPage`, чтобы формы не расходились.
 */
export type PageCapabilities = Pick<
  SystemPage,
  'hasCreate' | 'hasEdit' | 'hasDelete' | 'hasSpecial'
>

/**
 * Ключи объекта прав (для итерации по чекбоксам).
 */
export type PermissionAction =
  | 'canView'
  | 'canCreate'
  | 'canEdit'
  | 'canDelete'
  | 'canSpecial'

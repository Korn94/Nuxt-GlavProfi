// server/utils/permissions/types.ts
/**
* Типы для системы прав доступа на уровне страниц
* ⚠️ Импортируется и на клиенте, и на сервере
*
* Упрощённая система действий:
* - create, edit, delete — стандартные CRUD операции
* - special — специфичные бизнес-операции (accept/reject/pay/reorder/toggle-check и т.д.)
*/

// ============================================
// ТИПЫ ДЕЙСТВИЙ НА СТРАНИЦАХ
// ============================================

export type PageAction = 'create' | 'edit' | 'delete' | 'special'

// ============================================
// ПРАВА ДЛЯ СТРАНИЦЫ
// ============================================

export interface PagePermissions {
  canView: boolean
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
  canSpecial: boolean
}

// ============================================
// СТРАНИЦА СИСТЕМЫ (из БД)
// ============================================

export interface SystemPage {
  id: number
  slug: string
  name: string
  description: string | null
  icon: string | null
  parentId: number | null
  order: number
  hasCreate: boolean
  hasEdit: boolean
  hasDelete: boolean
  hasSpecial: boolean
  isActive: boolean
}

// ============================================
// КОНФИГУРАЦИЯ ПРАВ РОЛИ ДЛЯ СТРАНИЦЫ
// ============================================

export interface RolePageAccess {
  role: string
  pageSlug: string
  canView: boolean
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
  canSpecial: boolean
  comment: string | null
}

// ============================================
// ПЕРЕОПРЕДЕЛЕНИЕ ПРАВ ПОЛЬЗОВАТЕЛЯ
// ============================================

export interface UserPermissionOverride {
  userId: number
  pageSlug: string
  canView: boolean | null
  canCreate: boolean | null
  canEdit: boolean | null
  canDelete: boolean | null
  canSpecial: boolean | null
  reason: string | null
  expiresAt: string | null
}

// ============================================
// ОТВЕТ API ДЛЯ КЛИЕНТА
// ============================================

export interface UserPermissionsResponse {
  role: string
  level: number
  pages: Record<string, PagePermissions>
}

// ============================================
// SEED ДАННЫЕ
// ============================================

export interface PageSeedData {
  slug: string
  name: string
  description?: string
  icon?: string
  parentId?: string | null // slug родителя
  order?: number
  hasCreate?: boolean
  hasEdit?: boolean
  hasDelete?: boolean
  hasSpecial?: boolean
  children?: PageSeedData[]
}

export interface RolePermissionsSeed {
  [role: string]: {
    [pageSlug: string]: Partial<PagePermissions>
  }
}

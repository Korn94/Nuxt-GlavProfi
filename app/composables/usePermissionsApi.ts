// app/composables/usePermissionsApi.ts
/**
 * API клиент для системы прав доступа
 * Использует useApi() для автоматической передачи JWT и обработки ошибок
 *
 * Новая система прав:
 * - canView, canCreate, canEdit, canDelete, canSpecial
 * - Без legacy (canExport, canApprove)
 */
import type { PagePermissions } from 'server/utils/permissions/types'
import { useApi } from './useApi'

// ============================================
// ТИПЫ ОТВЕТА API
// ============================================

export interface SystemPage {
  slug: string
  name: string
  description: string | null
  icon: string | null
  order: number
  hasCreate: boolean
  hasEdit: boolean
  hasDelete: boolean
  hasSpecial: boolean
  parentId: number | null
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

export interface RoleWithPermissions {
  role: string
  userCount: number
  permissions: Record<string, PagePermissions>
}

export interface UserWithPermissions {
  id: number
  name: string
  login: string
  role: string
  contractorType: string | null
  contractorId: number | null
  createdAt: string
  basePermissions: Record<string, PagePermissions>
  overrides: UserOverride[]
  effectivePermissions: Record<string, PagePermissions>
}

export interface UserOverride {
  id: number
  pageSlug: string
  canView: boolean | null
  canCreate: boolean | null
  canEdit: boolean | null
  canDelete: boolean | null
  canSpecial: boolean | null
  reason: string | null
  expiresAt: string | null
  createdAt: string
  createdBy: number | null
}

export interface PaginationResponse {
  page: number
  limit: number
  total: number
  totalPages: number
}

// ============================================
// API ФУНКЦИИ (используют useApi)
// ============================================

/**
 * Получить список всех страниц системы
 */
export async function fetchPermissionsPages(): Promise<SystemPage[]> {
  const api = useApi()
  const response = await api.get<{ pages: SystemPage[] }>('/api/permissions/pages')
  return response.pages || []
}

/**
 * Получить список всех ролей с правами и количеством пользователей
 */
export async function fetchPermissionsRoles(): Promise<RoleWithPermissions[]> {
  const api = useApi()
  const response = await api.get<{ roles: RoleWithPermissions[] }>('/api/permissions/roles')
  return response.roles || []
}

/**
 * Обновить права роли
 */
export async function updateRolePermissions(
  role: string,
  permissions: Record<string, PagePermissions>,
  description?: string
): Promise<{
  role: string
  updatedCount: number
  permissions: Record<string, PagePermissions>
}> {
  const api = useApi()
  return await api.put(`/api/permissions/roles/${role}`, { permissions, description })
}

/**
 * Сбросить права роли к дефолтным значениям
 */
export async function resetRolePermissions(role: string): Promise<{
  role: string
  resetCount: number
  previousCount: number
  message: string
}> {
  const api = useApi()
  return await api.post(`/api/permissions/roles/${role}/reset`)
}

/**
 * Скопировать права из одной роли в другую
 */
export async function copyRolePermissions(from: string, to: string): Promise<{
  from: string
  to: string
  copiedCount: number
  previousCount: number
  message: string
}> {
  const api = useApi()
  return await api.post('/api/permissions/roles/copy', { from, to })
}

/**
 * Получить список пользователей с правами
 */
export async function fetchPermissionsUsers(params: {
  role?: string
  search?: string
  page?: number
  limit?: number
  withOverrides?: boolean
} = {}): Promise<{
  users: UserWithPermissions[]
  pagination: PaginationResponse
}> {
  const api = useApi()
  // Формируем query string
  const query = new URLSearchParams()
  if (params.role) query.append('role', params.role)
  if (params.search) query.append('search', params.search)
  if (params.page) query.append('page', String(params.page))
  if (params.limit) query.append('limit', String(params.limit))
  if (params.withOverrides) query.append('withOverrides', 'true')
  const queryString = query.toString()
  const url = `/api/permissions/users${queryString ? `?${queryString}` : ''}`
  return await api.get(url)
}

/**
 * Получить переопределения конкретного пользователя
 */
export async function fetchUserOverrides(userId: number): Promise<{
  userId: number
  userName: string
  login: string
  role: string
  basePermissions: Record<string, PagePermissions>
  overrides: UserOverride[]
  effectivePermissions: Record<string, PagePermissions>
}> {
  const api = useApi()
  return await api.get(`/api/permissions/users/${userId}/overrides`)
}

/**
 * Применить переопределения прав для пользователя
 */
export async function applyUserOverrides(
  userId: number,
  overrides: Array<{
    pageSlug: string
    canView?: boolean
    canCreate?: boolean
    canEdit?: boolean
    canDelete?: boolean
    canSpecial?: boolean
    reason?: string
    expiresAt?: string
  }>
): Promise<{
  userId: number
  userName: string
  created: number
  updated: number
  applied: number
}> {
  const api = useApi()
  return await api.post(`/api/permissions/users/${userId}/overrides`, { overrides })
}

/**
 * Удалить все переопределения пользователя
 */
export async function clearUserOverrides(userId: number): Promise<{
  userId: number
  userName: string
  deletedCount: number
  message: string
}> {
  const api = useApi()
  return await api.delete(`/api/permissions/users/${userId}/overrides`)
}

/**
 * Удалить переопределение для конкретной страницы
 */
export async function removeUserOverride(userId: number, pageSlug: string): Promise<{
  userId: number
  userName: string
  pageSlug: string
  deleted: boolean
}> {
  const api = useApi()
  return await api.delete(`/api/permissions/users/${userId}/overrides/${pageSlug}`)
}

/**
 * Инициализировать систему прав (заполнить таблицы из seed)
 */
export async function initPermissionsSystem(): Promise<{
  pagesCreated: number
  pagesExisting: number
  rolesCreated: number
  rolesExisting: number
  message: string
}> {
  const api = useApi()
  return await api.post('/api/permissions/init')
}

// ============================================
// УПРАВЛЕНИЕ СТРАНИЦАМИ (только для админов)
// ============================================

/**
 * Создать новую страницу
 */
export async function createPermissionsPage(data: {
  slug: string
  name: string
  description?: string
  icon?: string
  order?: number
  hasCreate?: boolean
  hasEdit?: boolean
  hasDelete?: boolean
  hasSpecial?: boolean
}): Promise<{ page: SystemPage }> {
  const api = useApi()
  return await api.post('/api/permissions/pages', data)
}

/**
 * Обновить страницу
 */
export async function updatePermissionsPage(
  slug: string,
  data: {
    name?: string
    description?: string | null
    icon?: string | null
    order?: number
    hasCreate?: boolean
    hasEdit?: boolean
    hasDelete?: boolean
    hasSpecial?: boolean
    isActive?: boolean
  }
): Promise<{ page: SystemPage }> {
  const api = useApi()
  return await api.put(`/api/permissions/pages/${slug}`, data)
}

/**
 * Удалить страницу
 * @param hard — если true, полное удаление с CASCADE (опасно!)
 */
export async function deletePermissionsPage(
  slug: string,
  hard: boolean = false
): Promise<{
  slug: string
  mode: 'soft' | 'hard'
  affectedRoles: number
  affectedUsers: number
  message: string
}> {
  const api = useApi()
  return await api.delete(`/api/permissions/pages/${slug}?hard=${hard}`)
}

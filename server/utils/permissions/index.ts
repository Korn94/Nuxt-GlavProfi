// server/utils/permissions/index.ts
/**
 * Основные функции системы прав доступа (серверная логика)
 *
 * Архитектура:
 * - Чтение прав из БД (permissions_role_access + permissions_user_overrides)
 * - Поддержка переопределений для конкретных пользователей с expiresAt
 * - Кэширование в памяти (5 мин TTL) — инвалидируется при изменениях
 * - Упрощённая система действий: view, create, edit, delete, special
 *
 * Импорт:
 *   import { hasUserPermission, getAllUserPermissions } from '~/server/utils/permissions'
 *
 * ⚠️ ВАЖНО: Возвращает ТОЛЬКО новую систему (pages), без legacy (permissions)
 */

import { db } from '../../db'
import {
  permissionsPages,
  permissionsRoleAccess,
  permissionsUserOverrides,
  users  // ✅ Обычный импорт (не type), так как используется в drizzle-запросах
} from '../../db/schema'
import { eq, and, or, isNull, gt, sql } from 'drizzle-orm'

import {
  ROLE_LEVELS,
  hasRequiredRoleLevel,
  type Role
} from 'shared/constants/roles'

import type { PageAction } from 'shared/constants/permissions'  // ✅ Импорт из constants

import type {
  PagePermissions,
  UserPermissionsResponse
} from 'shared/types/permissions'

// ============================================
// ТИПЫ
// ============================================

export type DbUser = typeof users.$inferSelect

// ============================================
// КЭШИРОВАНИЕ (in-memory, 5 минут TTL)
// ============================================

interface CachedPermissions {
  permissions: UserPermissionsResponse
  timestamp: number
}

const permissionsCache = new Map<number, CachedPermissions>()
const CACHE_TTL = 5 * 60 * 1000 // 5 минут

// ============================================
// ПОЛУЧЕНИЕ ВСЕХ ПРАВ (оптимизированная версия)
// ============================================

/**
 * Получить все права пользователя для всех активных страниц
 *
 * Выполняет только 3 запроса к БД вместо N+1:
 * 1. Все активные страницы
 * 2. Все права роли для всех страниц
 * 3. Все активные переопределения пользователя
 *
 * Затем собирает результат в памяти.
 *
 * Результат кэшируется на 5 минут.
 */
export async function getAllUserPermissions(user: DbUser): Promise<UserPermissionsResponse> {
  const now = Date.now()
  const cached = permissionsCache.get(user.id)

  // Возвращаем из кэша, если не истёк
  if (cached && now - cached.timestamp < CACHE_TTL) {
    return cached.permissions
  }

  // 1. Все активные страницы (один запрос)
  const activePages = await db
    .select({
      slug: permissionsPages.slug,
      hasCreate: permissionsPages.hasCreate,
      hasEdit: permissionsPages.hasEdit,
      hasDelete: permissionsPages.hasDelete,
      hasSpecial: permissionsPages.hasSpecial,
    })
    .from(permissionsPages)
    .where(eq(permissionsPages.isActive, true))
    .orderBy(permissionsPages.order)

  // 2. Все права роли для всех страниц (один запрос)
  const roleAccessRows = await db
    .select({
      pageSlug: permissionsRoleAccess.pageSlug,
      canView: permissionsRoleAccess.canView,
      canCreate: permissionsRoleAccess.canCreate,
      canEdit: permissionsRoleAccess.canEdit,
      canDelete: permissionsRoleAccess.canDelete,
      canSpecial: permissionsRoleAccess.canSpecial,
    })
    .from(permissionsRoleAccess)
    .where(
      and(
        eq(permissionsRoleAccess.role, user.role as Role),
        eq(permissionsRoleAccess.isActive, true)
      )
    )

  // Индексируем права роли по pageSlug
  const rolePermissionsMap = new Map<string, PagePermissions>()
  for (const row of roleAccessRows) {
    rolePermissionsMap.set(row.pageSlug, {
      canView: row.canView,
      canCreate: row.canCreate,
      canEdit: row.canEdit,
      canDelete: row.canDelete,
      canSpecial: row.canSpecial,
    })
  }

  // 3. Все активные переопределения пользователя (один запрос)
  const overrideRows = await db
    .select({
      pageSlug: permissionsUserOverrides.pageSlug,
      canView: permissionsUserOverrides.canView,
      canCreate: permissionsUserOverrides.canCreate,
      canEdit: permissionsUserOverrides.canEdit,
      canDelete: permissionsUserOverrides.canDelete,
      canSpecial: permissionsUserOverrides.canSpecial,
    })
    .from(permissionsUserOverrides)
    .where(
      and(
        eq(permissionsUserOverrides.userId, user.id),
        eq(permissionsUserOverrides.isActive, true),
        or(
          isNull(permissionsUserOverrides.expiresAt),
          gt(permissionsUserOverrides.expiresAt, sql`NOW()`)
        )
      )
    )

  // Индексируем переопределения по pageSlug
  const overridesMap = new Map<string, Partial<PagePermissions>>()
  for (const row of overrideRows) {
    overridesMap.set(row.pageSlug, {
      canView: row.canView ?? undefined,
      canCreate: row.canCreate ?? undefined,
      canEdit: row.canEdit ?? undefined,
      canDelete: row.canDelete ?? undefined,
      canSpecial: row.canSpecial ?? undefined,
    })
  }

  // 4. Собираем финальные права для каждой страницы
  const pages: Record<string, PagePermissions> = {}
  for (const page of activePages) {
    // Базовые права роли (или всё false если не настроено)
    const rolePerms = rolePermissionsMap.get(page.slug) || {
      canView: false,
      canCreate: false,
      canEdit: false,
      canDelete: false,
      canSpecial: false,
    }

    // Переопределения пользователя (если есть)
    const override = overridesMap.get(page.slug)

    // Применяем переопределения (null/undefined = использовать права роли)
    const effectivePerms: PagePermissions = {
      canView: override?.canView ?? rolePerms.canView,
      canCreate: override?.canCreate ?? rolePerms.canCreate,
      canEdit: override?.canEdit ?? rolePerms.canEdit,
      canDelete: override?.canDelete ?? rolePerms.canDelete,
      canSpecial: override?.canSpecial ?? rolePerms.canSpecial,
    }

    // Фильтруем: действие доступно только если страница его поддерживает
    pages[page.slug] = {
      canView: effectivePerms.canView,
      canCreate: page.hasCreate && effectivePerms.canCreate,
      canEdit: page.hasEdit && effectivePerms.canEdit,
      canDelete: page.hasDelete && effectivePerms.canDelete,
      canSpecial: page.hasSpecial && effectivePerms.canSpecial,
    }
  }

  const level = ROLE_LEVELS[user.role as Role] ?? 0

  const result: UserPermissionsResponse = {
    role: user.role,
    level,
    pages,
  }

  // Сохраняем в кэш
  permissionsCache.set(user.id, { permissions: result, timestamp: now })

  return result
}

// ============================================
// ПОЛУЧЕНИЕ ПРАВ ДЛЯ ОДНОЙ СТРАНИЦЫ
// ============================================

/**
 * Получить права пользователя для конкретной страницы
 *
 * Приоритет:
 * 1. user_permission_overrides (если есть и не истёк)
 * 2. role_access (базовые права роли из БД)
 * 3. Всё false (если нет записей)
 *
 * ⚠️ Для получения всех прав используйте getAllUserPermissions (оптимизирован)
 */
export async function getUserPagePermissions(
  user: DbUser,
  pageSlug: string
): Promise<PagePermissions> {
  // 1. Получаем страницу (чтобы узнать поддерживаемые действия)
  const [page] = await db
    .select({
      hasCreate: permissionsPages.hasCreate,
      hasEdit: permissionsPages.hasEdit,
      hasDelete: permissionsPages.hasDelete,
      hasSpecial: permissionsPages.hasSpecial,
    })
    .from(permissionsPages)
    .where(
      and(
        eq(permissionsPages.slug, pageSlug),
        eq(permissionsPages.isActive, true)
      )
    )
    .limit(1)

  // Страница не найдена или неактивна — всё запрещено
  if (!page) {
    return {
      canView: false,
      canCreate: false,
      canEdit: false,
      canDelete: false,
      canSpecial: false
    }
  }

  // 2. Базовые права роли
  const [roleAccess] = await db
    .select()
    .from(permissionsRoleAccess)
    .where(
      and(
        eq(permissionsRoleAccess.role, user.role as Role),
        eq(permissionsRoleAccess.pageSlug, pageSlug),
        eq(permissionsRoleAccess.isActive, true)
      )
    )
    .limit(1)

  const basePerms: PagePermissions = roleAccess ? {
    canView: roleAccess.canView,
    canCreate: roleAccess.canCreate,
    canEdit: roleAccess.canEdit,
    canDelete: roleAccess.canDelete,
    canSpecial: roleAccess.canSpecial,
  } : {
    canView: false,
    canCreate: false,
    canEdit: false,
    canDelete: false,
    canSpecial: false
  }

  // 3. Переопределения пользователя
  const [override] = await db
    .select()
    .from(permissionsUserOverrides)
    .where(
      and(
        eq(permissionsUserOverrides.userId, user.id),
        eq(permissionsUserOverrides.pageSlug, pageSlug),
        eq(permissionsUserOverrides.isActive, true),
        or(
          isNull(permissionsUserOverrides.expiresAt),
          gt(permissionsUserOverrides.expiresAt, sql`NOW()`)
        )
      )
    )
    .limit(1)

  // 4. Применяем переопределения (null = использовать права роли)
  const effectivePerms: PagePermissions = {
    canView: override?.canView ?? basePerms.canView,
    canCreate: override?.canCreate ?? basePerms.canCreate,
    canEdit: override?.canEdit ?? basePerms.canEdit,
    canDelete: override?.canDelete ?? basePerms.canDelete,
    canSpecial: override?.canSpecial ?? basePerms.canSpecial
  }

  // 5. Фильтруем: действие доступно только если страница его поддерживает
  return {
    canView: effectivePerms.canView,
    canCreate: page.hasCreate && effectivePerms.canCreate,
    canEdit: page.hasEdit && effectivePerms.canEdit,
    canDelete: page.hasDelete && effectivePerms.canDelete,
    canSpecial: page.hasSpecial && effectivePerms.canSpecial,
  }
}

// ============================================
// ПРОВЕРКА ПРАВ (ЕДИНСТВЕННАЯ ФУНКЦИЯ)
// ============================================

/**
 * Проверить, имеет ли пользователь право на действие
 *
 * Логика:
 * - view — достаточно canView
 * - create/edit/delete/special — canView + соответствующий флаг
 *
 * Используется в middleware для проверки прав на endpoint.
 */
export async function hasUserPermission(
  user: DbUser,
  pageSlug: string,
  action: PageAction
): Promise<boolean> {
  const permissions = await getUserPagePermissions(user, pageSlug)

  // Для просмотра достаточно canView
  if (action === 'view') {
    return permissions.canView
  }

  // Для действий нужно canView + флаг действия
  if (!permissions.canView) return false

  switch (action) {
    case 'create': return permissions.canCreate
    case 'edit': return permissions.canEdit
    case 'delete': return permissions.canDelete
    case 'special': return permissions.canSpecial
    default: return false
  }
}

// ============================================
// СПИСОК ВИДИМЫХ СТРАНИЦ (для меню навигации)
// ============================================

/**
 * Получить список страниц, доступных пользователю для отображения в меню
 * Фильтр: только страницы с canView = true
 */
export async function getUserVisiblePages(user: DbUser): Promise<Array<{
  slug: string
  name: string
  icon: string | null
  order: number
}>> {
  const allPermissions = await getAllUserPermissions(user)

  const pages = await db
    .select({
      slug: permissionsPages.slug,
      name: permissionsPages.name,
      icon: permissionsPages.icon,
      order: permissionsPages.order
    })
    .from(permissionsPages)
    .where(eq(permissionsPages.isActive, true))
    .orderBy(permissionsPages.order)

  return pages.filter(page => allPermissions.pages[page.slug]?.canView)
}

// ============================================
// ОТВЕТ API
// ============================================

/**
 * Получить полный ответ прав пользователя для API
 * Возвращает ТОЛЬКО новую систему: role, level, pages
 *
 * Используется в /api/permissions при логине и при обновлении токена
 */
export async function getUserPermissionsResponse(user: DbUser): Promise<UserPermissionsResponse> {
  return getAllUserPermissions(user)
}

// ============================================
// ИНВАЛИДАЦИЯ КЭША
// ============================================

/**
 * Инвалидировать кэш прав пользователя (вызывать после изменения прав)
 */
export function invalidatePermissionsCache(userId: number): void {
  permissionsCache.delete(userId)
}

/**
 * Инвалидировать кэш прав для ВСЕХ пользователей с определённой ролью
 * Вызывается после обновления прав роли через UI
 */
export async function invalidatePermissionsCacheByRole(role: Role): Promise<{
  total: number
  invalidated: number
}> {
  // Получаем всех пользователей с этой ролью
  const usersWithRole = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.role, role))

  // Инвалидируем кэш для каждого
  let invalidatedCount = 0
  for (const user of usersWithRole) {
    if (permissionsCache.has(user.id)) {
      permissionsCache.delete(user.id)
      invalidatedCount++
    }
  }

  return { total: usersWithRole.length, invalidated: invalidatedCount }
}

// ============================================
// ЭКСПОРТ ИЗ SHARED (для обратной совместимости)
// ============================================

/**
 * @deprecated Используйте hasRequiredRoleLevel из shared/constants/roles
 */
export { hasRequiredRoleLevel } from 'shared/constants/roles'

/**
 * @deprecated Используйте ROLE_LEVELS из shared/constants/roles
 */
export { ROLE_LEVELS } from 'shared/constants/roles'

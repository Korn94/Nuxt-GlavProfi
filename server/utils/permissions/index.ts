// server/utils/permissions/index.ts
/**
 * Основные функции системы прав доступа (серверная логика)
 *
 * Архитектура:
 * - Чтение прав из БД (permissions_role_access + permissions_user_overrides)
 * - Поддержка переопределений для конкретных пользователей с expiresAt
 * - Кэширование в памяти (5 мин TTL) — инвалидируется при изменениях
 * - Упрощённая система действий: create, edit, delete, special
 *
 * Видимость страниц:
 * - Раздел виден в меню, если есть хотя бы одно право (create/edit/delete/special)
 * - canView упразднён — отдельного флага просмотра нет
 *
 * Импорт:
 *   import { hasUserPermission, getAllUserPermissions } from '~/server/utils/permissions'
 */
import { db } from '../../db'
import {
  permissionsPages,
  permissionsRoleAccess,
  permissionsUserOverrides,
  users
} from '../../db/schema'
import { eq, and, or, isNull, gt, sql } from 'drizzle-orm'
import {
  ROLE_LEVELS,
  hasRequiredRoleLevel,
  type Role
} from 'shared/constants/roles'
import {
  PAGE_SUPPORTED_ACTIONS,
  type PageSlug,
  type PageAction
} from 'shared/constants/permissions'
import type {
  PagePermissions,
  UserPermissionsResponse
} from 'shared/types/permissions'

// ============================================
// ТИПЫ
// ============================================

export type DbUser = typeof users.$inferSelect

/**
 * Внутренний тип для хранения прав из БД
 * canView сохраняется для обратной совместимости с БД, но не используется в логике
 */
interface DbPagePermissions {
  canView: boolean
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
  canSpecial: boolean
}

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
// ХЕЛПЕРЫ
// ============================================

/**
 * Проверить, есть ли у страницы хотя бы одно действие (кроме view)
 * Такие страницы требуют наличия действий для видимости
 */
function hasCrudActions(pageSlug: string): boolean {
  const supportedActions = PAGE_SUPPORTED_ACTIONS[pageSlug as PageSlug]
  if (!supportedActions) return false
  return supportedActions.some(action => action !== 'view')
}

/**
 * Определить видимость страницы на основе прав
 *
 * Логика:
 * - CRUD страницы: видна если есть хотя бы одно действие (create/edit/delete/special)
 * - View-only страницы (dashboard, online, test): видна всегда если есть запись в БД
 */
function isPageVisible(
  pageSlug: string,
  perms: DbPagePermissions,
  pageCapabilities: { hasCreate: boolean; hasEdit: boolean; hasDelete: boolean; hasSpecial: boolean }
): boolean {
  const hasAnyCapability = pageCapabilities.hasCreate || pageCapabilities.hasEdit ||
                           pageCapabilities.hasDelete || pageCapabilities.hasSpecial

  if (hasAnyCapability) {
    // CRUD страница — видна если есть хотя бы одно действие
    return perms.canCreate || perms.canEdit || perms.canDelete || perms.canSpecial
  } else {
    // View-only страница (dashboard, online, test) — видна если canView=true в БД
    return perms.canView
  }
}

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
 * Результат кэшируется на 5 минут.
 *
 * ⚠️ Возвращает ТОЛЬКО видимые страницы
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
  const rolePermissionsMap = new Map<string, DbPagePermissions>()
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
  const overridesMap = new Map<string, Partial<DbPagePermissions>>()
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
    const rolePerms: DbPagePermissions = rolePermissionsMap.get(page.slug) || {
      canView: false,
      canCreate: false,
      canEdit: false,
      canDelete: false,
      canSpecial: false,
    }

    // Переопределения пользователя (если есть)
    const override = overridesMap.get(page.slug)

    // Применяем переопределения (null/undefined = использовать права роли)
    const effectivePerms: DbPagePermissions = {
      canView: override?.canView ?? rolePerms.canView,
      canCreate: override?.canCreate ?? rolePerms.canCreate,
      canEdit: override?.canEdit ?? rolePerms.canEdit,
      canDelete: override?.canDelete ?? rolePerms.canDelete,
      canSpecial: override?.canSpecial ?? rolePerms.canSpecial,
    }

    // Проверяем видимость страницы
    const pageCapabilities = {
      hasCreate: page.hasCreate,
      hasEdit: page.hasEdit,
      hasDelete: page.hasDelete,
      hasSpecial: page.hasSpecial,
    }

    const visible = isPageVisible(page.slug, effectivePerms, pageCapabilities)

    // Включаем страницу в результат только если она видима
    if (visible) {
      pages[page.slug] = {
        canCreate: page.hasCreate && effectivePerms.canCreate,
        canEdit: page.hasEdit && effectivePerms.canEdit,
        canDelete: page.hasDelete && effectivePerms.canDelete,
        canSpecial: page.hasSpecial && effectivePerms.canSpecial,
      }
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

  const basePerms: DbPagePermissions = roleAccess ? {
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
  const effectivePerms: DbPagePermissions = {
    canView: override?.canView ?? basePerms.canView,
    canCreate: override?.canCreate ?? basePerms.canCreate,
    canEdit: override?.canEdit ?? basePerms.canEdit,
    canDelete: override?.canDelete ?? basePerms.canDelete,
    canSpecial: override?.canSpecial ?? basePerms.canSpecial
  }

  // 5. Проверяем видимость
  const pageCapabilities = {
    hasCreate: page.hasCreate,
    hasEdit: page.hasEdit,
    hasDelete: page.hasDelete,
    hasSpecial: page.hasSpecial,
  }

  const visible = isPageVisible(pageSlug, effectivePerms, pageCapabilities)

  if (!visible) {
    return {
      canCreate: false,
      canEdit: false,
      canDelete: false,
      canSpecial: false
    }
  }

  // 6. Фильтруем: действие доступно только если страница его поддерживает
  return {
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
 * - view — страница должна быть видима (есть действия ИЛИ view-only с canView)
 * - create/edit/delete/special — страница видима + соответствующий флаг
 *
 * Используется в middleware для проверки прав на endpoint.
 */
export async function hasUserPermission(
  user: DbUser,
  pageSlug: string,
  action: PageAction
): Promise<boolean> {
  // Для view-only страниц — простая проверка canView в БД
  if (!hasCrudActions(pageSlug)) {
    const [roleAccess] = await db
      .select({ canView: permissionsRoleAccess.canView })
      .from(permissionsRoleAccess)
      .where(
        and(
          eq(permissionsRoleAccess.role, user.role as Role),
          eq(permissionsRoleAccess.pageSlug, pageSlug),
          eq(permissionsRoleAccess.isActive, true)
        )
      )
      .limit(1)

    // Проверяем override
    const [override] = await db
      .select({ canView: permissionsUserOverrides.canView })
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

    const effectiveCanView = override?.canView ?? roleAccess?.canView ?? false
    return effectiveCanView
  }

  // Для CRUD страниц — используем getUserPagePermissions
  const permissions = await getUserPagePermissions(user, pageSlug)

  if (action === 'view') {
    // Страница видима если есть хотя бы одно действие
    return (
      permissions.canCreate ||
      permissions.canEdit ||
      permissions.canDelete ||
      permissions.canSpecial
    )
  }

  // Для действий нужен соответствующий флаг
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
 *
 * Фильтр: страницы, которые есть в результате getAllUserPermissions
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

  // Фильтруем: оставляем только те, что есть в правах (т.е. видимы)
  return pages.filter(page => page.slug in allPermissions.pages)
}

// ============================================
// ОТВЕТ API
// ============================================

/**
 * Получить полный ответ прав пользователя для API
 * Возвращает ТОЛЬКО новую систему: role, level, pages
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
  const usersWithRole = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.role, role))

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

export { hasRequiredRoleLevel } from 'shared/constants/roles'
export { ROLE_LEVELS } from 'shared/constants/roles'

// server/utils/permissions/index.ts
/**
 * Основные функции системы прав доступа
 * Используется в API endpoints и middleware
 *
 * Архитектура:
 * - Чтение прав из БД (permissions_role_access + permissions_user_overrides)
 * - Поддержка переопределений для конкретных пользователей
 * - Упрощённая система действий: view, create, edit, delete, special
 *
 * ⚠️ ВАЖНО: Возвращает ТОЛЬКО новую систему (pages), без legacy (permissions)
 */
import { db } from '../../db'
import {
  permissionsPages,
  permissionsRoleAccess,
  permissionsUserOverrides
} from '../../db/schema'
import { eq, and, or, isNull, gt, sql } from 'drizzle-orm'
import type { users } from '../../db/schema'
import type { PagePermissions, PageAction, UserPermissionsResponse } from './types'
export type DbUser = typeof users.$inferSelect

// ============================================
// ТИПЫ И КОНСТАНТЫ
// ============================================

/**
 * Иерархия ролей (локально, без legacy импортов)
 */
export const ROLE_HIERARCHY: Record<string, number> = {
  worker: 1,
  master: 2,
  foreman: 3,
  manager: 4,
  admin: 5
}

// ============================================
// ОПТИМИЗИРОВАННОЕ ПОЛУЧЕНИЕ ВСЕХ ПРАВ
// ============================================

/**
 * Получить все права пользователя для всех активных страниц (ОПТИМИЗИРОВАННАЯ ВЕРСИЯ)
 * 
 * Выполняет только 3 запроса к БД вместо N+1:
 * 1. Все активные страницы
 * 2. Все права роли для всех страниц
 * 3. Все активные переопределения пользователя
 * 
 * Затем собирает результат в памяти.
 */
export async function getAllUserPermissions(user: DbUser): Promise<UserPermissionsResponse> {
  console.log(`[Permissions] 🔄 Получение прав для пользователя ${user.id} (${user.role})`)

  // 1. Получаем все активные страницы
  const activePages = await db
    .select({
      slug: permissionsPages.slug,
      name: permissionsPages.name,
      icon: permissionsPages.icon,
      order: permissionsPages.order,
      hasCreate: permissionsPages.hasCreate,
      hasEdit: permissionsPages.hasEdit,
      hasDelete: permissionsPages.hasDelete,
      hasSpecial: permissionsPages.hasSpecial,
    })
    .from(permissionsPages)
    .where(eq(permissionsPages.isActive, true))
    .orderBy(permissionsPages.order)

  console.log(`[Permissions] 📄 Активных страниц: ${activePages.length}`)

  // 2. Получаем все права роли для всех страниц (один запрос)
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
        eq(permissionsRoleAccess.role, user.role),
        eq(permissionsRoleAccess.isActive, true)
      )
    )

  // Индексируем права роли по pageSlug для быстрого доступа
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

  console.log(`[Permissions] 👥 Прав роли ${user.role}: ${rolePermissionsMap.size}`)

  // 3. Получаем все активные переопределения пользователя (один запрос)
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

  console.log(`[Permissions] 🔧 Переопределений пользователя: ${overridesMap.size}`)

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

    // Применяем переопределения (null = использовать права роли)
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

  console.log(`[Permissions] ✅ Итого страниц с правами: ${Object.keys(pages).length}`)

  const level = ROLE_HIERARCHY[user.role] || 0

  return {
    role: user.role,
    level,
    pages,
  }
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
 * ⚠️ Используется для проверки прав в middleware (одна страница)
 * Для получения всех прав используйте getAllUserPermissions (оптимизирован)
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

  // 2. Получаем базовые права роли
  const [roleAccess] = await db
    .select()
    .from(permissionsRoleAccess)
    .where(
      and(
        eq(permissionsRoleAccess.role, user.role),
        eq(permissionsRoleAccess.pageSlug, pageSlug),
        eq(permissionsRoleAccess.isActive, true)
      )
    )
    .limit(1)

  // Если нет прав роли — всё запрещено (но canView может быть true для публичных страниц)
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

  // 3. Получаем переопределения пользователя
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
// ПРОВЕРКА ПРАВ
// ============================================

/**
 * Проверить, имеет ли пользователь право на действие
 *
 * Логика:
 * - view — достаточно canView
 * - create/edit/delete/special — canView + соответствующий флаг
 * 
 * ⚠️ Используется для проверки прав в middleware (одна страница)
 */
export async function hasUserPermission(
  user: DbUser,
  pageSlug: string,
  action: PageAction | 'view'
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
 * ⚠️ ВАЖНО: НЕ возвращает legacy поле `permissions`!
 * 
 * Используется в /api/permissions при логине и при обновлении токена
 */
export async function getUserPermissionsResponse(user: DbUser): Promise<UserPermissionsResponse> {
  console.log(`[getUserPermissionsResponse] 🚀 Старт для пользователя ${user.id} (${user.role})`)
  
  const result = await getAllUserPermissions(user)
  
  console.log(`[getUserPermissionsResponse] ✅ Возвращаем:`, {
    role: result.role,
    level: result.level,
    pagesCount: Object.keys(result.pages).length,
    samplePages: Object.keys(result.pages).slice(0, 5),
  })
  
  return result
}

// ============================================
// ПРОВЕРКА УРОВНЯ РОЛИ
// ============================================

/**
 * Проверить что роль пользователя >= требуемой роли
 * Используется middleware для проверки type='role' в PROTECTED_PATHS
 *
 * @example
 * hasRoleLevel('foreman', 'manager') // false (3 < 4)
 * hasRoleLevel('admin', 'manager')   // true (5 >= 4)
 */
export function hasRoleLevel(userRole: string, requiredRole: string): boolean {
  const userLevel = ROLE_HIERARCHY[userRole] || 0
  const requiredLevel = ROLE_HIERARCHY[requiredRole] || 0
  return userLevel >= requiredLevel
}

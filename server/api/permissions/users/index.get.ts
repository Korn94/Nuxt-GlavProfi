// server/api/permissions/users/index.get.ts
/**
 * 📍 Эндпоинт: GET /api/permissions/users
 *
 * Назначение:
 * - Получить список пользователей с их правами (базовые + переопределения)
 * - Используется в UI настроек прав (вкладка "Пользователи")
 *
 * ⚠️ Доступ: middleware уже проверил через PROTECTED_PATHS (settings.canView)
 *
 * Query параметры (валидируются через zod):
 * - role: Role (опционально) — фильтр по роли
 * - search: string (опционально) — поиск по имени/логину
 * - page: number (default 1) — номер страницы
 * - limit: number (default 20, max 100) — размер страницы
 * - withOverrides: boolean (default false) — только пользователи с переопределениями
 *
 * Особенности:
 * - Базовые права берутся из permissions_role_access по роли пользователя
 * - Переопределения (overrides) применяются поверх базовых (null = не менять)
 * - В ответ добавляются label/color роли — UI не нужно их знать заранее
 * - canView упразднён — видимость определяется наличием любого действия
 *
 * @returns { users, pagination }
 */
import { defineEventHandler, getQuery } from 'h3'
import { eq, and, like, or, isNull, gt, sql, inArray } from 'drizzle-orm'
import { db } from '../../../db'
import {
  users,
  permissionsRoleAccess,
  permissionsUserOverrides
} from '../../../db/schema'
import { validateUsersQuery } from '../../../utils/permissions/validators'
import type { DbUser } from '../../../utils/permissions'
import {
  ROLE_LABELS,
  ROLE_COLORS,
  type Role
} from 'shared/constants/roles'
import type { PagePermissions } from 'shared/types/permissions'

// ============================================
// ТИП ОТВЕТА
// ============================================

interface UserOverride {
  id: number
  pageSlug: string
  canCreate: boolean | null
  canEdit: boolean | null
  canDelete: boolean | null
  canSpecial: boolean | null
  reason: string | null
  expiresAt: string | null
}

interface UserWithPermissions {
  id: number
  name: string
  login: string
  role: Role
  roleLabel: string
  roleColor: string
  contractorType: string | null
  contractorId: number | null
  createdAt: Date | string | null
  basePermissions: Record<string, PagePermissions>
  overrides: UserOverride[]
  effectivePermissions: Record<string, PagePermissions>
}

// ============================================
// ОБРАБОТЧИК
// ============================================

export default defineEventHandler(async (event) => {
  // ============================================
  // 1. ПРОВЕРКА ТЕКУЩЕГО ПОЛЬЗОВАТЕЛЯ
  // ============================================
  const currentUser = event.context.user as DbUser | undefined
  if (!currentUser) {
    console.error('[Permissions/Users] ⚠️ event.context.user отсутствует')
  }

  // ============================================
  // 2. ВАЛИДАЦИЯ QUERY ПАРАМЕТРОВ (через zod)
  // ============================================
  const query = getQuery(event)
  const validated = validateUsersQuery(query as Record<string, string | undefined>)
  const {
    role: filterRole,
    search,
    page,
    limit,
    withOverrides
  } = validated

  const offset = (page - 1) * limit

  // ============================================
  // 3. ФОРМИРОВАНИЕ УСЛОВИЙ ФИЛЬТРАЦИИ
  // ============================================
  const filters: ReturnType<typeof eq>[] = []

  if (filterRole) {
    filters.push(eq(users.role, filterRole))
  }

  if (search && search.trim().length > 0) {
    const searchPattern = `%${search.trim()}%`
    const searchCondition = or(
      like(users.name, searchPattern),
      like(users.login, searchPattern)
    )
    if (searchCondition) {
      filters.push(searchCondition)
    }
  }

  const whereCondition = filters.length > 0 ? and(...filters) : undefined

  // ============================================
  // 4. ПОДСЧЁТ ОБЩЕГО КОЛИЧЕСТВА
  // ============================================
  const [countResult] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(users)
    .where(whereCondition)

  const total = Number(countResult?.count || 0)
  const totalPages = Math.ceil(total / limit)

  // ============================================
  // 5. ПОЛУЧЕНИЕ ПОЛЬЗОВАТЕЛЕЙ С ПАГИНАЦИЕЙ
  // ============================================
  const usersList = await db
    .select({
      id: users.id,
      name: users.name,
      login: users.login,
      role: users.role,
      contractorType: users.contractorType,
      contractorId: users.contractorId,
      createdAt: users.createdAt
    })
    .from(users)
    .where(whereCondition)
    .orderBy(users.id)
    .limit(limit)
    .offset(offset)

  if (usersList.length === 0) {
    return {
      users: [],
      pagination: { page, limit, total, totalPages }
    }
  }

  const userIds = usersList.map(u => u.id)

  // ============================================
  // 6. ПОЛУЧЕНИЕ ПРАВ РОЛЕЙ (один запрос на все роли страницы)
  // ============================================
  const uniqueRoles = [...new Set(usersList.map(u => u.role))]

  const allRoleAccess = await db
    .select({
      role: permissionsRoleAccess.role,
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
        inArray(permissionsRoleAccess.role, uniqueRoles),
        eq(permissionsRoleAccess.isActive, true)
      )
    )

  // Индексируем по составному ключу role|pageSlug для быстрого доступа
  const rolePermissionsMap = new Map<string, Record<string, PagePermissions>>()
  for (const access of allRoleAccess) {
    if (!rolePermissionsMap.has(access.role)) {
      rolePermissionsMap.set(access.role, {})
    }
    rolePermissionsMap.get(access.role)![access.pageSlug] = {
      canView: access.canView,
      canCreate: access.canCreate,
      canEdit: access.canEdit,
      canDelete: access.canDelete,
      canSpecial: access.canSpecial,
    }
  }

  // ============================================
  // 7. ПОЛУЧЕНИЕ ПЕРЕОПРЕДЕЛЕНИЙ (один запрос на всех пользователей)
  // ============================================
  const allOverrides = await db
    .select({
      id: permissionsUserOverrides.id,
      userId: permissionsUserOverrides.userId,
      pageSlug: permissionsUserOverrides.pageSlug,
      canView: permissionsUserOverrides.canView,
      canCreate: permissionsUserOverrides.canCreate,
      canEdit: permissionsUserOverrides.canEdit,
      canDelete: permissionsUserOverrides.canDelete,
      canSpecial: permissionsUserOverrides.canSpecial,
      reason: permissionsUserOverrides.reason,
      expiresAt: permissionsUserOverrides.expiresAt
    })
    .from(permissionsUserOverrides)
    .where(
      and(
        inArray(permissionsUserOverrides.userId, userIds),
        eq(permissionsUserOverrides.isActive, true),
        or(
          isNull(permissionsUserOverrides.expiresAt),
          gt(permissionsUserOverrides.expiresAt, sql`NOW()`)
        )
      )
    )

  // Группируем по userId
  const userOverridesMap = new Map<number, typeof allOverrides>()
  for (const override of allOverrides) {
    if (!userOverridesMap.has(override.userId)) {
      userOverridesMap.set(override.userId, [])
    }
    userOverridesMap.get(override.userId)!.push(override)
  }

  // ============================================
  // 8. СБОРКА ИТОГОВОГО ОТВЕТА
  // ============================================
  let resultUsers: UserWithPermissions[] = usersList.map(user => {
    const basePermissions = rolePermissionsMap.get(user.role) || {}
    const overrides = userOverridesMap.get(user.id) || []

    // Формируем effectivePermissions (база + переопределения)
    const effectivePermissions: Record<string, PagePermissions> = {}
    for (const [pageSlug, perms] of Object.entries(basePermissions)) {
      effectivePermissions[pageSlug] = { ...perms }
    }

    // Применяем переопределения (только те поля, которые не null)
    for (const override of overrides) {
      // Создаём запись для страницы, если её нет в базовых правах
      if (!effectivePermissions[override.pageSlug]) {
        effectivePermissions[override.pageSlug] = {
          canView: false,
          canCreate: false,
          canEdit: false,
          canDelete: false,
          canSpecial: false,
        }
      }

      const target = effectivePermissions[override.pageSlug]!
      if (override.canView !== null) target.canView = override.canView
      if (override.canCreate !== null) target.canCreate = override.canCreate
      if (override.canEdit !== null) target.canEdit = override.canEdit
      if (override.canDelete !== null) target.canDelete = override.canDelete
      if (override.canSpecial !== null) target.canSpecial = override.canSpecial
    }

    const role = user.role as Role

    return {
      id: user.id,
      name: user.name,
      login: user.login,
      role,
      roleLabel: ROLE_LABELS[role] || role,
      roleColor: ROLE_COLORS[role] || '#6c757d',
      contractorType: user.contractorType,
      contractorId: user.contractorId,
      createdAt: user.createdAt,
      basePermissions,
      overrides,
      effectivePermissions
    }
  })

  // ============================================
  // 9. ФИЛЬТР: ТОЛЬКО ПОЛЬЗОВАТЕЛИ С ПЕРЕОПРЕДЕЛЕНИЯМИ
  // ============================================
  if (withOverrides) {
    resultUsers = resultUsers.filter(u => u.overrides.length > 0)
  }

  return {
    users: resultUsers,
    pagination: {
      page,
      limit,
      total,
      totalPages
    }
  }
})

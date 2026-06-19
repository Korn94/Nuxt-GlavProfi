// server/api/permissions/users/index.get.ts
/**
 * 📍 Эндпоинт: GET /api/permissions/users
 *
 * Назначение:
 * Получить список пользователей с их правами доступа (базовые + переопределения)
 * Используется в UI настроек прав (вкладка "Пользователи")
 *
 * ⚠️ Доступ: middleware уже проверил через PROTECTED_PATHS (settings.canView)
 *
 * Query параметры:
 * - role: Role (опционально) — фильтр по роли
 * - search: string (опционально) — поиск по имени/логину
 * - page: number (default 1) — номер страницы
 * - limit: number (default 20, max 100) — размер страницы
 * - withOverrides: boolean (default false) — только пользователи с переопределениями
 *
 * Новая система прав:
 * - canView, canCreate, canEdit, canDelete, canSpecial
 * - Без legacy (canExport, canApprove)
 *
 * @returns { users, pagination }
 */
import { defineEventHandler, getQuery, createError } from 'h3'
import { db } from '../../../db'
import {
  users,
  permissionsRoleAccess,
  permissionsUserOverrides
} from '../../../db/schema'
import { eq, and, like, or, isNull, gt, sql } from 'drizzle-orm'
import { validateUsersQuery } from '../../../utils/permissions/validators'
import type { DbUser } from '../../../utils/permissions'
import type { PagePermissions } from '../../../utils/permissions/types'

export default defineEventHandler(async (event) => {
  // ✅ Авторизация и права уже проверены мидлваром
  const currentUser = event.context.user as DbUser
  if (!currentUser) {
    throw createError({ statusCode: 401, statusMessage: 'Не удалось получить данные текущего пользователя' })
  }

  // ============================================
  // 1. ВАЛИДАЦИЯ QUERY ПАРАМЕТРОВ
  // ============================================
  const query = getQuery(event)
  const validated = validateUsersQuery(query as Record<string, string | undefined>)
  const {
    role: filterRole,
    search,
    page = 1,
    limit = 20,
    withOverrides
  } = validated
  const offset = (page - 1) * limit

  // ============================================
  // 2. ФОРМИРОВАНИЕ УСЛОВИЙ ФИЛЬТРАЦИИ
  // ============================================
  const filters = []

  // Фильтр по роли
  if (filterRole) {
    filters.push(eq(users.role, filterRole))
  }

  // Поиск по имени/логину
  if (search && search.trim().length > 0) {
    const searchPattern = `%${search.trim()}%`
    filters.push(
      or(
        like(users.name, searchPattern),
        like(users.login, searchPattern)
      )!
    )
  }

  const whereCondition = filters.length > 0 ? and(...filters) : undefined

  // ============================================
  // 3. ПОДСЧЁТ ОБЩЕГО КОЛИЧЕСТВА
  // ============================================
  const [countResult] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(users)
    .where(whereCondition)

  const total = Number(countResult?.count || 0)
  const totalPages = Math.ceil(total / limit)

  // ============================================
  // 4. ПОЛУЧЕНИЕ ПОЛЬЗОВАТЕЛЕЙ С ПАГИНАЦИЕЙ
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

  // Если пользователей нет — возвращаем пустой результат
  if (usersList.length === 0) {
    return {
      users: [],
      pagination: { page, limit, total, totalPages }
    }
  }

  const userIds = usersList.map(u => u.id)

  // ============================================
  // 5. ПОЛУЧЕНИЕ ПРАВ РОЛЕЙ (один запрос на все роли)
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
        sql`${permissionsRoleAccess.role} IN (${uniqueRoles.map(r => sql`${r}`).reduce((a, b) => sql`${a}, ${b}`)})`,
        eq(permissionsRoleAccess.isActive, true)
      )
    )

  // Группируем по ролям: Map<role, Map<pageSlug, permissions>>
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
  // 6. ПОЛУЧЕНИЕ ПЕРЕОПРЕДЕЛЕНИЙ ДЛЯ ВЫБРАННЫХ ПОЛЬЗОВАТЕЛЕЙ
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
        sql`${permissionsUserOverrides.userId} IN (${userIds.map(id => sql`${id}`).reduce((a, b) => sql`${a}, ${b}`)})`,
        eq(permissionsUserOverrides.isActive, true),
        // Только активные (не истёкшие)
        or(
          isNull(permissionsUserOverrides.expiresAt),
          gt(permissionsUserOverrides.expiresAt, sql`NOW()`)
        )
      )
    )

  // Группируем по пользователям: Map<userId, override[]>
  const userOverridesMap = new Map<number, typeof allOverrides>()
  for (const override of allOverrides) {
    if (!userOverridesMap.has(override.userId)) {
      userOverridesMap.set(override.userId, [])
    }
    userOverridesMap.get(override.userId)!.push(override)
  }

  // ============================================
  // 7. СБОРКА ИТОГОВОГО ОТВЕТА
  // ============================================
  let resultUsers = usersList.map(user => {
    const basePermissions = rolePermissionsMap.get(user.role) || {}
    const overrides = userOverridesMap.get(user.id) || []

    // Формируем эффективные права (с учётом переопределений)
    const effectivePermissions: Record<string, PagePermissions> = { ...basePermissions }

    // Применяем переопределения
    for (const override of overrides) {
      // Получаем или создаём объект прав для страницы
      let target = effectivePermissions[override.pageSlug]
      if (!target) {
        target = {
          canView: false,
          canCreate: false,
          canEdit: false,
          canDelete: false,
          canSpecial: false,
        }
        effectivePermissions[override.pageSlug] = target
      }

      // Применяем только те переопределения, которые не null/undefined
      if (override.canView !== null && override.canView !== undefined) {
        target.canView = override.canView
      }
      if (override.canCreate !== null && override.canCreate !== undefined) {
        target.canCreate = override.canCreate
      }
      if (override.canEdit !== null && override.canEdit !== undefined) {
        target.canEdit = override.canEdit
      }
      if (override.canDelete !== null && override.canDelete !== undefined) {
        target.canDelete = override.canDelete
      }
      if (override.canSpecial !== null && override.canSpecial !== undefined) {
        target.canSpecial = override.canSpecial
      }
    }

    return {
      id: user.id,
      name: user.name,
      login: user.login,
      role: user.role,
      contractorType: user.contractorType,
      contractorId: user.contractorId,
      createdAt: user.createdAt,
      basePermissions,
      overrides,
      effectivePermissions
    }
  })

  // Фильтр: только пользователи с переопределениями
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

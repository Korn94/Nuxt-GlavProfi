// server/api/permissions/users/[id]/overrides/index.get.ts
/**
 * 📍 Эндпоинт: GET /api/permissions/users/[id]/overrides
 *
 * Назначение:
 * Получить переопределения прав для конкретного пользователя
 * Возвращает базовые права роли, переопределения и эффективные (финальные) права
 *
 * ⚠️ Доступ: middleware уже проверил через PROTECTED_PATHS (settings.canView)
 * ⚠️ Переопределения для admin может смотреть только admin
 *
 * Новая система прав:
 * - canView, canCreate, canEdit, canDelete, canSpecial
 * - Без legacy (canExport, canApprove)
 *
 * @param {string} id — ID пользователя из пути
 * @returns { userId, userName, role, basePermissions, overrides, effectivePermissions }
 *
 * Пример ответа:
 * {
 *   "userId": 5,
 *   "userName": "Иван Петров",
 *   "role": "master",
 *   "basePermissions": {
 *     "dashboard": { "canView": true, "canCreate": false, "canEdit": false, "canDelete": false, "canSpecial": false },
 *     "works": { "canView": true, "canCreate": true, "canEdit": true, "canDelete": false, "canSpecial": true },
 *     ...
 *   },
 *   "overrides": [
 *     {
 *       "id": 1,
 *       "pageSlug": "finance",
 *       "canView": true,
 *       "canCreate": null,
 *       "canSpecial": null,
 *       "reason": "Временный доступ",
 *       "expiresAt": "2026-12-31T23:59:59.000Z",
 *       "createdAt": "2026-01-15T10:30:00.000Z"
 *     }
 *   ],
 *   "effectivePermissions": { ... }
 * }
 */
import { defineEventHandler, getRouterParam, createError } from 'h3'
import { db } from '../../../../../db'
import {
  users,
  permissionsRoleAccess,
  permissionsUserOverrides
} from '../../../../../db/schema'
import { eq, and, or, isNull, gt, sql } from 'drizzle-orm'
import type { DbUser } from '../../../../../utils/permissions'
import type { PagePermissions } from '../../../../../utils/permissions/types'

export default defineEventHandler(async (event) => {
  // ✅ Авторизация и права уже проверены мидлваром
  const currentUser = event.context.user as DbUser
  if (!currentUser) {
    throw createError({ statusCode: 401, statusMessage: 'Не удалось получить данные текущего пользователя' })
  }

  // ============================================
  // 1. ПОЛУЧЕНИЕ ID ПОЛЬЗОВАТЕЛЯ ИЗ URL
  // ============================================
  const idParam = getRouterParam(event, 'id')
  if (!idParam) {
    throw createError({ statusCode: 400, statusMessage: 'ID пользователя не указан в URL' })
  }
  const targetUserId = parseInt(idParam, 10)
  if (isNaN(targetUserId)) {
    throw createError({ statusCode: 400, statusMessage: 'Некорректный формат ID' })
  }

  // ============================================
  // 2. ПРОВЕРКА СУЩЕСТВОВАНИЯ ЦЕЛЕВОГО ПОЛЬЗОВАТЕЛЯ
  // ============================================
  const [targetUser] = await db
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
    .where(eq(users.id, targetUserId))
    .limit(1)

  if (!targetUser) {
    throw createError({ statusCode: 404, statusMessage: 'Пользователь не найден' })
  }

  // ============================================
  // 3. ЗАЩИТА ОТ ПРОСМОТРА ПРАВ АДМИНА НЕ-АДМИНОМ
  // ============================================
  if (targetUser.role === 'admin' && currentUser.role !== 'admin') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Только администратор может просматривать права администратора'
    })
  }

  // ============================================
  // 4. ПОЛУЧЕНИЕ БАЗОВЫХ ПРАВ РОЛИ (новая система)
  // ============================================
  const roleAccess = await db
    .select({
      pageSlug: permissionsRoleAccess.pageSlug,
      canView: permissionsRoleAccess.canView,
      canCreate: permissionsRoleAccess.canCreate,
      canEdit: permissionsRoleAccess.canEdit,
      canDelete: permissionsRoleAccess.canDelete,
      canSpecial: permissionsRoleAccess.canSpecial
    })
    .from(permissionsRoleAccess)
    .where(
      and(
        eq(permissionsRoleAccess.role, targetUser.role),
        eq(permissionsRoleAccess.isActive, true)
      )
    )

  const basePermissions: Record<string, PagePermissions> = {}
  for (const access of roleAccess) {
    basePermissions[access.pageSlug] = {
      canView: access.canView,
      canCreate: access.canCreate,
      canEdit: access.canEdit,
      canDelete: access.canDelete,
      canSpecial: access.canSpecial
    }
  }

  // ============================================
  // 5. ПОЛУЧЕНИЕ ПЕРЕОПРЕДЕЛЕНИЙ ПОЛЬЗОВАТЕЛЯ (новая система)
  // ============================================
  const overrides = await db
    .select({
      id: permissionsUserOverrides.id,
      pageSlug: permissionsUserOverrides.pageSlug,
      canView: permissionsUserOverrides.canView,
      canCreate: permissionsUserOverrides.canCreate,
      canEdit: permissionsUserOverrides.canEdit,
      canDelete: permissionsUserOverrides.canDelete,
      canSpecial: permissionsUserOverrides.canSpecial,
      reason: permissionsUserOverrides.reason,
      expiresAt: permissionsUserOverrides.expiresAt,
      createdAt: permissionsUserOverrides.createdAt,
      createdBy: permissionsUserOverrides.createdBy
    })
    .from(permissionsUserOverrides)
    .where(
      and(
        eq(permissionsUserOverrides.userId, targetUserId),
        eq(permissionsUserOverrides.isActive, true),
        // Только активные (не истёкшие)
        or(
          isNull(permissionsUserOverrides.expiresAt),
          gt(permissionsUserOverrides.expiresAt, sql`NOW()`)
        )
      )
    )
    .orderBy(permissionsUserOverrides.pageSlug)

  // ============================================
  // 6. ВЫЧИСЛЕНИЕ ЭФФЕКТИВНЫХ ПРАВ (новая система)
  // ============================================
  const effectivePermissions: Record<string, PagePermissions> = { ...basePermissions }

  for (const override of overrides) {
    // Инициализируем страницу если её нет в базовых правах
    let target = effectivePermissions[override.pageSlug]
    if (!target) {
      target = {
        canView: false,
        canCreate: false,
        canEdit: false,
        canDelete: false,
        canSpecial: false
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

  // ============================================
  // 7. ВОЗВРАТ РЕЗУЛЬТАТА
  // ============================================
  return {
    userId: targetUser.id,
    userName: targetUser.name,
    login: targetUser.login,
    role: targetUser.role,
    contractorType: targetUser.contractorType,
    contractorId: targetUser.contractorId,
    createdAt: targetUser.createdAt,
    basePermissions,
    overrides,
    effectivePermissions
  }
})

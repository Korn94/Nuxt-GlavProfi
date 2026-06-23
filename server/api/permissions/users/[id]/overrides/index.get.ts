// server/api/permissions/users/[id]/overrides/index.get.ts
/**
 * 📍 Эндпоинт: GET /api/permissions/users/[id]/overrides
 *
 * Назначение:
 * - Получить переопределения прав для конкретного пользователя
 * - Возвращает базовые права роли, переопределения и эффективные (финальные) права
 * - Используется в UI настроек прав при клике на пользователя
 *
 * ⚠️ Доступ: middleware уже проверил через PROTECTED_PATHS (settings.canView)
 * ⚠️ Защита: переопределения для admin может смотреть только admin
 *
 * Особенности (новая модель без canView):
 * - `basePermissions` — ПОЛНАЯ матрица прав (все страницы из VALID_PAGE_SLUGS,
 *   даже те, что не настроены в БД — для них будет `false`)
 * - `effectivePermissions` — результат применения overrides поверх base
 * - canView упразднён — видимость определяется наличием любого действия
 * - `roleLabel`, `roleColor` — метаданные роли для UI
 *
 * @param {string} id — ID пользователя из пути
 * @returns { userId, userName, role, roleLabel, roleColor, basePermissions, overrides, effectivePermissions }
 */
import { defineEventHandler, getRouterParam, createError } from 'h3'
import { eq, and, or, isNull, gt, sql } from 'drizzle-orm'
import { db } from '../../../../../db'
import {
  users,
  permissionsRoleAccess,
  permissionsUserOverrides
} from '../../../../../db/schema'
import type { DbUser } from '../../../../../utils/permissions'
import {
  ROLE_LABELS,
  ROLE_COLORS,
  type Role
} from 'shared/constants/roles'
import { VALID_PAGE_SLUGS } from 'shared/constants/permissions'
import type { PagePermissions } from 'shared/types/permissions'

// ============================================
// ТИП ОТВЕТА
// ============================================

interface OverrideRecord {
  id: number
  pageSlug: string
  canView: boolean | null
  canCreate: boolean | null
  canEdit: boolean | null
  canDelete: boolean | null
  canSpecial: boolean | null
  reason: string | null
  expiresAt: Date | string | null
  createdAt: Date | null
  createdBy: number | null
}

// ============================================
// ОБРАБОТЧИК
// ============================================

export default defineEventHandler(async (event) => {
  // ============================================
  // 1. ВАЛИДАЦИЯ ID ПОЛЬЗОВАТЕЛЯ ИЗ URL
  // ============================================
  const idParam = getRouterParam(event, 'id')
  if (!idParam) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID пользователя не указан в URL'
    })
  }
  const targetUserId = parseInt(idParam, 10)
  if (!Number.isFinite(targetUserId) || targetUserId <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Некорректный формат ID (должно быть положительное число)'
    })
  }

  // ============================================
  // 2. ПОЛУЧЕНИЕ ЦЕЛЕВОГО ПОЛЬЗОВАТЕЛЯ
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
    throw createError({
      statusCode: 404,
      statusMessage: 'Пользователь не найден'
    })
  }

  // ============================================
  // 3. ЗАЩИТА: ADMIN ПРАВА СМОТРИТ ТОЛЬКО ADMIN
  // ============================================
  const currentUser = event.context.user as DbUser | undefined
  if (targetUser.role === 'admin' && currentUser?.role !== 'admin') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Только администратор может просматривать права администратора'
    })
  }

  const targetRole = targetUser.role as Role

  // ============================================
  // 4. ПОЛУЧЕНИЕ БАЗОВЫХ ПРАВ РОЛИ (из БД)
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
        eq(permissionsRoleAccess.role, targetRole),
        eq(permissionsRoleAccess.isActive, true)
      )
    )

  // Индексируем по pageSlug
  const roleAccessMap = new Map<string, typeof roleAccess[number]>()
  for (const access of roleAccess) {
    roleAccessMap.set(access.pageSlug, access)
  }

  // ============================================
  // 5. 🆕 ПОЛНАЯ МАТРИЦА БАЗОВЫХ ПРАВ (все страницы из VALID_PAGE_SLUGS)
  // ============================================
  // UI всегда должен видеть все страницы, даже если для роли нет записи в БД.
  // Отсутствующие заполняем как всё false.
  //
  // ⚠️ canView упразднён — видимость определяется наличием любого действия
  const basePermissions: Record<string, PagePermissions> = {}
  for (const pageSlug of VALID_PAGE_SLUGS) {
    const access = roleAccessMap.get(pageSlug)
    basePermissions[pageSlug] = access
      ? {
        canView: access.canView,
        canCreate: access.canCreate,
        canEdit: access.canEdit,
        canDelete: access.canDelete,
        canSpecial: access.canSpecial
      }
      : {
        canView: false,
        canCreate: false,
        canEdit: false,
        canDelete: false,
        canSpecial: false
      }
  }

  // ============================================
  // 6. ПОЛУЧЕНИЕ ПЕРЕОПРЕДЕЛЕНИЙ ПОЛЬЗОВАТЕЛЯ
  // ============================================
  const overrides: OverrideRecord[] = await db
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
  // 7. ВЫЧИСЛЕНИЕ ЭФФЕКТИВНЫХ ПРАВ (база + overrides)
  // ============================================
  // Глубокая копия basePermissions, чтобы не мутировать исходный объект
  const effectivePermissions: Record<string, PagePermissions> = {}
  for (const [pageSlug, perms] of Object.entries(basePermissions)) {
    effectivePermissions[pageSlug] = { ...perms }
  }

  for (const override of overrides) {
    // Создаём запись для страницы, если её нет в базовых правах
    if (!effectivePermissions[override.pageSlug]) {
      effectivePermissions[override.pageSlug] = {
        canView: false,
        canCreate: false,
        canEdit: false,
        canDelete: false,
        canSpecial: false
      }
    }

    const target = effectivePermissions[override.pageSlug]!

    // Применяем только те переопределения, которые не null
    // (null означает "использовать права роли")
    if (override.canView !== null) target.canView = override.canView
    if (override.canCreate !== null) target.canCreate = override.canCreate
    if (override.canEdit !== null) target.canEdit = override.canEdit
    if (override.canDelete !== null) target.canDelete = override.canDelete
    if (override.canSpecial !== null) target.canSpecial = override.canSpecial
  }

  // ============================================
  // 8. ВОЗВРАТ РЕЗУЛЬТАТА (с метаданными роли)
  // ============================================
  return {
    userId: targetUser.id,
    userName: targetUser.name,
    login: targetUser.login,
    role: targetRole,
    roleLabel: ROLE_LABELS[targetRole] || targetRole,
    roleColor: ROLE_COLORS[targetRole] || '#6c757d',
    contractorType: targetUser.contractorType,
    contractorId: targetUser.contractorId,
    createdAt: targetUser.createdAt,
    basePermissions,
    overrides,
    effectivePermissions
  }
})

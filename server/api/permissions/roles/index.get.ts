// server/api/permissions/roles/index.get.ts
/**
 * 📍 Эндпоинт: GET /api/permissions/roles
 *
 * Назначение:
 * - Получить список всех ролей с их правами и метаданными
 * - Используется в UI настроек прав (вкладка "Роли")
 *
 * ⚠️ Доступ: middleware уже проверил через PROTECTED_PATHS (settings.canView)
 *
 * Особенности:
 * - Возвращает ВСЕ роли из shared/constants/roles (даже если нет прав в БД)
 * - Для каждой роли возвращает ПОЛНУЮ матрицу прав по всем страницам
 *   (отсутствующие в БД заполняются как всё false)
 * - Добавляет метаданные (label, color, level) — UI не нужно их импортировать
 *
 * Упрощённая модель прав (без canView):
 * - Видимость раздела определяется наличием любого действия
 * - canView упразднён — раздел появляется в меню если включено хотя бы одно действие
 *
 * @returns { roles: RoleWithPermissions[] }
 */
import { defineEventHandler } from 'h3'
import { eq, sql } from 'drizzle-orm'
import { db } from '../../../db'
import { users, permissionsRoleAccess } from '../../../db/schema'
import {
  VALID_ROLES,
  ROLE_LEVELS,
  ROLE_LABELS,
  ROLE_COLORS,
  type Role
} from 'shared/constants/roles'
import { VALID_PAGE_SLUGS } from 'shared/constants/permissions'
import type { PagePermissions } from 'shared/types/permissions'

// ============================================
// ТИП ОТВЕТА
// ============================================

interface RoleWithPermissions {
  role: Role
  label: string
  color: string
  level: number
  userCount: number
  permissions: Record<string, PagePermissions>
}

// ============================================
// ОБРАБОТЧИК
// ============================================

export default defineEventHandler(async () => {
  // ============================================
  // 1. ПОЛУЧАЕМ ПРАВА ВСЕХ РОЛЕЙ ИЗ БД (один запрос)
  // ============================================
  const allRoleAccess = await db
    .select({
      role: permissionsRoleAccess.role,
      pageSlug: permissionsRoleAccess.pageSlug,
      canView: permissionsRoleAccess.canView,
      canCreate: permissionsRoleAccess.canCreate,
      canEdit: permissionsRoleAccess.canEdit,
      canDelete: permissionsRoleAccess.canDelete,
      canSpecial: permissionsRoleAccess.canSpecial,
      comment: permissionsRoleAccess.comment
    })
    .from(permissionsRoleAccess)
    .where(eq(permissionsRoleAccess.isActive, true))

  // Индексируем по составному ключу "role|pageSlug" для быстрого доступа
  const accessMap = new Map<string, typeof allRoleAccess[number]>()
  for (const access of allRoleAccess) {
    accessMap.set(`${access.role}|${access.pageSlug}`, access)
  }

  // ============================================
  // 2. СЧИТАЕМ КОЛИЧЕСТВО ПОЛЬЗОВАТЕЛЕЙ ДЛЯ КАЖДОЙ РОЛИ
  // ============================================
  const userCounts = await db
    .select({
      role: users.role,
      count: sql<number>`COUNT(*)`
    })
    .from(users)
    .groupBy(users.role)

  const userCountMap = new Map(userCounts.map(uc => [uc.role, uc.count]))

  // ============================================
  // 3. СОБИРАЕМ ПОЛНУЮ МАТРИЦУ ПРАВ ДЛЯ КАЖДОЙ РОЛИ
  // ============================================
  // Для каждой роли создаём полную матрицу (все страницы × все действия),
  // заполняем значениями из БД (или false если записи нет)
  //
  // Видимость раздела в меню определяется на клиенте по наличию
  // хотя бы одного действия (canView || canCreate || canEdit || canDelete || canSpecial).
  const roles: RoleWithPermissions[] = VALID_ROLES.map(role => {
    const permissions: Record<string, PagePermissions> = {}
    for (const pageSlug of VALID_PAGE_SLUGS) {
      const key = `${role}|${pageSlug}`
      const access = accessMap.get(key)
      permissions[pageSlug] = access
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
    return {
      role,
      label: ROLE_LABELS[role],
      color: ROLE_COLORS[role],
      level: ROLE_LEVELS[role],
      userCount: userCountMap.get(role) || 0,
      permissions
    }
  })

  // ============================================
  // 4. СОРТИРОВКА ПО УРОВНЮ РОЛИ (от высшего к низшему)
  // ============================================
  // admin (5) → manager (4) → foreman (3) → master (2) → worker (1)
  roles.sort((a, b) => b.level - a.level)

  return { roles }
})

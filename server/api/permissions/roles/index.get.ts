// server/api/permissions/roles/index.get.ts
/**
 * 📍 Эндпоинт: GET /api/permissions/roles
 *
 * Назначение:
 * Получить список всех ролей с их правами доступа и количеством пользователей
 * Используется в UI настроек прав (вкладка "Роли")
 *
 * ⚠️ Доступ: middleware уже проверил через PROTECTED_PATHS (settings.canView)
 *
 * @returns { roles: RoleWithPermissions[] }
 *
 * Пример ответа:
 * {
 *   "roles": [
 *     {
 *       "role": "admin",
 *       "userCount": 2,
 *       "permissions": {
 *         "dashboard": { "canView": true, "canCreate": false, "canEdit": false, "canDelete": false, "canSpecial": false },
 *         "objects": { "canView": true, "canCreate": true, "canEdit": true, "canDelete": true, "canSpecial": false },
 *         ...
 *       }
 *     }
 *   ]
 * }
 */
import { defineEventHandler, createError } from 'h3'
import { db } from '../../../db'
import { users, permissionsRoleAccess } from '../../../db/schema'
import { eq, sql } from 'drizzle-orm'
import type { PagePermissions } from '../../../utils/permissions/types'

// Все возможные роли (должны соответствовать enum в БД)
const ALL_ROLES = ['admin', 'manager', 'foreman', 'master', 'worker'] as const

export default defineEventHandler(async (event) => {
  // ✅ Авторизация и права уже проверены middleware
  try {
    // 1. Получаем права доступа для всех ролей
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

    // 2. Считаем количество пользователей для каждой роли
    const userCounts = await db
      .select({
        role: users.role,
        count: sql<number>`COUNT(*)`
      })
      .from(users)
      .groupBy(users.role)

    const userCountMap = new Map(userCounts.map(uc => [uc.role, uc.count]))

    // 3. Группируем права по ролям
    const rolesMap = new Map<string, {
      role: string
      userCount: number
      permissions: Record<string, PagePermissions>
    }>()

    // Инициализируем все роли (даже если у них нет прав в БД)
    for (const role of ALL_ROLES) {
      rolesMap.set(role, {
        role,
        userCount: userCountMap.get(role) || 0,
        permissions: {}
      })
    }

    // Заполняем права для каждой роли
    for (const access of allRoleAccess) {
      const roleData = rolesMap.get(access.role)
      if (roleData) {
        roleData.permissions[access.pageSlug] = {
          canView: access.canView,
          canCreate: access.canCreate,
          canEdit: access.canEdit,
          canDelete: access.canDelete,
          canSpecial: access.canSpecial
        }
      }
    }

    // 4. Преобразуем Map в массив и сортируем по иерархии ролей
    const roles = Array.from(rolesMap.values()).sort((a, b) => {
      const roleOrder = { admin: 1, manager: 2, foreman: 3, master: 4, worker: 5 }
      return (roleOrder[a.role as keyof typeof roleOrder] || 99) -
             (roleOrder[b.role as keyof typeof roleOrder] || 99)
    })

    return { roles }
  } catch (error) {
    console.error('[API/Permissions/Roles/Get] Ошибка:', error)
    throw createError({
      statusCode: 500,
      message: 'Ошибка сервера при получении ролей'
    })
  }
})

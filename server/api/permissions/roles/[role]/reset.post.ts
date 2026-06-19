// server/api/permissions/roles/[role]/reset.post.ts
/**
 * 📍 Эндпоинт: POST /api/permissions/roles/[role]/reset
 *
 * Назначение:
 * Сбросить права указанной роли к дефолтным значениям из ROLE_PERMISSIONS_SEED
 * Все текущие настройки прав роли будут удалены и заменены дефолтными
 *
 * ⚠️ Доступ: только для роли admin (проверка в middleware через settings.canSpecial)
 *
 * Логика:
 * 1. Валидация роли из URL
 * 2. Проверка что роль существует в ROLE_PERMISSIONS_SEED
 * 3. Защита: роль admin может сбрасывать только админ
 * 4. В транзакции:
 *    - Удаление всех текущих прав роли
 *    - Создание дефолтных прав из ROLE_PERMISSIONS_SEED
 * 5. Инвалидация кэша для всех пользователей этой роли
 *
 * @param {string} role — роль из пути (admin, manager, foreman, master, worker)
 * @returns { role, resetCount, previousCount, message }
 *
 * Пример ответа:
 * {
 *   "role": "master",
 *   "resetCount": 11,
 *   "previousCount": 9,
 *   "message": "Права роли \"master\" сброшены к дефолтным значениям (11 прав)"
 * }
 */
import { defineEventHandler, getRouterParam, createError } from 'h3'
import { db } from '../../../../db'
import { users, permissionsRoleAccess } from '../../../../db/schema'
import { eq, sql } from 'drizzle-orm'
import { isValidRole, type Role } from '../../../../utils/permissions/validators'
import { ROLE_PERMISSIONS_SEED } from '../../../../utils/permissions/seed'
import { invalidatePermissionsCache } from '../../../../middleware/auth'
import type { DbUser } from '../../../../utils/permissions'

export default defineEventHandler(async (event) => {
  // ✅ Авторизация и права уже проверены мидлваром
  const currentUser = event.context.user as DbUser
  if (!currentUser) {
    throw createError({ statusCode: 401, statusMessage: 'Не удалось получить данные текущего пользователя' })
  }

  // ============================================
  // 1. ДОПОЛНИТЕЛЬНАЯ ПРОВЕРКА: ТОЛЬКО АДМИН
  // ============================================
  if (currentUser.role !== 'admin') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Сброс прав роли к дефолтным доступен только администратору'
    })
  }

  // ============================================
  // 2. ПОЛУЧЕНИЕ И ВАЛИДАЦИЯ РОЛИ ИЗ URL
  // ============================================
  const roleParam = getRouterParam(event, 'role')
  if (!roleParam) {
    throw createError({ statusCode: 400, statusMessage: 'Роль не указана в URL' })
  }
  if (!isValidRole(roleParam)) {
    throw createError({ statusCode: 400, statusMessage: `Некорректная роль: ${roleParam}` })
  }
  const targetRole: Role = roleParam

  // ============================================
  // 3. ПРОВЕРКА СУЩЕСТВОВАНИЯ ДЕФОЛТНЫХ ПРАВ
  // ============================================
  const defaultPermissions = ROLE_PERMISSIONS_SEED[targetRole]
  if (!defaultPermissions) {
    throw createError({
      statusCode: 404,
      statusMessage: `Дефолтные права для роли "${targetRole}" не найдены в конфигурации`
    })
  }
  const defaultPages = Object.keys(defaultPermissions)
  if (defaultPages.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: `У роли "${targetRole}" нет настроенных дефолтных прав`
    })
  }

  // ============================================
  // 4. ПОДСЧЁТ ТЕКУЩИХ ПРАВ РОЛИ
  // ============================================
  const [countResult] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(permissionsRoleAccess)
    .where(eq(permissionsRoleAccess.role, targetRole))
  const previousCount = Number(countResult?.count || 0)

  // ============================================
  // 5. СБРОС ПРАВ В ТРАНЗАКЦИИ
  // ============================================
  try {
    const resetCount = await db.transaction(async (tx) => {
      // 5.1. Удаляем все текущие права роли
      await tx
        .delete(permissionsRoleAccess)
        .where(eq(permissionsRoleAccess.role, targetRole))

      // 5.2. Создаём дефолтные права из ROLE_PERMISSIONS_SEED
      // Новая система: canView, canCreate, canEdit, canDelete, canSpecial
      const insertValues = defaultPages.map(pageSlug => {
        const perms = defaultPermissions[pageSlug] || {}
        return {
          role: targetRole,
          pageSlug,
          canView: perms.canView || false,
          canCreate: perms.canCreate || false,
          canEdit: perms.canEdit || false,
          canDelete: perms.canDelete || false,
          canSpecial: perms.canSpecial || false,
          comment: `Сброшено к дефолтным значениям пользователем ${currentUser.name}`,
          updatedBy: currentUser.id,
          isActive: true
        }
      })

      await tx.insert(permissionsRoleAccess).values(insertValues)
      return defaultPages.length
    })

    // ============================================
    // 6. ИНВАЛИДАЦИЯ КЭША ДЛЯ ВСЕХ ПОЛЬЗОВАТЕЛЕЙ РОЛИ
    // ============================================
    const usersWithRole = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.role, targetRole))

    for (const user of usersWithRole) {
      invalidatePermissionsCache(user.id)
    }

    // ============================================
    // 7. ЛОГИРОВАНИЕ НА РУССКОМ
    // ============================================
    console.log(
      `[Права] ✅ Администратор ${currentUser.name} (ID: ${currentUser.id}) ` +
      `сбросил права роли "${targetRole}" к дефолтным значениям. ` +
      `Было: ${previousCount}, стало: ${resetCount}. ` +
      `Инвалидирован кэш для ${usersWithRole.length} пользователей`
    )

    return {
      role: targetRole,
      resetCount,
      previousCount,
      message: `Права роли "${targetRole}" сброшены к дефолтным значениям (${resetCount} прав). Кэш обновлён для ${usersWithRole.length} пользователей.`
    }
  } catch (error: any) {
    console.error(
      `[Права] ❌ Ошибка сброса прав роли "${targetRole}":`,
      error
    )
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      statusMessage: 'Ошибка сервера при сбросе прав роли'
    })
  }
})

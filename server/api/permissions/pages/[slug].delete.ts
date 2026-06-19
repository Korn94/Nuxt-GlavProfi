// server/api/permissions/pages/[slug].delete.ts
/**
 * 📍 Эндпоинт: DELETE /api/permissions/pages/[slug]
 * 
 * Назначение:
 * Деактивировать или удалить страницу из справочника системы прав
 * 
 * Режимы работы:
 * - По умолчанию: мягкое удаление (isActive = false) — страница скрыта но данные сохранены
 * - ?hard=true: полное удаление — CASCADE удалит связанные права ролей и переопределения
 * 
 * ⚠️ Доступ: только для роли admin
 * 
 * @param {string} slug — slug страницы из пути
 * @query {boolean} hard — полное удаление (по умолчанию false)
 * @returns { slug, mode, affectedRoles, affectedUsers, message }
 * 
 * Пример ответа:
 * {
 *   "slug": "finance",
 *   "mode": "soft",
 *   "affectedRoles": 5,
 *   "affectedUsers": 3,
 *   "message": "Страница \"Финансы\" деактивирована"
 * }
 */

import { defineEventHandler, getRouterParam, getQuery, createError } from 'h3'
import { db } from '../../../db'
import { 
  permissionsPages, 
  permissionsRoleAccess, 
  permissionsUserOverrides 
} from '../../../db/schema'
import { eq, sql } from 'drizzle-orm'
import type { DbUser } from '../../../utils/permissions'

export default defineEventHandler(async (event) => {
  // ============================================
  // 1. ПРОВЕРКА ПРАВ
  // ============================================
  const currentUser = event.context.user as DbUser
  if (!currentUser) {
    throw createError({ statusCode: 401, message: 'Не удалось получить данные текущего пользователя' })
  }

  if (currentUser.role !== 'admin') {
    throw createError({ statusCode: 403, message: 'Удаление страниц доступно только администратору' })
  }

  // ============================================
  // 2. ПОЛУЧЕНИЕ ПАРАМЕТРОВ
  // ============================================
  const slugParam = getRouterParam(event, 'slug')
  if (!slugParam) {
    throw createError({ statusCode: 400, message: 'Slug страницы не указан в URL' })
  }

  const query = getQuery(event)
  const hardDelete = query.hard === 'true' || query.hard === '1'

  // ============================================
  // 3. ПРОВЕРКА СУЩЕСТВОВАНИЯ СТРАНИЦЫ
  // ============================================
  const [existingPage] = await db
    .select()
    .from(permissionsPages)
    .where(eq(permissionsPages.slug, slugParam))
    .limit(1)

  if (!existingPage) {
    throw createError({ statusCode: 404, message: `Страница с slug "${slugParam}" не найдена` })
  }

  // ============================================
  // 4. ПОДСЧЁТ ЗАТРОНУТЫХ ЗАПИСЕЙ
  // ============================================
  const [rolesCountResult] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(permissionsRoleAccess)
    .where(eq(permissionsRoleAccess.pageSlug, slugParam))

  const [overridesCountResult] = await db
    .select({ count: sql<number>`COUNT(DISTINCT user_id)` })
    .from(permissionsUserOverrides)
    .where(eq(permissionsUserOverrides.pageSlug, slugParam))

  const affectedRoles = Number(rolesCountResult?.count || 0)
  const affectedUsers = Number(overridesCountResult?.count || 0)

  // ============================================
  // 5. ВЫПОЛНЕНИЕ УДАЛЕНИЯ
  // ============================================
  try {
    if (hardDelete) {
      // ============================================
      // ПОЛНОЕ УДАЛЕНИЕ (CASCADE)
      // ============================================
      // ⚠️ Foreign keys настроены на CASCADE, поэтому связанные записи удалятся автоматически
      await db
        .delete(permissionsPages)
        .where(eq(permissionsPages.slug, slugParam))

      console.log(
        `[Permissions] 🗑️  Администратор ${currentUser.name} (ID: ${currentUser.id}) ` +
        `ПОЛНОСТЬЮ УДАЛИЛ страницу "${existingPage.name}" (${slugParam}). ` +
        `Затронуто: ${affectedRoles} ролей, ${affectedUsers} пользователей`
      )

      return {
        slug: slugParam,
        mode: 'hard' as const,
        affectedRoles,
        affectedUsers,
        message: `Страница "${existingPage.name}" полностью удалена вместе с ${affectedRoles} правами ролей и ${affectedUsers} переопределениями пользователей`
      }
    } else {
      // ============================================
      // МЯГКОЕ УДАЛЕНИЕ (деактивация)
      // ============================================
      await db
        .update(permissionsPages)
        .set({ isActive: false })
        .where(eq(permissionsPages.slug, slugParam))

      console.log(
        `[Permissions] 🚫 Администратор ${currentUser.name} (ID: ${currentUser.id}) ` +
        `деактивировал страницу "${existingPage.name}" (${slugParam}). ` +
        `Затронуто: ${affectedRoles} ролей, ${affectedUsers} пользователей`
      )

      return {
        slug: slugParam,
        mode: 'soft' as const,
        affectedRoles,
        affectedUsers,
        message: `Страница "${existingPage.name}" деактивирована. Права ролей и переопределения сохранены, но страница скрыта из UI`
      }
    }
  } catch (error: any) {
    console.error(`[Permissions] ❌ Ошибка удаления страницы "${slugParam}":`, error)
    
    if (error.statusCode) throw error
    
    throw createError({ 
      statusCode: 500, 
      message: 'Ошибка сервера при удалении страницы' 
    })
  }
})

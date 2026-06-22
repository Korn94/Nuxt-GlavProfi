// server/api/permissions/pages/[slug].delete.ts
/**
 * 📍 Эндпоинт: DELETE /api/permissions/pages/[slug]
 *
 * Назначение:
 * - Деактивировать или удалить страницу из справочника системы прав
 *
 * Режимы работы:
 * - По умолчанию: **мягкое удаление** (isActive = false) — страница скрыта из UI,
 *   но права ролей и переопределения сохранены
 * - `?hard=true`: **полное удаление** — CASCADE удалит связанные права ролей
 *   и переопределения пользователей (на уровне БД через FOREIGN KEY)
 *
 * ⚠️ Доступ: только для роли admin (двойная проверка — middleware + handler)
 * ⚠️ Защита: нельзя удалить системные страницы (dashboard, settings, users)
 *
 * Особенности:
 * - В обоих режимах инвалидируется кэш прав ВСЕХ пользователей
 *   (т.к. страница исчезает из getAllUserPermissions)
 * - Все админы уведомляются через сокет для обновления UI настроек
 * - При hard-удалении CASCADE работает на уровне БД (схема уже настроена)
 *
 * @param {string} slug — slug страницы из пути
 * @query {boolean} hard — полное удаление (по умолчанию false)
 * @returns { slug, mode, affectedRoles, affectedUsers, message }
 *
 * Примеры:
 *   DELETE /api/permissions/pages/reports           → soft delete
 *   DELETE /api/permissions/pages/reports?hard=true → hard delete
 */

import { defineEventHandler, getRouterParam, getQuery } from 'h3'
import { eq, sql } from 'drizzle-orm'

import { db } from '../../../db'
import {
  permissionsPages,
  permissionsRoleAccess,
  permissionsUserOverrides,
  users
} from '../../../db/schema'

import { validatePageSlugParam } from '../../../utils/permissions/validators'
import { invalidatePermissionsCache, type DbUser } from '../../../utils/permissions'

import { hasRequiredRoleLevel, type Role } from 'shared/constants/roles'

import { getIO } from '../../../socket/common'
import { getRoleRoomName } from '../../../socket/utils'

// ============================================
// ЗАЩИЩЁННЫЕ СИСТЕМНЫЕ СТРАНИЦЫ
// ============================================
// Эти страницы нельзя удалить ни мягко, ни жёстко —
// они критичны для работы системы (на них завязаны роуты и middleware)
const PROTECTED_PAGES = ['dashboard', 'settings', 'users'] as const

// ============================================
// ОБРАБОТЧИК
// ============================================

export default defineEventHandler(async (event) => {
  // ============================================
  // 1. ПРОВЕРКА ПРАВ: ТОЛЬКО АДМИН
  // ============================================
  const currentUser = event.context.user as DbUser | undefined

  if (!currentUser) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Не удалось получить данные текущего пользователя'
    })
  }

  if (!hasRequiredRoleLevel(currentUser.role as Role, 'admin')) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Удаление страниц доступно только администратору'
    })
  }

  // ============================================
  // 2. ВАЛИДАЦИЯ SLUG ИЗ URL
  // ============================================
  const slugParam = getRouterParam(event, 'slug')
  const pageSlug = validatePageSlugParam(slugParam)

  // ============================================
  // 3. ПРОВЕРКА: НЕ СИСТЕМНАЯ ЛИ СТРАНИЦА
  // ============================================
  if ((PROTECTED_PAGES as readonly string[]).includes(pageSlug)) {
    throw createError({
      statusCode: 403,
      statusMessage: `Страница "${pageSlug}" является системной и не может быть удалена`
    })
  }

  // ============================================
  // 4. ПРОВЕРКА СУЩЕСТВОВАНИЯ СТРАНИЦЫ
  // ============================================
  const [existingPage] = await db
    .select()
    .from(permissionsPages)
    .where(eq(permissionsPages.slug, pageSlug))
    .limit(1)

  if (!existingPage) {
    throw createError({
      statusCode: 404,
      statusMessage: `Страница с slug "${pageSlug}" не найдена`
    })
  }

  // ============================================
  // 5. ПАРСИНГ ПАРАМЕТРА hard
  // ============================================
  const query = getQuery(event)
  const hardDelete = query.hard === 'true' || query.hard === '1'

  // ============================================
  // 6. ПОДСЧЁТ ЗАТРОНУТЫХ ЗАПИСЕЙ (для ответа и логов)
  // ============================================
  // Делаем до удаления, чтобы вернуть статистику клиенту
  const [rolesCountResult] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(permissionsRoleAccess)
    .where(eq(permissionsRoleAccess.pageSlug, pageSlug))

  const [overridesCountResult] = await db
    .select({ count: sql<number>`COUNT(DISTINCT user_id)` })
    .from(permissionsUserOverrides)
    .where(eq(permissionsUserOverrides.pageSlug, pageSlug))

  const affectedRoles = Number(rolesCountResult?.count || 0)
  const affectedUsers = Number(overridesCountResult?.count || 0)

  // ============================================
  // 7. ВЫПОЛНЕНИЕ УДАЛЕНИЯ
  // ============================================
  const mode = hardDelete ? 'hard' : 'soft'
  const pageName = existingPage.name

  if (hardDelete) {
    // ============================================
    // ПОЛНОЕ УДАЛЕНИЕ (CASCADE на уровне БД)
    // ============================================
    // FOREIGN KEY в схеме настроены с onDelete: 'cascade',
    // поэтому permissionsRoleAccess и permissionsUserOverrides удалятся автоматически
    await db
      .delete(permissionsPages)
      .where(eq(permissionsPages.slug, pageSlug))

    console.log(
      `[Permissions] 🗑️  Администратор ${currentUser.name} (ID: ${currentUser.id}) ` +
      `ПОЛНОСТЬЮ УДАЛИЛ страницу "${pageName}" (${pageSlug}). ` +
      `Затронуто: ${affectedRoles} ролей, ${affectedUsers} пользователей`
    )
  }
  else {
    // ============================================
    // МЯГКОЕ УДАЛЕНИЕ (деактивация)
    // ============================================
    await db
      .update(permissionsPages)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(permissionsPages.slug, pageSlug))

    console.log(
      `[Permissions] 🚫 Администратор ${currentUser.name} (ID: ${currentUser.id}) ` +
      `деактивировал страницу "${pageName}" (${pageSlug}). ` +
      `Затронуто: ${affectedRoles} ролей, ${affectedUsers} пользователей`
    )
  }

  // ============================================
  // 8. ИНВАЛИДАЦИЯ КЭША ПРАВ ВСЕХ ПОЛЬЗОВАТЕЛЕЙ
  // ============================================
  // Почему всех? Потому что в getAllUserPermissions() выборка идёт
  // только по isActive=true:
  //   .where(eq(permissionsPages.isActive, true))
  // После деактивации страницы она исчезнет из результатов у ВСЕХ пользователей.
  const allUsers = await db
    .select({ id: users.id })
    .from(users)

  let invalidatedCount = 0
  for (const user of allUsers) {
    invalidatePermissionsCache(user.id)
    invalidatedCount++
  }

  console.log(
    `[Permissions] 🧹 Кэш прав инвалидирован для ${invalidatedCount} пользователей`
  )

  // ============================================
  // 9. УВЕДОМЛЕНИЕ АДМИНОВ ЧЕРЕЗ СОКЕТ
  // ============================================
  const io = getIO()
  if (io) {
    io.to(getRoleRoomName('admin')).emit('permissions:page:deleted', {
      slug: pageSlug,
      name: pageName,
      mode,
      affectedRoles,
      affectedUsers,
      deletedBy: {
        id: currentUser.id,
        name: currentUser.name
      },
      timestamp: new Date().toISOString()
    })
  }

  // ============================================
  // 10. ФОРМИРОВАНИЕ ОТВЕТА
  // ============================================
  const message = hardDelete
    ? `Страница "${pageName}" полностью удалена вместе с ${affectedRoles} правами ролей и ${affectedUsers} переопределениями пользователей`
    : `Страница "${pageName}" деактивирована. Права ролей и переопределения сохранены, но страница скрыта из UI`

  return {
    slug: pageSlug,
    mode,
    affectedRoles,
    affectedUsers,
    invalidatedCacheFor: invalidatedCount,
    message
  }
})

// ============================================
// ЛОКАЛЬНЫЙ ИМПОРТ createError (для совместимости)
// ============================================
import { createError } from 'h3'

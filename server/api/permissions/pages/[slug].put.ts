// server/api/permissions/pages/[slug].put.ts
/**
 * 📍 Эндпоинт: PUT /api/permissions/pages/[slug]
 *
 * Назначение:
 * - Обновить существующую страницу в справочнике системы прав
 * - Используется в UI настроек прав (вкладка "Страницы") администраторами
 *
 * ⚠️ Доступ: только для роли admin (двойная проверка — middleware + handler)
 * - Middleware проверяет settings.canEdit
 * - Handler дополнительно проверяет admin
 *
 * Особенности:
 * - Можно обновлять только существующие страницы (создание — через POST)
 * - При изменении `hasCreate/hasEdit/hasDelete/hasSpecial` инвалидируется
 *   кэш прав **всех пользователей** (эти флаги фильтруют effective permissions)
 * - При `isActive: false` страница перестаёт отображаться в UI и проверках
 * - Уведомляются все админы через сокет
 *
 * @param {string} slug — slug страницы из пути
 * @body { name?, description?, icon?, order?, hasCreate?, hasEdit?, hasDelete?, hasSpecial?, isActive? }
 * @returns { page: SystemPage }
 *
 * Пример запроса:
 * PUT /api/permissions/pages/reports
 * { "name": "Отчёты (обновлено)", "hasCreate": true }
 */

import { defineEventHandler, readBody, getRouterParam } from 'h3'
import { eq } from 'drizzle-orm'

import { db } from '../../../db'
import { permissionsPages, users } from '../../../db/schema'

import {
  validateUpdatePage,
  validatePageSlugParam,
  type UpdatePageInput
} from '../../../utils/permissions/validators'

import {
  invalidatePermissionsCache,
  type DbUser
} from '../../../utils/permissions'

import { hasRequiredRoleLevel, type Role } from 'shared/constants/roles'

import { getIO } from '../../../socket/common'
import { getRoleRoomName } from '../../../socket/utils'

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
      statusMessage: 'Редактирование страниц доступно только администратору'
    })
  }

  // ============================================
  // 2. ВАЛИДАЦИЯ SLUG ИЗ URL (через zod-enum из shared)
  // ============================================
  const slugParam = getRouterParam(event, 'slug')
  const pageSlug = validatePageSlugParam(slugParam)

  // ============================================
  // 3. ПРОВЕРКА СУЩЕСТВОВАНИЯ СТРАНИЦЫ
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
  // 4. ВАЛИДАЦИЯ ТЕЛА ЗАПРОСА (через zod из validators.ts)
  // ============================================
  const body = await readBody(event)
  const validated: UpdatePageInput = validateUpdatePage(body)

  // Проверяем что есть хотя бы одно поле для обновления
  const updateKeys = Object.keys(validated)
  if (updateKeys.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Нет данных для обновления'
    })
  }

  // ============================================
  // 5. ОБНОВЛЕНИЕ СТРАНИЦЫ
  // ============================================
  await db
    .update(permissionsPages)
    .set({ ...validated, updatedAt: new Date() })
    .where(eq(permissionsPages.slug, pageSlug))

  // ============================================
  // 6. ПОЛУЧЕНИЕ ОБНОВЛЁННОЙ СТРАНИЦЫ ДЛЯ ОТВЕТА
  // ============================================
  const [updated] = await db
    .select()
    .from(permissionsPages)
    .where(eq(permissionsPages.slug, pageSlug))
    .limit(1)

  if (!updated) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Страница обновлена, но не удалось её получить'
    })
  }

  // ============================================
  // 7. ИНВАЛИДАЦИЯ КЭША ПРАВ ВСЕХ ПОЛЬЗОВАТЕЛЕЙ
  // ============================================
  // Почему всех? Потому что hasCreate/hasEdit/hasDelete/hasSpecial страницы
  // влияют на effective permissions в getAllUserPermissions():
  //   pages[page.slug] = {
  //     canCreate: page.hasCreate && effectivePerms.canCreate,
  //     ...
  //   }
  // Если hasCreate изменился с true → false, у ВСЕХ пользователей пропадёт canCreate.
  // Проще всего — инвалидировать весь кэш (он небольшой и быстро пересоздаётся).
  const allUsers = await db
    .select({ id: users.id })
    .from(users)

  let invalidatedCount = 0
  for (const user of allUsers) {
    invalidatePermissionsCache(user.id)
    invalidatedCount++
  }

  // ============================================
  // 8. ЛОГИРОВАНИЕ И УВЕДОМЛЕНИЕ АДМИНОВ
  // ============================================
  const changedFields = updateKeys.join(', ')
  // console.log(
  //   `[Permissions] ✅ Администратор ${currentUser.name} (ID: ${currentUser.id}) ` +
  //   `обновил страницу "${updated.name}" (${pageSlug}) — поля: ${changedFields}. ` +
  //   `Кэш инвалидирован для ${invalidatedCount} пользователей.`
  // )

  const io = getIO()
  if (io) {
    io.to(getRoleRoomName('admin')).emit('permissions:page:updated', {
      page: {
        slug: updated.slug,
        name: updated.name,
        icon: updated.icon,
        isActive: updated.isActive
      },
      changedFields: updateKeys,
      updatedBy: {
        id: currentUser.id,
        name: currentUser.name
      },
      timestamp: new Date().toISOString()
    })
  }

  // ============================================
  // 9. ВОЗВРАТ ОБНОВЛЁННОЙ СТРАНИЦЫ
  // ============================================
  return { page: updated }
})

// ============================================
// ЛОКАЛЬНЫЙ ИМПОРТ createError (для совместимости)
// ============================================
import { createError } from 'h3'

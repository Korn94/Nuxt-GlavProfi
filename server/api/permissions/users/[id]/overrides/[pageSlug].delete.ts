// server/api/permissions/users/[id]/overrides/[pageSlug].delete.ts
/**
 * 📍 Эндпоинт: DELETE /api/permissions/users/[id]/overrides/[pageSlug]
 *
 * Назначение:
 * - Удалить переопределение прав для конкретной страницы у пользователя
 * - После удаления пользователь будет использовать базовые права своей роли для этой страницы
 *
 * ⚠️ Доступ: middleware уже проверил через PROTECTED_PATHS (settings.canEdit)
 * ⚠️ Защита: переопределения admin может удалять только admin
 *
 * Логика:
 * 1. Валидация параметров из URL (userId, pageSlug)
 * 2. Проверка существования целевого пользователя
 * 3. Проверка существования override'а
 * 4. Анализ критичности: давал ли этот override canView на критической странице,
 *    которой нет у базовой роли?
 * 5. Удаление override'а
 * 6. Инвалидация кэша прав пользователя
 * 7. 🆕 Сокет-уведомление (или forceDisconnect при критичном изменении)
 *
 * Почему удаление одного override'а может быть критичным?
 * - Если override давал canView=true на dashboard/objects/works,
 *   а у роли canView=false — пользователь потеряет доступ к системе
 * - Безопаснее разорвать соединение с понятной причиной
 *
 * @param {string} id — ID пользователя из пути
 * @param {string} pageSlug — slug страницы из пути
 * @returns { userId, userName, roleLabel, pageSlug, deleted, disconnected, wasCritical, message }
 *
 * Пример ответа:
 * {
 *   "userId": 5,
 *   "userName": "Иван Петров",
 *   "roleLabel": "Мастер",
 *   "pageSlug": "finance",
 *   "deleted": true,
 *   "disconnected": false,
 *   "wasCritical": false,
 *   "message": "Переопределение удалено. Пользователь теперь использует базовые права роли."
 * }
 */

import { defineEventHandler, getRouterParam } from 'h3'
import { eq, and } from 'drizzle-orm'

import { db } from '../../../../../db'
import {
  users,
  permissionsUserOverrides,
  permissionsRoleAccess
} from '../../../../../db/schema'

import {
  invalidatePermissionsCache,
  type DbUser
} from '../../../../../utils/permissions'

import {
  hasRequiredRoleLevel,
  ROLE_LABELS,
  type Role
} from 'shared/constants/roles'

import { PageSlugSchema } from 'shared/constants/permissions'

import { getIO } from '../../../../../socket/common'
import {
  notifyUserPermissionsChanged,
  forceDisconnectUserWithReason
} from '../../../../../socket/handlers/user'

// ============================================
// КОНСТАНТЫ
// ============================================

/**
 * Страницы, потеря canView на которых критична для работы пользователя.
 */
const CRITICAL_PAGES_FOR_DISCONNECT = ['dashboard', 'objects', 'works'] as const

// ============================================
// ОБРАБОТЧИК
// ============================================

export default defineEventHandler(async (event) => {
  // ============================================
  // 1. ПРОВЕРКА ТЕКУЩЕГО ПОЛЬЗОВАТЕЛЯ
  // ============================================
  const currentUser = event.context.user as DbUser | undefined
  if (!currentUser) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Не удалось получить данные текущего пользователя'
    })
  }

  // ============================================
  // 2. ПОЛУЧЕНИЕ И ВАЛИДАЦИЯ ПАРАМЕТРОВ ИЗ URL
  // ============================================
  const idParam = getRouterParam(event, 'id')
  const pageSlugParam = getRouterParam(event, 'pageSlug')

  if (!idParam) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID пользователя не указан в URL'
    })
  }
  if (!pageSlugParam) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Slug страницы не указан в URL'
    })
  }

  const targetUserId = parseInt(idParam, 10)
  if (!Number.isFinite(targetUserId) || targetUserId <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Некорректный формат ID (должно быть положительное число)'
    })
  }

  // Валидация pageSlug через zod-enum из shared
  const parseResult = PageSlugSchema.safeParse(pageSlugParam)
  if (!parseResult.success) {
    throw createError({
      statusCode: 400,
      statusMessage: `Некорректный slug страницы: "${pageSlugParam}"`
    })
  }
  const pageSlug = parseResult.data

  // ============================================
  // 3. ПРОВЕРКА СУЩЕСТВОВАНИЯ ЦЕЛЕВОГО ПОЛЬЗОВАТЕЛЯ
  // ============================================
  const [targetUser] = await db
    .select()
    .from(users)
    .where(eq(users.id, targetUserId))
    .limit(1)

  if (!targetUser) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Пользователь не найден'
    })
  }

  const targetRole = targetUser.role as Role

  // ============================================
  // 4. ЗАЩИТА: ПРАВА АДМИНА УДАЛЯЕТ ТОЛЬКО АДМИН
  // ============================================
  if (
    targetUser.role === 'admin' &&
    !hasRequiredRoleLevel(currentUser.role as Role, 'admin')
  ) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Только администратор может изменять права администратора'
    })
  }

  // ============================================
  // 5. ПРОВЕРКА СУЩЕСТВОВАНИЯ ПЕРЕОПРЕДЕЛЕНИЯ
  // ============================================
  const [existingOverride] = await db
    .select({
      id: permissionsUserOverrides.id,
      canView: permissionsUserOverrides.canView
    })
    .from(permissionsUserOverrides)
    .where(
      and(
        eq(permissionsUserOverrides.userId, targetUserId),
        eq(permissionsUserOverrides.pageSlug, pageSlug)
      )
    )
    .limit(1)

  if (!existingOverride) {
    // Переопределение не найдено — это не ошибка, просто нечего удалять
    console.log(
      `[Права] ℹ️ Пользователь ${currentUser.name} (ID: ${currentUser.id}) ` +
      `пытался удалить несуществующее переопределение для пользователя "${targetUser.name}" ` +
      `(ID: ${targetUserId}), страница "${pageSlug}"`
    )
    return {
      userId: targetUserId,
      userName: targetUser.name,
      roleLabel: ROLE_LABELS[targetRole] || targetRole,
      pageSlug,
      deleted: false,
      disconnected: false,
      wasCritical: false,
      message: 'Переопределение не найдено'
    }
  }

  // ============================================
  // 6. АНАЛИЗ КРИТИЧНОСТИ ИЗМЕНЕНИЯ
  // ============================================
  // Определяем, было ли это переопределение критичным:
  // 1. Страница в списке критических (dashboard/objects/works)
  // 2. Override давал canView=true
  // 3. Базовая роль НЕ даёт canView (false или отсутствует)
  let wasCritical = false

  if (
    (CRITICAL_PAGES_FOR_DISCONNECT as readonly string[]).includes(pageSlug) &&
    existingOverride.canView === true
  ) {
    // Проверяем базовое право роли
    const [roleAccess] = await db
      .select({ canView: permissionsRoleAccess.canView })
      .from(permissionsRoleAccess)
      .where(
        and(
          eq(permissionsRoleAccess.role, targetRole as any),
          eq(permissionsRoleAccess.pageSlug, pageSlug),
          eq(permissionsRoleAccess.isActive, true)
        )
      )
      .limit(1)

    const roleHasView = roleAccess?.canView === true

    if (!roleHasView) {
      // Override давал доступ, а роль — нет. После удаления пользователь потеряет доступ.
      wasCritical = true
    }
  }

  // ============================================
  // 7. УДАЛЕНИЕ ПЕРЕОПРЕДЕЛЕНИЯ
  // ============================================
  await db
    .delete(permissionsUserOverrides)
    .where(eq(permissionsUserOverrides.id, existingOverride.id))

  // ============================================
  // 8. ИНВАЛИДАЦИЯ КЭША ПРАВ ПОЛЬЗОВАТЕЛЯ
  // ============================================
  invalidatePermissionsCache(targetUserId)

  // ============================================
  // 9. ЛОГИРОВАНИЕ
  // ============================================
  console.log(
    `[Права] ✅ Администратор ${currentUser.name} (ID: ${currentUser.id}) ` +
    `удалил переопределение для пользователя "${targetUser.name}" (${ROLE_LABELS[targetRole]}, ID: ${targetUserId}), ` +
    `страница "${pageSlug}". Критичное: ${wasCritical ? '✅' : '❌'}. Кэш инвалидирован.`
  )

  // ============================================
  // 10. 🆕 УВЕДОМЛЕНИЕ ПОЛЬЗОВАТЕЛЯ ЧЕРЕЗ СОКЕТ
  // ============================================
  const io = getIO()
  let disconnected = false

  if (io) {
    if (wasCritical) {
      // Критичное изменение — принудительное отключение
      await forceDisconnectUserWithReason(
        io,
        targetUserId,
        `Ваш индивидуальный доступ к разделу "${pageSlug}" был отозван администратором ${currentUser.name}. ` +
        `Необходимо войти в систему заново.`
      )
      disconnected = true
    } else {
      // Обычное изменение — мягкое уведомление
      await notifyUserPermissionsChanged(io, targetUserId, {
        reason: `Администратор ${currentUser.name} удалил ваше индивидуальное право на странице "${pageSlug}". Теперь используются базовые права роли "${ROLE_LABELS[targetRole]}".`,
        changedPages: [pageSlug],
        requireRelogin: false
      })
    }
  }

  // ============================================
  // 11. ВОЗВРАТ РЕЗУЛЬТАТА
  // ============================================
  return {
    userId: targetUserId,
    userName: targetUser.name,
    roleLabel: ROLE_LABELS[targetRole] || targetRole,
    pageSlug,
    deleted: true,
    disconnected,
    wasCritical,
    message: wasCritical
      ? `Переопределение удалено. Пользователь отключён от системы из-за потери доступа к разделу "${pageSlug}".`
      : `Переопределение удалено. Пользователь теперь использует базовые права роли "${ROLE_LABELS[targetRole]}" для страницы "${pageSlug}".`
  }
})

// ============================================
// ЛОКАЛЬНЫЙ ИМПОРТ createError (для совместимости)
// ============================================
import { createError } from 'h3'

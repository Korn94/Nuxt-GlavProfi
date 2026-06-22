// server/api/permissions/users/[id]/overrides/index.delete.ts
/**
 * 📍 Эндпоинт: DELETE /api/permissions/users/[id]/overrides
 *
 * Назначение:
 * - Удалить ВСЕ переопределения прав для конкретного пользователя
 * - После удаления пользователь будет использовать только базовые права своей роли
 *
 * ⚠️ Доступ: middleware уже проверил через PROTECTED_PATHS (settings.canEdit)
 * ⚠️ Защита: переопределения admin может удалять только admin
 *
 * Логика:
 * 1. Получение целевого пользователя
 * 2. Получение текущих override'ов и базовых прав роли (для анализа критичности)
 * 3. Удаление всех override'ов
 * 4. Инвалидация кэша прав пользователя
 * 5. 🆕 Анализ: были ли критичные override'ы (давали canView на dashboard/objects/works,
 *    а у роли их нет) → если да, принудительное отключение
 * 6. Иначе — мягкое уведомление через сокет
 *
 * Почему удаление override'ов может быть критичным?
 * - Override мог давать canView=true на критической странице, которой у роли нет
 * - После удаления override'а пользователь потеряет доступ к dashboard/objects/works
 * - UI будет показывать элементы, которые теперь недоступны
 * - Безопаснее разорвать соединение с понятной причиной
 *
 * @param {string} id — ID пользователя из пути
 * @returns { userId, userName, roleLabel, deletedCount, disconnected, criticalPages, message }
 */

import { defineEventHandler, getRouterParam } from 'h3'
import { eq, sql, and } from 'drizzle-orm'

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

import { getIO } from '../../../../../socket/common'
import {
  notifyUserPermissionsChanged,
  forceDisconnectUserWithReason
} from '../../../../../socket/handlers/user'

// ============================================
// КОНСТАНТЫ
// ============================================

/**
 * Страницы, для которых потеря canView через удаление override'а критична.
 *
 * Логика: если override давал canView=true на одной из этих страниц,
 * а базовое право роли = false (или отсутствует) — пользователь потеряет доступ.
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
  // 2. ПОЛУЧЕНИЕ И ВАЛИДАЦИЯ ID ИЗ URL
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

  const targetRole = targetUser.role as Role

  // ============================================
  // 5. ПОЛУЧЕНИЕ ТЕКУЩИХ OVERRIDE'ОВ (до удаления)
  // ============================================
  // Нужны для анализа критичности — какие страницы потеряют canView
  const currentOverrides = await db
    .select({
      pageSlug: permissionsUserOverrides.pageSlug,
      canView: permissionsUserOverrides.canView
    })
    .from(permissionsUserOverrides)
    .where(
      and(
        eq(permissionsUserOverrides.userId, targetUserId),
        eq(permissionsUserOverrides.isActive, true)
      )
    )

  const deletedCount = currentOverrides.length

  if (deletedCount === 0) {
    console.log(
      `[Права] ℹ️ Пользователь ${currentUser.name} (ID: ${currentUser.id}) ` +
      `пытался удалить переопределения для "${targetUser.name}" (ID: ${targetUserId}), но их не было`
    )

    return {
      userId: targetUserId,
      userName: targetUser.name,
      roleLabel: ROLE_LABELS[targetRole] || targetRole,
      deletedCount: 0,
      disconnected: false,
      criticalPages: [],
      message: 'Переопределений не найдено'
    }
  }

  // ============================================
  // 6. ПОЛУЧЕНИЕ БАЗОВЫХ ПРАВ РОЛИ (для анализа критичности)
  // ============================================
  // Нужно понять: для каких критических страниц override давал canView=true,
  // а у роли canView = false (или отсутствует).
  const criticalPageSlugs = [...CRITICAL_PAGES_FOR_DISCONNECT]

  const roleAccessForCritical = await db
    .select({
      pageSlug: permissionsRoleAccess.pageSlug,
      canView: permissionsRoleAccess.canView
    })
    .from(permissionsRoleAccess)
    .where(
      and(
        eq(permissionsRoleAccess.role, targetRole as any),
        eq(permissionsRoleAccess.isActive, true)
      )
    )

  const roleCanViewMap = new Map(
    roleAccessForCritical.map(r => [r.pageSlug, r.canView])
  )

  // ============================================
  // 7. АНАЛИЗ КРИТИЧНОСТИ ИЗМЕНЕНИЙ
  // ============================================
  // Override был критичным если:
  // 1. Он был на критической странице (dashboard/objects/works)
  // 2. Override давал canView=true
  // 3. Базовая роль НЕ даёт canView (false или отсутствует)
  const criticalPages: string[] = []

  for (const override of currentOverrides) {
    if (!criticalPageSlugs.includes(override.pageSlug as any)) continue
    if (override.canView !== true) continue

    const roleHasView = roleCanViewMap.get(override.pageSlug) === true

    if (!roleHasView) {
      // Override давал canView, а роль — нет. После удаления потеряет доступ.
      criticalPages.push(override.pageSlug)
    }
  }

  const requiresDisconnect = criticalPages.length > 0

  // ============================================
  // 8. УДАЛЕНИЕ ВСЕХ ПЕРЕОПРЕДЕЛЕНИЙ
  // ============================================
  await db
    .delete(permissionsUserOverrides)
    .where(eq(permissionsUserOverrides.userId, targetUserId))

  // ============================================
  // 9. ИНВАЛИДАЦИЯ КЭША ПРАВ ПОЛЬЗОВАТЕЛЯ
  // ============================================
  invalidatePermissionsCache(targetUserId)

  // ============================================
  // 10. ЛОГИРОВАНИЕ
  // ============================================
  console.log(
    `[Права] ✅ Администратор ${currentUser.name} (ID: ${currentUser.id}) ` +
    `удалил ${deletedCount} переопределений для "${targetUser.name}" (${ROLE_LABELS[targetRole]}, ID: ${targetUserId}). ` +
    `Критичных отзывов: ${criticalPages.length}` +
    (criticalPages.length > 0 ? ` [${criticalPages.join(', ')}]` : '')
  )

  // ============================================
  // 11. 🆕 УВЕДОМЛЕНИЕ ПОЛЬЗОВАТЕЛЯ ЧЕРЕЗ СОКЕТ
  // ============================================
  const io = getIO()
  let disconnected = false

  if (io) {
    if (requiresDisconnect) {
      // Критичные изменения — принудительное отключение
      await forceDisconnectUserWithReason(
        io,
        targetUserId,
        `Ваши индивидуальные права доступа были удалены администратором ${currentUser.name}. ` +
        `Вы потеряли доступ к некоторым разделам. Необходимо войти в систему заново.`
      )
      disconnected = true
    } else {
      // Обычные изменения — мягкое уведомление
      await notifyUserPermissionsChanged(io, targetUserId, {
        reason: `Администратор ${currentUser.name} удалил все ваши индивидуальные права доступа. Теперь используются базовые права роли "${ROLE_LABELS[targetRole]}".`,
        changedPages: currentOverrides.map(o => o.pageSlug),
        requireRelogin: false
      })
    }
  }

  // ============================================
  // 12. ВОЗВРАТ РЕЗУЛЬТАТА
  // ============================================
  return {
    userId: targetUserId,
    userName: targetUser.name,
    roleLabel: ROLE_LABELS[targetRole] || targetRole,
    deletedCount,
    disconnected,
    criticalPages,
    message: requiresDisconnect
      ? `Удалено ${deletedCount} переопределений. Пользователь отключён от системы из-за потери доступа к критичным разделам: ${criticalPages.join(', ')}.`
      : `Удалено ${deletedCount} переопределений. Пользователь теперь использует базовые права роли "${ROLE_LABELS[targetRole]}".`
  }
})

// ============================================
// ЛОКАЛЬНЫЙ ИМПОРТ createError (для совместимости)
// ============================================
import { createError } from 'h3'

// server/api/permissions/users/[id]/overrides/index.post.ts
/**
 * 📍 Эндпоинт: POST /api/permissions/users/[id]/overrides
 *
 * Назначение:
 * - Применить (создать/обновить) переопределения прав для конкретного пользователя
 * - Используется во вкладке "Пользователи" страницы настроек прав
 *
 * ⚠️ Доступ: middleware уже проверил через PROTECTED_PATHS (settings.canEdit)
 * ⚠️ Защита: переопределения для admin может делать только admin
 *
 * Логика:
 * 1. Валидация body через zod (validateUserOverrides)
 * 2. Проверка существования целевого пользователя
 * 3. Проверка существования страниц (через inArray)
 * 4. В транзакции: для каждой страницы — insert или update
 *    (при update сохраняем неуказанные поля, чтобы не перезаписать другие override'ы)
 * 5. Инвалидация кэша прав ТОЛЬКО для этого пользователя
 * 6. 🆕 Сокет-уведомление пользователя (или forceDisconnect при критичных изменениях)
 *
 * Особенности partial update:
 * - Если в override не указано canCreate — сохраняем текущее значение из БД
 * - Это позволяет админу изменить только одно поле, не трогая остальные
 * - null = использовать права роли (сброс override для этого поля)
 *
 * @param {string} id — ID пользователя из пути
 * @body { overrides: UserOverride[] }
 * @returns { userId, userName, roleLabel, created, updated, applied, disconnected, changedPages }
 *
 * Пример body:
 * {
 *   "overrides": [
 *     { "pageSlug": "comings", "canView": true, "reason": "Временный доступ" },
 *     { "pageSlug": "works", "canSpecial": true, "expiresAt": "2026-12-31T00:00:00.000Z" }
 *   ]
 * }
 */

import { defineEventHandler, readBody, getRouterParam } from 'h3'
import { eq, and, inArray } from 'drizzle-orm'

import { db } from '../../../../../db'
import {
  users,
  permissionsPages,
  permissionsUserOverrides
} from '../../../../../db/schema'

import {
  validateUserOverrides,
  type UserOverrideInput
} from '../../../../../utils/permissions/validators'

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
import { notifyUserPermissionsChanged } from '../../../../../socket/handlers/user'
import { forceDisconnectUserWithReason } from '../../../../../socket/handlers/user'

// ============================================
// КОНСТАНТЫ
// ============================================

/**
 * Страницы, отзыв canView у которых требует принудительного отключения пользователя.
 *
 * Если у пользователя override'ом отозвали canView на одну из этих страниц —
 * он больше не сможет работать в системе (не увидит меню, не сможет открыть объекты).
 * В таких случаях безопаснее принудительно разорвать соединение.
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
  // 4. ЗАЩИТА: ПРАВА АДМИНА МЕНЯЕТ ТОЛЬКО АДМИН
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
  // 5. ВАЛИДАЦИЯ ТЕЛА ЗАПРОСА (через zod)
  // ============================================
  const body = await readBody(event)
  const validated = validateUserOverrides(body)

  // Дополнительная валидация slug'ов через PageSlugSchema (enum из shared)
  for (const override of validated.overrides) {
    const parseResult = PageSlugSchema.safeParse(override.pageSlug)
    if (!parseResult.success) {
      throw createError({
        statusCode: 400,
        statusMessage: `Некорректный slug страницы: "${override.pageSlug}"`
      })
    }
  }

  // ============================================
  // 6. ПРОВЕРКА СУЩЕСТВОВАНИЯ СТРАНИЦ (через inArray)
  // ============================================
  const pageSlugs = validated.overrides.map(o => o.pageSlug)

  const existingPages = await db
    .select({ slug: permissionsPages.slug })
    .from(permissionsPages)
    .where(
      and(
        inArray(permissionsPages.slug, pageSlugs),
        eq(permissionsPages.isActive, true)
      )
    )

  const existingSlugs = new Set(existingPages.map(p => p.slug))
  const invalidSlugs = pageSlugs.filter(slug => !existingSlugs.has(slug))

  if (invalidSlugs.length > 0) {
    throw createError({
      statusCode: 400,
      statusMessage: `Страницы не существуют или неактивны: ${invalidSlugs.join(', ')}`
    })
  }

  // ============================================
  // 7. ПОЛУЧЕНИЕ ТЕКУЩИХ OVERRIDE'ОВ (для анализа критичности изменений)
  // ============================================
  const currentOverrides = await db
    .select({
      pageSlug: permissionsUserOverrides.pageSlug,
      canView: permissionsUserOverrides.canView
    })
    .from(permissionsUserOverrides)
    .where(
      and(
        eq(permissionsUserOverrides.userId, targetUserId),
        inArray(permissionsUserOverrides.pageSlug, pageSlugs),
        eq(permissionsUserOverrides.isActive, true)
      )
    )

  const currentMap = new Map(currentOverrides.map(o => [o.pageSlug, o.canView]))

  // ============================================
  // 8. ПРИМЕНЕНИЕ ПЕРЕОПРЕДЕЛЕНИЙ В ТРАНЗАКЦИИ
  // ============================================
  const result = await db.transaction(async (tx) => {
    // Получаем существующие переопределения для этих страниц (внутри транзакции для консистентности)
    const existingOverrides = await tx
      .select()
      .from(permissionsUserOverrides)
      .where(
        and(
          eq(permissionsUserOverrides.userId, targetUserId),
          inArray(permissionsUserOverrides.pageSlug, pageSlugs)
        )
      )

    const existingMap = new Map(existingOverrides.map(o => [o.pageSlug, o]))

    let created = 0
    let updated = 0

    for (const override of validated.overrides) {
      const existing = existingMap.get(override.pageSlug)

      if (existing) {
        // ============================================
        // UPDATE: сохраняем текущие значения для неуказанных полей
        // ============================================
        // Логика: если поле undefined — оставляем существующее значение,
        // если null — сбрасываем к правам роли, если boolean — устанавливаем
        await tx.update(permissionsUserOverrides)
          .set({
            canView: override.canView !== undefined ? override.canView : existing.canView,
            canCreate: override.canCreate !== undefined ? override.canCreate : existing.canCreate,
            canEdit: override.canEdit !== undefined ? override.canEdit : existing.canEdit,
            canDelete: override.canDelete !== undefined ? override.canDelete : existing.canDelete,
            canSpecial: override.canSpecial !== undefined ? override.canSpecial : existing.canSpecial,
            reason: override.reason !== undefined ? override.reason : existing.reason,
            expiresAt: override.expiresAt !== undefined ? (override.expiresAt || null) : existing.expiresAt,
            isActive: true,
            updatedAt: new Date()
          })
          .where(eq(permissionsUserOverrides.id, existing.id))

        updated++
      } else {
        // ============================================
        // INSERT: создаём новое переопределение
        // ============================================
        await tx.insert(permissionsUserOverrides).values({
          userId: targetUserId,
          pageSlug: override.pageSlug,
          canView: override.canView ?? null,
          canCreate: override.canCreate ?? null,
          canEdit: override.canEdit ?? null,
          canDelete: override.canDelete ?? null,
          canSpecial: override.canSpecial ?? null,
          reason: override.reason || null,
          expiresAt: override.expiresAt || null,
          createdBy: currentUser.id,
          isActive: true
        })

        created++
      }
    }

    return {
      created,
      updated,
      applied: validated.overrides.length
    }
  })

  // ============================================
  // 9. ИНВАЛИДАЦИЯ КЭША ПРАВ (гарантированно, даже если сокет недоступен)
  // ============================================
  invalidatePermissionsCache(targetUserId)

  // ============================================
  // 10. АНАЛИЗ КРИТИЧНОСТИ ИЗМЕНЕНИЙ
  // ============================================
  // Определяем, были ли отозваны canView у критических страниц через override.
  // Учитываем, что override может сбрасывать canView к false (или к null = использовать роль).
  //
  // Логика:
  // - currentCanView = существующий override (или базовое право роли, если override нет)
  // - newCanView = новый override (или текущий, если не менялся)
  // - Если было true, стало false/null → критично
  const criticalRevocations: string[] = []

  for (const pageSlug of CRITICAL_PAGES_FOR_DISCONNECT) {
    if (!pageSlugs.includes(pageSlug)) continue

    const newOverride = validated.overrides.find(o => o.pageSlug === pageSlug)
    if (!newOverride || newOverride.canView === undefined) continue

    const currentCanView = currentMap.get(pageSlug)

    // Если раньше было canView=true (или override отсутствовал и у роли было true),
    // а теперь override явно ставит false → критично
    // Примечание: мы не знаем точно базовое право роли здесь, поэтому
    // реагируем только на явный отзыв canView с true на false в override
    if (currentCanView === true && newOverride.canView === false) {
      criticalRevocations.push(pageSlug)
    }
  }

  const requiresDisconnect = criticalRevocations.length > 0

  // ============================================
  // 11. ЛОГИРОВАНИЕ
  // ============================================
  const pages = validated.overrides.map(o => o.pageSlug).join(', ')
  const targetRoleLabel = ROLE_LABELS[targetUser.role as Role] || targetUser.role

  console.log(
    `[Права] ✅ Администратор ${currentUser.name} (ID: ${currentUser.id}) ` +
    `применил переопределения для пользователя "${targetUser.name}" (${targetRoleLabel}, ID: ${targetUserId}). ` +
    `Создано: ${result.created}, обновлено: ${result.updated}. Страницы: [${pages}]. ` +
    `Критичных отзывов: ${criticalRevocations.length}` +
    (criticalRevocations.length > 0 ? ` [${criticalRevocations.join(', ')}]` : '')
  )

  // ============================================
  // 12. 🆕 УВЕДОМЛЕНИЕ ПОЛЬЗОВАТЕЛЯ ЧЕРЕЗ СОКЕТ
  // ============================================
  const io = getIO()
  let disconnected = false

  if (io) {
    if (requiresDisconnect) {
      // Критичные изменения — принудительное отключение
      await forceDisconnectUserWithReason(
        io,
        targetUserId,
        `Ваши права доступа были существенно изменены администратором ${currentUser.name}. Необходимо войти в систему заново.`
      )
      disconnected = true
    } else {
      // Обычные изменения — мягкое уведомление
      // notifyUserPermissionsChanged сам инвалидирует кэш и отправит событие 'permissions:changed'
      await notifyUserPermissionsChanged(io, targetUserId, {
        reason: `Администратор ${currentUser.name} обновил ваши права доступа`,
        changedPages: pageSlugs,
        requireRelogin: false
      })
    }
  }

  // ============================================
  // 13. ВОЗВРАТ РЕЗУЛЬТАТА
  // ============================================
  return {
    userId: targetUserId,
    userName: targetUser.name,
    roleLabel: targetRoleLabel,
    created: result.created,
    updated: result.updated,
    applied: result.applied,
    disconnected,
    changedPages: pageSlugs
  }
})

// ============================================
// ЛОКАЛЬНЫЙ ИМПОРТ createError (для совместимости)
// ============================================
import { createError } from 'h3'

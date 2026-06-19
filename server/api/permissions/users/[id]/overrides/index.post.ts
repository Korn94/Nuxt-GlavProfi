// server/api/permissions/users/[id]/overrides/index.post.ts
/**
 * 📍 Эндпоинт: POST /api/permissions/users/[id]/overrides
 *
 * Назначение:
 * Применить (создать/обновить) переопределения прав для конкретного пользователя
 * Используется во вкладке "Пользователи" страницы настроек прав
 *
 * ⚠️ Доступ: middleware уже проверил через PROTECTED_PATHS (settings.canEdit)
 * ⚠️ Переопределения для admin может делать только admin
 *
 * Логика:
 * 1. Валидация body через zod
 * 2. Проверка существования пользователя
 * 3. Проверка существования страниц
 * 4. Получение существующих переопределений
 * 5. Для каждой страницы — insert или update (сохраняя неуказанные поля)
 * 6. Всё в транзакции
 * 7. Инвалидация кэша прав пользователя
 *
 * Новая система прав:
 * - canView, canCreate, canEdit, canDelete, canSpecial
 * - Без legacy (canExport, canApprove)
 *
 * @param {string} id — ID пользователя из пути
 * @body { overrides: UserOverride[] }
 * @returns { userId, userName, applied, updated, created }
 *
 * Пример body:
 * {
 *   "overrides": [
 *     { "pageSlug": "comings", "canView": true, "reason": "Временный доступ" },
 *     { "pageSlug": "works", "canSpecial": true, "expiresAt": "2026-12-31T00:00:00.000Z" }
 *   ]
 * }
 */
import { defineEventHandler, readBody, getRouterParam, createError } from 'h3'
import { db } from '../../../../../db'
import {
  users,
  permissionsPages,
  permissionsUserOverrides
} from '../../../../../db/schema'
import { eq, and, sql } from 'drizzle-orm'
import {
  validateUserOverrides,
  type UserOverride
} from '../../../../../utils/permissions/validators'
import type { DbUser } from '../../../../../utils/permissions'
import { invalidatePermissionsCache } from '../../../../../middleware/auth'

export default defineEventHandler(async (event) => {
  // ✅ Авторизация и права уже проверены мидлваром
  const currentUser = event.context.user as DbUser
  if (!currentUser) {
    throw createError({ statusCode: 401, statusMessage: 'Не удалось получить данные текущего пользователя' })
  }

  // ============================================
  // 1. ПОЛУЧЕНИЕ ID ПОЛЬЗОВАТЕЛЯ
  // ============================================
  const idParam = getRouterParam(event, 'id')
  if (!idParam) {
    throw createError({ statusCode: 400, statusMessage: 'ID пользователя не указан в URL' })
  }
  const targetUserId = parseInt(idParam, 10)
  if (isNaN(targetUserId)) {
    throw createError({ statusCode: 400, statusMessage: 'Некорректный формат ID' })
  }

  // ============================================
  // 2. ПРОВЕРКА СУЩЕСТВОВАНИЯ ЦЕЛЕВОГО ПОЛЬЗОВАТЕЛЯ
  // ============================================
  const [targetUser] = await db
    .select()
    .from(users)
    .where(eq(users.id, targetUserId))
    .limit(1)

  if (!targetUser) {
    throw createError({ statusCode: 404, statusMessage: 'Пользователь не найден' })
  }

  // ============================================
  // 3. ЗАЩИТА ОТ ИЗМЕНЕНИЯ ПРАВ АДМИНА НЕ-АДМИНОМ
  // ============================================
  if (targetUser.role === 'admin' && currentUser.role !== 'admin') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Только администратор может изменять права администратора'
    })
  }

  // ============================================
  // 4. ВАЛИДАЦИЯ ТЕЛА ЗАПРОСА
  // ============================================
  const body = await readBody(event)
  const validated = validateUserOverrides(body)

  // ============================================
  // 5. ПРОВЕРКА СУЩЕСТВОВАНИЯ СТРАНИЦ
  // ============================================
  const pageSlugs = validated.overrides.map(o => o.pageSlug)
  const existingPages = await db
    .select({ slug: permissionsPages.slug })
    .from(permissionsPages)
    .where(
      and(
        sql`${permissionsPages.slug} IN (${pageSlugs.map(s => sql`${s}`).reduce((a, b) => sql`${a}, ${b}`)})`,
        eq(permissionsPages.isActive, true)
      )
    )

  const existingSlugs = new Set(existingPages.map(p => p.slug))
  const invalidSlugs = pageSlugs.filter(slug => !existingSlugs.has(slug))
  if (invalidSlugs.length > 0) {
    throw createError({
      statusCode: 400,
      statusMessage: `Страницы не существуют: ${invalidSlugs.join(', ')}`
    })
  }

  // ============================================
  // 6. ПРИМЕНЕНИЕ ПЕРЕОПРЕДЕЛЕНИЙ В ТРАНЗАКЦИИ
  // ============================================
  try {
    const result = await db.transaction(async (tx) => {
      // Получаем существующие переопределения для этих страниц
      const existingOverrides = await tx
        .select()
        .from(permissionsUserOverrides)
        .where(
          and(
            eq(permissionsUserOverrides.userId, targetUserId),
            sql`${permissionsUserOverrides.pageSlug} IN (${pageSlugs.map(s => sql`${s}`).reduce((a, b) => sql`${a}, ${b}`)})`
          )
        )

      // Map<pageSlug, существующий override>
      const existingMap = new Map(existingOverrides.map(o => [o.pageSlug, o]))

      let created = 0
      let updated = 0

      for (const override of validated.overrides) {
        const existing = existingMap.get(override.pageSlug)

        if (existing) {
          // ============================================
          // UPDATE: сохраняем текущие значения для неуказанных полей
          // ============================================
          await tx.update(permissionsUserOverrides)
            .set({
              canView: override.canView !== undefined ? override.canView : existing.canView,
              canCreate: override.canCreate !== undefined ? override.canCreate : existing.canCreate,
              canEdit: override.canEdit !== undefined ? override.canEdit : existing.canEdit,
              canDelete: override.canDelete !== undefined ? override.canDelete : existing.canDelete,
              canSpecial: override.canSpecial !== undefined ? override.canSpecial : existing.canSpecial,
              reason: override.reason !== undefined ? override.reason : existing.reason,
              expiresAt: override.expiresAt !== undefined ? (override.expiresAt || null) : existing.expiresAt,
              isActive: true
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

      return { created, updated, applied: validated.overrides.length }
    })

    // ============================================
    // 7. ИНВАЛИДАЦИЯ КЭША ПРАВ ПОЛЬЗОВАТЕЛЯ
    // ============================================
    invalidatePermissionsCache(targetUserId)

    // ============================================
    // 8. ЛОГИРОВАНИЕ НА РУССКОМ
    // ============================================
    const pages = validated.overrides.map(o => o.pageSlug).join(', ')
    console.log(
      `[Права] ✅ Пользователь ${currentUser.name} (ID: ${currentUser.id}) ` +
      `применил переопределения для пользователя "${targetUser.name}" (ID: ${targetUserId}): ` +
      `создано ${result.created}, обновлено ${result.updated}. Страницы: ${pages}. ` +
      `Кэш инвалидирован.`
    )

    return {
      userId: targetUserId,
      userName: targetUser.name,
      ...result
    }
  } catch (error: any) {
    console.error(
      `[Права] ❌ Ошибка применения переопределений для пользователя ID=${targetUserId}:`,
      error
    )
    // Пробрасываем HTTP-ошибки как есть
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      statusMessage: 'Ошибка сервера при применении переопределений'
    })
  }
})

// server/api/permissions/pages/[slug].put.ts
/**
 * 📍 Эндпоинт: PUT /api/permissions/pages/[slug]
 *
 * Назначение:
 * Обновить существующую страницу в справочнике системы прав
 *
 * ⚠️ Доступ: только для роли admin
 *
 * Новая система:
 * - hasCreate, hasEdit, hasDelete, hasSpecial
 * - Без legacy (hasExport, hasApprove)
 *
 * @param {string} slug — slug страницы из пути
 * @body { name?, description?, icon?, order?, hasCreate?, hasEdit?, hasDelete?, hasSpecial?, isActive? }
 * @returns { page: SystemPage }
 */
import { defineEventHandler, readBody, getRouterParam, createError } from 'h3'
import { db } from '../../../db'
import { permissionsPages } from '../../../db/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import type { DbUser } from '../../../utils/permissions'

const UpdatePageSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(500).nullable().optional(),
  icon: z.string().max(50).nullable().optional(),
  order: z.number().int().min(0).optional(),
  hasCreate: z.boolean().optional(),
  hasEdit: z.boolean().optional(),
  hasDelete: z.boolean().optional(),
  hasSpecial: z.boolean().optional(),
  isActive: z.boolean().optional(),
})

export default defineEventHandler(async (event) => {
  const currentUser = event.context.user as DbUser
  if (!currentUser) {
    throw createError({ statusCode: 401, message: 'Не удалось получить данные текущего пользователя' })
  }
  if (currentUser.role !== 'admin') {
    throw createError({ statusCode: 403, message: 'Редактирование страниц доступно только администратору' })
  }

  // ============================================
  // 1. ПОЛУЧЕНИЕ SLUG ИЗ URL
  // ============================================
  const slugParam = getRouterParam(event, 'slug')
  if (!slugParam) {
    throw createError({ statusCode: 400, message: 'Slug страницы не указан в URL' })
  }

  // ============================================
  // 2. ПРОВЕРКА СУЩЕСТВОВАНИЯ СТРАНИЦЫ
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
  // 3. ВАЛИДАЦИЯ ТЕЛА ЗАПРОСА
  // ============================================
  const body = await readBody(event)
  const result = UpdatePageSchema.safeParse(body)
  if (!result.success) {
    const errors = result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ')
    throw createError({ statusCode: 400, message: `Ошибка валидации: ${errors}` })
  }

  const validated = result.data

  // Проверяем что есть хотя бы одно поле для обновления
  if (Object.keys(validated).length === 0) {
    throw createError({ statusCode: 400, message: 'Нет данных для обновления' })
  }

  // ============================================
  // 4. ОБНОВЛЕНИЕ СТРАНИЦЫ
  // ============================================
  try {
    await db
      .update(permissionsPages)
      .set({ ...validated, updatedAt: new Date() })
      .where(eq(permissionsPages.slug, slugParam))

    console.log(
      `[Permissions] ✅ Администратор ${currentUser.name} (ID: ${currentUser.id}) ` +
      `обновил страницу "${validated.name || existingPage.name}" (${slugParam})`
    )

    // Возвращаем обновлённую страницу
    const [updated] = await db
      .select()
      .from(permissionsPages)
      .where(eq(permissionsPages.slug, slugParam))
      .limit(1)

    return { page: updated }
  } catch (error: any) {
    console.error(`[Permissions] ❌ Ошибка обновления страницы "${slugParam}":`, error)
    throw createError({ statusCode: 500, message: 'Ошибка сервера при обновлении страницы' })
  }
})

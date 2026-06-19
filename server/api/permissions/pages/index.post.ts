// server/api/permissions/pages/index.post.ts
/**
 * 📍 Эндпоинт: POST /api/permissions/pages
 *
 * Назначение:
 * Создать новую страницу в справочнике системы прав
 *
 * ⚠️ Доступ: только для роли admin
 *
 * Новая система:
 * - hasCreate, hasEdit, hasDelete, hasSpecial
 * - Без legacy (hasExport, hasApprove)
 *
 * @body { slug, name, description?, icon?, order?, hasCreate?, hasEdit?, hasDelete?, hasSpecial? }
 * @returns { page: SystemPage }
 */
import { defineEventHandler, readBody, createError } from 'h3'
import { db } from '../../../db'
import { permissionsPages } from '../../../db/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import type { DbUser } from '../../../utils/permissions'

// ============================================
// ZOD СХЕМА (новая система: без hasExport/hasApprove)
// ============================================
const CreatePageSchema = z.object({
  slug: z.string()
    .min(1)
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Slug должен содержать только латинские буквы, цифры и дефисы'),
  name: z.string().min(1).max(255),
  description: z.string().max(500).optional(),
  icon: z.string().max(50).optional(),
  order: z.number().int().min(0).default(0),
  hasCreate: z.boolean().default(false),
  hasEdit: z.boolean().default(false),
  hasDelete: z.boolean().default(false),
  hasSpecial: z.boolean().default(false),
})

export default defineEventHandler(async (event) => {
  // ============================================
  // 1. ПРОВЕРКА ПРАВ (ТОЛЬКО АДМИН)
  // ============================================
  const currentUser = event.context.user as DbUser
  if (!currentUser) {
    throw createError({ statusCode: 401, message: 'Не удалось получить данные текущего пользователя' })
  }
  if (currentUser.role !== 'admin') {
    throw createError({ statusCode: 403, message: 'Создание страниц доступно только администратору' })
  }

  // ============================================
  // 2. ВАЛИДАЦИЯ ТЕЛА ЗАПРОСА
  // ============================================
  const body = await readBody(event)
  const result = CreatePageSchema.safeParse(body)
  if (!result.success) {
    const errors = result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ')
    throw createError({ statusCode: 400, message: `Ошибка валидации: ${errors}` })
  }
  const validated = result.data

  // ============================================
  // 3. ПРОВЕРКА УНИКАЛЬНОСТИ SLUG
  // ============================================
  const [existing] = await db
    .select()
    .from(permissionsPages)
    .where(eq(permissionsPages.slug, validated.slug))
    .limit(1)

  if (existing) {
    throw createError({ statusCode: 400, message: `Страница с slug "${validated.slug}" уже существует` })
  }

  // ============================================
  // 4. СОЗДАНИЕ СТРАНИЦЫ
  // ============================================
  try {
    await db.insert(permissionsPages).values({
      slug: validated.slug,
      name: validated.name,
      description: validated.description || null,
      icon: validated.icon || null,
      parentId: null,
      order: validated.order,
      hasCreate: validated.hasCreate,
      hasEdit: validated.hasEdit,
      hasDelete: validated.hasDelete,
      hasSpecial: validated.hasSpecial,
      isActive: true,
    })

    console.log(
      `[Permissions] ✅ Администратор ${currentUser.name} (ID: ${currentUser.id}) ` +
      `создал страницу "${validated.name}" (${validated.slug})`
    )

    // Возвращаем созданную страницу
    const [created] = await db
      .select()
      .from(permissionsPages)
      .where(eq(permissionsPages.slug, validated.slug))
      .limit(1)

    if (!created) {
      throw createError({ statusCode: 500, message: 'Страница создана, но не удалось её получить' })
    }

    return { page: created }
  } catch (error: any) {
    console.error('[Permissions] ❌ Ошибка создания страницы:', error)
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, message: 'Ошибка сервера при создании страницы' })
  }
})

// server/api/permissions/pages/index.post.ts
/**
 * 📍 Эндпоинт: POST /api/permissions/pages
 *
 * Назначение:
 * - Создать новую страницу в справочнике системы прав
 * - Используется в UI настроек прав (вкладка "Страницы") администраторами
 *
 * ⚠️ Доступ: только для роли admin (двойная проверка — middleware + handler)
 * - Middleware проверяет settings.canEdit
 * - Handler дополнительно проверяет admin для критических операций создания
 *
 * Особенности:
 * - Slug валидируется regex (латиница + цифры + дефис), НЕ через enum,
 *   т.к. новые страницы могут иметь slug, которого нет в PageSlugSchema
 * - После создания уведомляются все админы через сокет
 * - Страница создаётся как isActive=true по умолчанию
 *
 * @body { slug, name, description?, icon?, order?, hasCreate?, hasEdit?, hasDelete?, hasSpecial? }
 * @returns { page: SystemPage }
 */

import { defineEventHandler, readBody, createError } from 'h3'
import { eq } from 'drizzle-orm'

import { db } from '../../../db'
import { permissionsPages } from '../../../db/schema'

import {
  validateCreatePage,
  type CreatePageInput
} from '../../../utils/permissions/validators'

import type { DbUser } from '../../../utils/permissions'

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
  // Middleware проверил settings.canEdit, но создание страниц — критическая операция,
  // требующая явного admin (даже если менеджеру дали settings.canEdit)
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
      statusMessage: 'Создание страниц доступно только администратору'
    })
  }

  // ============================================
  // 2. ВАЛИДАЦИЯ ТЕЛА ЗАПРОСА (через zod из validators.ts)
  // ============================================
  const body = await readBody(event)
  const validated: CreatePageInput = validateCreatePage(body)

  // ============================================
  // 3. ПРОВЕРКА УНИКАЛЬНОСТИ SLUG
  // ============================================
  const [existing] = await db
    .select({ slug: permissionsPages.slug })
    .from(permissionsPages)
    .where(eq(permissionsPages.slug, validated.slug))
    .limit(1)

  if (existing) {
    throw createError({
      statusCode: 409,
      statusMessage: `Страница с slug "${validated.slug}" уже существует`
    })
  }

  // ============================================
  // 4. СОЗДАНИЕ СТРАНИЦЫ
  // ============================================
  // INSERT без $returningId() — MySQL не поддерживает RETURNING,
  // поэтому получаем созданную запись через SELECT после INSERT
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

  // ============================================
  // 5. ПОЛУЧЕНИЕ СОЗДАННОЙ СТРАНИЦЫ ДЛЯ ОТВЕТА
  // ============================================
  const [created] = await db
    .select()
    .from(permissionsPages)
    .where(eq(permissionsPages.slug, validated.slug))
    .limit(1)

  if (!created) {
    // Теоретически недостижимо: только что сделали INSERT,
    // но для типобезопасности проверяем
    throw createError({
      statusCode: 500,
      statusMessage: 'Страница создана, но не удалось её получить'
    })
  }

  // ============================================
  // 6. ЛОГИРОВАНИЕ И УВЕДОМЛЕНИЕ АДМИНОВ ЧЕРЕЗ СОКЕТ
  // ============================================
  console.log(
    `[Permissions] ✅ Администратор ${currentUser.name} (ID: ${currentUser.id}) ` +
    `создал страницу "${validated.name}" (${validated.slug})`
  )

  // Уведомляем всех админов через сокет, чтобы они могли обновить UI настроек
  const io = getIO()
  if (io) {
    io.to(getRoleRoomName('admin')).emit('permissions:page:created', {
      page: {
        slug: created.slug,
        name: created.name,
        icon: created.icon
      },
      createdBy: {
        id: currentUser.id,
        name: currentUser.name
      },
      timestamp: new Date().toISOString()
    })
  }

  // ============================================
  // 7. ВОЗВРАТ СОЗДАННОЙ СТРАНИЦЫ
  // ============================================
  return { page: created }
})

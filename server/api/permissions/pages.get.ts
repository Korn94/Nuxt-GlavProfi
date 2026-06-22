// server/api/permissions/pages.get.ts
/**
 * 📍 Эндпоинт: GET /api/permissions/pages
 *
 * Назначение:
 * - Получить список всех активных страниц системы с их метаданными
 * - Используется в UI настроек прав для построения таблицы прав и меню
 *
 * ⚠️ Доступ: middleware уже проверил через PROTECTED_PATHS (settings.canView)
 *
 * @returns { pages: SystemPage[] } — массив страниц с флагами поддерживаемых действий
 */

import { defineEventHandler } from 'h3'
import { eq } from 'drizzle-orm'

import { db } from '../../db'
import { permissionsPages } from '../../db/schema'

export default defineEventHandler(async () => {
  // ============================================
  // ПОЛУЧЕНИЕ АКТИВНЫХ СТРАНИЦ
  // ============================================
  // Middleware уже проверил settings.canView — здесь только чтение
  const pages = await db
    .select({
      id: permissionsPages.id,
      slug: permissionsPages.slug,
      name: permissionsPages.name,
      description: permissionsPages.description,
      icon: permissionsPages.icon,
      order: permissionsPages.order,
      hasCreate: permissionsPages.hasCreate,
      hasEdit: permissionsPages.hasEdit,
      hasDelete: permissionsPages.hasDelete,
      hasSpecial: permissionsPages.hasSpecial,
      parentId: permissionsPages.parentId,
      isActive: permissionsPages.isActive
    })
    .from(permissionsPages)
    .where(eq(permissionsPages.isActive, true))
    .orderBy(permissionsPages.order)

  return { pages }
})

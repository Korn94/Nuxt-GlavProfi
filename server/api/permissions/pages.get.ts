// server/api/permissions/pages.get.ts
/**
 * 📍 Эндпоинт: GET /api/permissions/pages
 *
 * Назначение:
 * Получить список всех активных страниц системы с их метаданными
 * Используется в UI настроек прав для отображения списка разделов
 *
 * ⚠️ Доступ: middleware уже проверил через PROTECTED_PATHS (settings.canView)
 *
 * Новая система:
 * - hasCreate, hasEdit, hasDelete, hasSpecial
 * - Без legacy (hasExport, hasApprove)
 *
 * @returns { pages: Page[] } — массив страниц с флагами поддерживаемых действий
 *
 * Пример ответа:
 * {
 *   "pages": [
 *     {
 *       "slug": "dashboard",
 *       "name": "Дашборд",
 *       "description": "Главная страница с обзором",
 *       "icon": "mdi:view-dashboard",
 *       "order": 1,
 *       "hasCreate": false,
 *       "hasEdit": false,
 *       "hasDelete": false,
 *       "hasSpecial": false,
 *       "parentId": null
 *     },
 *     {
 *       "slug": "works",
 *       "name": "Работы",
 *       "description": "Учёт выполненных работ",
 *       "icon": "mdi:hammer-wrench",
 *       "order": 6,
 *       "hasCreate": true,
 *       "hasEdit": true,
 *       "hasDelete": true,
 *       "hasSpecial": true,
 *       "parentId": null
 *     }
 *   ]
 * }
 */
import { defineEventHandler, createError } from 'h3'
import { db } from '../../db'
import { permissionsPages } from '../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  // ✅ Авторизация и права уже проверены мидлваром
  try {
    // Получаем все активные страницы, отсортированные по порядку
    const pages = await db
      .select({
        slug: permissionsPages.slug,
        name: permissionsPages.name,
        description: permissionsPages.description,
        icon: permissionsPages.icon,
        order: permissionsPages.order,
        hasCreate: permissionsPages.hasCreate,
        hasEdit: permissionsPages.hasEdit,
        hasDelete: permissionsPages.hasDelete,
        hasSpecial: permissionsPages.hasSpecial,
        parentId: permissionsPages.parentId
      })
      .from(permissionsPages)
      .where(eq(permissionsPages.isActive, true))
      .orderBy(permissionsPages.order)

    return { pages }
  } catch (error) {
    console.error('[API/Permissions/Pages] Ошибка получения страниц:', error)
    throw createError({
      statusCode: 500,
      message: 'Ошибка сервера при получении списка страниц'
    })
  }
})

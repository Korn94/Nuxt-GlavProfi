/**
 * 📍 Файл: `server/api/portfolio/[slug]/images/[id].delete.ts`
 * 📍 Эндпоинт: `DELETE /api/portfolio/[slug]/images/[id]`
 *
 * Назначение: Удаление изображения кейса (из БД и с диска)
 * ⚠️ Требует роль `admin` или `manager`
 *
 * Логика (порядок критически важен!):
 * 1. СНАЧАЛА удаляем запись из БД (если упадёт — файл останется, это безопасно)
 * 2. ПОТОМ удаляем файл с диска (если упадёт — останется файл-сирота, но не битая ссылка)
 *
 * @param {string} slug — slug кейса (из пути)
 * @param {string} id — ID изображения (из пути)
 * @returns { message: string }
 */

import { eventHandler, createError } from 'h3'
import { db } from '../../../../db'
import { portfolioImages, portfolioCases } from '../../../../db/schema'
import { eq, and } from 'drizzle-orm'
import { verifyAuth } from '../../../../utils/auth'
import { unlink } from 'node:fs/promises'
import { join } from 'node:path'

export default eventHandler(async (event) => {
  // 🔐 Проверка прав
  const user = await verifyAuth(event)
  if (!['admin', 'manager'].includes(user.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const params = event.context.params
  if (!params?.slug || !params?.id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing slug or image ID' })
  }

  const imageId = parseInt(params.id)
  if (isNaN(imageId)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid image ID' })
  }

  // Получаем кейс по slug (для проверки принадлежности)
  const [caseData] = await db
    .select({ id: portfolioCases.id })
    .from(portfolioCases)
    .where(eq(portfolioCases.slug, params.slug))

  if (!caseData) {
    throw createError({ statusCode: 404, statusMessage: 'Case not found' })
  }

  // Находим изображение с проверкой принадлежности к кейсу
  const [image] = await db
    .select()
    .from(portfolioImages)
    .where(and(
      eq(portfolioImages.id, imageId),
      eq(portfolioImages.caseId, caseData.id)
    ))

  if (!image) {
    throw createError({ statusCode: 404, statusMessage: 'Image not found in this case' })
  }

  // ✅ 1. СНАЧАЛА удаляем запись из БД
  //    Если упадёт — файл останется на диске (это безопасно, просто сирота)
  await db
    .delete(portfolioImages)
    .where(eq(portfolioImages.id, imageId))

  // ✅ 2. ПОТОМ удаляем файл с диска (асинхронно)
  try {
    const physicalPath = join(process.cwd(), image.url)
    await unlink(physicalPath)
    console.log(`[Portfolio] 🗑️ Файл удалён: ${image.url}`)
  } catch (err: any) {
    // Файл не найден или не удалось удалить — логируем, но не прерываем
    // Запись в БД уже удалена, так что операция считается успешной
    if (err.code === 'ENOENT') {
      console.warn(`[Portfolio] ⚠️ Файл не найден (уже удалён?): ${image.url}`)
    } else {
      console.error(`[Portfolio] ❌ Ошибка удаления файла: ${image.url}`, err)
    }
  }

  return { message: 'Image deleted successfully' }
})

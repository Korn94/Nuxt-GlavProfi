/**
 * 📍 Файл: `server/api/portfolio/[slug]/size.get.ts`
 * 📍 Эндпоинт: `GET /api/portfolio/[slug]/size`
 *
 * Назначение: Подсчёт суммарного размера всех файлов кейса
 * ⚠️ Требует роль `admin` или `manager`
 *
 * Логика:
 * - Получаем все изображения кейса
 * - Параллельно (Promise.all) асинхронно получаем размеры файлов
 * - fs.promises.stat не блокирует event loop
 *
 * @param {string} slug — slug кейса (из пути)
 * @returns { totalSize: number, fileCount: number, caseId: number }
 */

import { eventHandler, createError } from 'h3'
import { db } from '../../../db'
import { portfolioImages, portfolioCases } from '../../../db/schema'
import { eq } from 'drizzle-orm'
import { requireAuth } from '../../../utils/permissions'
import { stat } from 'node:fs/promises'
import { posix } from 'node:path'

const UPLOAD_DIR_BASE = '/var/www/glavprofi_ru_usr40/data/www/uploads'

// ✅ Асинхронный хелпер: возвращает размер файла или 0 если не найден
const getFileSize = async (physicalPath: string): Promise<number> => {
  try {
    const stats = await stat(physicalPath)
    return stats.size
  } catch (err: any) {
    // ENOENT = файл не найден (не критичная ошибка)
    if (err.code === 'ENOENT') {
      return 0
    }
    console.warn(`[Portfolio/Size] ⚠️ Ошибка доступа к файлу: ${physicalPath}`, err)
    return 0
  }
}

export default eventHandler(async (event) => {
  // ───────── AUTH ─────────
  const user = await requireAuth(event)
  if (!['admin', 'manager'].includes(user.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const slug = event.context.params?.slug
  if (!slug) {
    throw createError({ statusCode: 400, statusMessage: 'Missing slug' })
  }

  // ───────── ПОЛУЧАЕМ ID КЕЙСА ─────────
  const [caseData] = await db
    .select({ id: portfolioCases.id })
    .from(portfolioCases)
    .where(eq(portfolioCases.slug, slug))

  if (!caseData) {
    throw createError({ statusCode: 404, statusMessage: 'Case not found' })
  }

  // ───────── ПОЛУЧАЕМ ВСЕ ИЗОБРАЖЕНИЯ ─────────
  const images = await db
    .select({ url: portfolioImages.url })
    .from(portfolioImages)
    .where(eq(portfolioImages.caseId, caseData.id))

  if (!images.length) {
    return { totalSize: 0, fileCount: 0, caseId: caseData.id }
  }

  // ───────── ✅ ПАРАЛЛЕЛЬНЫЙ подсчёт размеров (не блокирует event loop) ─────────
  const sizes = await Promise.all(
    images.map(async (img) => {
      const relativePath = img.url.replace('/uploads/', '')
      const physicalPath = posix.join(UPLOAD_DIR_BASE, relativePath)
      return await getFileSize(physicalPath)
    })
  )

  // ───────── ФОРМИРУЕМ РЕЗУЛЬТАТ ─────────
  let totalSize = 0
  let fileCount = 0

  for (const size of sizes) {
    if (size > 0) {
      totalSize += size
      fileCount++
    }
  }

  return {
    totalSize,
    fileCount,
    caseId: caseData.id
  }
})

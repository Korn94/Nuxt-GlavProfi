// server/api/portfolio/[slug]/size.get.ts
import { eventHandler, createError } from 'h3'
import { db } from '../../../db'
import { portfolioImages, portfolioCases } from '../../../db/schema'
import { eq } from 'drizzle-orm'
import { verifyAuth } from '../../../utils/auth'
import { existsSync, statSync } from 'fs'
import { posix } from 'path'  // 🔥 Импортируем posix вместо всего path

const UPLOAD_DIR_BASE = '/var/www/glavprofi_ru_usr40/data/www/uploads'

export default eventHandler(async (event) => {
  // ───────── AUTH ─────────
  const user = await verifyAuth(event)
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

  // ───────── СЧИТАЕМ РАЗМЕР ФАЙЛОВ ─────────
  let totalSize = 0
  let fileCount = 0

  for (const img of images) {
    try {
      // 🔥 Используем posix.join для корректных путей на любой ОС
      const relativePath = img.url.replace('/uploads/', '')
      const physicalPath = posix.join(UPLOAD_DIR_BASE, relativePath)
      
      if (existsSync(physicalPath)) {
        const stats = statSync(physicalPath)
        totalSize += stats.size
        fileCount++
      }
    } catch (err) {
      console.warn(`Ошибка при получении размера: ${img.url}`, err)
    }
  }

  return {
    totalSize,
    fileCount,
    caseId: caseData.id
  }
})

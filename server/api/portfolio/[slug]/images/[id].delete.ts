// server/api/portfolio/[slug]/images/[id].delete.ts

import { eventHandler, createError } from 'h3'
import { db } from '../../../../db'
import { portfolioImages } from '../../../../db/schema'
import { eq } from 'drizzle-orm'
import { verifyAuth } from '../../../../utils/auth'
import { unlink } from 'node:fs/promises'
import { join } from 'node:path'

export default eventHandler(async (event) => {
  const user = await verifyAuth(event)
  if (!['admin', 'manager'].includes(user.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const params = event.context.params
  if (!params || !params.id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing image ID' })
  }

  const imageId = parseInt(params.id)
  if (isNaN(imageId)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid image ID' })
  }

  // Находим изображение
  const [image] = await db
    .select()
    .from(portfolioImages)
    .where(eq(portfolioImages.id, imageId))

  if (!image) {
    throw createError({ statusCode: 404, statusMessage: 'Image not found' })
  }

  // Удаляем файл с диска
  try {
    const physicalPath = join(process.cwd(), image.url)
    await unlink(physicalPath)
  } catch (err) {
    console.warn(`Файл не найден или не может быть удален: ${image.url}`)
    // Не останавливаем операцию, если файл уже удален
  }

  // Удаляем запись из базы данных
  await db
    .delete(portfolioImages)
    .where(eq(portfolioImages.id, imageId))

  return { message: 'Image deleted successfully' }
})

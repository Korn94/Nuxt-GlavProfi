/**
 * 📍 Файл: `server/api/portfolio/[slug]/images/index.post.ts`
 * 📍 Эндпоинт: `POST /api/portfolio/[slug]/images`
 *
 * Назначение: Загрузка нового изображения в кейс
 * ⚠️ Требует роль `admin` или `manager`
 *
 * Логика:
 * - Проверяем slug кейса и получаем caseId из БД
 * - Создаём папку кейса если её нет
 * - Сохраняем файл на диск
 * - Вставляем запись в БД
 * - При ошибке INSERT — удаляем файл-сироту (cleanup)
 *
 * @param {string} slug — slug кейса (из пути)
 * @body { image: File } — файл изображения
 * @returns { PortfolioImage } — созданная запись
 */

import { eventHandler, createError, readMultipartFormData } from 'h3'
import { writeFile, unlink } from 'node:fs/promises'
import { join } from 'node:path'
import { randomUUID } from 'crypto'
import { db } from '../../../../db'
import { portfolioImages, portfolioCases } from '../../../../db/schema'
import { eq } from 'drizzle-orm'
import { requireAuth } from '../../../../utils/permissions'
import * as fs from 'node:fs'

const UPLOAD_DIR_BASE = '/var/www/glavprofi_ru_usr40/data/www/uploads'

export default eventHandler(async (event) => {
  // 🔐 Проверка прав
  const user = await requireAuth(event)
  if (!['admin', 'manager'].includes(user.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const params = event.context.params
  if (!params || !params.slug) {
    throw createError({ statusCode: 400, statusMessage: 'Missing case slug' })
  }

  const slug = params.slug

  // ✅ Получаем кейс по slug (вместо ошибочного params.id)
  const [caseData] = await db
    .select({ id: portfolioCases.id })
    .from(portfolioCases)
    .where(eq(portfolioCases.slug, slug))

  if (!caseData) {
    throw createError({ statusCode: 404, statusMessage: 'Case not found' })
  }

  const caseId = caseData.id

  // Чтение multipart/form-data
  const formData = await readMultipartFormData(event)
  const file = formData?.find(file => file.name === 'image')
  if (!file) {
    throw createError({ statusCode: 400, statusMessage: 'No file uploaded' })
  }

  // Создаём папку кейса если её нет
  const caseDir = join(UPLOAD_DIR_BASE, `case-${caseId}`)
  try {
    await fs.promises.mkdir(caseDir, { recursive: true })
  } catch (err: any) {
    console.error('[Portfolio/Images] ❌ Ошибка создания папки кейса:', err)
    throw createError({ statusCode: 500, statusMessage: 'Ошибка создания папки кейса' })
  }

  // Генерируем уникальное имя файла
  const ext = file.filename?.split('.').pop() || 'jpg'
  const filename = `${Date.now()}-${randomUUID()}.${ext}`
  const filePath = `/uploads/case-${caseId}/${filename}`
  const physicalPath = join(UPLOAD_DIR_BASE, `case-${caseId}/${filename}`)

  // Сохраняем файл
  await writeFile(physicalPath, file.data)
  console.log(`[Portfolio/Images] 💾 Файл сохранён: ${filePath}`)

  // ✅ Вставляем в БД с защитой от сирот
  try {
    const [newImage] = await db.insert(portfolioImages).values({
      caseId,
      url: filePath,
      type: 'gallery',
      pairGroup: null,
      alt: file.filename,
      order: 0
    }).$returningId()

    if (!newImage) {
      throw new Error('Не удалось создать запись изображения')
    }

    return newImage
  } catch (err: any) {
    // ❌ Если INSERT упал — удаляем файл-сироту (cleanup)
    console.error(`[Portfolio/Images] ❌ Ошибка INSERT, удаляем файл-сироту: ${filePath}`, err)
    try {
      await unlink(physicalPath)
      console.log(`[Portfolio/Images] 🗑️ Файл-сирота удалён: ${filePath}`)
    } catch (unlinkErr) {
      console.error(`[Portfolio/Images] ⚠️ Не удалось удалить файл-сироту: ${filePath}`, unlinkErr)
    }
    throw createError({ statusCode: 500, statusMessage: 'Ошибка сохранения изображения в БД' })
  }
})

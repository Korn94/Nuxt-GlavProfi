// server/api/portfolio/[slug]/images/index.post.ts
import { eventHandler, createError, readMultipartFormData } from 'h3'
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { randomUUID } from 'crypto'
import { db } from '../../../../db'
import { portfolioImages } from '../../../../db/schema'
import * as fs from 'node:fs'

export default eventHandler(async (event) => {
  // Получаем ID кейса
  const params = event.context.params
  if (!params || !params.id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing case ID' })
  }

  const caseId = parseInt(params.id)
  if (isNaN(caseId)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid case ID' })
  }

  // Чтение multipart/form-data
  const formData = await readMultipartFormData(event)
  const file = formData?.find(file => file.name === 'image')

  if (!file) {
    throw createError({ statusCode: 400, statusMessage: 'No file uploaded' })
  }

  // Базовая папка загрузки
  const UPLOAD_DIR_BASE = join(process.cwd(), 'public', 'uploads')
  const caseDir = join(UPLOAD_DIR_BASE, `case-${caseId}`)
  try {
    await fs.promises.mkdir(caseDir, { recursive: true }) // <-- Создаём подпапку
  } catch (err) {
    console.error('Ошибка при создании папки кейса:', err)
    throw createError({ statusCode: 500, statusMessage: 'Ошибка создания папки кейса' })
  }

  // Генерируем уникальное имя файла
  const ext = file.filename?.split('.').pop() || 'jpg'
  const filename = `${Date.now()}-${randomUUID()}.${ext}`
  const filePath = `/uploads/case-${caseId}/${filename}`
  const physicalPath = join(process.cwd(), filePath)

  // Сохраняем файл
  await writeFile(physicalPath, file.data)

  // Вставляем в БД
  const [newImage] = await db.insert(portfolioImages).values({
    caseId,
    url: filePath,
    type: 'gallery',
    pairGroup: null,
    alt: file.filename,
    order: 0
  }).$returningId()

  return newImage
})

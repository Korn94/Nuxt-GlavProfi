/**
 * 📍 Файл: `server/api/portfolio/[slug]/index.put.ts`
 * 📍 Эндпоинт: `PUT /api/portfolio/[slug]`
 *
 * Назначение: Полное обновление кейса + миграция/замена изображений
 * ⚠️ Требует роль `admin` или `manager`
 *
 * Логика:
 * - Быстрый toggle isPublished через JSON
 * - Полное обновление через multipart/form-data
 * - Асинхронные FS-операции (fs.promises) — не блокируют event loop
 * - Все DB-операции в одной транзакции
 * - Cleanup новых файлов при ошибке
 *
 * @param {string} slug — slug кейса
 * @body multipart/form-data или JSON (только isPublished)
 * @returns { success: boolean, slug: string, message: string }
 */

import { eventHandler, createError, readMultipartFormData, readBody } from 'h3'
import { db } from '../../../db'
import { portfolioCases, portfolioImages, portfoCaseWorks } from '../../../db/schema'
import { eq, and, inArray } from 'drizzle-orm'
import { requireAuth } from '../../../utils/permissions'
import { transliterate } from '../../../utils/transliteration'
import { randomUUID } from 'crypto'
import { join, basename } from 'path'
import { validateImage } from '../../../utils/imageValidation'
import sharp from 'sharp'
import { mkdir, writeFile, unlink, access, readFile } from 'node:fs/promises'

const UPLOAD_DIR_BASE = '/var/www/glavprofi_ru_usr40/data/www/uploads'

// 🔥 Настройки оптимизации (должны совпадать с index.post.ts)
const IMAGE_CONFIG = {
  maxWidth: 1920,
  thumbWidth: 400,
  webpQuality: 85,
  maxFileSize: 20 * 1024 * 1024
}

// ✅ Асинхронный хелпер для проверки существования файла
const fileExists = async (path: string): Promise<boolean> => {
  try {
    await access(path)
    return true
  } catch {
    return false
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

  // ───────── ПРОВЕРКА ТИПА КОНТЕНТА ─────────
  const contentType = event.node.req.headers['content-type'] || ''

  // 🔥 БЫСТРОЕ ОБНОВЛЕНИЕ: только isPublished через JSON
  if (contentType.includes('application/json')) {
    const body = await readBody(event)
    if (body.isPublished !== undefined && Object.keys(body).length === 1) {
      const [existingCase] = await db
        .select()
        .from(portfolioCases)
        .where(eq(portfolioCases.slug, slug))

      if (!existingCase) {
        throw createError({ statusCode: 404, statusMessage: 'Case not found' })
      }

      const newStatus = body.isPublished === true || body.isPublished === 'true' || body.isPublished === '1'
      await db.update(portfolioCases)
        .set({
          isPublished: newStatus,
          updatedAt: new Date()
        })
        .where(eq(portfolioCases.slug, slug))

      return { success: true, isPublished: newStatus, message: 'Status updated' }
    }
    throw createError({
      statusCode: 400,
      statusMessage: 'Full update requires multipart/form-data. Use JSON only for isPublished toggle.'
    })
  }

  // ───────── ПОЛНОЕ ОБНОВЛЕНИЕ: multipart/form-data ─────────
  const formData = await readMultipartFormData(event)
  if (!formData) {
    throw createError({ statusCode: 400, statusMessage: 'No form data' })
  }

  const fields: Record<string, string> = {}
  const files: Record<string, any> = {}
  const keepImageIds: number[] = []

  for (const part of formData) {
    if (part.filename && part.name) {
      files[part.name] = part
      continue
    }
    if (part.name) {
      const value = part.data?.toString() || ''
      if (part.name === 'keepImageId[]') {
        const id = parseInt(value, 10)
        if (!isNaN(id)) keepImageIds.push(id)
      } else {
        fields[part.name] = value
      }
    }
  }

  // ───────── ВАЛИДАЦИЯ НОВЫХ ИЗОБРАЖЕНИЙ ─────────
  for (const [key, file] of Object.entries(files)) {
    const validation = validateImage(file)
    if (!validation.valid) {
      throw createError({ statusCode: 400, statusMessage: validation.error! })
    }
    if (file.data.length > IMAGE_CONFIG.maxFileSize) {
      throw createError({
        statusCode: 400,
        statusMessage: `Файл слишком большой. Максимум ${IMAGE_CONFIG.maxFileSize / 1024 / 1024} МБ`
      })
    }
  }

  // ───────── CASE ─────────
  const [existingCase] = await db
    .select()
    .from(portfolioCases)
    .where(eq(portfolioCases.slug, slug))

  if (!existingCase) {
    throw createError({ statusCode: 404, statusMessage: 'Case not found' })
  }

  const existingImages = await db
    .select()
    .from(portfolioImages)
    .where(eq(portfolioImages.caseId, existingCase.id))

  // ───────── IDS TO KEEP ─────────
  const idsToKeep: number[] = [...keepImageIds]
  if (fields.mainImageId) {
    const id = parseInt(fields.mainImageId, 10)
    if (!isNaN(id)) idsToKeep.push(id)
  }
  if (fields.thumbnailId) {
    const id = parseInt(fields.thumbnailId, 10)
    if (!isNaN(id)) idsToKeep.push(id)
  }

  // ✅ Массив для cleanup новых файлов при ошибке
  const newSavedFiles: string[] = []

  // ✅ Функция cleanup
  const cleanupNewFiles = async () => {
    if (newSavedFiles.length === 0) return
    console.log(`[Portfolio/Update] 🧹 Cleanup: удаляем ${newSavedFiles.length} новый(х) файл(ов)...`)
    await Promise.allSettled(
      newSavedFiles.map(async (filePath) => {
        try {
          await unlink(filePath)
        } catch (err: any) {
          if (err.code !== 'ENOENT') {
            console.warn(`[Portfolio/Update] ⚠️ Не удалось удалить: ${filePath}`)
          }
        }
      })
    )
  }

  // ───────── ФУНКЦИЯ ОПТИМИЗАЦИИ (асинхронная!) ─────────
  const optimizeImage = async (
    fileOrPath: any,
    type: string,
    isMain: boolean = false,
    caseId: number
  ) => {
    try {
      let buffer: Buffer
      let originalExt: string

      // 🔥 Если передали файл из формы
      if (fileOrPath.data) {
        buffer = Buffer.from(fileOrPath.data)
        originalExt = fileOrPath.filename?.split('.').pop()?.toLowerCase() || 'jpg'
      }
      // 🔥 Если передали путь к существующему файлу (для миграции)
      else if (typeof fileOrPath === 'string') {
        const physicalPath = join(UPLOAD_DIR_BASE, fileOrPath.replace('/uploads/', ''))
        if (!(await fileExists(physicalPath))) {
          throw new Error(`Файл не найден: ${physicalPath}`)
        }
        buffer = await readFile(physicalPath)
        originalExt = basename(fileOrPath).split('.').pop()?.toLowerCase() || 'jpg'
      } else {
        throw new Error('Неверный формат данных для оптимизации')
      }

      const validation = validateImage({ data: buffer, filename: `temp.${originalExt}` })
      if (!validation.valid) {
        throw createError({ statusCode: 400, statusMessage: validation.error! })
      }

      const uuid = randomUUID()
      let sharpInstance = sharp(buffer)
      const metadata = await sharpInstance.metadata()
      const width = metadata.width || 0
      const height = metadata.height || 0

      if (width > IMAGE_CONFIG.maxWidth || height > IMAGE_CONFIG.maxWidth) {
        sharpInstance = sharpInstance.resize({
          width: IMAGE_CONFIG.maxWidth,
          height: IMAGE_CONFIG.maxWidth,
          fit: 'inside',
          withoutEnlargement: true
        })
      }

      const optimizedBuffer = await sharpInstance
        .rotate()
        .webp({ quality: IMAGE_CONFIG.webpQuality })
        .toBuffer()

      const filename = `${uuid}.webp`
      const caseDir = join(UPLOAD_DIR_BASE, `case-${caseId}`)
      
      // ✅ Асинхронное создание папки
      await mkdir(caseDir, { recursive: true })
      
      const filePath = join(caseDir, filename)
      
      // ✅ Асинхронная запись + запоминание для cleanup
      await writeFile(filePath, optimizedBuffer)
      newSavedFiles.push(filePath)

      const url = `/uploads/case-${caseId}/${filename}`

      // 🔥 Миниатюра для главного фото
      let thumbUrl: string | null = null
      if (isMain) {
        const thumbBuffer = await sharp(buffer)
          .resize({
            width: IMAGE_CONFIG.thumbWidth,
            height: IMAGE_CONFIG.thumbWidth,
            fit: 'inside',
            withoutEnlargement: true
          })
          .rotate()
          .webp({ quality: IMAGE_CONFIG.webpQuality })
          .toBuffer()

        const thumbFilename = `${uuid}-thumb.webp`
        const thumbPath = join(caseDir, thumbFilename)

        // ✅ Асинхронная запись миниатюры + запоминание
        await writeFile(thumbPath, thumbBuffer)
        newSavedFiles.push(thumbPath)

        thumbUrl = `/uploads/case-${caseId}/${thumbFilename}`
      }

      return { url, thumbUrl, filename }
    } catch (error) {
      console.error(`[Portfolio/Update] ❌ Ошибка оптимизации (${type}):`, error)
      throw error
    }
  }

  // ───────── ФУНКЦИЯ МИГРАЦИИ СТАРОГО ИЗОБРАЖЕНИЯ ─────────
  const migrateOldImage = async (image: any, isMain: boolean = false) => {
    try {
      // 🔥 Если уже WebP — пропускаем
      if (image.url.endsWith('.webp')) {
        return { url: image.url, thumbUrl: image.url.replace('.webp', '-thumb.webp') }
      }

      console.log(`[Portfolio/Update] 🔄 Миграция: ${image.url}`)

      // Оптимизируем старый файл
      const result = await optimizeImage(image.url, image.type, isMain, existingCase.id)

      // 🔥 Асинхронное удаление старого файла
      const oldPhysicalPath = join(UPLOAD_DIR_BASE, image.url.replace('/uploads/', ''))
      if (await fileExists(oldPhysicalPath)) {
        try {
          await unlink(oldPhysicalPath)
          console.log(`[Portfolio/Update] 🗑️ Удалён старый: ${image.url}`)
        } catch (err) {
          console.warn(`[Portfolio/Update] ⚠️ Не удалось удалить: ${image.url}`)
        }
      }

      // 🔥 Удаляем старую миниатюру если есть
      if (image.url.includes('-thumb.')) {
        if (await fileExists(oldPhysicalPath)) {
          try {
            await unlink(oldPhysicalPath)
          } catch {}
        }
      }

      console.log(`[Portfolio/Update] ✅ Миграция: ${image.url} → ${result.url}`)
      return { url: result.url, thumbUrl: result.thumbUrl }
    } catch (error) {
      console.error(`[Portfolio/Update] ❌ Ошибка миграции ${image.id}:`, error)
      return { url: image.url, thumbUrl: null }
    }
  }

  try {
    // ✅ ВСЁ В ОДНОЙ ТРАНЗАКЦИИ
    const result = await db.transaction(async (tx) => {
      // ───────── ОБРАБОТКА ИЗОБРАЖЕНИЙ ─────────
      const imagesToInsert: any[] = []
      const imagesToUpdate: Array<{ id: number; url: string }> = []

      // 🔥 1. Миграция существующих изображений, которые пользователь оставил
      for (const img of existingImages) {
        if (idsToKeep.includes(img.id)) {
          const isMain = img.type === 'main'
          const result = await migrateOldImage(img, isMain)

          if (result.url !== img.url) {
            imagesToUpdate.push({ id: img.id, url: result.url })
          }
        }
      }

      // 🔥 2. Новые/заменённые изображения из формы
      const saveNewImage = async (file: any, type: string, isMain: boolean = false, order: number) => {
        const result = await optimizeImage(file, type, isMain, existingCase.id)
        return {
          caseId: existingCase.id,
          url: result.url,
          type,
          alt: `${type} image`,
          order
        }
      }

      // Главное изображение
      if (files.mainImage) {
        const data = await saveNewImage(files.mainImage, 'main', true, 0)
        imagesToInsert.push(data)
      }

      // Миниатюра
      if (files.thumbnail && files.thumbnail !== files.mainImage) {
        const data = await saveNewImage(files.thumbnail, 'thumbnail', false, 1)
        imagesToInsert.push(data)
      }

      // Галерея
      let gi = 0
      while (files[`gallery[${gi}]`]) {
        const data = await saveNewImage(
          files[`gallery[${gi}]`],
          fields[`galleryType[${gi}]`] || 'after',
          false,
          100 + gi
        )
        imagesToInsert.push(data)
        gi++
      }

      // Пары before/after
      let pi = 0
      while (files[`beforeImage[${pi}]`] || files[`afterImage[${pi}]`]) {
        const group = fields[`pairGroup[${pi}]`] || `pair-${pi}`

        if (files[`beforeImage[${pi}]`]) {
          const data = await saveNewImage(files[`beforeImage[${pi}]`], 'before', false, 200 + pi * 2)
          imagesToInsert.push({ ...data, pairGroup: group })
        }

        if (files[`afterImage[${pi}]`]) {
          const data = await saveNewImage(files[`afterImage[${pi}]`], 'after', false, 201 + pi * 2)
          imagesToInsert.push({ ...data, pairGroup: group })
        }
        pi++
      }

      // ───────── УДАЛЕНИЕ НЕИСПОЛЬЗУЕМЫХ ИЗОБРАЖЕНИЙ ─────────
      // ✅ СНАЧАЛА удаляем из БД (если упадёт — файлы останутся, но не битая ссылка)
      const idsToDelete = existingImages
        .filter(img => !idsToKeep.includes(img.id))
        .map(img => img.id)

      if (idsToDelete.length) {
        // ✅ Сначала БД
        await tx.delete(portfolioImages).where(
          and(
            eq(portfolioImages.caseId, existingCase.id),
            inArray(portfolioImages.id, idsToDelete)
          )
        )

        // ✅ ПОТОМ файлы (асинхронно, с try/catch)
        for (const img of existingImages.filter(i => idsToDelete.includes(i.id))) {
          const physicalPath = join(UPLOAD_DIR_BASE, img.url.replace('/uploads/', ''))

          try {
            if (await fileExists(physicalPath)) {
              await unlink(physicalPath)
              console.log(`[Portfolio/Update] 🗑️ Удалён файл: ${img.url}`)
            }

            // Миниатюра
            if (img.type === 'main' && img.url.endsWith('.webp')) {
              const thumbPath = physicalPath.replace('.webp', '-thumb.webp')
              if (await fileExists(thumbPath)) {
                await unlink(thumbPath)
              }
            }
          } catch (err: any) {
            if (err.code !== 'ENOENT') {
              console.warn(`[Portfolio/Update] ⚠️ Не удалось удалить: ${img.url}`)
            }
          }
        }
      }

      // ───────── ВСТАВКА НОВЫХ И ОБНОВЛЕНИЕ МИГРИРОВАННЫХ ─────────
      if (imagesToInsert.length) {
        await tx.insert(portfolioImages).values(imagesToInsert)
      }

      for (const { id, url } of imagesToUpdate) {
        await tx.update(portfolioImages)
          .set({ url })
          .where(eq(portfolioImages.id, id))
      }

      // ───────── UPDATE CASE ─────────
      if (!fields.slug && fields.title) {
        fields.slug = transliterate(fields.title)
          .toLowerCase()
          .replace(/[\s\W]+/g, '-')
          .replace(/^-+|-+$/g, '')
      }

      const isPublishedValue = fields.isPublished === 'true' || fields.isPublished === '1'

      await tx.update(portfolioCases)
        .set({
          title: fields.title,
          slug: fields.slug,
          category: fields.category as any,
          address: fields.address,
          objectDescription: fields.objectDescription,
          shortObject: fields.shortObject,
          shortDescription: fields.shortDescription,
          fullDescription: fields.fullDescription || '',
          result: fields.result || '',
          space: fields.space,
          duration: fields.duration,
          people: fields.people,
          metaTitle: fields.metaTitle || '',
          metaDescription: fields.metaDescription || '',
          metaKeywords: fields.metaKeywords || '',
          isPublished: isPublishedValue,
          updatedAt: new Date()
        })
        .where(eq(portfolioCases.slug, slug))

      // ───────── UPDATE WORKS ─────────
      const workTypes: string[] = []
      const workValues: string[] = []
      for (const key of Object.keys(fields)) {
        if (key.startsWith('workType[')) {
          const idx = parseInt(key.match(/\d+/)?.[0] ?? '-1', 10)
          if (idx >= 0) workTypes[idx] = fields[key] ?? ''
        }
        if (key.startsWith('workValue[')) {
          const idx = parseInt(key.match(/\d+/)?.[0] ?? '-1', 10)
          if (idx >= 0) workValues[idx] = fields[key] ?? ''
        }
      }

      const worksToInsert = workTypes
        .map((type, i) => ({ workType: type?.trim() ?? '', value: workValues[i]?.trim() ?? '' }))
        .filter(w => w.workType)

      if (worksToInsert.length > 0) {
        await tx.delete(portfoCaseWorks).where(eq(portfoCaseWorks.caseId, existingCase.id))
        await tx.insert(portfoCaseWorks).values(
          worksToInsert.map(({ workType, value }) => ({
            caseId: existingCase.id,
            workType,
            value,
            order: 0
          }))
        )
      }

      return {
        success: true,
        slug: fields.slug || slug,
        message: 'Case updated'
      }
    })

    console.log(`[Portfolio/Update] ✅ Кейс обновлён: ${slug}`)
    return result

  } catch (error: any) {
    // ❌ При ошибке — удаляем все новые созданные файлы
    console.error('[Portfolio/Update] ❌ Ошибка обновления кейса:', error)
    await cleanupNewFiles()

    if (error?.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: 'Ошибка при обновлении кейса' })
  }
})

// server/api/portfolio/index.post.ts
import { eventHandler, createError, readMultipartFormData } from 'h3'
import { db } from '../../db'
import { portfolioCases, portfolioImages, portfoCaseWorks } from '../../db/schema'
import { verifyAuth } from '../../utils/auth'
import { randomUUID } from 'crypto'
import { mkdirSync, writeFileSync, unlinkSync } from 'fs'
import { join } from 'path'
import { sql } from 'drizzle-orm'
import { transliterate } from '../../utils/transliteration'
import { validateImage } from '../../utils/imageValidation'
import sharp from 'sharp'

const UPLOAD_DIR_BASE = '/var/www/glavprofi_ru_usr40/data/www/uploads'
mkdirSync(UPLOAD_DIR_BASE, { recursive: true })

// 🔥 Настройки оптимизации
const IMAGE_CONFIG = {
  maxWidth: 1920,        // Макс. ширина для основного фото
  thumbWidth: 400,       // Ширина для миниатюры
  webpQuality: 85,       // Качество WebP (0-100)
  maxFileSize: 20 * 1024 * 1024 // 20 МБ макс. размер файла
}

export default eventHandler(async (event) => {
  // ───────── AUTH ─────────
  const user = await verifyAuth(event)
  if (!['admin', 'manager'].includes(user.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  // ───────── FORM DATA ─────────
  const formData = await readMultipartFormData(event)
  if (!formData) {
    throw createError({ statusCode: 400, statusMessage: 'Form data missing' })
  }

  const fields: Record<string, string> = {}
  const files: Record<string, any> = {}

  for (const part of formData) {
    if (part.filename) {
      if (part.name) files[part.name] = part
    } else if (part.name) {
      fields[part.name] = part.data?.toString() || ''
    }
  }

  // ───────── ПРОВЕРКА ОБЯЗАТЕЛЬНЫХ ФАЙЛОВ ─────────
  const requiredFiles = ['mainImage', 'thumbnail']
  for (const name of requiredFiles) {
    if (!files[name] || !files[name].data || (files[name].data?.length || 0) === 0) {
      throw createError({ statusCode: 400, statusMessage: `Отсутствует обязательный файл: ${name}` })
    }
  }

  // ───────── ВАЛИДАЦИЯ ИЗОБРАЖЕНИЙ ─────────
  for (const name of requiredFiles) {
    const validation = validateImage(files[name])
    if (!validation.valid) {
      throw createError({ statusCode: 400, statusMessage: validation.error! })
    }
    
    // 🔥 Проверка размера файла
    if (files[name].data.length > IMAGE_CONFIG.maxFileSize) {
      throw createError({ 
        statusCode: 400, 
        statusMessage: `Файл ${name} слишком большой. Максимум ${IMAGE_CONFIG.maxFileSize / 1024 / 1024} МБ` 
      })
    }
  }

  // Валидируем пары before/after и галерею
  const allFileParts = formData.filter(f => f.filename && f.name)
  for (const part of allFileParts) {
    if (
      part.name?.startsWith('beforeImage[') ||
      part.name?.startsWith('afterImage[') ||
      part.name?.startsWith('gallery[')
    ) {
      const validation = validateImage(part as any)
      if (!validation.valid) {
        throw createError({ statusCode: 400, statusMessage: validation.error! })
      }
      
      // 🔥 Проверка размера файла
      if (part.data.length > IMAGE_CONFIG.maxFileSize) {
        throw createError({ 
          statusCode: 400, 
          statusMessage: `Файл слишком большой. Максимум ${IMAGE_CONFIG.maxFileSize / 1024 / 1024} МБ` 
        })
      }
    }
  }

  // ───────── SLUG ─────────
  if (!fields.slug) {
    const transliterated = transliterate(fields.title || '')
    fields.slug = transliterated
      .toLowerCase()
      .trim()
      .replace(/[\s\W]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .replace(/-+/g, '-')
  }

  // ───────── ВАЛИДАЦИЯ ОБЯЗАТЕЛЬНЫХ ПОЛЕЙ ─────────
  const requiredFields = [
    'title', 'slug', 'category',
    'objectDescription', 'shortObject',
    'space', 'duration', 'people',
    'shortDescription'
  ]
  for (const field of requiredFields) {
    if (!fields[field]) {
      throw createError({ statusCode: 400, statusMessage: `Missing required field: ${field}` })
    }
  }

  try {
    // ───────── ВСТАВКА КЕЙСА ─────────
    const newCase = await db.insert(portfolioCases).values({
      title: fields.title ?? '',
      slug: fields.slug ?? '',
      category: sql<string>`${fields.category}`,
      objectDescription: fields.objectDescription ?? '',
      shortObject: fields.shortObject ?? '',
      space: sql<number>`${parseFloat(fields.space || '0')}`,
      duration: fields.duration ?? '',
      people: fields.people ?? '',
      shortDescription: fields.shortDescription ?? '',
      fullDescription: fields.fullDescription ?? null,
      result: fields.result ?? null,
      metaTitle: fields.metaTitle ?? null,
      metaDescription: fields.metaDescription ?? null,
      metaKeywords: fields.metaKeywords ?? null,
      address: fields.address ?? 'Не указано',
      isPublished: true
    }).$returningId()

    if (!newCase[0]?.id) {
      throw createError({ statusCode: 500, statusMessage: 'Ошибка получения ID кейса' })
    }

    const caseId = newCase[0].id
    const caseDir = join(UPLOAD_DIR_BASE, `case-${caseId}`)
    mkdirSync(caseDir, { recursive: true })

    // ───────── ФУНКЦИЯ ОПТИМИЗАЦИИ ─────────
    const optimizeImage = async (file: any, type: string, isMain: boolean = false) => {
      try {
        if (!file?.data) throw new Error(`Файл не передан для типа ${type}`)

        const validation = validateImage(file)
        if (!validation.valid) {
          throw createError({ statusCode: 400, statusMessage: validation.error! })
        }

        const buffer = Buffer.from(file.data)
        const ext = file.filename?.split('.').pop()?.toLowerCase() || 'jpg'
        const uuid = randomUUID()

        // 🔥 Оптимизация через sharp
        let sharpInstance = sharp(buffer)
        
        // Получаем метаданные для определения ориентации
        const metadata = await sharpInstance.metadata()
        const width = metadata.width || 0
        const height = metadata.height || 0
        
        // Resize только если изображение больше максимума
        if (width > IMAGE_CONFIG.maxWidth || height > IMAGE_CONFIG.maxWidth) {
          sharpInstance = sharpInstance.resize({
            width: IMAGE_CONFIG.maxWidth,
            height: IMAGE_CONFIG.maxWidth,
            fit: 'inside',
            withoutEnlargement: true
          })
        }

        // Конвертация в WebP
        const optimizedBuffer = await sharpInstance
          .rotate()
          .webp({ quality: IMAGE_CONFIG.webpQuality })
          .toBuffer()

        // Сохранение основного файла
        const filename = `${uuid}.webp`
        const filePath = join(caseDir, filename)
        writeFileSync(filePath, optimizedBuffer)

        const url = `/uploads/case-${caseId}/${filename}`

        // 🔥 Если это главное фото — создаём миниатюру
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
          writeFileSync(thumbPath, thumbBuffer)
          thumbUrl = `/uploads/case-${caseId}/${thumbFilename}`
        }

        return {
          caseId,
          url,
          thumbUrl,
          type,
          alt: `${type} фото с объекта ремонта для кейса ${caseId}`,
          order: type === 'main' ? 0 : type === 'thumbnail' ? 1 : 2
        }
      } catch (error) {
        console.error(`Ошибка при оптимизации изображения (${type}):`, error)
        throw error
      }
    }

    // ───────── СОХРАНЕНИЕ ИЗОБРАЖЕНИЙ ─────────
    const imagesToInsert: any[] = []

    // Главное изображение (с миниатюрой)
    const mainResult = await optimizeImage(files.mainImage, 'main', true)
    imagesToInsert.push({
      caseId: mainResult.caseId,
      url: mainResult.url,
      type: 'main',
      alt: mainResult.alt,
      order: 0
    })

    // Миниатюра (отдельный файл, если загружен другой)
    if (files.thumbnail !== files.mainImage) {
      const thumbResult = await optimizeImage(files.thumbnail, 'thumbnail', false)
      imagesToInsert.push({
        caseId: thumbResult.caseId,
        url: thumbResult.url,
        type: 'thumbnail',
        alt: thumbResult.alt,
        order: 1
      })
    }

    // Пары before/after
    const beforeFiles = formData
      .filter(f => f.name?.startsWith('beforeImage[') && f.filename)
      .map(f => ({ index: parseInt(f.name!.match(/\d+/)?.[0] || '-1'), file: f }))
      .filter(item => item.index >= 0)
      .sort((a, b) => a.index - b.index)

    const afterFiles = formData
      .filter(f => f.name?.startsWith('afterImage[') && f.filename)
      .map(f => ({ index: parseInt(f.name!.match(/\d+/)?.[0] || '-1'), file: f }))
      .filter(item => item.index >= 0)
      .sort((a, b) => a.index - b.index)

    const maxLen = Math.max(beforeFiles.length, afterFiles.length)
    for (let i = 0; i < maxLen; i++) {
      const beforeFile = beforeFiles.find(f => f.index === i)
      const afterFile = afterFiles.find(f => f.index === i)
      const pairGroup = `pair-${i}`

      if (beforeFile) {
        const result = await optimizeImage(beforeFile.file, 'before', false)
        imagesToInsert.push({ ...result, type: 'before', pairGroup, order: 2 + i * 2 })
      }
      if (afterFile) {
        const result = await optimizeImage(afterFile.file, 'after', false)
        imagesToInsert.push({ ...result, type: 'after', pairGroup, order: 3 + i * 2 })
      }
    }

    // Галерея
    const galleryFiles = Object.entries(files)
      .filter(([key]) => key.startsWith('gallery['))
      .map(([, value]) => value)

    const galleryTypes: Record<number, string> = {}
    Object.entries(fields).forEach(([key, value]) => {
      if (key.startsWith('galleryType[')) {
        const index = parseInt(key.match(/\d+/)?.[0] || '-1')
        if (index >= 0) galleryTypes[index] = value
      }
    })

    for (let i = 0; i < galleryFiles.length; i++) {
      const type = galleryTypes[i] ?? 'after'
      const result = await optimizeImage(galleryFiles[i], 'gallery', false)
      imagesToInsert.push({ ...result, type, order: 100 + i })
    }

    // Вставка в БД
    if (imagesToInsert.length > 0) {
      await db.insert(portfolioImages).values(imagesToInsert)
    }

    // ───────── WORKS ─────────
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
      await db.insert(portfoCaseWorks).values(
        worksToInsert.map(({ workType, value }) => ({
          caseId,
          workType,
          value
        }))
      )
    } else {
      await db.insert(portfoCaseWorks).values({
        caseId,
        workType: 'Отделка',
        value: ''
      })
    }

    return { id: caseId, slug: fields.slug }
  } catch (error) {
    console.error('Ошибка при создании кейса:', error)
    throw createError({ statusCode: 500, statusMessage: 'Ошибка при создании кейса' })
  }
})

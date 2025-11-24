// server/api/portfolio/[slug]/index.put.ts
import { eventHandler, createError, readMultipartFormData } from 'h3'
import { db } from '../../../db'
import { portfolioCases, portfolioImages, portfoCaseWorks } from '../../../db/schema'
import { eq, and, inArray } from 'drizzle-orm'
import { verifyAuth } from '../../../utils/auth'
import { transliterate } from '../../../utils/transliteration'
import { randomUUID } from 'crypto'
import { mkdirSync, writeFileSync, existsSync, unlinkSync } from 'fs'
import { join } from 'path'

// Базовая директория для загрузки
const UPLOAD_DIR_BASE = join(process.cwd(), 'public', 'uploads')
mkdirSync(UPLOAD_DIR_BASE, { recursive: true }) // Создаём uploads, если нет

// Разрешённые типы изображений
const validImageTypes = ['main', 'thumbnail', 'gallery', 'before', 'after'] as const
type ImageType = typeof validImageTypes[number]

// Допустимые расширения файлов
const allowedExt = ['jpg', 'jpeg', 'png', 'webp', 'avif']

// Допустимые категории
const validCategories = [
  'Кафе', 'Магазины', 'Клиники', 'Банки', 
  'Фитнес', 'Производственные', 'Фасады и Кровля', 'Прочее'
] as const
type Category = typeof validCategories[number]

// Тип для данных изображения, соответствующий схеме БД
interface ImageData {
  [x: string]: any
  caseId: number
  url: string
  type: ImageType
  pairGroup: string | null
  alt: string | null
  order: number
}

export default eventHandler(async (event) => {
  try {
    // Авторизация
    const user = await verifyAuth(event)
    if (!['admin', 'manager'].includes(user.role)) {
      throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    }
    
    // Проверка params и slug
    const params = event.context.params
    if (!params || !params.slug) {
      throw createError({ statusCode: 400, statusMessage: 'Missing case slug in request parameters' })
    }
    const slug = params.slug
    
    // Получаем multipart данные
    const formData = await readMultipartFormData(event)
    if (!formData) {
      throw createError({ statusCode: 400, statusMessage: 'Request body is missing' })
    }
    
    // Преобразуем formData в объект полей
    const fields: Record<string, string> = {}
    const files: Record<string, any> = {}
    for (const part of formData) {
      if (part.filename) {
        if (part.name) files[part.name] = part
      } else if (part.name) {
        fields[part.name] = part.data?.toString() || ''
      }
    }
    
    // Валидация обязательных текстовых полей
    const requiredFields: Array<keyof typeof fields> = [
      'title', 'category', 'address',
      'objectDescription', 'shortObject',
      'space', 'duration', 'people',
      'shortDescription'
    ]
    for (const field of requiredFields) {
      if (!fields[field]) {
        throw createError({ statusCode: 400, statusMessage: `Missing required field: ${field}` })
      }
    }
    
    // Валидация категории
    if (!validCategories.includes(fields.category as Category)) {
      throw createError({ 
        statusCode: 400, 
        statusMessage: `Invalid category. Must be one of: ${validCategories.join(', ')}` 
      })
    }
    
    // Проверяем, существует ли кейс
    const [existingCase] = await db.select().from(portfolioCases).where(eq(portfolioCases.slug, slug))
    if (!existingCase) {
      throw createError({ statusCode: 404, statusMessage: 'Case not found' })
    }
    
    // Получаем существующие изображения
    const existingImages = await db.select().from(portfolioImages).where(eq(portfolioImages.caseId, existingCase.id))
    const existingMainImage = existingImages.find(img => img.type === 'main')
    const existingThumbnail = existingImages.find(img => img.type === 'thumbnail')
    
    // Определяем, есть ли новые изображения
    const hasNewMainImage = files.mainImage && files.mainImage.data.length > 0
    const hasNewThumbnail = files.thumbnail && files.thumbnail.data.length > 0
    
    // Собираем все изображения, которые нужно сохранить
    const imagesToSave: ImageData[] = []
    
    // Обрабатываем главное изображение
    if (hasNewMainImage) {
      // Удаляем старое изображение, если оно существует
      if (existingMainImage) {
        try {
          const oldPath = join(process.cwd(), 'public', existingMainImage.url)
          if (existsSync(oldPath)) {
            unlinkSync(oldPath)
          }
        } catch (err) {
          console.warn(`Не удалось удалить старое главное изображение: ${existingMainImage.url}`, err)
        }
      }
      // Сохраняем новое главное изображение
      const ext = files.mainImage.filename?.split('.').pop()?.toLowerCase() || 'jpg'
      if (!allowedExt.includes(ext)) {
        throw createError({ statusCode: 400, statusMessage: 'Invalid main image format' })
      }
      const fileName = `${randomUUID()}.${ext}`
      const caseDir = join(UPLOAD_DIR_BASE, `case-${existingCase.id}`)
      mkdirSync(caseDir, { recursive: true })
      const filePath = `/uploads/case-${existingCase.id}/${fileName}`
      const physicalPath = join(caseDir, fileName)
      writeFileSync(physicalPath, Buffer.from(files.mainImage.data))
      imagesToSave.push({
        caseId: existingCase.id,
        url: filePath,
        type: 'main',
        pairGroup: null,
        alt: `Главное фото с объекта ремонта и отделке помещения для кейса ${existingCase.id}`,
        order: 0
      })
    } else if (existingMainImage) {
      // Сохраняем существующее главное изображение
      imagesToSave.push({
        caseId: existingCase.id,
        url: existingMainImage.url,
        type: 'main',
        pairGroup: existingMainImage.pairGroup,
        alt: existingMainImage.alt,
        order: 0
      })
    }
    
    // Обрабатываем миниатюру
    if (hasNewThumbnail) {
      // Удаляем старую миниатюру, если она существует
      if (existingThumbnail) {
        try {
          const oldPath = join(process.cwd(), 'public', existingThumbnail.url)
          if (existsSync(oldPath)) {
            unlinkSync(oldPath)
          }
        } catch (err) {
          console.warn(`Не удалось удалить старую миниатюру: ${existingThumbnail.url}`, err)
        }
      }
      // Сохраняем новую миниатюру
      const ext = files.thumbnail.filename?.split('.').pop()?.toLowerCase() || 'jpg'
      if (!allowedExt.includes(ext)) {
        throw createError({ statusCode: 400, statusMessage: 'Invalid thumbnail format' })
      }
      const fileName = `${randomUUID()}.${ext}`
      const caseDir = join(UPLOAD_DIR_BASE, `case-${existingCase.id}`)
      mkdirSync(caseDir, { recursive: true })
      const filePath = `/uploads/case-${existingCase.id}/${fileName}`
      const physicalPath = join(caseDir, fileName)
      writeFileSync(physicalPath, Buffer.from(files.thumbnail.data))
      imagesToSave.push({
        caseId: existingCase.id,
        url: filePath,
        type: 'thumbnail',
        pairGroup: null,
        alt: `Миниатюра фото с объекта ремонта и отделке помещения для кейса ${existingCase.id}`,
        order: 1
      })
    } else if (existingThumbnail) {
      // Сохраняем существующую миниатюру
      imagesToSave.push({
        caseId: existingCase.id,
        url: existingThumbnail.url,
        type: 'thumbnail',
        pairGroup: existingThumbnail.pairGroup,
        alt: existingThumbnail.alt,
        order: 1
      })
    }
    
    // Проверяем наличие обязательных изображений
    if (imagesToSave.length === 0 || !imagesToSave.some(img => img.type === 'main')) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Необходимо загрузить главное изображение или оставить существующее'
      })
    }
    if (imagesToSave.length === 0 || !imagesToSave.some(img => img.type === 'thumbnail')) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Необходимо загрузить миниатюру или оставить существующую'
      })
    }
    
    // Обработка пар "до/после"
    let pairIndex = 2 // Начинаем с порядкового номера 2
    
    // Обработка новых пар "до/после"
    for (let i = 0; ; i++) {
      const beforeKey = `beforeImage[${i}]`
      const afterKey = `afterImage[${i}]`
      const hasBefore = files[beforeKey]
      const hasAfter = files[afterKey]
      if (!hasBefore && !hasAfter) break
      
      const pairGroup = randomUUID()
      
      // Обработка фото "до"
      if (hasBefore) {
        const ext = hasBefore.filename?.split('.').pop()?.toLowerCase() || 'jpg'
        if (!allowedExt.includes(ext)) {
          throw createError({ statusCode: 400, statusMessage: `Invalid before image format at index ${i}` })
        }
        const fileName = `${randomUUID()}.${ext}`
        const caseDir = join(UPLOAD_DIR_BASE, `case-${existingCase.id}`)
        mkdirSync(caseDir, { recursive: true })
        const filePath = `/uploads/case-${existingCase.id}/${fileName}`
        const physicalPath = join(caseDir, fileName)
        writeFileSync(physicalPath, Buffer.from(hasBefore.data))
        imagesToSave.push({
          caseId: existingCase.id,
          url: filePath,
          type: 'before',
          pairGroup,
          alt: `Фото до ремонта для кейса ${existingCase.id}`,
          order: pairIndex++
        })
      }
      
      // Обработка фото "после"
      if (hasAfter) {
        const ext = hasAfter.filename?.split('.').pop()?.toLowerCase() || 'jpg'
        if (!allowedExt.includes(ext)) {
          throw createError({ statusCode: 400, statusMessage: `Invalid after image format at index ${i}` })
        }
        const fileName = `${randomUUID()}.${ext}`
        const caseDir = join(UPLOAD_DIR_BASE, `case-${existingCase.id}`)
        mkdirSync(caseDir, { recursive: true })
        const filePath = `/uploads/case-${existingCase.id}/${fileName}`
        const physicalPath = join(caseDir, fileName)
        writeFileSync(physicalPath, Buffer.from(hasAfter.data))
        imagesToSave.push({
          caseId: existingCase.id,
          url: filePath,
          type: 'after',
          pairGroup,
          alt: `Фото после ремонта для кейса ${existingCase.id}`,
          order: pairIndex++
        })
      }
    }
    
    // Обработка существующих пар "до/после" (если они не были заменены)
    const existingBeforeAfter = existingImages.filter(img => img.type === 'before' || img.type === 'after')
    const existingPairGroups = new Set(existingBeforeAfter.map(img => img.pairGroup))
    
    // Если есть существующие пары, добавляем их обратно, если они не были заменены
    for (const pairGroup of existingPairGroups) {
      if (!pairGroup) continue
      
      const existingBefore = existingImages.find(img => img.type === 'before' && img.pairGroup === pairGroup)
      const existingAfter = existingImages.find(img => img.type === 'after' && img.pairGroup === pairGroup)
      
      // Проверяем, была ли заменена эта пара
      let wasReplaced = false
      for (let i = 0; ; i++) {
        const beforeKey = `beforeImage[${i}]`
        const afterKey = `afterImage[${i}]`
        const hasBefore = files[beforeKey]
        const hasAfter = files[afterKey]
        if (!hasBefore && !hasAfter) break
        
        // Проверяем, была ли заменена эта пара
        if (hasBefore && existingBefore) {
          wasReplaced = true
          break
        }
        if (hasAfter && existingAfter) {
          wasReplaced = true
          break
        }
      }
      
      // Если пара не была заменена, добавляем существующие изображения
      if (!wasReplaced) {
        if (existingBefore) {
          imagesToSave.push({
            caseId: existingCase.id,
            url: existingBefore.url,
            type: 'before',
            pairGroup: existingBefore.pairGroup,
            alt: existingBefore.alt,
            order: existingBefore.order ?? 0
          })
        }
        if (existingAfter) {
          imagesToSave.push({
            caseId: existingCase.id,
            url: existingAfter.url,
            type: 'after',
            pairGroup: existingAfter.pairGroup,
            alt: existingAfter.alt,
            order: existingAfter.order ?? 0
          })
        }
      }
    }
    
    // Обработка галереи
    let galleryIndex = pairIndex // Продолжаем нумерацию от последнего индекса
    
    // Обработка новых изображений галереи
    for (let i = 0; ; i++) {
      const galleryKey = `gallery[${i}]`
      const typeKey = `galleryType[${i}]`
      if (!files[galleryKey]) break
      
      const ext = files[galleryKey].filename?.split('.').pop()?.toLowerCase() || 'jpg'
      if (!allowedExt.includes(ext)) {
        throw createError({ statusCode: 400, statusMessage: `Invalid gallery image format at index ${i}` })
      }
      const type = fields[typeKey] as ImageType || 'main'
      if (!validImageTypes.includes(type)) {
        throw createError({ statusCode: 400, statusMessage: `Invalid gallery image type: ${type}` })
      }
      const fileName = `${randomUUID()}.${ext}`
      const caseDir = join(UPLOAD_DIR_BASE, `case-${existingCase.id}`)
      mkdirSync(caseDir, { recursive: true })
      const filePath = `/uploads/case-${existingCase.id}/${fileName}`
      const physicalPath = join(caseDir, fileName)
      writeFileSync(physicalPath, Buffer.from(files[galleryKey].data))
      imagesToSave.push({
        caseId: existingCase.id,
        url: filePath,
        type,
        pairGroup: null,
        alt: `${type} фото с объекта ремонта и отделке помещения для кейса ${existingCase.id}`,
        order: galleryIndex++
      })
    }
    
    // Обработка существующих изображений галереи (если они не были заменены)
    const existingGallery = existingImages.filter(img => img.type !== 'main' && img.type !== 'thumbnail' && !img.pairGroup)
    const existingGalleryIds = existingGallery.map(img => img.id)
    
    // Добавляем существующие изображения галереи, если они не были заменены
    for (const existingImage of existingGallery) {
      // Проверяем, не было ли замены этого изображения
      let wasReplaced = false
      for (let i = 0; ; i++) {
        const galleryKey = `gallery[${i}]`
        if (!files[galleryKey]) break
        wasReplaced = true
        break
      }
      
      // Если изображение не было заменено, добавляем его обратно
      if (!wasReplaced) {
        imagesToSave.push({
          caseId: existingCase.id,
          url: existingImage.url,
          type: existingImage.type,
          pairGroup: existingImage.pairGroup,
          alt: existingImage.alt,
          order: existingImage.order ?? 0
        })
      }
    }
    
    // Обработка работ
    const worksToSave = []
    for (let i = 0; ; i++) {
      const workTypeKey = `workType[${i}]`
      const progressKey = `progress[${i}]`
      if (!fields[workTypeKey]) break
      const workType = fields[workTypeKey]
      const progressStr = fields[progressKey] || '0'
      const progress = Math.min(100, Math.max(0, parseInt(progressStr) || 0))
      worksToSave.push({
        caseId: existingCase.id,
        workType,
        progress,
        order: i
      })
    }
    
    // Автогенерация slug, если не предоставлен
    if (!fields.slug && fields.title) {
      let transliterated = transliterate(fields.title)
      fields.slug = transliterated.toLowerCase()
        .trim()
        .replace(/[\s\W]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .replace(/-+/g, '-')
    }
    
    // Удаляем только те изображения, которые больше не нужны
    const existingImageIds = existingImages.map(img => img.id)
    const imagesToSaveIds = imagesToSave.map(img => img.id)
    const imagesToDelete = existingImageIds.filter(id => !imagesToSaveIds.includes(id))
    
    if (imagesToDelete.length > 0) {
      await db.delete(portfolioImages).where(inArray(portfolioImages.id, imagesToDelete))
    }
    
    // Добавляем новые изображения
    if (imagesToSave.length > 0) {
      await db.insert(portfolioImages).values(imagesToSave)
    }
    
    // Удаляем все работы текущего кейса
    await db.delete(portfoCaseWorks).where(eq(portfoCaseWorks.caseId, existingCase.id))
    
    // Добавляем новые работы
    if (worksToSave.length > 0) {
      await db.insert(portfoCaseWorks).values(worksToSave)
    } else {
      // Если работы не переданы, добавляем дефолтную
      await db.insert(portfoCaseWorks).values({
        caseId: existingCase.id,
        workType: 'Отделочные работы',
        progress: 100,
        order: 0
      })
    }
    
    // Обновляем сам кейс
    const updateData = {
      title: fields.title,
      slug: fields.slug,
      category: fields.category as Category,
      address: fields.address,
      objectDescription: fields.objectDescription,
      shortObject: fields.shortObject,
      space: fields.space,
      duration: fields.duration,
      people: fields.people,
      shortDescription: fields.shortDescription,
      fullDescription: fields.fullDescription || '',
      result: fields.result || '',
      metaTitle: fields.metaTitle || '',
      metaDescription: fields.metaDescription || '',
      metaKeywords: fields.metaKeywords || '',
      isPublished: fields.isPublished === 'true',
      updatedAt: new Date()
    }
    
    await db.update(portfolioCases).set(updateData).where(eq(portfolioCases.slug, slug))
    
    // Получаем обновленный кейс
    const [updatedCase] = await db.select().from(portfolioCases).where(eq(portfolioCases.slug, slug))
    return updatedCase
    
  } catch (error) {
    console.error('Ошибка при обновлении кейса:', error)
    // Проверяем, является ли ошибка уже созданным объектом ошибки
    if (error instanceof Error && 'statusCode' in error) {
      throw error
    }
    // Иначе создаем общую ошибку сервера
    throw createError({ statusCode: 500, statusMessage: 'Internal server error' })
  }
})

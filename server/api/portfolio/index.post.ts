// server/api/portfolio/index.post.ts

import { eventHandler, createError, readMultipartFormData } from 'h3'
import { db } from '../../db'
import { portfolioCases, portfolioImages, portfoCaseWorks } from '../../db/schema'
import { verifyAuth } from '../../utils/auth'
import { randomUUID } from 'crypto'
import { mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'
import { sql } from 'drizzle-orm'
import { transliterate } from '../../utils/transliteration'

// Базовая директория для загрузки
const UPLOAD_DIR_BASE = join(process.cwd(), 'public', 'uploads')
mkdirSync(UPLOAD_DIR_BASE, { recursive: true }) // Создаём uploads, если нет

// Разрешённые типы изображений
const validImageTypes = ['main', 'thumbnail', 'before', 'after'] as const
type ImageType = typeof validImageTypes[number]

const allowedExt = ['jpg', 'jpeg', 'png', 'webp', 'avif']

// Тип для вставки данных в таблицу `portfolio_cases`
type PortfolioCaseInsert = {
  isPublished?: boolean
  title: string
  slug: string
  category: 'Кафе' | 'Магазины' | 'Клиники' | 'Банки' | 'Фитнес' | 'Производственные' | 'Фасады и Кровля' | 'Прочее'
  objectDescription: string
  shortObject: string
  space: string
  duration: string
  people: string
  shortDescription: string
  fullDescription?: string
  result?: string
  metaTitle?: string
  metaDescription?: string
  metaKeywords?: string
  order?: number
}

export default eventHandler(async (event) => {
  // Авторизация
  const user = await verifyAuth(event)
  if (!['admin', 'manager'].includes(user.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  // Чтение multipart/form-data
  const formData = await readMultipartFormData(event)
  if (!formData) {
    throw createError({ statusCode: 400, statusMessage: 'Form data missing' })
  }

  // Разделение данных
  const fields: Record<string, string> = {}
  const files: Record<string, any> = {}
  for (const part of formData) {
    if (part.filename) {
      if (part.name) files[part.name] = part
    } else if (part.name) {
      fields[part.name] = part.data?.toString() || ''
    }
  }

  // Проверка обязательных файлов
  const requiredFiles = ['mainImage', 'thumbnail']
  for (const name of requiredFiles) {
    if (!files[name] || !files[name].data || (files[name].data?.length || 0) === 0) {
      throw createError({ statusCode: 400, statusMessage: `Отсутствует обязательный файл: ${name}` })
    }
  }

  // Автогенерация slug
  if (!fields.slug) {
    let transliterated = transliterate(fields.title || '')
    fields.slug = transliterated
      .toLowerCase()
      .trim()
      .replace(/[\s\W]+/g, '-') 
      .replace(/^-+|-+$/g, '')  
      .replace(/-+/g, '-')      
  }

  // Валидация обязательных полей
  const requiredFields: Array<keyof typeof fields> = [
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
    // Вставка кейса
    const newCase = await db.insert(portfolioCases).values({
      title: fields.title || '',
      slug: fields.slug || '',
      category: sql<string>`${fields.category}`,
      objectDescription: fields.objectDescription || '',
      shortObject: fields.shortObject || '',
      space: sql<number>`${parseFloat(fields.space || '0')}`,
      duration: fields.duration || '',
      people: fields.people || '',
      shortDescription: fields.shortDescription || '',
      fullDescription: fields.fullDescription || null,
      result: fields.result || null,
      metaTitle: fields.metaTitle || null,
      metaDescription: fields.metaDescription || null,
      metaKeywords: fields.metaKeywords || null,
      address: String(fields.address || 'Не указано'),
      isPublished: true
    }).$returningId()

    if (!newCase[0] || !newCase[0].id) {
      throw createError({ statusCode: 500, statusMessage: 'Ошибка получения ID кейса' })
    }

    const caseId = newCase[0].id

    if (!fields.slug && newCase[0]?.id) {
      fields.slug = newCase[0].id.toString()
    }

    // Функция сохранения изображений
    const saveImage = async (file: any, type: ImageType, pairGroup?: string, order: number = 0) => {
      try {
        if (!file || !file.data) {
          throw new Error(`Файл не передан для типа ${type}`)
        }

        const ext = file.filename?.split('.').pop()?.toLowerCase() || 'jpg'
        if (!allowedExt.includes(ext)) {
          throw createError({ statusCode: 400, statusMessage: `Недопустимый формат файла: ${ext}` })
        }

        const caseDir = join(UPLOAD_DIR_BASE, `case-${caseId}`)
        mkdirSync(caseDir, { recursive: true }) // ← синхронно

        const filename = `${randomUUID()}.${ext}`
        const filePath = join(caseDir, filename)

        writeFileSync(filePath, Buffer.from(file.data)) // ← синхронно

        await db.insert(portfolioImages).values({
          caseId,
          url: `/uploads/case-${caseId}/${filename}`,
          type,
          pairGroup: pairGroup || undefined,
          alt: `${type} фото с объекта ремонта и отделке помещения для кейса ${caseId}`,
          order
        })
      } catch (error) {
        console.error(`Ошибка при сохранении изображения (${type}):`, error)
      }
    }

    // Сохраняем основные изображения
    await saveImage(files.mainImage, 'main', undefined, 0)
    await saveImage(files.thumbnail, 'thumbnail', undefined, 1)

    // Пары "до/после"
    const beforeFiles = formData
      .filter(f => f.name?.startsWith('beforeImage[') && f.filename)
      .map(f => {
        const index = parseInt(f.name!.match(/\d+/)?.[0] || '-1')
        return { index, file: f }
      })
      .filter(item => item.index >= 0)
      .sort((a, b) => a.index - b.index)

    const afterFiles = formData
      .filter(f => f.name?.startsWith('afterImage[') && f.filename)
      .map(f => {
        const index = parseInt(f.name!.match(/\d+/)?.[0] || '-1')
        return { index, file: f }
      })
      .filter(item => item.index >= 0)
      .sort((a, b) => a.index - b.index)

    const maxLen = Math.max(beforeFiles.length, afterFiles.length)
    for (let i = 0; i < maxLen; i++) {
      const beforeFile = beforeFiles.find(f => f.index === i)
      const afterFile = afterFiles.find(f => f.index === i)

      const pairGroup = `pair-${i}` // уникальная группа для каждой пары

      if (beforeFile) {
        await saveImage(beforeFile.file, 'before', pairGroup, i)
      }
      if (afterFile) {
        await saveImage(afterFile.file, 'after', pairGroup, i)
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
        if (index >= 0) {
          galleryTypes[index] = value
        }
      }
    })

    for (let i = 0; i < galleryFiles.length; i++) {
      const type = galleryTypes[i] ?? 'after'
      await saveImage(galleryFiles[i], type as ImageType, undefined, i)
    }

    // Виды работ
    const workTypes: string[] = []
    const progressValues: number[] = []

    for (const key of Object.keys(fields)) {
      if (key.startsWith('workType[')) {
        const idx = parseInt(key.match(/\d+/)?.[0] ?? '-1', 10)
        if (idx >= 0) workTypes[idx] = fields[key] ?? ''   // <- дефолтим
      }
      if (key.startsWith('progress[')) {
        const idx = parseInt(key.match(/\d+/)?.[0] ?? '-1', 10)
        if (idx >= 0) {
          const raw = (fields[key] ?? '').trim()
          const num = parseInt(raw || '0', 10)
          progressValues[idx] = Number.isFinite(num) ? num : 0
        }
      }
    }

    const worksToInsert = workTypes
      .map((type, i) => ({
        workType: type?.trim() ?? '',
        progress: progressValues[i] || 0
      }))
      .filter(w => w.workType)

    if (worksToInsert.length > 0) {
      await db.insert(portfoCaseWorks).values(
        worksToInsert.map(({ workType, progress }) => ({
          caseId,
          workType,
          progress: Math.min(100, Math.max(0, progress))
        }))
      )
    } else {
      await db.insert(portfoCaseWorks).values({
        caseId,
        workType: 'Отделочные работы',
        progress: 100
      })
    }

    return { id: caseId, slug: fields.slug }
  } catch (error) {
    console.error('Ошибка при создании кейса:', error)
    throw createError({ statusCode: 500, statusMessage: 'Ошибка при создании кейса' })
  }
})

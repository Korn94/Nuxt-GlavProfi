// server/api/portfolio/index.post.ts
import { eventHandler, createError, readMultipartFormData } from 'h3'
import { db } from '../../db'
import { portfolioCases, portfolioImages, portfoCaseWorks } from '../../db/schema'
import { verifyAuth } from '~/server/utils/auth'
import { randomUUID } from 'crypto'
import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import { sql } from 'drizzle-orm'
import { transliterate } from '~/server/utils/transliteration'

// Базовая директория для загрузки
const UPLOAD_DIR_BASE = join(process.cwd(), 'public', 'uploads')
mkdirSync(UPLOAD_DIR_BASE, { recursive: true }) // <-- Создаём uploads, если нет

// Разрешённые типы изображений
const validImageTypes = ['main', 'thumbnail', 'before', 'after'] as const
type ImageType = typeof validImageTypes[number]
function isValidImageType(type: string): type is ImageType {
  return validImageTypes.includes(type as ImageType)
}

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
    // Сначала транслитерируем, затем обрабатываем дефисы
    let transliterated = transliterate(fields.title)
    fields.slug = transliterated
      .toLowerCase()
      .trim()
      .replace(/[\s\W]+/g, '-') // Заменяем пробелы и не-слова на дефис
      .replace(/^-+|-+$/g, '')  // Убираем дефисы в начале и конце
      .replace(/-+/g, '-')      // Заменяем множественные дефисы на один
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
      title: fields.title,
      slug: fields.slug,
      category: sql<string>`${fields.category}`,
      objectDescription: fields.objectDescription,
      shortObject: fields.shortObject,
      space: sql<number>`${parseFloat(fields.space)}`,
      duration: fields.duration,
      people: fields.people,
      shortDescription: fields.shortDescription,
      fullDescription: fields.fullDescription || null,
      result: fields.result || null,
      metaTitle: fields.metaTitle || null,
      metaDescription: fields.metaDescription || null,
      metaKeywords: fields.metaKeywords || null,
      address: fields.address || 'Не указано',
      isPublished: true
    }).$returningId()

    if (!newCase[0] || !newCase[0].id) {
      throw createError({ statusCode: 500, statusMessage: 'Ошибка получения ID кейса' })
    }

    const caseId = newCase[0].id

    // Если slug всё ещё пустой после обработки — используем ID как резерв
    if (!fields.slug) {
      fields.slug = newCase[0].id.toString() // <-- Используем ID кейса как slug
    }

    // Функция сохранения изображений
    const saveImage = async (file: any, type: ImageType, pairGroup?: string) => {
      try {
        if (!file || !file.data) {
          throw new Error(`Файл не передан для типа ${type}`)
        }

        // Создаём подпапку для кейса
        const caseDir = join(UPLOAD_DIR_BASE, `case-${caseId}`)
        mkdirSync(caseDir, { recursive: true })

        // Генерируем уникальное имя файла
        const ext = file.filename?.split('.').pop() || 'jpg'
        const filename = `${randomUUID()}.${ext}`
        const filePath = join(caseDir, filename)

        // Сохраняем файл
        writeFileSync(filePath, Buffer.from(file.data))

        // Вставляем в БД
        await db.insert(portfolioImages).values({
          caseId,
          url: `/uploads/case-${caseId}/${filename}`,
          type,
          pairGroup: pairGroup || undefined,
          alt: `${type} фото с объекта ремонта и отделке помещения для кейса ${caseId}`,
          order: 0
        })
      } catch (error) {
        console.error(`Ошибка при сохранении изображения (${type}):`, error)
      }
    }

    // Сохраняем основные изображения
    await saveImage(files.mainImage, 'main')
    await saveImage(files.thumbnail, 'thumbnail')

    // Пары "до/после"
    const beforeFiles = formData.filter(f => f.name === 'beforeImage' && f.filename)
    const afterFiles = formData.filter(f => f.name === 'afterImage' && f.filename)

    // Определяем группу
    const pairGroup = fields.pairGroup || `Сравнение фото - ${Math.floor(Date.now() / 1000) % 10000}`

    // Сохраняем пары
    const maxLen = Math.max(beforeFiles.length, afterFiles.length)
    for (let i = 0; i < maxLen; i++) {
      if (beforeFiles[i]) {
        await saveImage(beforeFiles[i], 'before', pairGroup)
      }
      if (afterFiles[i]) {
        await saveImage(afterFiles[i], 'after', pairGroup)
      }
    }

    // Получите типы фото из формы
    const galleryFiles = Object.entries(files)
      .filter(([key]) => key.startsWith('gallery['))
      .map(([, value]) => value)

    const galleryTypes: Record<string, string> = {}
    Object.entries(fields).forEach(([key, value]) => {
      if (key.startsWith('galleryType[')) {
        galleryTypes[key] = value
      }
    })

    let galleryIndex = 0
    for (const file of galleryFiles) {
      const typeKey = `galleryType[${galleryIndex}]`
      const type = galleryTypes[typeKey] || 'after'
      await saveImage(file, type as ImageType)
      galleryIndex++
    }

    // Получаем виды работ из формы
    const workTypes = []
    const progressValues: any[] = []

    for (const key of Object.keys(fields)) {
      if (key.startsWith('workType[')) {
        const match = key.match(/\d+/)
        if (match) {
          const idx = parseInt(match[0])
          workTypes[idx] = fields[key]
        }
      }
      if (key.startsWith('progress[')) {
        const match = key.match(/\d+/)
        if (match) {
          const idx = parseInt(match[0])
          progressValues[idx] = parseInt(fields[key])
        }
      }
    }

    // Фильтруем и валидируем
    const worksToInsert = workTypes
      .map((type, i) => ({
        workType: type?.trim(),
        progress: progressValues[i] || 0
      }))
      .filter(w => w.workType)

    // Вставляем работы
    if (worksToInsert.length > 0) {
      await db.insert(portfoCaseWorks).values(
        worksToInsert.map(({ workType, progress }) => ({
          caseId,
          workType,
          progress: Math.min(100, Math.max(0, progress))
        }))
      )
    } else {
      // Если не указано — оставить хотя бы одну заглушку
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

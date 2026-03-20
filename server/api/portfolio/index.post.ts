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
import { validateImage } from '../../utils/imageValidation'

const UPLOAD_DIR_BASE = join(process.cwd(), 'public', 'uploads')
mkdirSync(UPLOAD_DIR_BASE, { recursive: true })

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
  }

  // Валидируем пары before/after
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

    // ───────── СОХРАНЕНИЕ ИЗОБРАЖЕНИЙ ─────────
    const saveImage = async (file: any, type: string, pairGroup?: string, order: number = 0) => {
      try {
        if (!file?.data) throw new Error(`Файл не передан для типа ${type}`)

        const validation = validateImage(file)
        if (!validation.valid) {
          throw createError({ statusCode: 400, statusMessage: validation.error! })
        }

        const ext = file.filename?.split('.').pop()?.toLowerCase() || 'jpg'
        const caseDir = join(UPLOAD_DIR_BASE, `case-${caseId}`)
        mkdirSync(caseDir, { recursive: true })

        const filename = `${randomUUID()}.${ext}`
        const filePath = join(caseDir, filename)
        writeFileSync(filePath, Buffer.from(file.data))

        await db.insert(portfolioImages).values({
          caseId,
          url: `/uploads/case-${caseId}/${filename}`,
          type: type as 'main' | 'thumbnail' | 'gallery' | 'before' | 'after',
          pairGroup: pairGroup || undefined,
          alt: `${type} фото с объекта ремонта для кейса ${caseId}`,
          order
        })
      } catch (error) {
        console.error(`Ошибка при сохранении изображения (${type}):`, error)
      }
    }

    // Основные изображения
    await saveImage(files.mainImage, 'main', undefined, 0)
    await saveImage(files.thumbnail, 'thumbnail', undefined, 1)

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

      if (beforeFile) await saveImage(beforeFile.file, 'before', pairGroup, i)
      if (afterFile) await saveImage(afterFile.file, 'after', pairGroup, i)
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
      await saveImage(galleryFiles[i], type, undefined, i)
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

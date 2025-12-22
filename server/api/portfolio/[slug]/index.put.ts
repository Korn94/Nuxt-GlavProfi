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

const UPLOAD_DIR_BASE = join(process.cwd(), 'public', 'uploads')
mkdirSync(UPLOAD_DIR_BASE, { recursive: true })

const allowedExt = ['jpg', 'jpeg', 'png', 'webp']

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

  // ───────── FORM DATA ─────────
  const formData = await readMultipartFormData(event)
  if (!formData) {
    throw createError({ statusCode: 400, statusMessage: 'No form data' })
  }

  const fields: Record<string, string> = {}
  const files: Record<string, any> = {}
  const keepImageIds: number[] = []

  for (const part of formData) {
    // ✅ ФАЙЛ — ТОЛЬКО если есть filename
    if (part.filename && part.name) {
      files[part.name] = part
      continue
    }

    // ✅ ПОЛЕ
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

  console.log('DEBUG SERVER: IDs to keep:', idsToKeep)

  // ───────── SAVE IMAGE ─────────
  const saveImage = (file: any, type: string, order = 0, pairGroup: string | null = null) => {
    const ext = file.filename.split('.').pop()?.toLowerCase() || 'jpg'
    if (!allowedExt.includes(ext)) {
      throw createError({ statusCode: 400, statusMessage: `Bad image format: ${ext}` })
    }

    const dir = join(UPLOAD_DIR_BASE, `case-${existingCase.id}`)
    mkdirSync(dir, { recursive: true })

    const name = `${randomUUID()}.${ext}`
    const url = `/uploads/case-${existingCase.id}/${name}`
    const path = join(process.cwd(), 'public', url)

    writeFileSync(path, file.data)

    return {
      caseId: existingCase.id,
      url,
      type,
      pairGroup,
      alt: `${type} image`,
      order
    }
  }

  const imagesToInsert: any[] = []

  // ───────── MAIN IMAGE ─────────
  if (files.mainImage) {
    imagesToInsert.push(saveImage(files.mainImage, 'main', 0))
  }

  // ───────── THUMBNAIL ─────────
  if (files.thumbnail) {
    imagesToInsert.push(saveImage(files.thumbnail, 'thumbnail', 1))
  }

  // ───────── GALLERY ─────────
  let gi = 0
  while (files[`gallery[${gi}]`]) {
    imagesToInsert.push(
      saveImage(
        files[`gallery[${gi}]`],
        fields[`galleryType[${gi}]`] || 'after',
        100 + gi
      )
    )
    gi++
  }

  // ───────── BEFORE / AFTER ─────────
  let pi = 0
  while (files[`beforeImage[${pi}]`] || files[`afterImage[${pi}]`]) {
    const group = fields[`pairGroup[${pi}]`] || `pair-${pi}`

    if (files[`beforeImage[${pi}]`]) {
      imagesToInsert.push(saveImage(files[`beforeImage[${pi}]`], 'before', 200 + pi * 2, group))
    }

    if (files[`afterImage[${pi}]`]) {
      imagesToInsert.push(saveImage(files[`afterImage[${pi}]`], 'after', 201 + pi * 2, group))
    }

    pi++
  }

  // ───────── DELETE UNUSED ─────────
  const idsToDelete = existingImages
    .filter(img => !idsToKeep.includes(img.id))
    .map(img => img.id)

  if (idsToDelete.length) {
    for (const img of existingImages.filter(i => idsToDelete.includes(i.id))) {
      const p = join(process.cwd(), 'public', img.url)
      if (existsSync(p)) unlinkSync(p)
    }

    await db.delete(portfolioImages).where(
      and(
        eq(portfolioImages.caseId, existingCase.id),
        inArray(portfolioImages.id, idsToDelete)
      )
    )
  }

  if (imagesToInsert.length) {
    await db.insert(portfolioImages).values(imagesToInsert)
  }

  // ───────── UPDATE CASE ─────────
  if (!fields.slug && fields.title) {
    fields.slug = transliterate(fields.title)
      .toLowerCase()
      .replace(/[\s\W]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  await db.update(portfolioCases)
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
      isPublished: fields.isPublished === 'true',
      updatedAt: new Date()
    })
    .where(eq(portfolioCases.slug, slug))

  return {
    success: true,
    slug: fields.slug || slug
  }
})

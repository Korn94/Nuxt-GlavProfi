/**
 * 📍 Файл: `server/api/portfolio/index.post.ts`
 * 📍 Эндпоинт: `POST /api/portfolio`
 *
 * Назначение: Создание кейса + стриминговая загрузка изображений на диск.
 * ⚠️ Требует роль `admin` или `manager`
 *
 * 🛠 Что изменено (fix OOM + «мёртвые» файлы):
 * - Стриминговый разбор multipart через busboy и запись файлов СРАЗУ на диск
 *   (вместо readMultipartFormData, который держал всё тело запроса в RAM).
 * - Вся оптимизация (sharp) выполняется ВНЕ транзакции БД.
 * - Транзакция короткая: вставка кейса → перенос webp → INSERT картинок/работ.
 * - Гарантированная очистка: при ошибке удаляются и temp-папка, и папка кейса.
 */

import { eventHandler, createError, getRequestHeader, getRequestWebStream } from 'h3'
import { db } from '../../db'
import { portfolioCases, portfolioImages, portfoCaseWorks } from '../../db/schema'
import { verifyAuth } from '../../utils/auth'
import { randomUUID } from 'node:crypto'
import { join } from 'node:path'
import { sql } from 'drizzle-orm'
import { transliterate } from '../../utils/transliteration'
import { validateImage, allowedExt } from '../../utils/imageValidation'
import { logPortfolio } from '../../utils/fileLogger'
import busboy from 'busboy'
import sharp from 'sharp'
import { Readable } from 'node:stream'
import { createWriteStream } from 'node:fs'
import { mkdir, rm, rename, stat, open } from 'node:fs/promises'

const UPLOAD_DIR_BASE = '/var/www/glavprofi_ru_usr40/data/www/uploads'

// 🔥 Настройки оптимизации
const IMAGE_CONFIG = {
  maxWidth: 1920,
  webpQuality: 85,
  maxFileSize: 20 * 1024 * 1024,
  // Защита от «картинок-бомб» (огромных по пикселям изображений)
  maxInputPixels: 60 * 1000 * 1000
}

const readFirstBytes = async (filePath: string, n: number): Promise<Buffer> => {
  const fh = await open(filePath, 'r')
  try {
    const buf = Buffer.alloc(n)
    const { bytesRead } = await fh.read(buf, 0, n, 0)
    return buf.subarray(0, bytesRead)
  } finally {
    await fh.close()
  }
}

export default eventHandler(async (event) => {
  // ───────── AUTH ─────────
  const user = await verifyAuth(event)
  if (!['admin', 'manager'].includes(user.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  // ───────── MULTIPART HEADERS ─────────
  const contentType = getRequestHeader(event, 'content-type') || ''
  if (!contentType.startsWith('multipart/form-data')) {
    throw createError({ statusCode: 400, statusMessage: 'Expected multipart/form-data' })
  }
  const boundary = contentType.match(/boundary=([^;]*)(;|$)/i)?.[1]
  if (!boundary) {
    throw createError({ statusCode: 400, statusMessage: 'Boundary missing' })
  }

  // ───────── ВРЕМЕННАЯ ПАПКА ДЛЯ СТРИМИНГА ─────────
  const jobDir = join(UPLOAD_DIR_BASE, `tmp-${randomUUID()}`)
  await mkdir(jobDir, { recursive: true })

  const fields: Record<string, string> = {}
  const files: Record<string, string> = {} // имя поля -> путь к файлу на диске
  const originalFilenames: Record<string, string> = {}
  let caseDir: string | undefined = undefined

  const cleanup = async (removeCaseDir?: string) => {
    const targets = [jobDir]
    if (removeCaseDir) targets.push(removeCaseDir)
    await Promise.allSettled(
      targets.map(async (p): Promise<void> => {
        try { await rm(p, { recursive: true, force: true }) } catch { /* ignore */ }
      })
    )
  }

  try {
    // ───────── 1. СТРИМИНГОВЫЙ РАЗБОР MULTIPART → ДИСК ─────────
    await new Promise<void>((resolve, reject) => {
      const bb = busboy({
        headers: { 'content-type': contentType },
        limits: { fileSize: IMAGE_CONFIG.maxFileSize }
      })

      let fileIndex = 0
      bb.on('field', (name: string, val: string) => { fields[name] = val })

      bb.on('file', (name: string, stream: NodeJS.ReadableStream, info: any) => {
        // ⚠️ НЕ сохраняем квадратные скобки в имени файла: libvips/sharp трактует
        // `[N]` в пути как опцию последовательности/номера страницы, обрезает его
        // и падает с «Input file is missing» (поле `beforeImage[0]`, `gallery[2]`, …).
        // Уникальность даёт префикс f{fileIndex}_, а связь «имя поля → путь»
        // хранится в словаре `files`, поэтому читаемое имя в пути не обязательно.
        const safe = `f${fileIndex++}_` + (name.replace(/[^a-zA-Z0-9_.-]/g, '_') || 'file')
        const p = join(jobDir, safe)
        files[name] = p
        originalFilenames[name] = info.filename || name

        const ws = createWriteStream(p)
        stream.on('error', reject)
        ws.on('error', reject)
        // Превышен лимит размера файла — прерываем и отвечаем 400
        stream.on('limit', () => {
          ws.destroy()
          bb.destroy()
          reject(createError({
            statusCode: 400,
            statusMessage: `Файл ${info.filename} превышает максимальный размер ${IMAGE_CONFIG.maxFileSize / 1024 / 1024} МБ`
          }))
        })
        stream.pipe(ws)
      })

      bb.on('error', reject)
      bb.on('close', resolve)

      const webBody = getRequestWebStream(event)
      const src: NodeJS.ReadableStream = webBody
        ? Readable.fromWeb(webBody as any)
        : event.node.req as unknown as NodeJS.ReadableStream
      src.on('error', reject)
      src.pipe(bb)
    })

    await logPortfolio('INFO', 'streaming-complete', {
      fieldsCount: Object.keys(fields).length,
      filesCount: Object.keys(files).length
    })

    // ───────── 2. ПРОВЕРКА ОБЯЗАТЕЛЬНЫХ ФАЙЛОВ И СЛАГ ─────────
    for (const name of ['mainImage', 'thumbnail']) {
      if (!files[name]) {
        throw createError({ statusCode: 400, statusMessage: `Отсутствует обязательный файл: ${name}` })
      }
    }

    if (!fields.slug) {
      const transliterated = transliterate(fields.title || '')
      fields.slug = transliterated
        .toLowerCase()
        .trim()
        .replace(/[\s\W]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .replace(/-+/g, '-')
    }

    const requiredFields = [
      'title', 'slug', 'category',
      'objectDescription', 'shortObject',
      'space', 'duration', 'people', 'shortDescription'
    ]
    for (const f of requiredFields) {
      if (!fields[f]) {
        throw createError({ statusCode: 400, statusMessage: `Missing required field: ${f}` })
      }
    }

    // Валидация файла на диске: размер + расширение + magic bytes
    const validateDiskImage = async (name: string) => {
      const p = files[name]
      const origName = originalFilenames[name]
      if (!p || !origName) {
        throw createError({ statusCode: 400, statusMessage: `Не удалось сохранить файл: ${name}` })
      }
      const { size } = await stat(p)
      if (size > IMAGE_CONFIG.maxFileSize) {
        throw createError({
          statusCode: 400,
          statusMessage: `Файл ${origName} слишком большой. Максимум ${IMAGE_CONFIG.maxFileSize / 1024 / 1024} МБ`
        })
      }
      const ext = (origName.split('.').pop() || '').toLowerCase()
      if (!allowedExt.includes(ext)) {
        throw createError({ statusCode: 400, statusMessage: `Недопустимый формат файла: ${ext}` })
      }
      const magic = await readFirstBytes(p, 16)
      const v = validateImage({ data: magic, filename: origName })
      if (!v.valid) {
        throw createError({ statusCode: 400, statusMessage: v.error || 'Недопустимое изображение' })
      }
    }

    // ───────── 3. ОПТИМИЗАЦИЯ ВНЕ ТРАНЗАКЦИИ (только диск) ─────────
    type Prepared = {
      type: string
      order: number
      pairGroup?: string
      filename: string
    }
    const prepared: Prepared[] = []

    const optimizeToJobDir = async (
      field: string,
      type: string,
      order: number,
      pairGroup?: string
    ): Promise<void> => {
      await validateDiskImage(field)
      const src = files[field]

      let inst = sharp(src, { limitInputPixels: IMAGE_CONFIG.maxInputPixels })
      const meta = await inst.metadata()
      const w = meta.width || 0
      const h = meta.height || 0
      if (w > IMAGE_CONFIG.maxWidth || h > IMAGE_CONFIG.maxWidth) {
        inst = inst.resize({
          width: IMAGE_CONFIG.maxWidth,
          height: IMAGE_CONFIG.maxWidth,
          fit: 'inside',
          withoutEnlargement: true
        })
      }

      const filename = `${randomUUID()}.webp`
      await inst
        .rotate()
        .webp({ quality: IMAGE_CONFIG.webpQuality })
        .toFile(join(jobDir, filename))

      prepared.push({ type, order, pairGroup, filename })
    }

    // Задачи в правильном порядке (последовательно — память не растёт)
    const taskList: Array<() => Promise<void>> = []
    taskList.push(() => optimizeToJobDir('mainImage', 'main', 0))
    taskList.push(() => optimizeToJobDir('thumbnail', 'thumbnail', 1))

    const pairIdx = new Set<number>()
    Object.keys(files).forEach((k) => {
      const m = k.match(/^(beforeImage|afterImage)\[(\d+)\]$/)
      if (m) pairIdx.add(parseInt(m[2]!, 10))
    })
    ;[...pairIdx].sort((a, b) => a - b).forEach((i) => {
      if (files[`beforeImage[${i}]`]) taskList.push(() => optimizeToJobDir(`beforeImage[${i}]`, 'before', 2 + i * 2, `pair-${i}`))
      if (files[`afterImage[${i}]`]) taskList.push(() => optimizeToJobDir(`afterImage[${i}]`, 'after', 3 + i * 2, `pair-${i}`))
    })

    const galleryKeys = Object.keys(files)
      .filter((k) => /^gallery\[\d+\]$/.test(k))
      .sort((a, b) => parseInt((a.match(/\d+/) || ['0'])[0]!, 10) - parseInt((b.match(/\d+/) || ['0'])[0]!, 10))
    galleryKeys.forEach((k) => {
      const idx = parseInt((k.match(/\d+/) || ['0'])[0]!, 10)
      const gtype = fields[`galleryType[${idx}]`] || 'after'
      taskList.push(() => optimizeToJobDir(k, gtype, 100 + idx))
    })

    for (const t of taskList) await t()

    await logPortfolio('INFO', 'optimization-complete', {
      imagesPrepared: prepared.length
    })

    // ───────── 4. КОРОТКАЯ ТРАНЗАКЦИЯ БД ─────────
    const result = await db.transaction(async (tx) => {
      const [newCase]: any = await tx.insert(portfolioCases).values({
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

      if (!newCase?.id) {
        throw createError({ statusCode: 500, statusMessage: 'Ошибка получения ID кейса' })
      }
      const caseId = newCase.id
      caseDir = join(UPLOAD_DIR_BASE, `case-${caseId}`)
      await mkdir(caseDir, { recursive: true })

      // Переносим webp из temp-папки в папку кейса и формируем строки вставки
      const imagesToInsert: any[] = []
      for (const p of prepared) {
        await rename(join(jobDir, p.filename), join(caseDir, p.filename))
        const row: any = {
          caseId,
          url: `/uploads/case-${caseId}/${p.filename}`,
          type: p.type,
          alt: `${p.type} фото с объекта ремонта для кейса ${caseId}`,
          order: p.order
        }
        if (p.pairGroup) row.pairGroup = p.pairGroup
        imagesToInsert.push(row)
      }

      if (imagesToInsert.length > 0) {
        await tx.insert(portfolioImages).values(imagesToInsert)
      }

      // Работы
      const workTypes: string[] = []
      const workValues: string[] = []
      Object.keys(fields).forEach((key) => {
        const mT = key.match(/^workType\[(\d+)\]$/)
        if (mT) workTypes[parseInt(mT[1]!, 10)] = fields[key] ?? ''
        const mV = key.match(/^workValue\[(\d+)\]$/)
        if (mV) workValues[parseInt(mV[1]!, 10)] = fields[key] ?? ''
      })
      const worksToInsert = workTypes
        .map((t, i) => ({ workType: t?.trim() ?? '', value: workValues[i]?.trim() ?? '' }))
        .filter((w) => w.workType)

      if (worksToInsert.length > 0) {
        await tx.insert(portfoCaseWorks).values(
          worksToInsert.map(({ workType, value }) => ({ caseId, workType, value }))
        )
      } else {
        await tx.insert(portfoCaseWorks).values({
          caseId,
          workType: 'Отделка',
          value: ''
        })
      }

      return { id: caseId, slug: fields.slug }
    })

    // ✅ Успех — temp-папка больше не нужна
    await rm(jobDir, { recursive: true, force: true })
    await logPortfolio('INFO', 'case-created', {
      id: result.id,
      slug: result.slug,
      images: prepared.length
    })
    return result
  } catch (error: any) {
    // ❌ Ошибка — удаляем и temp-папку, и папку кейса (никаких мёртвых файлов)
    console.error('[Portfolio/Create] ❌ Ошибка при создании кейса:', error)
    await cleanup(caseDir)
    await logPortfolio('ERROR', 'case-create-failed', {
      message: error?.message || String(error),
      statusCode: error?.statusCode ?? null,
      stack: error?.stack?.toString?.() || null
    })
    if (error?.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: 'Ошибка при создании кейса' })
  }
})

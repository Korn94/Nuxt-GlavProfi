/**
 * 📍 Файл: `server/api/portfolio/[slug]/index.delete.ts`
 * 📍 Эндпоинт: `DELETE /api/portfolio/[slug]`
 *
 * Назначение: Полное удаление кейса + всех связанных данных + файлов с диска
 * ⚠️ Требует роль `admin` или `manager`
 *
 * Логика:
 * 1. Получаем все связанные изображения (URL для удаления с диска)
 * 2. В транзакции удаляем: работы → изображения → кейс (порядок важен из-за FK)
 * 3. После успешного COMMIT удаляем файлы с диска (async)
 * 4. Удаляем пустую папку кейса
 *
 * @param {string} slug — slug кейса (из пути)
 * @returns { success: boolean, deletedFiles: number, message: string }
 */

import { eventHandler, createError } from 'h3'
import { db } from '../../../db'
import { portfolioCases, portfolioImages, portfoCaseWorks } from '../../../db/schema'
import { eq } from 'drizzle-orm'
import { requireAuth } from '../../../utils/permissions'
import { unlink, rm, access } from 'node:fs/promises'
import { join } from 'node:path'

const UPLOAD_DIR_BASE = '/var/www/glavprofi_ru_usr40/data/www/uploads'

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

  // ───────── ПОЛУЧАЕМ КЕЙС ─────────
  const [existingCase] = await db
    .select()
    .from(portfolioCases)
    .where(eq(portfolioCases.slug, slug))

  if (!existingCase) {
    throw createError({ statusCode: 404, statusMessage: 'Case not found' })
  }

  // ───────── ПОЛУЧАЕМ ВСЕ ИЗОБРАЖЕНИЯ (для удаления с диска) ─────────
  // Read-only, можно вне транзакции
  const caseImages = await db
    .select({
      id: portfolioImages.id,
      url: portfolioImages.url,
      type: portfolioImages.type
    })
    .from(portfolioImages)
    .where(eq(portfolioImages.caseId, existingCase.id))

  // ✅ Всё в одной транзакции
  const result = await db.transaction(async (tx) => {
    // ───────── 1. УДАЛЯЕМ РАБОТЫ КЕЙСА (дочерние записи) ─────────
    await tx
      .delete(portfoCaseWorks)
      .where(eq(portfoCaseWorks.caseId, existingCase.id))

    // ───────── 2. УДАЛЯЕМ ИЗОБРАЖЕНИЯ КЕЙСА (дочерние записи) ─────────
    await tx
      .delete(portfolioImages)
      .where(eq(portfolioImages.caseId, existingCase.id))

    // ───────── 3. УДАЛЯЕМ САМ КЕЙС ─────────
    await tx
      .delete(portfolioCases)
      .where(eq(portfolioCases.id, existingCase.id))

    return {
      success: true,
      deletedImages: caseImages.length,
      message: 'Case deleted successfully'
    }
  })

  // ✅ ПОСЛЕ УСПЕШНОГО COMMIT — удаляем файлы с диска
  // Это вне транзакции, потому что:
  // - Если unlink упадёт — БД уже консистентна (записи удалены)
  // - Файлы-сироты безопаснее, чем битые ссылки в БД
  const caseDir = join(UPLOAD_DIR_BASE, `case-${existingCase.id}`)
  let deletedFilesCount = 0

  // 1. Удаляем все файлы изображений (основные + миниатюры)
  for (const img of caseImages) {
    try {
      const relativePath = img.url.replace('/uploads/', '')
      const physicalPath = join(UPLOAD_DIR_BASE, relativePath)

      if (await fileExists(physicalPath)) {
        await unlink(physicalPath)
        deletedFilesCount++
        console.log(`[Portfolio/Delete] 🗑️ Файл удалён: ${img.url}`)
      }

      // Миниатюра для главного фото
      if (img.type === 'main' && img.url.endsWith('.webp')) {
        const thumbPath = physicalPath.replace('.webp', '-thumb.webp')
        if (await fileExists(thumbPath)) {
          await unlink(thumbPath)
          deletedFilesCount++
          console.log(`[Portfolio/Delete] 🗑️ Миниатюра удалена: ${thumbPath}`)
        }
      }
    } catch (err: any) {
      // Логируем, но не прерываем — БД уже консистентна
      if (err.code !== 'ENOENT') {
        console.warn(`[Portfolio/Delete] ⚠️ Не удалось удалить файл: ${img.url}`, err)
      }
    }
  }

  // 2. Удаляем саму папку кейса (рекурсивно, если вдруг остались файлы)
  try {
    if (await fileExists(caseDir)) {
      await rm(caseDir, { recursive: true, force: true })
      console.log(`[Portfolio/Delete] 🗑️ Папка кейса удалена: ${caseDir}`)
    }
  } catch (err) {
    console.warn(`[Portfolio/Delete] ⚠️ Не удалось удалить папку кейса: ${caseDir}`, err)
  }

  console.log(`[Portfolio/Delete] ✅ Кейс "${slug}" полностью удалён. Файлов: ${deletedFilesCount}`)

  return {
    success: result.success,
    deletedImages: result.deletedImages,
    deletedFiles: deletedFilesCount,
    message: 'Case deleted successfully'
  }
})

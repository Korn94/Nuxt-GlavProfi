/**
 * 📍 Файл: `server/api/attachments/[id]/index.delete.ts`
 * 📍 Эндпоинт: `DELETE /api/attachments/[id]`
 *
 * Назначение: Удаление вложения (файла) с диска и из базы данных
 * ⚠️ Middleware уже проверил canDelete через PROTECTED_PATHS (dashboard.canDelete)
 * ⚠️ Дополнительная бизнес-логика: только admin ИЛИ загрузивший пользователь
 *
 * Логика:
 * - Сначала удаляем запись из БД (чтобы не осталось битых ссылок)
 * - Потом удаляем файл с диска (если не удалится — останется сирота, но не битая ссылка)
 * - Асинхронное удаление через fs.promises.unlink (не блокирует event loop)
 *
 * @param {string} id — ID вложения (из пути)
 * @returns { success: boolean, message: string }
 */
import { defineEventHandler, createError, getRouterParam } from 'h3'
import { db } from '../../../db'
import { boardsAttachments } from '../../../db/schema'
import { eq } from 'drizzle-orm'
import { unlink } from 'node:fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import type { DbUser } from '../../../utils/permissions'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '../..')

export default defineEventHandler(async (event) => {
  // ✅ Авторизация и базовые права уже проверены мидлваром
  const currentUser = event.context.user as DbUser
  if (!currentUser) {
    throw createError({ statusCode: 401, message: 'Не удалось получить данные текущего пользователя' })
  }

  const idParam = getRouterParam(event, 'id')
  if (!idParam || isNaN(Number(idParam))) {
    throw createError({ statusCode: 400, message: 'Некорректный ID вложения' })
  }
  const attachmentId = Number(idParam)

  // Проверка существования вложения
  const [attachment] = await db
    .select()
    .from(boardsAttachments)
    .where(eq(boardsAttachments.id, attachmentId))

  if (!attachment) {
    throw createError({ statusCode: 404, message: 'Вложение не найдено' })
  }

  // 🔐 Дополнительная проверка: админ ИЛИ загрузивший пользователь
  if (currentUser.role !== 'admin' && attachment.uploadedBy !== currentUser.id) {
    throw createError({ statusCode: 403, message: 'Нет прав на удаление' })
  }

  // ✅ 1. Сначала удаляем запись из БД
  await db.delete(boardsAttachments).where(eq(boardsAttachments.id, attachmentId))

  // ✅ 2. Потом удаляем файл с диска (асинхронно)
  const filePath = path.join(projectRoot, 'public', attachment.fileUrl)
  try {
    await unlink(filePath)
    console.log(`[Attachments] 🗑️ Файл удалён: ${filePath}`)
  } catch (err: any) {
    // Файл не найден или не удалось удалить — логируем, но не прерываем
    if (err.code === 'ENOENT') {
      console.warn(`[Attachments] ⚠️ Файл не найден (уже удалён?): ${filePath}`)
    } else {
      console.error(`[Attachments] ❌ Ошибка удаления файла: ${filePath}`, err)
    }
  }

  return { success: true, message: 'Вложение успешно удалено' }
})

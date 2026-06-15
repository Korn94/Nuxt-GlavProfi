/**
 * 📍 Файл: `server/api/attachments/[id]/index.delete.ts`
 * 📍 Эндпоинт: `DELETE /api/attachments/[id]`
 *
 * Назначение: Удаление вложения (файла) с диска и из базы данных
 * ⚠️ Требует аутентификацию + право `admin` ИЛИ быть загрузившим пользователем
 *
 * Логика:
 * - Сначала удаляем запись из БД (чтобы не осталось битых ссылок)
 * - Потом удаляем файл с диска (если не удалится — останется сирота, но не битая ссылка)
 * - Асинхронное удаление через fs.promises.unlink (не блокирует event loop)
 *
 * @param {string} id — ID вложения (из пути)
 * @returns { success: boolean, message: string }
 */

import { eventHandler, createError } from 'h3'
import { db } from '../../../db'
import { boardsAttachments } from '../../../db/schema'
import { eq } from 'drizzle-orm'
import { requireAuth } from '../../../utils/permissions'
import { unlink } from 'node:fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '../..')

export default eventHandler(async (event) => {
  // 🔐 Проверка аутентификации
  const user = await requireAuth(event)

  const id = event.context.params?.id
  if (!id || isNaN(Number(id))) {
    throw createError({ statusCode: 400, message: 'Некорректный ID вложения' })
  }
  
  const attachmentId = Number(id)

  // Проверка существования вложения
  const [attachment] = await db
    .select()
    .from(boardsAttachments)
    .where(eq(boardsAttachments.id, attachmentId))
  
  if (!attachment) {
    throw createError({ statusCode: 404, message: 'Вложение не найдено' })
  }

  // 🔐 Проверка прав: админ ИЛИ загрузивший пользователь
  if (user.role !== 'admin' && attachment.uploadedBy !== user.id) {
    throw createError({ statusCode: 403, message: 'Нет прав на удаление' })
  }

  // ✅ 1. Сначала удаляем запись из БД
  //    Если это упадёт — файл останется на диске (это безопасно)
  await db.delete(boardsAttachments).where(eq(boardsAttachments.id, attachmentId))

  // ✅ 2. Потом удаляем файл с диска (асинхронно)
  const filePath = path.join(projectRoot, 'public', attachment.fileUrl)
  
  try {
    await unlink(filePath)
    console.log(`[Attachments] 🗑️ Файл удалён: ${filePath}`)
  } catch (err: any) {
    // Файл не найден или не удалось удалить — логируем, но не прерываем
    // Запись в БД уже удалена, так что операция считается успешной
    if (err.code === 'ENOENT') {
      console.warn(`[Attachments] ⚠️ Файл не найден (уже удалён?): ${filePath}`)
    } else {
      console.error(`[Attachments] ❌ Ошибка удаления файла: ${filePath}`, err)
    }
  }

  return { success: true, message: 'Вложение успешно удалено' }
})

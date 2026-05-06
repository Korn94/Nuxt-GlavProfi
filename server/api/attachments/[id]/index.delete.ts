// server/api/attachments/[id]/index.delete.ts
/**
 * Назначение: Удаление вложения (файла) с диска и из базы данных
 * ⚠️ Требует аутентификацию + право `admin` ИЛИ быть загрузившим пользователем
 * 
 * @param {string} id — ID вложения (из пути)
 * @returns { success: boolean, message: string }
 */

import { eventHandler, createError } from 'h3'
import { db } from '../../../db'
import { boardsAttachments } from '../../../db/schema'
import { eq } from 'drizzle-orm'
import { requireAuth, requirePermission } from '../../../utils/permissions'
import fs from 'fs'
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

  // 🗑️ Удаление файла с диска
  const filePath = path.join(projectRoot, 'public', attachment.fileUrl)
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath)
  }

  // 🗑️ Удаление записи из БД
  await db.delete(boardsAttachments).where(eq(boardsAttachments.id, attachmentId))

  return { success: true, message: 'Вложение успешно удалено' }
})

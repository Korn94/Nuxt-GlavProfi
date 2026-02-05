// server/api/attachments/[id]/index.delete.ts
import { eventHandler, createError } from 'h3'
import { db } from '../../../db'
import { boardsAttachments } from '../../../db/schema'
import { eq } from 'drizzle-orm'
import { verifyAuth } from '../../../utils/auth'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// Получаем путь к директории проекта
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '../..')

export default eventHandler(async (event) => {
  try {
    // Проверяем аутентификацию
    const user = await verifyAuth(event)

    // Получаем ID вложения из параметров
    const id = event.context.params?.id

    if (!id || isNaN(Number(id))) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Некорректный ID вложения'
      })
    }

    const attachmentId = Number(id)

    // Проверяем, существует ли вложение
    const [attachment] = await db
      .select()
      .from(boardsAttachments)
      .where(eq(boardsAttachments.id, attachmentId))

    if (!attachment) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Вложение не найдено'
      })
    }

    // Проверяем права на удаление
    // Разрешаем удалять админам и пользователям, которые загрузили файл
    if (user.role !== 'admin' && attachment.uploadedBy !== user.id) {
      throw createError({
        statusCode: 403,
        statusMessage: 'У вас нет прав на удаление этого вложения'
      })
    }

    // Удаляем файл с диска
    const filePath = path.join(projectRoot, 'public', attachment.fileUrl)
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }

    // Удаляем запись из базы данных
    await db
      .delete(boardsAttachments)
      .where(eq(boardsAttachments.id, attachmentId))

    return {
      success: true,
      message: 'Вложение успешно удалено'
    }
  } catch (error) {
    console.error('Error deleting attachment:', error)
    
    if ('statusCode' in error) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to delete attachment'
    })
  }
})

// server/api/tasks/[id]/attachments/index.post.ts
import { eventHandler, createError } from 'h3'
import { db } from '../../../../db'
import { boardsAttachments } from '../../../../db/schema'
import { eq } from 'drizzle-orm'
import { verifyAuth } from '../../../../utils/auth'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// Получаем путь к директории проекта
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '../../../..')

// Директория для загрузки файлов
const UPLOAD_DIR = path.join(projectRoot, 'public', 'uploads', 'boards')

// Разрешённые типы файлов (расширения)
const ALLOWED_EXTENSIONS = {
  image: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'],
  document: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt'],
  video: ['.mp4', '.mov', '.avi', '.mkv'],
  other: []
}

// Максимальный размер файла (100 МБ)
const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100 MB

export default eventHandler(async (event) => {
  try {
    // Проверяем аутентификацию
    const user = await verifyAuth(event)

    // Получаем ID задачи из параметров
    const taskIdParam = event.context.params?.id

    if (!taskIdParam || isNaN(Number(taskIdParam))) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Некорректный ID задачи'
      })
    }

    const taskId = Number(taskIdParam)

    // Проверяем, существует ли задача
    const [task] = await db
      .select()
      .from(db.boardsTasks)
      .where(eq(db.boardsTasks.id, taskId))

    if (!task) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Задача не найдена'
      })
    }

    // Получаем форму данных
    const formData = await readMultipartFormData(event)

    if (!formData || formData.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Файл не найден в запросе'
      })
    }

    // Обрабатываем каждый файл
    const uploadedFiles = []

    for (const fileData of formData) {
      // Пропускаем не-файловые поля
      if (!fileData.filename || !fileData.data) {
        continue
      }

      // Получаем оригинальное имя файла
      const originalFilename = fileData.filename
      const fileBuffer = fileData.data

      // Проверяем размер файла
      if (fileBuffer.length > MAX_FILE_SIZE) {
        throw createError({
          statusCode: 400,
          statusMessage: `Файл "${originalFilename}" превышает максимальный размер (100 МБ)`
        })
      }

      // Определяем расширение файла
      const ext = path.extname(originalFilename).toLowerCase()
      const baseName = path.basename(originalFilename, ext)

      // Определяем тип файла
      let fileType: 'image' | 'document' | 'video' | 'other' = 'other'

      if (ALLOWED_EXTENSIONS.image.includes(ext)) {
        fileType = 'image'
      } else if (ALLOWED_EXTENSIONS.document.includes(ext)) {
        fileType = 'document'
      } else if (ALLOWED_EXTENSIONS.video.includes(ext)) {
        fileType = 'video'
      }

      // Создаём уникальное имя файла
      const timestamp = Date.now()
      const randomString = Math.random().toString(36).substring(2, 8)
      const uniqueFilename = `${baseName}_${timestamp}_${randomString}${ext}`
      const safeFilename = uniqueFilename.replace(/[^a-zA-Z0-9._-]/g, '_')

      // Создаём директорию для загрузки, если её нет
      const uploadPath = path.join(UPLOAD_DIR, fileType)
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true })
      }

      // Полный путь к файлу
      const filePath = path.join(uploadPath, safeFilename)

      // Сохраняем файл на диск
      fs.writeFileSync(filePath, fileBuffer)

      // URL для доступа к файлу
      const fileUrl = `/uploads/boards/${fileType}/${safeFilename}`

      // Создаём запись в базе данных
      const [attachment] = await db
        .insert(boardsAttachments)
        .values({
          taskId: taskId,
          fileUrl: fileUrl,
          fileType: fileType,
          fileName: originalFilename,
          fileSize: fileBuffer.length,
          uploadedBy: user.id
        })
        .returning()

      uploadedFiles.push({
        ...attachment,
        fileUrl: fileUrl
      })
    }

    if (uploadedFiles.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Не удалось загрузить файлы'
      })
    }

    return {
      success: true,
      attachments: uploadedFiles,
      message: `Загружено ${uploadedFiles.length} файл(ов)`
    }
  } catch (error) {
    console.error('Error uploading attachments:', error)
    
    if ('statusCode' in error) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to upload attachments'
    })
  }
})

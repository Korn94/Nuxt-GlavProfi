// server/api/portfolio/[slug]/works/index.post.ts
import { eventHandler, createError, readBody } from 'h3'
import { db } from '../../../../db'
import { portfoCaseWorks, portfolioCases } from '../../../../db/schema'
import { eq } from 'drizzle-orm'
import { verifyAuth } from '../../../../utils/auth'

export default eventHandler(async (event) => {
  const user = await verifyAuth(event)
  if (!['admin', 'manager'].includes(user.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  // Проверка params и id
  const params = event.context.params
  if (!params || !params.id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing case ID in request parameters'
    })
  }

  const caseId = parseInt(params.id)

  // Проверка, что ID — это число
  if (isNaN(caseId)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Case ID must be a valid number'
    })
  }

  const body = await readBody(event)
  const { workType, progress } = body

  // Проверка обязательных полей
  if (!workType || progress === undefined) {
    throw createError({ statusCode: 400, statusMessage: 'Missing required fields' })
  }

  // Список допустимых типов работ
  const validWorkTypes = [
    'Демонтаж',
    'Перегородки ГКЛ',
    'Перегородки',
    'Плитка',
    'Электромонтаж',
    'Стяжка',
    'Поддоконники',
    'Кладочные работы',
    'Бетонные работы',
    'Отделочные работы',
    'Черновые работы',
    'Покраска',
    'Штукатурка',
    'Шпаклёвка',
    'Кровля',
    'Фасадные работы',
    'Утепление',
    'Гидроизоляция',
    'Сантехника',
    'Полы',
    'Окна',
    'Двери',
    'Потолки',
    'Сверочные работы',
    'Покрытие полов',
    'Монтаж металлоконструкций',
    'Террасная доска'
  ]

  // Проверка, что workType входит в enum
  if (!validWorkTypes.includes(workType)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid work type' })
  }

  // Проверка, что кейс существует
  const [caseExists] = await db
    .select()
    .from(portfolioCases)
    .where(eq(portfolioCases.id, caseId))

  if (!caseExists) {
    throw createError({ statusCode: 404, statusMessage: 'Case not found' })
  }

  // Добавление новой работы
  const [newWork] = await db
    .insert(portfoCaseWorks)
    .values({
      caseId,
      workType,
      progress,
      order: 0 // По умолчанию 0, можно обновить позже
    })
    .$returningId()

  return newWork
})

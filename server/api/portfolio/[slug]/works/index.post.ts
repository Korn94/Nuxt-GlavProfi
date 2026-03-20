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

  const params = event.context.params
  if (!params || !params.slug) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing case slug in request parameters'
    })
  }

  const slug = params.slug

  const [caseExists] = await db
    .select()
    .from(portfolioCases)
    .where(eq(portfolioCases.slug, slug))

  if (!caseExists) {
    throw createError({ statusCode: 404, statusMessage: 'Case not found' })
  }

  const caseId = caseExists.id

  const body = await readBody(event)
  const { workType, progress } = body

  if (!workType || progress === undefined) {
    throw createError({ statusCode: 400, statusMessage: 'Missing required fields' })
  }

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

  if (!validWorkTypes.includes(workType)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid work type' })
  }

  const [newWork] = await db
    .insert(portfoCaseWorks)
    .values({
      caseId,
      workType,
      progress,
      order: 0
    })
    .$returningId()

  return newWork
})

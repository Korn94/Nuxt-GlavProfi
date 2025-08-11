// server/api/portfolio/index.get.ts
import { eventHandler, createError, getQuery } from 'h3'
import { db } from '../../db'
import { portfolioCases, portfolioImages, portfoCaseWorks } from '../../db/schema'
import { eq, and, inArray, sql } from 'drizzle-orm'

// Допустимые категории
const validCategories = [
  'Все',
  'Кафе',
  'Магазины',
  'Клиники',
  'Банки',
  'Фитнес',
  'Производственные',
  'Фасады и Кровля',
  'Прочее'
] as const

type Category = Exclude<typeof validCategories[number], 'Все'>

export default eventHandler(async (event) => {
  const query = getQuery(event)
  const pageStr = query.page as string | undefined
  const limitStr = query.limit as string | undefined
  const category = query.category as string | undefined

  const page = Math.max(1, pageStr ? parseInt(pageStr) : 1)
  const limit = limitStr ? parseInt(limitStr) : 12
  const offset = (page - 1) * limit

  if (isNaN(page) || isNaN(limit) || limit < 1) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid page or limit' })
  }

  // Проверка категории
  let categoryFilter: Category | undefined = undefined
  if (category && category !== 'Все' && validCategories.includes(category as any)) {
    categoryFilter = category as Category
  }

  // 1. Подсчёт общего количества опубликованных кейсов
  const [countResult] = await db
    .select({
      count: sql<number>`COUNT(*)`.as('count')
    })
    .from(portfolioCases)
    .where(
      and(
        eq(portfolioCases.isPublished, true),
        categoryFilter ? eq(portfolioCases.category, categoryFilter) : undefined
      )
    )

  const total = countResult?.count ?? 0
  const totalPages = Math.ceil(total / limit)

  if (total === 0) {
    return {
      data: [],
      meta: { page, limit, total, totalPages }
    }
  }

  // 2. Получаем ID кейсов для текущей страницы
  const idQuery = db
    .select({ id: portfolioCases.id })
    .from(portfolioCases)
    .where(
      and(
        eq(portfolioCases.isPublished, true),
        categoryFilter ? eq(portfolioCases.category, categoryFilter) : undefined
      )
    )
    .limit(limit)
    .offset(offset)
    .orderBy(portfolioCases.order, portfolioCases.id)

  const caseIdsResult = await idQuery
  const caseIds = caseIdsResult.map(c => c.id)

  if (caseIds.length === 0) {
    return {
      data: [],
      meta: { page, limit, total, totalPages }
    }
  }

  // 3. Загружаем только нужные поля кейсов
  const cases = await db
    .select({
      id: portfolioCases.id,
      title: portfolioCases.title,
      space: portfolioCases.space,
      category: portfolioCases.category,
      order: portfolioCases.order,
      slug: portfolioCases.slug
    })
    .from(portfolioCases)
    .where(inArray(portfolioCases.id, caseIds))
    .orderBy(portfolioCases.order)

  // 4. Загружаем только нужные поля изображений
  const images = await db
    .select({
      id: portfolioImages.id,
      caseId: portfolioImages.caseId,
      url: portfolioImages.url,
      type: portfolioImages.type
    })
    .from(portfolioImages)
    .where(inArray(portfolioImages.caseId, caseIds))
    .orderBy(portfolioImages.order)

  // 5. Загружаем только нужные поля работ
  const works = await db
    .select({
      id: portfoCaseWorks.id,
      caseId: portfoCaseWorks.caseId,
      workType: portfoCaseWorks.workType,
      progress: portfoCaseWorks.progress
    })
    .from(portfoCaseWorks)
    .where(inArray(portfoCaseWorks.caseId, caseIds))
    .orderBy(portfoCaseWorks.order)

  // 6. Группируем данные по кейсам
  const casesMap = new Map()
  cases.forEach(c => {
    casesMap.set(c.id, { ...c, images: [], works: [] })
  })

  images.forEach(img => {
    if (casesMap.has(img.caseId)) {
      casesMap.get(img.caseId).images.push({
        id: img.id,
        url: img.url,
        type: img.type
      })
    }
  })

  works.forEach(w => {
    if (casesMap.has(w.caseId)) {
      casesMap.get(w.caseId).works.push({
        id: w.id,
        workType: w.workType,
        progress: w.progress
      })
    }
  })

  // 7. Возвращаем результат
  return {
    data: Array.from(casesMap.values()),
    meta: {
      page,
      limit,
      total,
      totalPages
    }
  }
})

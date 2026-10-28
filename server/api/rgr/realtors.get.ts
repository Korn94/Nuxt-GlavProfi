// server/api/rgr/realtors.get.ts
/**
 * 📍 Эндпоинт: GET /api/rgr/realtors?page=1&fresh=1
 *
 * Назначение:
 * - Отдать листинг аттестованных риэлторов Рязани с reestr.rgr.ru (без телефонов).
 * - Используется блоком RgrRealtors на /cabinet/testpage2 для таблицы и пагинации.
 * - Телефоны подтягиваются отдельно и «по требованию»: GET /api/rgr/phones.
 *
 * 🔐 Доступ: право test.view (см. PROTECTED_PATHS в server/middleware/auth.ts).
 *
 * @returns { page, totalPages, totalSpecialists, sourceUrl, fetchedAt, cached, items: RgrRealtor[] }
 *
 * Кэш: 5 минут на страницу (листинг меняется редко); `fresh=1` — обойти кэш.
 */
import { defineEventHandler, createError, getQuery } from 'h3'
import { getRealtorsPage, clampListPage } from '../../utils/rgrRealtors'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  const rawPage = query.page === undefined || query.page === '' ? 1 : Number.parseInt(String(query.page), 10)
  if (!Number.isInteger(rawPage) || rawPage < 1) {
    throw createError({ statusCode: 400, statusMessage: 'Параметр page должен быть положительным числом' })
  }

  const page = clampListPage(rawPage)
  const fresh = query.fresh === '1' || query.fresh === 'true'

  try {
    return await getRealtorsPage(page, { fresh })
  } catch (error: any) {
    console.error('[API/RGR] ❌ Не удалось получить листинг риелторов:', error?.message)
    throw createError({
      statusCode: 502,
      statusMessage: error?.message || 'Реестр РГР недоступен'
    })
  }
})

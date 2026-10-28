// server/api/rgr/phones.get.ts
/**
 * 📍 Эндпоинт: GET /api/rgr/phones?page=1&indices=0,3,5&fresh=1
 *
 * Назначение:
 * - Собрать ТЕЛЕФОНЫ риелторов Рязани с персональных страниц reestr.rgr.ru.
 * - Вызывается «по требованию» с /cabinet/testpage2: по одной карточке (indices=0)
 *   или по всей странице листинга (indices не указан) — см. блок RgrRealtors.
 *
 * ⚠️ Номера подменные (переадресация РГР): кэш номеров на сервере — 30 секунд
 *    (только от двойных кликов), `fresh=1` форсирует перепарсинг прямо сейчас.
 *    Ничего не сохраняется в БД.
 *
 * 🔐 Доступ: право test.view (см. PROTECTED_PATHS в server/middleware/auth.ts).
 *
 * @returns { page, sourceUrl, fetchedAt, requested, found, items: RgrPhoneItem[] }
 *
 * ⚠️ URL-ы карточек берутся из листинга, который парсим сами, — клиент не может
 *    подставить произвольный адрес (защита от SSRF).
 */
import { defineEventHandler, createError, getQuery } from 'h3'
import { getRealtorPhones, MAX_PHONE_BATCH } from '../../utils/rgrRealtors'

/** Парсит номер страницы из query (1..50), иначе 400. */
function parsePageParam(value: unknown): number {
  if (value === undefined || value === null || value === '') return 1
  const page = Number.parseInt(String(value), 10)
  if (!Number.isInteger(page) || page < 1) {
    throw createError({ statusCode: 400, statusMessage: 'Параметр page должен быть положительным числом' })
  }
  return page
}

/** Парсит список индексов карточек «0,3,5»; пусто → undefined (= вся страница). */
function parseIndicesParam(value: unknown): number[] | undefined {
  if (value === undefined || value === null || value === '') return undefined
  const raw = String(value)
  const indices = raw
    .split(',')
    .map(part => part.trim())
    .filter(part => part !== '')
    .map(part => Number.parseInt(part, 10))

  if (indices.length === 0 || indices.some(index => !Number.isInteger(index) || index < 0)) {
    throw createError({ statusCode: 400, statusMessage: 'Параметр indices должен быть списком неотрицательных чисел' })
  }
  if (indices.length > MAX_PHONE_BATCH) {
    throw createError({
      statusCode: 400,
      statusMessage: `За один запрос можно запросить не более ${MAX_PHONE_BATCH} карточек`
    })
  }
  return indices
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const page = parsePageParam(query.page)
  const indices = parseIndicesParam(query.indices)
  const fresh = query.fresh === '1' || query.fresh === 'true'

  try {
    return await getRealtorPhones(page, indices, { fresh })
  } catch (error: any) {
    console.error('[API/RGR] ❌ Не удалось собрать телефоны риелторов:', error?.message)
    throw createError({
      statusCode: 502,
      statusMessage: error?.message || 'Реестр РГР недоступен'
    })
  }
})

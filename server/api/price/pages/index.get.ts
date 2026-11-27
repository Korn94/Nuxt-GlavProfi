// server/api/price/pages/index.get.ts
// Особая логика для страниц (SEO-поля)
import { defineApi } from '../../../utils/defineApi'
import { db } from '../../../db'
import { pricePages } from '../../../db/schema'

const handler = defineApi(async () => {
  console.log('📋 Запрос списка страниц прайс-листа')

  const pages = await db
    .select()
    .from(pricePages)
    .orderBy(pricePages.order)

  console.log(`✅ Загружено страниц: ${pages.length}`)

  /**
   * ⚠️ SEO-поля отдаём как есть (null, если не заполнены).
   *
   * Раньше здесь генерировались заглушки:
   *   metaTitle: `Цены на ${page.title} - 2026`
   *   metaDescription: `Описание для ${page.title}`
   *   metaKeywords: `ключевые, слова, для ${page.title}`
   * и `usePriceSeo` брал metaDescription из этого ответа первым приоритетом —
   * в `<meta name="description">` публичной страницы уходило
   * «Описание для Отделочные работы». Осмысленные fallback-тексты живут
   * в app/composables/usePriceSeo.ts и prices/data/pricesContent.ts.
   *
   * updatedAt/order/createdAt нужны типу PricePage и дате «обновлено» в UI.
   */
  return pages.map(page => ({
    id: page.id,
    title: page.title,
    slug: page.slug,
    metaTitle: page.metaTitle ?? null,
    metaDescription: page.metaDescription ?? null,
    metaKeywords: page.metaKeywords ?? null,
    order: page.order ?? 0,
    createdAt: page.createdAt,
    updatedAt: page.updatedAt,
  }))
})

// SWR-кэш списка страниц прайса (короткий TTL — данные используются и в кабинете).
export default defineCachedEventHandler(handler, {
  group: 'price-pages',
  swr: true,
  maxAge: 60,
  staleMaxAge: 600,
})

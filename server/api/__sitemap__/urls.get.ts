// server/api/__sitemap__/urls.get.ts
/**
 * 🗺️ Источник URL для @nuxtjs/sitemap v7 (nuxt.config.ts → sitemap.sources).
 *
 * Зачем нужен: модуль сам собирает в sitemap только СТАТИЧЕСКИЕ файлы страниц
 * (app/pages/**). Динамические разделы он перечислить не может, поэтому раньше
 * в sitemap.xml отсутствовали:
 *   - /prices/<slug>   — категории прайс-листа (таблица price_pages);
 *   - /projects/<slug> — опубликованные кейсы портфолио (таблица portfolio_cases).
 *
 * Формат ответа: массив { loc, lastmod }. Модуль принимает и массив, и { urls }.
 * `lastmod` обязан быть строкой в формате W3C (поэтому приводим дату к ISO).
 *
 * ⚠️ Путь добавлен в PUBLIC_PATHS (server/middleware/auth.ts), иначе внутренний
 * $fetch модуля получал 401 и разделы молча выпадали из sitemap.
 */
import { defineEventHandler } from 'h3'
import { eq } from 'drizzle-orm'
import { db } from '../../db'
import { pricePages, portfolioCases } from '../../db/schema'

interface SitemapEntry {
  loc: string
  lastmod?: string
}

/**
 * Дата из БД → строка ISO (W3C). Drizzle для mysql-колонок datetime может отдавать
 * и Date, и строку — обрабатываем оба варианта. Невалидное значение → undefined
 * (модуль просто не выведет <lastmod>).
 */
const toIsoDate = (value: unknown): string | undefined => {
  if (!value) return undefined
  const date = value instanceof Date ? value : new Date(String(value))
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString()
}

const handler = defineEventHandler(async (): Promise<SitemapEntry[]> => {
  try {
    const [pages, cases] = await Promise.all([
      db
        .select({ slug: pricePages.slug, updatedAt: pricePages.updatedAt })
        .from(pricePages),
      db
        .select({ slug: portfolioCases.slug, updatedAt: portfolioCases.updatedAt })
        .from(portfolioCases)
        .where(eq(portfolioCases.isPublished, true)),
    ])

    const priceEntries: SitemapEntry[] = pages
      .filter(page => Boolean(page.slug))
      .map(page => ({
        loc: `/prices/${page.slug}`,
        lastmod: toIsoDate(page.updatedAt),
      }))

    const projectEntries: SitemapEntry[] = cases
      .filter(item => Boolean(item.slug))
      .map(item => ({
        loc: `/projects/${item.slug}`,
        lastmod: toIsoDate(item.updatedAt),
      }))

    console.log(
      `[sitemap] Источник URL: ${priceEntries.length} категорий прайса, ${projectEntries.length} кейсов портфолио`,
    )

    return [...priceEntries, ...projectEntries]
  } catch (error) {
    // Битая БД не должна ронять sitemap.xml: отдаём пустой список, ошибку — в лог.
    console.error('[sitemap] Не удалось получить URL прайса/портфолио:', error)
    return []
  }
})

// SWR-кэш: sitemap запрашивает источник при каждой генерации (см. cacheMaxAgeSeconds).
export default defineCachedEventHandler(handler, {
  group: 'sitemap-urls',
  swr: true,
  maxAge: 600,
  staleMaxAge: 3600,
})

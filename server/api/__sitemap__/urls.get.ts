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
import {
  pricePages,
  priceCategories,
  priceSubCategories,
  priceItems,
  priceItemDetails,
  priceAdditionalItems,
  portfolioCases,
} from '../../db/schema'

interface SitemapEntry {
  loc: string
  lastmod?: string
}

/**
 * Дата из БД → timestamp (мс). Drizzle для mysql-колонок datetime может отдавать
 * и Date, и строку — обрабатываем оба варианта. Невалидное значение → 0.
 */
const toTime = (value: unknown): number => {
  if (!value) return 0
  const date = value instanceof Date ? value : new Date(String(value))
  return Number.isNaN(date.getTime()) ? 0 : date.getTime()
}

/** timestamp (мс) → строка ISO (W3C); 0 → undefined (модуль не выведет <lastmod>). */
const toIsoDate = (time: number): string | undefined =>
  time > 0 ? new Date(time).toISOString() : undefined

const handler = defineEventHandler(async (): Promise<SitemapEntry[]> => {
  try {
    // lastmod прайса = максимум по самой странице и всем её потомкам
    // (категории → подкатегории → работы → детали/доп. работы). Иначе правка
    // цены работы не меняла `price_pages.updated_at`, и в sitemap месяцами
    // висела дата создания страницы (2025) при актуальном прайсе 2026.
    // Если потомков нет — остаётся собственный updatedAt страницы.
    const [pages, categories, subcategories, items, details, dopworks, cases] = await Promise.all([
      db
        .select({
          pageId: pricePages.id,
          slug: pricePages.slug,
          updatedAt: pricePages.updatedAt,
        })
        .from(pricePages),
      db
        .select({ pageId: priceCategories.pageId, updatedAt: priceCategories.updatedAt })
        .from(priceCategories),
      db
        .select({ pageId: priceCategories.pageId, updatedAt: priceSubCategories.updatedAt })
        .from(priceSubCategories)
        .innerJoin(priceCategories, eq(priceSubCategories.categoryId, priceCategories.id)),
      db
        .select({ pageId: priceCategories.pageId, updatedAt: priceItems.updatedAt })
        .from(priceItems)
        .innerJoin(priceSubCategories, eq(priceItems.subCategoryId, priceSubCategories.id))
        .innerJoin(priceCategories, eq(priceSubCategories.categoryId, priceCategories.id)),
      db
        .select({ pageId: priceCategories.pageId, updatedAt: priceItemDetails.updatedAt })
        .from(priceItemDetails)
        .innerJoin(priceItems, eq(priceItemDetails.itemId, priceItems.id))
        .innerJoin(priceSubCategories, eq(priceItems.subCategoryId, priceSubCategories.id))
        .innerJoin(priceCategories, eq(priceSubCategories.categoryId, priceCategories.id)),
      db
        .select({ pageId: priceCategories.pageId, updatedAt: priceAdditionalItems.updatedAt })
        .from(priceAdditionalItems)
        .innerJoin(priceItems, eq(priceAdditionalItems.itemId, priceItems.id))
        .innerJoin(priceSubCategories, eq(priceItems.subCategoryId, priceSubCategories.id))
        .innerJoin(priceCategories, eq(priceSubCategories.categoryId, priceCategories.id)),
      db
        .select({ slug: portfolioCases.slug, updatedAt: portfolioCases.updatedAt })
        .from(portfolioCases)
        .where(eq(portfolioCases.isPublished, true)),
    ])

    const lastModified = new Map<number, number>()
    const bump = (pageId: number, updatedAt: unknown) => {
      const time = toTime(updatedAt)
      if (time > (lastModified.get(pageId) ?? 0)) lastModified.set(pageId, time)
    }

    for (const page of pages) bump(page.pageId, page.updatedAt)
    for (const rows of [categories, subcategories, items, details, dopworks]) {
      for (const row of rows) bump(row.pageId, row.updatedAt)
    }

    const priceEntries: SitemapEntry[] = pages
      .filter(page => Boolean(page.slug))
      .map(page => ({
        loc: `/prices/${page.slug}`,
        lastmod: toIsoDate(lastModified.get(page.pageId) ?? toTime(page.updatedAt)),
      }))

    const projectEntries: SitemapEntry[] = cases
      .filter(item => Boolean(item.slug))
      .map(item => ({
        loc: `/projects/${item.slug}`,
        lastmod: toIsoDate(toTime(item.updatedAt)),
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

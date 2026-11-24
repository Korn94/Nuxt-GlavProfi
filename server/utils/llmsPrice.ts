// server/utils/llmsPrice.ts
/**
 * 📄 Сборка блоков прайс-листа для LLM-документации (/llms.txt и /llms-full.txt).
 *
 * Раньше цены в llms-файлах были захардкожены и расходились с БД. Теперь блок
 * между маркерами <!-- PRICE:START --> и <!-- PRICE:END --> собирается из таблиц
 * price_pages → price_categories → price_sub_categories → price_items.
 *
 * Используется:
 *  - server/utils/llmsContent.ts — кэшируемый снимок обоих файлов;
 *  - server/routes/llms.txt.ts и server/routes/llms-full.txt.ts — отдача агентам.
 */
import { sql } from 'drizzle-orm'
import { db } from '../db'
import {
  pricePages,
  priceCategories,
  priceSubCategories,
  priceItems,
  priceItemDetails,
  priceAdditionalItems
} from '../db/schema'
import {
  buildPriceTree,
  type PriceTreePage,
  type PriceTreeCategory,
  type PriceTreeItem
} from './priceTree'

export const PRICE_START = '<!-- PRICE:START -->'
export const PRICE_END = '<!-- PRICE:END -->'

/**
 * Единицы измерения из price_items.unit. Нужны, чтобы отличить настоящую
 * единицу («м²», «шт») от текстовой подписи («бесплатно», «входит в стоимость»).
 */
const MEASURE_UNITS = new Set([
  'м²', 'м2', 'м.п.', 'м.п', 'п.м.', 'п.м', 'шт', 'комплект', 'узел', 'контур',
  'система', 'линия', 'точка', 'зона', 'объект', 'щит', 'выезд', 'стояк', 'шкаф'
])

export interface PriceSnapshot {
  pages: PriceTreePage[]
  totalItems: number
  /** Дата последнего изменения цен по данным БД: «16.10.2026 08:10» (по Москве). */
  priceUpdatedAt: string | null
}

export interface PriceMeta {
  /** Базовый адрес сайта без завершающего слэша. */
  siteUrl: string
  /** Момент генерации блока: «23.11.2026, 16:05 (МСК)». */
  generatedAtLabel: string
  /** Момент сборки сайта: «23.11.2026, 15:58 (МСК)» (null — если неизвестен). */
  buildTimeLabel: string | null
  /** Дата последнего изменения цен в БД (см. PriceSnapshot.priceUpdatedAt). */
  priceUpdatedAt: string | null
}

/**
 * Загружает весь прайс-лист и дату последнего изменения цен.
 *
 * @throws Если БД недоступна — вызывающий код (llmsContent) отдаёт fallback.
 */
export async function loadPriceData(): Promise<PriceSnapshot> {
  const [pages, categories, subcategories, items, details, dopworks, updatedRows] = await Promise.all([
    db.select().from(pricePages).orderBy(pricePages.order, pricePages.id),
    db.select().from(priceCategories).orderBy(priceCategories.order, priceCategories.id),
    db.select().from(priceSubCategories).orderBy(priceSubCategories.order, priceSubCategories.id),
    db.select().from(priceItems).orderBy(priceItems.order, priceItems.id),
    db.select().from(priceItemDetails).orderBy(priceItemDetails.order, priceItemDetails.id),
    db.select().from(priceAdditionalItems).orderBy(priceAdditionalItems.order, priceAdditionalItems.id),
    // DATE_FORMAT — чтобы не зависеть от таймзоны Node: MySQL отдаёт уже готовую
    // московскую строку (сессия БД выставляет +03:00, см. server/db/index.ts).
    db.select({
      updated: sql<string | null>`DATE_FORMAT(GREATEST(
        COALESCE(MAX(updated_at), '1970-01-01 00:00:00'),
        COALESCE((SELECT MAX(updated_at) FROM price_item_details), '1970-01-01 00:00:00'),
        COALESCE((SELECT MAX(updated_at) FROM price_additional_items), '1970-01-01 00:00:00')
      ), '%d.%m.%Y %H:%i')`
    }).from(priceItems)
  ])

  const tree = buildPriceTree({ pages, categories, subcategories, items, details, dopworks })
  const rawUpdated = updatedRows[0]?.updated ?? null
  const priceUpdatedAt = rawUpdated && !rawUpdated.startsWith('01.01.1970') ? rawUpdated : null

  return { pages: tree, totalItems: items.length, priceUpdatedAt }
}

// ========================================
// 🧮 ФОРМАТИРОВАНИЕ
// ========================================

const MOSCOW_DATE_FORMATTER = new Intl.DateTimeFormat('ru-RU', {
  timeZone: 'Europe/Moscow',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
})

/** ISO/Date → «23.11.2026, 16:05 (МСК)». Невалидное значение → null. */
export function formatMoscowDateTime(value: Date | string | null | undefined): string | null {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return `${MOSCOW_DATE_FORMATTER.format(date)} (МСК)`
}

/** 1200 → «1 200» (обычные пробелы, без неразрывных — так читаемее в plain text). */
export function formatMoney(value: number): string {
  return String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

/**
 * Цена + единица из БД → строка для markdown.
 *
 * Примеры реальных данных:
 *   4500 + «м²»                    → «4 500 ₽/м²»
 *   8000 + «от / шт»               → «от 8 000 ₽/шт»
 *   200  + «м² +»                  → «200 ₽/м² +» (легенда: «+» = доплата к базовой)
 *   0    + «бесплатно»             → «бесплатно»
 *   0    + «входит в стоимость…»   → «входит в стоимость…»
 *   0    + «м²»                    → «включено в стоимость»
 */
export function formatPrice(price: string | number, unit: string): string {
  const numeric = Number(price)
  const rawUnit = String(unit ?? '').replace(/\s+/g, ' ').trim()

  if (!Number.isFinite(numeric) || numeric <= 0) {
    if (!rawUnit) return 'по запросу'
    const isDescriptive = !MEASURE_UNITS.has(rawUnit.toLowerCase()) && !rawUnit.includes('/')
    return isDescriptive ? rawUnit : 'включено в стоимость'
  }

  let normalizedUnit = rawUnit
  let fromPrefix = ''

  if (/^от\b/i.test(normalizedUnit)) {
    fromPrefix = 'от '
    normalizedUnit = normalizedUnit.replace(/^от\s*/i, '')
  }
  normalizedUnit = normalizedUnit.replace(/^\/\s*/, '')

  const suffix = normalizedUnit ? `/${normalizedUnit}` : ''
  return `${fromPrefix}${formatMoney(numeric)} ₽${suffix}`
}

/** Русская плюрализация: plural(70, ['позиция', 'позиции', 'позиций']) → «позиций». */
function plural(count: number, forms: [string, string, string]): string {
  const abs = Math.abs(count) % 100
  const last = abs % 10
  if (abs > 10 && abs < 20) return forms[2]
  if (last > 1 && last < 5) return forms[1]
  if (last === 1) return forms[0]
  return forms[2]
}

/** Экранирует «|» и переводы строк, чтобы не ломать markdown-таблицу. */
function escapeCell(value: string): string {
  return String(value ?? '').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ').trim()
}

// ========================================
// 📊 ПОДСЧЁТЫ
// ========================================

/** Перевод строки как в шаблонах (CRLF) — чтобы итоговый файл не был «смешанным». */
const NL = '\r\n'

function countCategoryItems(category: PriceTreeCategory): number {
  return category.subcategories.reduce((acc, sub) => acc + sub.items.length, 0)
}

function countPageItems(page: PriceTreePage): number {
  return page.categories.reduce((acc, category) => acc + countCategoryItems(category), 0)
}

/** Самая дешёвая базовая позиция категории (для «от 60 ₽/м²» в сводке). */
function findCheapestItem(category: PriceTreeCategory): PriceTreeItem | null {
  let cheapest: PriceTreeItem | null = null

  for (const sub of category.subcategories) {
    for (const item of sub.items) {
      const price = Number(item.price)
      if (!Number.isFinite(price) || price <= 0) continue
      // «м² +», «п.м +» — это доплата к базовой цене, а не сама цена работы:
      // в «от …» такие позиции не берём, иначе получается «от 180 ₽/м² +».
      if (String(item.unit ?? '').includes('+')) continue
      if (!cheapest || price < Number(cheapest.price)) cheapest = item
    }
  }

  return cheapest
}

export function itemsLabel(count: number): string {
  return `${count} ${plural(count, ['позиция', 'позиции', 'позиций'])}`
}

/** «от 60 ₽/м²» без дублирования «от», если цена уже помечена как «от». */
function fromPrice(item: PriceTreeItem | null): string | null {
  if (!item) return null
  const formatted = formatPrice(item.price, item.unit)
  return /^от\s/.test(formatted) ? formatted : `от ${formatted}`
}

// ========================================
// 📝 РЕНДЕР: llms.txt (краткая сводка)
// ========================================

export function renderPriceSummary(pages: PriceTreePage[], meta: PriceMeta): string {
  const total = pages.reduce((acc, page) => acc + countPageItems(page), 0)
  const lines: string[] = [
    '### Актуальные цены из прайс-листа',
    '',
    '> Блок собирается автоматически из базы данных сайта — править вручную не нужно.',
    `> Актуально на: ${meta.generatedAtLabel}. Сайт собран: ${meta.buildTimeLabel ?? 'дата неизвестна'}. Цены в базе изменены: ${meta.priceUpdatedAt ?? 'дата неизвестна'}.`,
    `> Всего в прайсе: ${itemsLabel(total)}. Полные позиции с ценами: ${meta.siteUrl}/llms-full.txt`,
    ''
  ]

  if (total === 0) {
    lines.push('> Прайс-лист пока не заполнен.')
    return lines.join(NL).trim()
  }

  for (const page of pages) {
    const pageUrl = `${meta.siteUrl}/prices/${page.slug}`
    lines.push(`**${page.title}** — ${itemsLabel(countPageItems(page))} · [страница прайса](${pageUrl})`)

    const categories = page.categories.filter(category => countCategoryItems(category) > 0)

    if (categories.length === 0) {
      lines.push('- Позиции пока не заполнены')
      lines.push('')
      continue
    }

    for (const category of categories) {
      const from = fromPrice(findCheapestItem(category))
      const suffix = from ? `, ${from}` : ''
      lines.push(`- ${category.name} — ${itemsLabel(countCategoryItems(category))}${suffix}`)
    }

    lines.push('')
  }

  return lines.join(NL).trim()
}

// ========================================
// 📝 РЕНДЕР: llms-full.txt (полный прайс)
// ========================================

export function renderPriceFull(pages: PriceTreePage[], meta: PriceMeta): string {
  const total = pages.reduce((acc, page) => acc + countPageItems(page), 0)
  const lines: string[] = [
    '## ТОЧНЫЕ ЦЕНЫ НА РАБОТЫ (из базы данных сайта)',
    '',
    '> Блок собирается автоматически из базы данных сайта. Цены — за работу без материалов.',
    `> Актуально на: ${meta.generatedAtLabel}. Сайт собран: ${meta.buildTimeLabel ?? 'дата неизвестна'}. Цены в базе изменены: ${meta.priceUpdatedAt ?? 'дата неизвестна'}.`,
    '> «+» в единице измерения — доплата к базовой цене, «от» — минимальная цена, «включено в стоимость»/«бесплатно» — отдельно не оплачивается.',
    `> Всего в прайсе: ${itemsLabel(total)}. Краткая версия для агентов: ${meta.siteUrl}/llms.txt`,
    ''
  ]

  if (total === 0) {
    lines.push('> Прайс-лист пока не заполнен.')
    return lines.join(NL).trim()
  }

  const pageLinks = pages.map(page => `[${page.title}](${meta.siteUrl}/prices/${page.slug}) — ${itemsLabel(countPageItems(page))}`)
  lines.push(`**Разделы прайса:** ${pageLinks.join('; ')}`)
  lines.push('')

  for (const page of pages) {
    lines.push(`### ${page.title} — ${itemsLabel(countPageItems(page))}`)
    lines.push(`Страница прайса: ${meta.siteUrl}/prices/${page.slug}`)
    lines.push('')

    for (const category of page.categories) {
      if (countCategoryItems(category) === 0) continue

      lines.push(`#### ${category.name}`)
      lines.push('')

      for (const sub of category.subcategories) {
        if (sub.items.length === 0) continue

        lines.push(`**${sub.name}**`)
        lines.push('')
        lines.push('| Работа | Цена |')
        lines.push('|---|---|')

        for (const item of sub.items) {
          lines.push(`| ${escapeCell(item.name)} | ${formatPrice(item.price, item.unit)} |`)

          for (const detail of item.details) {
            lines.push(`| ↳ ${escapeCell(detail.name)} (деталь) | ${formatPrice(detail.price, detail.unit)} |`)
          }

          for (const dop of item.dopworks) {
            const label = dop.label ? `${escapeCell(dop.label)}: ` : ''
            lines.push(`| ↳ ${label}${escapeCell(dop.dopwork)} (доп. работа) | ${formatPrice(dop.price, dop.unit)} |`)
          }
        }

        lines.push('')
      }
    }
  }

  return lines.join(NL).trim()
}

/**
 * Подставляет сгенерированный блок между маркерами в шаблон.
 * Маркеры остаются только в шаблоне (assets:server/llms/*.txt) — в ответе их нет.
 */
export function applyPriceBlock(template: string, block: string): string {
  const startIndex = template.indexOf(PRICE_START)
  const endIndex = template.indexOf(PRICE_END)

  if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
    console.warn('[llms] В шаблоне не найдены маркеры PRICE:START/PRICE:END — блок цен не подставлен')
    return template
  }

  return template.slice(0, startIndex) + block.trim() + template.slice(endIndex + PRICE_END.length)
}

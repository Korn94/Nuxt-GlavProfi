// app/composables/useOfferLinks.ts
/**
 * 📄 Список страниц коммерческих предложений (КП) для кабинета.
 *
 * Авто-обнаружение: список строится по файлам, поэтому новая страница КП
 * (app/pages/offers/<slug>.vue) автоматически появляется на странице
 * «Дополнительно» (/cabinet/more) — править код не нужно.
 *
 * Название/номер берутся из данных КП
 * (app/components/pages/public/offers/data/<slug>.ts → KpData.meta).
 * Если файла данных нет — используется название страницы-двойника
 * (<slug>-1 → <slug>) либо сам slug.
 */
import type { KpData } from '~/components/pages/public/offers/kp/types'

export interface OfferLink {
  /** slug страницы: /offers/<slug> */
  slug: string
  /** Полный путь страницы */
  path: string
  /** Человекочитаемое название («Отделка офисов · ФБУ «Приокский ЦСМ»») */
  title: string
  /** Номер КП (КП-2026-043) */
  number?: string
  /** Объект из шапки КП */
  object?: string
  /** Дата КП */
  date?: string
}

/**
 * Все страницы КП. Без `eager` — получаем только пути файлов,
 * сами страницы (и их большие сметы) в бандл кабинета не попадают.
 */
const offerPageModules = import.meta.glob('../pages/offers/*.vue')

/**
 * Данные КП — нужны только для названий/номеров в списке.
 * `import: 'default'` — берём default-экспорт (результат defineKpData).
 */
const offerDataModules = import.meta.glob(
  '../components/pages/public/offers/data/*.ts',
  { eager: true, import: 'default' }
) as Record<string, KpData>

/** 'offers/dvizheniya-pervyh.vue' → 'dvizheniya-pervyh' */
function fileSlug(filePath: string): string {
  return filePath.split('/').pop()?.replace(/\.(vue|ts)$/, '') ?? filePath
}

/** Запасное название, если у страницы нет своего файла данных */
function humanizeSlug(slug: string): string {
  return slug.replace(/-/g, ' ').replace(/^./, char => char.toUpperCase())
}

/** slug → данные КП */
const dataBySlug: Record<string, KpData> = {}
for (const [filePath, data] of Object.entries(offerDataModules)) {
  dataBySlug[fileSlug(filePath)] = data
}

/** Готовый список КП: свежие сверху (по номеру), затем по slug */
const offerLinks: OfferLink[] = Object.keys(offerPageModules)
  .map(fileSlug)
  .sort()
  .map((slug): OfferLink => {
    // Страницы-двойники (<slug>-1, <slug>-2) своего файла данных не имеют —
    // берём данные базовой страницы
    const meta = (dataBySlug[slug] ?? dataBySlug[slug.replace(/-\d+$/, '')])?.meta

    return {
      slug,
      path: `/offers/${slug}`,
      title: meta ? [meta.title, meta.titleAccent].filter(Boolean).join(' · ') : humanizeSlug(slug),
      number: meta?.number,
      object: meta?.object,
      date: meta?.date,
    }
  })
  .sort((a, b) => (b.number ?? '').localeCompare(a.number ?? '', 'ru') || a.slug.localeCompare(b.slug))

export function useOfferLinks() {
  return { offers: offerLinks }
}

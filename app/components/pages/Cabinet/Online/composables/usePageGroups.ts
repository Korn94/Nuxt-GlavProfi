// app/components/pages/Cabinet/Online/composables/usePageGroups.ts
import type { VisitorPageStat } from '~/types'

/**
 * Логическая группировка страниц сайта для блока «Страницы» на /cabinet/online.
 *
 * Сервер отдаёт плоский топ страниц (`VisitorPageStat[]`), а в таблице удобнее
 * видеть разделы: прайс рядом с прайсом, офферы — с офферами и т.д.
 * Группы считаются на клиенте, показатели агрегируются взвешенно по просмотрам.
 */

/** Группа страниц с агрегированными показателями */
export interface PageGroup {
  key: string
  label: string
  icon: string
  pages: VisitorPageStat[]
  views: number
  /** Среднее активное время на просмотр, сек (взвешено по просмотрам) */
  avgSeconds: number
  /** Средняя глубина скролла, % (взвешено по просмотрам) */
  avgScroll: number
  exits: number
  /** % просмотров, закончившихся выходом с сайта */
  exitRate: number
}

interface PageGroupRule {
  key: string
  label: string
  icon: string
  /** Префиксы пути; совпадение проверяется по границе сегмента */
  prefixes: string[]
}

/** Правила разделов сайта (app/pages). Порядок важен: первое совпадение выигрывает */
const PAGE_GROUP_RULES: PageGroupRule[] = [
  { key: 'offers', label: 'Офферы', icon: 'mdi:tag-multiple-outline', prefixes: ['/offers'] },
  { key: 'prices', label: 'Прайс-листы', icon: 'mdi:currency-rub', prefixes: ['/prices'] },
  { key: 'premises', label: 'Ремонт помещений', icon: 'mdi:office-building', prefixes: ['/remont-pomescheniy'] },
  { key: 'works', label: 'Виды работ', icon: 'mdi:hammer-screwdriver', prefixes: ['/vidy-rabot'] },
  { key: 'projects', label: 'Проекты', icon: 'mdi:briefcase-outline', prefixes: ['/projects'] },
  {
    key: 'cabinet',
    label: 'Кабинет',
    icon: 'mdi:view-dashboard-outline',
    prefixes: ['/cabinet', '/login', '/access-denied']
  },
  {
    key: 'info',
    label: 'Информационные',
    icon: 'mdi:information-outline',
    prefixes: [
      '/about',
      '/contacts',
      '/partner',
      '/privacy-policy',
      '/terms-of-service',
      '/requisites',
      '/requisites-ip',
      '/telegram'
    ]
  }
]

type PageGroupBase = Omit<PageGroupRule, 'prefixes'>

/** Главная страница сайта и «прочее» — отдельные ветки, без префиксов */
const HOME_GROUP: PageGroupBase = { key: 'home', label: 'Главная', icon: 'mdi:home-city' }
const OTHER_GROUP: PageGroupBase = { key: 'other', label: 'Прочее', icon: 'mdi:web' }

/** Путь без query/hash и хвостового слэша ('/prices/plumbing/?x=1' → '/prices/plumbing') */
function normalizePath(path: string): string {
  const base = (path || '').split('#')[0]!.split('?')[0]!.trim()
  if (!base || base === '/') return '/'
  const withSlash = base.startsWith('/') ? base : `/${base}`
  return withSlash.replace(/\/+$/, '') || '/'
}

/** Совпадение пути с префиксом по границе сегмента ('/prices-new' ≠ '/prices') */
function matchesPrefix(path: string, prefix: string): boolean {
  return path === prefix || path.startsWith(`${prefix}/`)
}

/** Правило группы для пути страницы */
function resolveGroup(path: string): PageGroupBase {
  const clean = normalizePath(path)
  if (clean === '/') return HOME_GROUP
  return PAGE_GROUP_RULES.find(rule => rule.prefixes.some(prefix => matchesPrefix(clean, prefix))) || OTHER_GROUP
}

/** Среднее, взвешенное по просмотрам страниц */
function weightedAverage(
  pages: VisitorPageStat[],
  pick: (page: VisitorPageStat) => number,
  totalViews: number
): number {
  if (!totalViews) return 0
  const sum = pages.reduce((acc, page) => acc + pick(page) * page.views, 0)
  return Math.round(sum / totalViews)
}

/** Процент с одним знаком после запятой (как pct() на сервере) */
function percent(part: number, total: number): number {
  return total ? Math.round((part / total) * 1000) / 10 : 0
}

/**
 * Сгруппировать строки таблицы страниц.
 *
 * @param pages строки `stats.pages` (сервер уже сортирует их по просмотрам)
 * @returns группы по убыванию просмотров, «Прочее» — всегда последняя;
 *          страницы внутри группы сохраняют порядок сервера (по просмотрам)
 */
export function groupPages(pages: VisitorPageStat[]): PageGroup[] {
  if (!pages.length) return []

  const buckets = new Map<string, { rule: PageGroupBase; pages: VisitorPageStat[] }>()
  for (const page of pages) {
    const rule = resolveGroup(page.path)
    let bucket = buckets.get(rule.key)
    if (!bucket) {
      bucket = { rule, pages: [] }
      buckets.set(rule.key, bucket)
    }
    bucket.pages.push(page)
  }

  const groups: PageGroup[] = []
  for (const { rule, pages: groupPagesList } of buckets.values()) {
    const views = groupPagesList.reduce((sum, page) => sum + page.views, 0)
    const exits = groupPagesList.reduce((sum, page) => sum + page.exits, 0)
    groups.push({
      key: rule.key,
      label: rule.label,
      icon: rule.icon,
      pages: groupPagesList,
      views,
      avgSeconds: weightedAverage(groupPagesList, page => page.avgSeconds, views),
      avgScroll: weightedAverage(groupPagesList, page => page.avgScroll, views),
      exits,
      exitRate: percent(exits, views)
    })
  }

  // «Прочее» всегда в конце, остальные группы — по убыванию трафика
  return groups.sort((a, b) => {
    if (a.key === OTHER_GROUP.key) return 1
    if (b.key === OTHER_GROUP.key) return -1
    return b.views - a.views
  })
}

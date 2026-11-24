// server/utils/llmsMarkdown.ts
/**
 * 📝 Markdown-версии страниц сайта (llmstxt.org v2).
 *
 * Зачем: спека просит отдавать «чистую» markdown-версию каждой значимой страницы
 * по тому же URL с расширением `.md`, а находить её — через
 * `rel="alternate" type="text/markdown"`. Ссылки внутри `/llms.txt` тоже должны
 * вести на markdown, а не на HTML.
 *
 * Принцип (вариант A из обсуждения): markdown собирается из ТЕХ ЖЕ источников,
 * что и HTML-страницы, а не конвертируется из готового HTML:
 * - цены и прайсы — БД (`price_pages … price_items`, см. llmsPrice.ts);
 * - проекты — БД (`portfolio_cases`);
 * - страницы типов помещений — `pageTypes/data/*` (title/description/FAQ/цены);
 * - страницы видов работ — `workTypes/data/pages/*` (те же данные, что рендерит UI).
 * Поэтому цены и тексты не расходятся с сайтом, а новых зависимостей нет.
 *
 * ⚠️ Список поддерживаемых путей — `shared/constants/llmsMarkdown.ts`.
 * Добавили рендер здесь — добавьте slug туда, иначе страница не получит
 * `rel="alternate"` на HTML-версии.
 */
import { and, eq, inArray } from 'drizzle-orm'
import { COMPANY } from 'shared/constants/company'
import { db } from '../db'
import { portfolioCases, portfoCaseWorks } from '../db/schema'
import { formatMoney, formatPrice, itemsLabel, loadPriceData, type PriceSnapshot } from './llmsPrice'
import {
  PREMISES_CATALOG,
  getPremisesPriceFrom,
  getSimilarPremises
} from '../../app/components/pages/public/remontPomescheniy/pageTypes/data/premisesCatalog'
import { premisesSeo } from '../../app/components/pages/public/remontPomescheniy/pageTypes/data/premisesSeo'
import {
  WORK_TYPES,
  getWorkTypesForCategory,
  type PremisesSlug
} from '../../app/components/pages/public/remontPomescheniy/pageTypes/data/workTypesByCategory'
import { getProjectsCategories } from '../../app/components/pages/public/remontPomescheniy/pageTypes/data/projectsByCategory'
import * as gklPeregorodki from '../../app/components/pages/public/remontPomescheniy/workTypes/data/pages/gkl-peregorodki'
import * as oblitsovkaGkl from '../../app/components/pages/public/remontPomescheniy/workTypes/data/pages/oblitsovka-gkl'
import * as shtukaturkaSten from '../../app/components/pages/public/remontPomescheniy/workTypes/data/pages/shtukaturka-sten'
import * as shpaklevkaSten from '../../app/components/pages/public/remontPomescheniy/workTypes/data/pages/shpaklevka-sten'
import * as ukladkaPlitki from '../../app/components/pages/public/remontPomescheniy/workTypes/data/pages/ukladka-plitki'

/** Перевод строки: в markdown-файлах используем LF (в отличие от CRLF в llms*.txt). */
const NL = '\n'

/** `https://site.ru` + `/path` → `https://site.ru/path`. */
const url = (siteUrl: string, path: string): string => `${siteUrl}${path}`

/** Ссылка на markdown-версию раздела: `/prices/x` → `/prices/x.md`. */
const md = (siteUrl: string, path: string): string => url(siteUrl, `${path}.md`)

/** `1200` → `1 200` (без «₽» — для таблиц, где валюта в заголовке). */
const money = (value: number): string => formatMoney(value)

/** Блок «Контакты» — общий для всех markdown-страниц. */
function contactsBlock(siteUrl: string): string[] {
  return [
    '## Контакты',
    '',
    `- **Телефон:** ${COMPANY.phone}`,
    `- **Email:** ${COMPANY.email}`,
    `- **Офис:** г. ${COMPANY.address.addressLocality}, ${COMPANY.address.streetAddress}`,
    `- **Режим работы:** ${COMPANY.openingHoursLabel}`,
    `- **Регион работ:** ${COMPANY.areaServed.join(', ')}`,
    `- **Реквизиты:** ${md(siteUrl, '/requisites-ip')}`,
    `- **Сайт:** ${siteUrl}`,
    ''
  ]
}

/** Блок «Гарантии и условия» — общий (совпадает с текстом на сайте). */
function guaranteesBlock(): string[] {
  return [
    '## Гарантии и условия',
    '',
    '- Гарантия 3 года на все строительно-отделочные работы, включая скрытые дефекты.',
    '- Смета фиксируется в договоре: дополнительные работы — только через допсоглашение.',
    '- Собственные бригады в штате, без субподряда.',
    '- Прямые контракты с поставщиками материалов — экономия 15–20%.',
    '- Работаем без остановки бизнеса: ночные смены, поэтапная сдача зон.',
    ''
  ]
}

/** Блок «Как мы работаем» — общий. */
function processBlock(): string[] {
  return [
    '## Как мы работаем',
    '',
    '1. Заявка и консультация — бесплатно, в течение рабочего дня.',
    '2. Выезд замерщика и аудит объекта — бесплатно, ни к чему не обязывает.',
    '3. ТЗ и смета — фиксируются в договоре и не растут в процессе.',
    '4. Договор — с фиксацией сроков и стоимости.',
    '5. Работы — штатные бригады, один прораб на объект.',
    '6. Сдача — с исполнительной документацией, актами КС-2/КС-3.',
    '7. Гарантийное обслуживание — 3 года.',
    ''
  ]
}

/** Строка ссылки на прайс-лист: «- [Отделочные работы](…/prices/otdelochnye-raboty.md) — 796 позиций». */
function priceLinksBlock(snapshot: PriceSnapshot, siteUrl: string): string[] {
  const lines = ['## Прайс-листы с ценами', '']

  for (const page of snapshot.pages) {
    const count = page.categories.reduce(
      (pageAcc, category) =>
        pageAcc + category.subcategories.reduce((acc, sub) => acc + sub.items.length, 0),
      0
    )
    lines.push(`- [${page.title}](${md(siteUrl, `/prices/${page.slug}`)}) — ${itemsLabel(count)}`)
  }

  lines.push(`- Полный прайс одним файлом: ${url(siteUrl, '/llms-full.txt')}`)
  lines.push('')
  return lines
}

// ========================================
// 💼 ПОРТФОЛИО (БД)
// ========================================

type PortfolioCase = typeof portfolioCases.$inferSelect

/** Значения enum категорий кейсов — берём из схемы БД (единый источник). */
type PortfolioCategoryValue = (typeof portfolioCases.category.enumValues)[number]

/** Категория кейса валидна? */
const isPortfolioCategory = (value: string): boolean =>
  (portfolioCases.category.enumValues as readonly string[]).includes(value)

/** Подпись кейса для списков: «Название (255 м², Банки)». */
const caseLabel = (item: PortfolioCase): string =>
  `${item.title} (${Number(item.space)} м², ${item.category})`

/** Опубликованные кейсы: по категориям (если переданы) и с лимитом. */
async function loadPublishedCases(
  categories: readonly string[],
  limit: number
): Promise<PortfolioCase[]> {
  const filters = [eq(portfolioCases.isPublished, true)]
  const valid = categories.filter(isPortfolioCategory) as PortfolioCategoryValue[]

  if (valid.length > 0) {
    filters.push(inArray(portfolioCases.category, valid))
  }

  return db
    .select()
    .from(portfolioCases)
    .where(and(...filters))
    .orderBy(portfolioCases.order, portfolioCases.id)
    .limit(limit)
}

/** Один опубликованный кейс по slug. */
async function loadCaseBySlug(slug: string): Promise<PortfolioCase | null> {
  const [row] = await db
    .select()
    .from(portfolioCases)
    .where(and(eq(portfolioCases.slug, slug), eq(portfolioCases.isPublished, true)))
    .limit(1)

  return row ?? null
}

/** Виды работ кейса: [{ workType, value }] — «Плитка: 2 100 м²». */
async function loadCaseWorks(caseId: number) {
  return db
    .select({ workType: portfoCaseWorks.workType, value: portfoCaseWorks.value })
    .from(portfoCaseWorks)
    .where(eq(portfoCaseWorks.caseId, caseId))
    .orderBy(portfoCaseWorks.order, portfoCaseWorks.id)
}

/** Кейсы, у которых slug входит в список (для блоков «проекты по теме»). */
async function loadCasesBySlugs(slugs: readonly string[]): Promise<PortfolioCase[]> {
  if (slugs.length === 0) return []

  const rows = await db
    .select()
    .from(portfolioCases)
    .where(
      and(
        eq(portfolioCases.isPublished, true),
        inArray(portfolioCases.slug, slugs as [string, ...string[]])
      )
    )

  // Порядок — как в исходном списке slug'ов, а не как в БД
  return slugs
    .map(slug => rows.find(row => row.slug === slug))
    .filter((row): row is PortfolioCase => Boolean(row))
}

/** Список кейсов: «- [Название (255 м², Банки)](…/projects/slug.md) — адрес». */
function caseListBlock(cases: readonly PortfolioCase[], siteUrl: string, title: string): string[] {
  if (cases.length === 0) return []

  const lines = [`## ${title}`, '']

  for (const item of cases) {
    const address = item.address ? ` — ${item.address}` : ''
    lines.push(
      `- [${item.title} (${Number(item.space)} м², ${item.category})](${md(siteUrl, `/projects/${item.slug}`)})${address}`
    )
  }

  lines.push('')
  return lines
}

// ========================================
// 💰 ПРАЙС (БД)
// ========================================

interface PriceRow {
  name: string
  unit: string
  price: string
}

/** Плоская карта всех позиций прайса: id → { name, unit, price }. */
function buildPriceIndex(snapshot: PriceSnapshot): Map<number, PriceRow> {
  const index = new Map<number, PriceRow>()

  for (const page of snapshot.pages) {
    for (const category of page.categories) {
      for (const sub of category.subcategories) {
        for (const item of sub.items) {
          index.set(Number(item.id), {
            name: item.name,
            unit: item.unit,
            price: String(item.price)
          })
        }
      }
    }
  }

  return index
}

/** Таблица «Работа | Цена» по списку id (детали и допработы не включаем). */
function priceTableBlock(ids: readonly number[], index: Map<number, PriceRow>): string[] {
  const rows = ids
    .map(id => index.get(Number(id)))
    .filter((row): row is PriceRow => Boolean(row))

  if (rows.length === 0) return []

  const lines = ['| Работа | Цена |', '|---|---|']

  for (const row of rows) {
    const name = row.name.replace(/\|/g, '\\|')
    lines.push(`| ${name} | ${formatPrice(row.price, row.unit)} |`)
  }

  lines.push('')
  return lines
}

/** Минимальная положительная цена по списку id → «от 1 200 ₽/м²» (или null). */
function minPriceFrom(ids: readonly number[], index: Map<number, PriceRow>): string | null {
  let best: { value: number; label: string } | null = null

  for (const id of ids) {
    const row = index.get(Number(id))
    if (!row) continue

    const value = Number(row.price)
    if (!Number.isFinite(value) || value <= 0) continue
    if (String(row.unit).includes('+')) continue

    if (!best || value < best.value) {
      best = { value, label: formatPrice(row.price, row.unit) }
    }
  }

  if (!best) return null
  return /^от\s/.test(best.label) ? best.label : `от ${best.label}`
}

// ========================================
// 🧱 ВИДЫ РАБОТ: данные страниц (app/components/.../workTypes/data/pages)
// ========================================

/**
 * Минимальный контракт data-модуля вида работ.
 * Поля опциональные: разные страницы заполняют разный набор блоков.
 */
interface WorkTypeModule {
  seoData: { title: string; description: string }
  categoryAdvantages?: ReadonlyArray<{ title: string; description: string }>
  comparisonMethods?: ReadonlyArray<{
    title: string
    tagline?: string
    priceWorkId?: number
    priceWorkIds?: readonly number[]
    whenToUse?: readonly string[]
    pros?: readonly string[]
    cons?: readonly string[]
    specs?: Record<string, string | undefined>
  }>
  technicalInsights?: ReadonlyArray<{ title: string; description: string; fact?: string }>
  WORK_IDS?: Record<string, number>
  priceFactors?: ReadonlyArray<{ title: string; description: string }>
  workStages?: ReadonlyArray<{
    title: string
    description: string
    duration?: string
    result?: string
  }>
  guarantees?: ReadonlyArray<{ title: string; description: string }>
  faqItems?: ReadonlyArray<{ question: string; answer: string }>
  projectSlugs?: readonly string[]
}

/** slug страницы вида работ → её data-модуль (те же данные, что рендерит UI). */
const WORK_TYPE_PAGES: Record<string, WorkTypeModule> = {
  'peregorodki-gkl': gklPeregorodki,
  'oblitsovka-gkl': oblitsovkaGkl,
  'shtukaturka-sten': shtukaturkaSten,
  'shpaklevka-sten': shpaklevkaSten,
  'ukladka-plitki': ukladkaPlitki
}

/** Русские подписи характеристик методов (MethodSpecs). */
const SPEC_LABELS: Record<string, string> = {
  soundproof: 'звукоизоляция',
  thickness: 'толщина',
  strength: 'прочность',
  weight: 'вес',
  fireRating: 'огнестойкость',
  format: 'формат',
  base: 'основание',
  load: 'нагрузка',
  care: 'уход',
  spaceLoss: 'съедает пространства',
  maxDeviation: 'макс. перепад',
  speed: 'скорость монтажа',
  communications: 'коммуникации',
  maxLayer: 'макс. слой',
  dryingTime: 'высыхание',
  moistureResistance: 'влагостойкость',
  suitableFor: 'под финиш',
  bestFor: 'для помещений',
  layerThickness: 'толщина слоёв',
  finishType: 'под финиш',
  smoothness: 'гладкость',
  duration: 'срок',
  qualityControl: 'контроль качества'
}

/** `specs` → «звукоизоляция ~35 дБ, толщина 75 мм». */
function specsLine(specs: Record<string, string | undefined> | undefined): string | null {
  if (!specs) return null

  const parts = Object.entries(specs)
    .filter(([, value]) => Boolean(value))
    .map(([key, value]) => `${SPEC_LABELS[key] ?? key}: ${value}`)

  return parts.length > 0 ? parts.join(', ') : null
}

/** Id цен метода: основной + дополнительные. */
function methodPriceIds(method: NonNullable<WorkTypeModule['comparisonMethods']>[number]): number[] {
  const ids = [method.priceWorkId, ...(method.priceWorkIds ?? [])]
  return ids.filter((value): value is number => typeof value === 'number')
}

/**
 * `/vidy-rabot/<slug>.md` — цены + варианты исполнения + нюансы + FAQ.
 * Все тексты берутся из того же data-модуля, что и HTML-страница.
 */
async function renderWorkTypePage(
  siteUrl: string,
  slug: string,
  snapshot: PriceSnapshot
): Promise<string | null> {
  const data = WORK_TYPE_PAGES[slug]
  const definition = WORK_TYPES[slug as keyof typeof WORK_TYPES]
  if (!data || !definition) return null

  const index = buildPriceIndex(snapshot)
  const methods = data.comparisonMethods ?? []
  const methodIds = methods.flatMap(methodPriceIds)
  const ids = [...new Set([...Object.values(data.WORK_IDS ?? {}), ...methodIds])]
  // «от …» считаем по основным вариантам исполнения: в WORK_IDS есть, например,
  // укладка утеплителя (380 ₽/м²), и минимум по всем id давал «от 380 ₽/м²»
  // вместо реальной цены перегородки.
  const from = minPriceFrom(methodIds, index) ?? minPriceFrom(ids, index)

  const lines: string[] = [
    `# ${data.seoData.title}`,
    '',
    `> ${data.seoData.description}`,
    '',
    `- Цена: ${from ?? 'по запросу'}`,
    `- HTML-версия страницы: ${url(siteUrl, definition.to)}`,
    `- Работы и цены в общем прайсе: ${md(siteUrl, '/prices/otdelochnye-raboty')}`,
    ''
  ]

  const priceRows = priceTableBlock(ids, index)
  if (priceRows.length > 0) lines.push('## Цены на работы', '', ...priceRows)

  if (methods.length > 0) {
    lines.push('## Варианты исполнения', '')

    methods.forEach((method, position) => {
      lines.push(`### ${position + 1}. ${method.title}`, '')
      if (method.tagline) lines.push(method.tagline, '')

      const methodFrom = minPriceFrom(methodPriceIds(method), index)
      if (methodFrom) lines.push(`- Цена: ${methodFrom}`)

      const specs = specsLine(method.specs)
      if (specs) lines.push(`- Характеристики: ${specs}`)

      if (method.whenToUse?.length) lines.push(`- Когда применять: ${method.whenToUse.join('; ')}`)
      if (method.pros?.length) lines.push(`- Плюсы: ${method.pros.join('; ')}`)
      if (method.cons?.length) lines.push(`- Ограничения: ${method.cons.join('; ')}`)

      lines.push('')
    })
  }

  if (data.categoryAdvantages?.length) {
    lines.push('## Преимущества', '')
    for (const item of data.categoryAdvantages) {
      lines.push(`- **${item.title}** — ${item.description}`)
    }
    lines.push('')
  }

  if (data.technicalInsights?.length) {
    lines.push('## Технические нюансы', '')
    for (const item of data.technicalInsights) {
      lines.push(`- **${item.title}** — ${item.description}${item.fact ? ` (${item.fact})` : ''}`)
    }
    lines.push('')
  }

  if (data.priceFactors?.length) {
    lines.push('## Что влияет на цену', '')
    for (const item of data.priceFactors) {
      lines.push(`- **${item.title}** — ${item.description}`)
    }
    lines.push('')
  }

  if (data.workStages?.length) {
    lines.push('## Этапы работ', '')
    data.workStages.forEach((stage, position) => {
      const meta = [stage.duration, stage.result].filter(Boolean).join(', ')
      lines.push(
        `${position + 1}. **${stage.title}** — ${stage.description}${meta ? ` (${meta})` : ''}`
      )
    })
    lines.push('')
  }

  if (data.guarantees?.length) {
    lines.push('## Гарантии', '')
    for (const item of data.guarantees) {
      lines.push(`- **${item.title}** — ${item.description}`)
    }
    lines.push('')
  }

  if (data.faqItems?.length) {
    lines.push('## Частые вопросы', '')
    for (const item of data.faqItems) {
      lines.push(`**${item.question}**`, '', item.answer, '')
    }
  }

  const cases = await loadCasesBySlugs(data.projectSlugs ?? [])
  lines.push(...caseListBlock(cases, siteUrl, 'Похожие проекты'))

  lines.push(...guaranteesBlock(), ...contactsBlock(siteUrl))
  return finish(lines)
}

/** Склейка строк: без тройных пустых строк, с завершающим переводом строки. */
function finish(lines: readonly string[]): string {
  return `${lines.join(NL).replace(/\n{3,}/g, '\n\n').trim()}${NL}`
}

/**
 * `/prices/<slug>.md` — полный прайс раздела из БД (категории → подкатегории → позиции).
 */
async function renderPricePage(
  siteUrl: string,
  slug: string,
  snapshot: PriceSnapshot
): Promise<string | null> {
  const page = snapshot.pages.find(candidate => candidate.slug === slug)
  if (!page) return null

  const index = buildPriceIndex(snapshot)
  const total = page.categories.reduce(
    (pageAcc, category) =>
      pageAcc + category.subcategories.reduce((acc, sub) => acc + sub.items.length, 0),
    0
  )

  const lines: string[] = [
    `# ${page.metaTitle || page.title}`,
    '',
    ...(page.metaDescription ? [`> ${page.metaDescription}`, ''] : []),
    `- Цены из базы сайта. Всего ${itemsLabel(total)}. Цены в базе изменены: ${snapshot.priceUpdatedAt ?? 'дата неизвестна'}.`,
    `- HTML-версия: ${url(siteUrl, `/prices/${slug}`)}`,
    '- «+» в единице измерения — доплата к базовой цене, «от» — минимальная цена.',
    ''
  ]

  for (const category of page.categories) {
    const itemsCount = category.subcategories.reduce((acc, sub) => acc + sub.items.length, 0)
    if (itemsCount === 0) continue

    lines.push(`## ${category.name}`, '')

    for (const sub of category.subcategories) {
      if (sub.items.length === 0) continue
      lines.push(`### ${sub.name}`, '')
      lines.push(...priceTableBlock(sub.items.map(item => Number(item.id)), index))
    }
  }

  lines.push(...contactsBlock(siteUrl))
  return finish(lines)
}

/**
 * `/remont-pomescheniy/<slug>.md` — страница типа помещения:
 * описание, цена «от», профильные виды работ, похожие услуги, кейсы, FAQ.
 */
async function renderPremisesPage(
  siteUrl: string,
  slug: string,
  snapshot: PriceSnapshot
): Promise<string | null> {
  const item = PREMISES_CATALOG.find(candidate => candidate.slug === slug)
  const seo = premisesSeo[slug as keyof typeof premisesSeo]
  if (!item || !seo) return null

  const lines: string[] = [
    `# ${seo.title}`,
    '',
    `> ${seo.description}`,
    '',
    `- Цена: от ${money(item.priceFrom)} ₽/м². Пример для 100 м²: ${item.priceExample}.`,
    `- HTML-версия страницы: ${url(siteUrl, `/remont-pomescheniy/${slug}`)}`,
    ''
  ]

  lines.push(`## Что входит в ремонт: ${item.title.toLowerCase()}`, '', item.description, '')

  const workTypes = getWorkTypesForCategory(slug)
  if (workTypes.length > 0) {
    lines.push('## Профильные виды работ', '')
    for (const workType of workTypes) {
      lines.push(`- [${workType.title}](${md(siteUrl, workType.to)}) — ${workType.description}`)
    }
    lines.push('')
  }

  const cases = await loadPublishedCases(getProjectsCategories(slug as PremisesSlug), 3)
  lines.push(...caseListBlock(cases, siteUrl, 'Реализованные объекты по теме'))

  if (seo.faq?.length) {
    lines.push('## Частые вопросы', '')
    for (const entry of seo.faq) {
      lines.push(`**${entry.question}**`, '', entry.answer, '')
    }
  }

  lines.push('## Похожие типы помещений', '')
  for (const similar of getSimilarPremises(slug, 3)) {
    lines.push(
      `- [${similar.title}](${md(siteUrl, `/remont-pomescheniy/${similar.slug}`)}) — от ${money(similar.priceFrom)} ₽/м²`
    )
  }
  lines.push('')

  lines.push(...priceLinksBlock(snapshot, siteUrl), ...guaranteesBlock(), ...contactsBlock(siteUrl))
  return finish(lines)
}

/** `/remont-pomescheniy.md` — хаб раздела: типы помещений, виды работ, прайсы. */
async function renderPremisesIndex(siteUrl: string, snapshot: PriceSnapshot): Promise<string> {
  const lines: string[] = [
    '# Ремонт коммерческих помещений под ключ в Рязани',
    '',
    '> ГлавПрофи выполняет ремонт и отделку коммерческих помещений «под ключ»: офисы, магазины, склады, ангары, клиники, салоны, фитнес-клубы, МОПы, фасады и производственные цеха. Собственные бригады в штате, смета фиксируется в договоре, гарантия 3 года.',
    '',
    `- HTML-версия: ${url(siteUrl, '/remont-pomescheniy')}`,
    ''
  ]

  lines.push('## Типы помещений', '')
  for (const item of PREMISES_CATALOG.filter(candidate => candidate.isReady)) {
    const subtitle = item.subtitle ? ` (${item.subtitle})` : ''
    lines.push(
      `### ${item.title}${subtitle}`,
      '',
      `- [Страница: ремонт ${item.title.toLowerCase()}](${md(siteUrl, `/remont-pomescheniy/${item.slug}`)}) — от ${money(item.priceFrom)} ₽/м²`,
      `- ${item.description}`,
      ''
    )
  }

  lines.push('## Виды отделочных работ', '')
  for (const definition of Object.values(WORK_TYPES)) {
    lines.push(`- [${definition.title}](${md(siteUrl, definition.to)})`)
  }
  lines.push('')

  lines.push(...priceLinksBlock(snapshot, siteUrl), ...processBlock(), ...guaranteesBlock(), ...contactsBlock(siteUrl))
  return finish(lines)
}

/** `/index.md` — главная страница сайта в markdown. */
async function renderHome(siteUrl: string, snapshot: PriceSnapshot): Promise<string> {
  const lines: string[] = [
    '# ГлавПрофи — ремонт и отделка коммерческих помещений под ключ',
    '',
    '> Строительная компания из Рязани, работаем с 2014 года. Ремонт коммерческих помещений «под ключ»: офисы, магазины, склады, ангары, клиники, фитнес-клубы, производственные цеха. Собственные бригады в штате, без субподряда. Смета фиксируется в договоре, гарантия 3 года.',
    '',
    `- HTML-версия: ${url(siteUrl, '/')}`,
    `- Краткая документация для ИИ-агентов: ${url(siteUrl, '/llms.txt')}`,
    `- Полная документация: ${url(siteUrl, '/llms-full.txt')}`,
    ''
  ]

  lines.push('## Ключевые цифры', '')
  lines.push(
    '- Более 250 сданных коммерческих объектов.',
    '- 5 специализированных бригад в штате (отделочники, электрики, сантехники).',
    '- Площадь объектов: от 35 до 3 500 м².',
    '- 12+ лет опыта, 7 прямых контрактов с поставщиками материалов.',
    ''
  )

  lines.push('## Типы помещений', '')
  for (const item of PREMISES_CATALOG.filter(candidate => candidate.isReady)) {
    lines.push(
      `- [${item.title}](${md(siteUrl, `/remont-pomescheniy/${item.slug}`)}) — от ${money(item.priceFrom)} ₽/м²`
    )
  }
  lines.push(`- [Все типы помещений](${md(siteUrl, '/remont-pomescheniy')})`)
  lines.push('')

  lines.push('## Виды отделочных работ', '')
  for (const definition of Object.values(WORK_TYPES)) {
    lines.push(`- [${definition.title}](${md(siteUrl, definition.to)})`)
  }
  lines.push('')

  lines.push(`## Реализованные проекты`, '', `- [Портфолио с кейсами](${md(siteUrl, '/projects')})`, '')

  lines.push(...priceLinksBlock(snapshot, siteUrl), ...processBlock(), ...guaranteesBlock(), ...contactsBlock(siteUrl))
  return finish(lines)
}

/** `/projects.md` — список опубликованных кейсов. */
async function renderProjectsIndex(siteUrl: string): Promise<string> {
  const cases = await loadPublishedCases([], 100)

  const lines: string[] = [
    '# Портфолио: реализованные коммерческие объекты',
    '',
    `> ${cases.length} опубликованных кейсов: офисы, клиники, банки, магазины, фитнес-клубы, производства. Площади, сроки и выполненные работы — без рендеров.`,
    '',
    `- HTML-версия: ${url(siteUrl, '/projects')}`,
    ''
  ]

  lines.push('## Объекты', '')
  for (const item of cases) {
    lines.push(
      `- [${caseLabel(item)}](${md(siteUrl, `/projects/${item.slug}`)}) — ${item.address}, срок ${item.duration}`
    )
  }
  lines.push('')

  lines.push(...contactsBlock(siteUrl))
  return finish(lines)
}

/** `/projects/<slug>.md` — карточка кейса с составом работ. */
async function renderProjectPage(siteUrl: string, slug: string): Promise<string | null> {
  const item = await loadCaseBySlug(slug)
  if (!item) return null

  const works = await loadCaseWorks(Number(item.id))

  const lines: string[] = [
    `# ${item.title}`,
    '',
    `> ${item.shortDescription}`,
    '',
    `- Категория: ${item.category}`,
    `- Площадь: ${Number(item.space)} м²`,
    `- Срок: ${item.duration}; команда: ${item.people}`,
    `- Адрес: ${item.address}`,
    `- HTML-версия: ${url(siteUrl, `/projects/${slug}`)}`,
    ''
  ]

  if (item.objectDescription) lines.push('## Объект', '', item.objectDescription, '')
  if (item.fullDescription) lines.push('## Задача и решение', '', item.fullDescription, '')

  if (works.length > 0) {
    lines.push('## Выполненные работы', '')
    for (const work of works) {
      lines.push(`- ${work.workType}: ${work.value}`)
    }
    lines.push('')
  }

  if (item.result) lines.push('## Результат', '', item.result, '')

  lines.push(`- Все проекты: ${md(siteUrl, '/projects')}`)
  lines.push('')
  lines.push(...contactsBlock(siteUrl))
  return finish(lines)
}

/** `/contacts.md` — контакты и режим работы (без формы заявки). */
function renderContacts(siteUrl: string): string {
  return finish([
    '# Контакты ГлавПрофи',
    '',
    `> ${COMPANY.legalShortName}: ремонт и отделка коммерческих помещений в Рязани и области. Бесплатный выезд замерщика, смета в течение рабочего дня.`,
    '',
    `- **Телефон:** ${COMPANY.phone}`,
    `- **Email:** ${COMPANY.email}`,
    `- **Офис:** г. ${COMPANY.address.addressLocality}, ${COMPANY.address.streetAddress}`,
    `- **Режим работы:** ${COMPANY.openingHoursLabel}`,
    `- **Регион работ:** ${COMPANY.areaServed.join(', ')}`,
    `- **HTML-версия:** ${url(siteUrl, '/contacts')}`,
    `- **Реквизиты для договора:** ${md(siteUrl, '/requisites-ip')}`,
    ''
  ])
}

/**
 * Реквизиты в markdown — общий блок для `/requisites-ip.md`, `/llms.txt`
 * и `/llms-full.txt` (в шаблонах вместо него стоит маркер `<!-- REQUISITES -->`).
 */
export function requisitesBlock(): string[] {
  const { requisites } = COMPANY

  return [
    '## Реквизиты (для договора и оплаты)',
    '',
    '| Параметр | Значение |',
    '|---|---|',
    `| Организационно-правовая форма | ${requisites.form} |`,
    `| Наименование | ${COMPANY.legalName} |`,
    `| ИНН | ${requisites.inn} |`,
    `| ОГРНИП | ${requisites.ogrnip} |`,
    `| Юридический адрес | ${requisites.legalAddress} |`,
    `| Фактический адрес (офис) | г. ${COMPANY.address.addressLocality}, ${COMPANY.address.streetAddress} |`,
    `| Банк | ${requisites.bank} |`,
    `| БИК | ${requisites.bik} |`,
    `| Расчётный счёт | ${requisites.account} |`,
    `| Корр. счёт | ${requisites.correspondentAccount} |`,
    `| Основной ОКВЭД | ${requisites.okvedMain.code} — ${requisites.okvedMain.name} |`,
    '',
    `Проверка в ЕГРИП/ФНС: ${requisites.egrulUrl}`,
    ''
  ]
}

/**
 * Цены «от … ₽/м²» по типам помещений — из единого каталога
 * (`premisesCatalog.priceFrom`). Подставляется в `/llms.txt` вместо ручного
 * списка цен: раньше там были устаревшие числа (например, «Офисы от 8 500 ₽/м²»
 * при актуальных 11 000 ₽/м²).
 */
export function premisesPriceBlock(): string[] {
  return PREMISES_CATALOG.filter(item => item.isReady).map(item => {
    const subtitle = item.subtitle ? ` (${item.subtitle})` : ''
    return `- **${item.title}**${subtitle}: от ${formatMoney(item.priceFrom)} ₽/м²`
  })
}

/** `/requisites-ip.md` — юридические и банковские реквизиты (сейчас ИП). */
function renderRequisites(siteUrl: string): string {
  return finish([
    `# Реквизиты ${COMPANY.legalShortName}`,
    '',
    `> Полные реквизиты для договора и оплаты: ${COMPANY.legalName}.`,
    '',
    ...requisitesBlock(),
    `- HTML-версия: ${url(siteUrl, '/requisites-ip')}`,
    ''
  ])
}

// ========================================
// 🚦 ДИСПЕТЧЕР + КЭШ
// ========================================

export interface LlmsMarkdownDocument {
  /** Тело markdown-документа */
  body: string
  /** HTML-путь, которому соответствует документ */
  htmlPath: string
  /** ISO-время генерации (идёт в заголовок X-LLMS-Generated) */
  generatedAt: string
}

/** Выбор рендерера по HTML-пути. `null` — страницы нет или она не поддерживается. */
async function renderBody(htmlPath: string, siteUrl: string): Promise<string | null> {
  if (htmlPath === '/contacts') return renderContacts(siteUrl)
  if (htmlPath === '/requisites-ip') return renderRequisites(siteUrl)
  if (htmlPath === '/projects') return renderProjectsIndex(siteUrl)

  const projectMatch = /^\/projects\/([a-z0-9-]+)$/.exec(htmlPath)
  if (projectMatch?.[1]) return renderProjectPage(siteUrl, projectMatch[1])

  // Остальные страницы строятся по прайсу из БД (один набор запросов на документ)
  const snapshot = await loadPriceData()

  if (htmlPath === '/') return renderHome(siteUrl, snapshot)
  if (htmlPath === '/remont-pomescheniy') return renderPremisesIndex(siteUrl, snapshot)

  const premisesMatch = /^\/remont-pomescheniy\/([a-z0-9-]+)$/.exec(htmlPath)
  if (premisesMatch?.[1]) return renderPremisesPage(siteUrl, premisesMatch[1], snapshot)

  const workTypeMatch = /^\/vidy-rabot\/([a-z0-9-]+)$/.exec(htmlPath)
  if (workTypeMatch?.[1]) return renderWorkTypePage(siteUrl, workTypeMatch[1], snapshot)

  const priceMatch = /^\/prices\/([a-z0-9-]+)$/.exec(htmlPath)
  if (priceMatch?.[1]) return renderPricePage(siteUrl, priceMatch[1], snapshot)

  return null
}

/** Полная сборка без кэша (используется и кэшем, и `?refresh=1`). */
export async function buildLlmsMarkdown(htmlPath: string): Promise<LlmsMarkdownDocument | null> {
  const config = useRuntimeConfig()
  const siteUrl = String(config.public.siteUrl || COMPANY.siteUrl).replace(/\/+$/, '')

  const body = await renderBody(htmlPath, siteUrl)

  return body ? { body, htmlPath, generatedAt: new Date().toISOString() } : null
}

/**
 * Кэш на 5 минут + SWR до часа: markdown-версии пересобираются из БД так же,
 * как `/llms.txt`, поэтому правки цен попадают в `.md` без пересборки сайта.
 */
export const getLlmsMarkdown = defineCachedFunction(buildLlmsMarkdown, {
  name: 'llms-markdown',
  maxAge: 300,
  staleMaxAge: 3600,
  swr: true,
  getKey: (htmlPath: string) => htmlPath
})

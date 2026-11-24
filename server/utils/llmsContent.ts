// server/utils/llmsContent.ts
/**
 * 🧠 Кэшируемый снимок LLM-документации (/llms.txt и /llms-full.txt).
 *
 * Схема:
 *  - шаблоны лежат в server/assets/llms/*.txt (доступны как assets:server);
 *  - блок цен между маркерами PRICE:START/PRICE:END собирается из БД
 *    (server/utils/llmsPrice.ts);
 *  - готовый результат кэшируется в памяти Nitro на 5 минут (SWR до часа),
 *    поэтому правки цен в кабинете попадают в файлы без пересборки и деплоя.
 *
 * Используется роутами server/routes/llms.txt.ts и llms-full.txt.ts.
 * Принудительное обновление (мимо кэша): /llms.txt?refresh=1
 */
import {
  applyPriceBlock,
  formatMoscowDateTime,
  loadPriceData,
  renderPriceFull,
  renderPriceSummary
} from './llmsPrice'
import { premisesPriceBlock, requisitesBlock } from './llmsMarkdown'

const TEMPLATE_LLMS = 'llms/llms.txt'
const TEMPLATE_LLMS_FULL = 'llms/llms-full.txt'

/** Маркеры, вместо которых в шаблоны подставляются данные из кода/БД. */
const REQUISITES_MARKER = '<!-- REQUISITES -->'
const PREMISES_MARKER = '<!-- PREMISES -->'

/** Сколько секунд держать снимок в памяти Nitro до фонового обновления. */
const CONTENT_MAX_AGE_SECONDS = 300
/** Сколько ещё отдавать прошлый снимок, если обновление упало. */
const CONTENT_STALE_MAX_AGE_SECONDS = 3600

export interface LlmsContent {
  llmsTxt: string
  llmsFull: string
  /** ISO-время генерации снимка (идёт в заголовок X-LLMS-Generated). */
  generatedAt: string
  /** «23.11.2026, 16:05 (МСК)» — для текста документа. */
  generatedAtLabel: string
  /** ISO-время сборки сайта (nuxt.config → runtimeConfig.buildTime). */
  buildTime: string | null
  /** «23.11.2026, 15:58 (МСК)». */
  buildTimeLabel: string | null
  /** «16.10.2026 08:10» — последнее изменение цен в БД. */
  priceUpdatedAt: string | null
}

async function readTemplate(key: string): Promise<string> {
  const template = await useStorage('assets:server').getItem<string>(key)

  if (!template) {
    throw new Error(`[llms] Шаблон не найден: assets:server:${key}`)
  }

  return template
}

/** Короткий ответ, если БД недоступна на холодном старте (без 500 для агентов). */
function buildFallbackBlock(siteUrl: string): string {
  return [
    '### Прайс временно недоступен',
    '',
    '> Не удалось загрузить цены из базы данных. Актуальные прайс-листы — на сайте:',
    `> - ${siteUrl}/prices/otdelochnye-raboty`,
    `> - ${siteUrl}/prices/plumbing`,
    `> - ${siteUrl}/prices/electricity`,
    '',
    '> Стоимость уточняйте по телефону +7 (910) 909-69-47.'
  ].join('\r\n')
}

/**
 * Подставляет в шаблон генерируемые блоки: цены прайса, цены по типам
 * помещений и реквизиты. Маркеры остаются только в `server/assets/llms/*.txt`.
 */
function composeDocument(template: string, priceBlock: string): string {
  const withPrice = applyPriceBlock(template, priceBlock)

  return withPrice
    // Цены «от … ₽/м²» по типам помещений — из premisesCatalog (не из шаблона)
    .replace(PREMISES_MARKER, premisesPriceBlock().join('\r\n'))
    // Реквизиты — из shared/constants/company.ts (единый источник с JSON-LD и .md)
    .replace(REQUISITES_MARKER, requisitesBlock().join('\r\n').trim())
}

/** Полная сборка без кэша — используется и кэшем, и параметром ?refresh=1. */
export async function buildLlmsContent(): Promise<LlmsContent> {
  const config = useRuntimeConfig()
  const siteUrl = String(config.public.siteUrl || 'https://glavprofi.ru').replace(/\/+$/, '')

  const generatedDate = new Date()
  const generatedAt = generatedDate.toISOString()
  const generatedAtLabel = formatMoscowDateTime(generatedDate) ?? generatedAt

  const buildTime = typeof config.buildTime === 'string' && config.buildTime ? config.buildTime : null
  const buildTimeLabel = formatMoscowDateTime(buildTime)

  const [templateLlms, templateLlmsFull] = await Promise.all([
    readTemplate(TEMPLATE_LLMS),
    readTemplate(TEMPLATE_LLMS_FULL)
  ])

  try {
    const snapshot = await loadPriceData()
    const meta = {
      siteUrl,
      generatedAtLabel,
      buildTimeLabel,
      priceUpdatedAt: snapshot.priceUpdatedAt
    }

    return {
      llmsTxt: composeDocument(templateLlms, renderPriceSummary(snapshot.pages, meta)),
      llmsFull: composeDocument(templateLlmsFull, renderPriceFull(snapshot.pages, meta)),
      generatedAt,
      generatedAtLabel,
      buildTime,
      buildTimeLabel,
      priceUpdatedAt: snapshot.priceUpdatedAt
    }
  } catch (error) {
    // Битая/недоступная БД не должна отдавать агентам 500: со SWR прошлый снимок
    // продолжает отдаваться, а на холодном старте — fallback со ссылками.
    console.error('[llms] Не удалось загрузить прайс из БД:', error)
    const fallbackBlock = buildFallbackBlock(siteUrl)

    return {
      llmsTxt: composeDocument(templateLlms, fallbackBlock),
      llmsFull: composeDocument(templateLlmsFull, fallbackBlock),
      generatedAt,
      generatedAtLabel,
      buildTime,
      buildTimeLabel,
      priceUpdatedAt: null
    }
  }
}

/**
 * Кэш на 5 минут + SWR до часа: цены из БД не читаются на каждый запрос,
 * но правки в прайсе попадают в llms-файлы без пересборки/деплоя.
 *
 * ⚠️ Опции вынесены в отдельную константу осознанно: mlly (сканер экспортов
 * для авто-импортов Nitro) принимает поля объектного литерала справа от `=`
 * за дополнительные экспорты файла. Из-за этого Nuxt писал
 * «Duplicated imports "getKey"» и генерировал битую запись в
 * `.nuxt/types/nitro-imports.d.ts` (ссылка на несуществующий экспорт).
 */
const llmsContentCacheOptions = {
  name: 'llms-content',
  maxAge: CONTENT_MAX_AGE_SECONDS,
  staleMaxAge: CONTENT_STALE_MAX_AGE_SECONDS,
  swr: true,
  getKey: () => 'v1'
}

export const getLlmsContent = defineCachedFunction(buildLlmsContent, llmsContentCacheOptions)

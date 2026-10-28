// server/utils/rgrRealtors.ts
/**
 * 📞 Парсер Единого реестра РГР (reestr.rgr.ru) — аттестованные риэлторы Рязани.
 *
 * Зачем:
 * - На /cabinet/testpage2 нужно собирать телефоны риелторов Рязани «по требованию».
 * - В листинге города телефонов нет: номер лежит на персональной странице
 *   специалиста в блоке «Контактная информация»:
 *       `<strong class="phone" ...>Тел.: 8-920-963-77-77</strong>`
 * - Номера подменные (переадресация РГР), поэтому кэш номеров короткий,
 *   а `fresh: true` позволяет перепарсить номер прямо сейчас.
 *
 * Особенности источника (проверено вручную):
 * - Пагинация: `?p=N` (30 карточек на страницу, у Рязани ~10 страниц).
 * - Ответ отдаётся с НЕВАЛИДНЫМ `charset=utf8mb4` → читаем байты и декодируем UTF-8 сами.
 * - У части специалистов номера нет (`Тел.:` пусто) — это не ошибка парсинга.
 *
 * ⚠️ Весь парсинг внешнего HTML изолирован в этом файле: если верстка РГР изменится,
 *    править нужно только здесь (для телефона есть fallback-селекторы).
 *
 * Использование:
 *   const listing = await getRealtorsPage(1)            // карточки без телефонов
 *   const phones  = await getRealtorPhones(1, [0, 2, 5]) // телефоны конкретных карточек
 *   const all     = await getRealtorPhones(1, undefined, { fresh: true }) // вся страница заново
 */
import type {
  RgrRealtor,
  RgrRealtorsResponse,
  RgrPhoneItem,
  RgrPhonesResponse
} from 'shared/types/rgr'

// ============================================
// 1. КОНСТАНТЫ
// ============================================

export const RGR_BASE = 'https://reestr.rgr.ru'
/** Городская страница Рязани (регион: Рязанская область). */
export const RGR_RYAZAN_CITY_PATH = '/rieltory/ryazanskaya-oblast/ryazan-10961/'
/** Публичный адрес источника — отдаётся клиенту для ссылки. */
export const RGR_SOURCE_URL = RGR_BASE + RGR_RYAZAN_CITY_PATH

/** Браузерный UA: без него сайт отвечает редиректами/пустыми страницами. */
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

const REQUEST_TIMEOUT_MS = 15_000
/** 1 попытка + 2 ретрая */
const MAX_ATTEMPTS = 3
/** Одновременных запросов к карточкам (вежливый парсинг источника). */
const CONCURRENCY = 4
const JITTER_MIN_MS = 150
const JITTER_MAX_MS = 300
/** Листинг меняется редко — держим 5 минут. */
const LIST_TTL_MS = 5 * 60 * 1000
/** Номера подменные — кэш только от двойных кликов. */
const PHONE_TTL_MS = 30 * 1000
const CACHE_MAX_ENTRIES = 400
/** Максимум карточек за один вызов (защита от «собери всё одним запросом»). */
export const MAX_PHONE_BATCH = 60
/** Технический предел номера страницы листинга. */
export const MAX_LIST_PAGE = 50

// ============================================
// 2. ХЕЛПЕРЫ (текст / HTML / номера)
// ============================================

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function randomJitterMs(): number {
  return JITTER_MIN_MS + Math.floor(Math.random() * (JITTER_MAX_MS - JITTER_MIN_MS))
}

const HTML_ENTITIES: Record<string, string> = {
  nbsp: ' ',
  quot: '"',
  amp: '&',
  lt: '<',
  gt: '>',
  laquo: '«',
  raquo: '»',
  ndash: '–',
  mdash: '—'
}

function decodeEntities(value: string): string {
  return value.replace(/&(#\d+|#x[0-9a-f]+|[a-z]+);/gi, (match, entity: string) => {
    const key = entity.toLowerCase()
    if (key.startsWith('#x')) {
      const code = Number.parseInt(key.slice(2), 16)
      return Number.isFinite(code) ? String.fromCodePoint(code) : match
    }
    if (key.startsWith('#')) {
      const code = Number.parseInt(key.slice(1), 10)
      return Number.isFinite(code) ? String.fromCodePoint(code) : match
    }
    return HTML_ENTITIES[key] ?? match
  })
}

/** Убирает теги, декодирует сущности и схлопывает пробелы. */
function plainText(value: string): string {
  return decodeEntities(value.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim()
}

/** «8-920-963-77-77» / «8 (910) 012-37-77» / «89106106650» → '79209637777'. */
function toElevenDigits(raw: string): string | null {
  const digits = raw.replace(/\D/g, '')
  if (digits.length === 11 && (digits.startsWith('7') || digits.startsWith('8'))) {
    return '7' + digits.slice(1)
  }
  if (digits.length === 10) return '7' + digits
  return null
}

/** '79209637777' → '+7 (920) 963-77-77'. */
function formatPhone(digits: string): string {
  if (digits.length !== 11) return digits
  return `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9, 11)}`
}

/** Относительные ссылки источника → абсолютные. */
function absoluteUrl(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return trimmed.startsWith('/') ? RGR_BASE + trimmed : `${RGR_BASE}/${trimmed}`
}

// ============================================
// 3. ПАРСИНГ ТЕЛЕФОНА ПЕРСОНАЛЬНОЙ СТРАНИЦЫ
// ============================================

/**
 * Достаёт номер из карточки специалиста: `<strong class="phone">Тел.: …</strong>`.
 *
 * ⚠️ HTML-комментарии вырезаем заранее: в верстке РГР рядом лежит
 * законментированный телефон агентства («<!--<span class="phone">Тел.: 8 (910) …`) —
 * его нельзя выдавать за личный номер специалиста.
 */
export function parseRealtorPhone(html: string): { phone: string | null; digits: string | null } {
  const source = html.replace(/<!--[\s\S]*?-->/g, ' ')
  const patterns = [
    /<strong[^>]*class="phone"[^>]*>([\s\S]*?)<\/strong>/i,
    /<span[^>]*class="phone"[^>]*>([\s\S]*?)<\/span>/i,
    /<a[^>]*href="tel:([^"]+)"[^>]*>/i
  ]

  for (const pattern of patterns) {
    const match = pattern.exec(source)
    if (!match) continue
    const raw = plainText(match[1] ?? '').replace(/^тел\.?\s*:?\s*/i, '').trim()
    if (!raw) continue
    const digits = toElevenDigits(raw)
    if (!digits) continue
    return { phone: formatPhone(digits), digits }
  }

  return { phone: null, digits: null }
}

// ============================================
// 4. ПАРСИНГ ЛИСТИНГА ГОРОДА
// ============================================

interface ParsedListPage {
  page: number
  totalSpecialists: number
  totalPages: number
  items: RgrRealtor[]
}

/**
 * Разбирает страницу листинга: каждая карточка — `<tr class="show">`.
 * Телефонов здесь нет — их собирает `getRealtorPhones()`.
 */
export function parseRealtorsList(html: string, page: number): ParsedListPage {
  const rows = html.match(/<tr class="show">[\s\S]*?<\/tr>/g) ?? []
  const items: RgrRealtor[] = []

  rows.forEach((row, rowIndex) => {
    const link = /<strong class="ttl">\s*<a href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i.exec(row)
    if (!link) return

    const url = absoluteUrl(link[1] ?? '')
    const name = plainText(link[2] ?? '')
    if (!url || !name) return

    const descRows = Array.from(row.matchAll(/<span class="desc-row">([\s\S]*?)<\/span>/gi)).map(m => m[1] ?? '')
    const firstDesc = descRows[0] ?? ''
    const agencyLink = /<a href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i.exec(firstDesc)

    const position = plainText(firstDesc.replace(/<a[\s\S]*?<\/a>/gi, '')).replace(/^[,\s]+|[,\s]+$/g, '') || null
    const agencyName = agencyLink
      ? plainText(agencyLink[2] ?? '').replace(/^["«]+|["»]+$/g, '').trim() || null
      : null

    const ratingMatch =
      /class="agent-rating-stars"[^>]*title="[^"]*?(\d+[.,]?\d*)"/i.exec(row) ??
      /agent-rating-stars__num">(\d+[.,]?\d*)</i.exec(row)
    const rating = ratingMatch?.[1] ? Number.parseFloat(ratingMatch[1].replace(',', '.')) : NaN

    const attestat = plainText(/<strong class="attestat">([\s\S]*?)<\/strong>/i.exec(row)?.[1] ?? '') || null
    const attestatUntil =
      plainText(/<span class="attestat-date">([\s\S]*?)<\/span>/i.exec(row)?.[1] ?? '')
        .replace(/срок\s+действия/i, '')
        .replace(/^[\s–—\-]+/, '')
        .trim() || null

    const photoRaw = /<img[^>]*src="([^"]+)"/i.exec(row)?.[1] ?? ''

    items.push({
      index: rowIndex,
      name,
      position,
      agency: { name: agencyName, url: agencyLink ? absoluteUrl(agencyLink[1] ?? '') : null },
      address: plainText(descRows[1] ?? '') || null,
      rating: Number.isFinite(rating) ? rating : null,
      attestat,
      attestatUntil,
      photo: photoRaw ? absoluteUrl(photoRaw) : null,
      url
    })
  })

  const totalSpecialists = Number.parseInt(/В городе:\s*(\d+)\s*специалист/i.exec(html)?.[1] ?? '', 10)
  const pageNumbers = Array.from(html.matchAll(/[?&]p=(\d+)/g))
    .map(m => Number.parseInt(m[1] ?? '', 10))
    .filter(Number.isFinite)

  const fallbackPages =
    items.length > 0 && Number.isFinite(totalSpecialists)
      ? Math.ceil(totalSpecialists / items.length)
      : 1

  return {
    page,
    totalSpecialists: Number.isFinite(totalSpecialists) ? totalSpecialists : items.length,
    totalPages: Math.max(1, pageNumbers.length > 0 ? Math.max(...pageNumbers) : fallbackPages),
    items
  }
}

// ============================================
// 5. HTTP-ЗАГРУЗКА ИСТОЧНИКА
// ============================================

function buildListUrl(page: number): string {
  return page <= 1 ? RGR_SOURCE_URL : `${RGR_SOURCE_URL}?p=${page}`
}

async function fetchHtml(url: string): Promise<string> {
  let lastError: unknown = null

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': USER_AGENT,
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'ru-RU,ru;q=0.9'
        },
        redirect: 'follow',
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
      })

      if (!response.ok) throw new Error(`HTTP ${response.status}`)

      // ⚠️ Источник отдаёт charset=utf8mb4 (невалидный для стандартных декодеров):
      // читаем байты и декодируем UTF-8 сами, чтобы русский текст не превратился в «?».
      return new TextDecoder('utf-8').decode(await response.arrayBuffer())
    } catch (error) {
      lastError = error
      if (attempt < MAX_ATTEMPTS) await sleep(400 * attempt)
    }
  }

  const reason = lastError instanceof Error ? lastError.message : 'неизвестная ошибка'
  throw new Error(`Реестр РГР недоступен (${url}): ${reason}`)
}

// ============================================
// 6. КЭШ И ОГРАНИЧЕНИЕ ПАРАЛЛЕЛИЗМА
// ============================================

interface CacheEntry<T> {
  value: T
  expiresAt: number
}

const listCache = new Map<number, CacheEntry<RgrRealtorsResponse>>()
const phoneCache = new Map<string, CacheEntry<{ phone: string | null; digits: string | null }>>()
const inflightList = new Map<number, Promise<RgrRealtorsResponse>>()
const inflightPhone = new Map<string, Promise<{ phone: string | null; digits: string | null }>>()

function setCache<T>(store: Map<string | number, CacheEntry<T>>, key: string | number, value: T, ttlMs: number): void {
  if (store.size >= CACHE_MAX_ENTRIES) {
    const oldestKey = store.keys().next().value
    if (oldestKey !== undefined) store.delete(oldestKey)
  }
  store.set(key, { value, expiresAt: Date.now() + ttlMs })
}

function readCache<T>(store: Map<string | number, CacheEntry<T>>, key: string | number, fresh: boolean): T | null {
  if (fresh) return null
  const entry = store.get(key)
  if (!entry) return null
  if (entry.expiresAt <= Date.now()) {
    store.delete(key)
    return null
  }
  return entry.value
}

/** Пул запросов: не более `limit` одновременно + пауза с jitter между карточками. */
async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length)
  let cursor = 0

  const runners = Array.from({ length: Math.max(1, Math.min(limit, items.length)) }, async () => {
    while (cursor < items.length) {
      const index = cursor++
      const item = items[index]
      if (item === undefined) continue
      results[index] = await worker(item, index)
      await sleep(randomJitterMs())
    }
  })

  await Promise.all(runners)
  return results
}

/** Приводит номер страницы к допустимому диапазону. */
export function clampListPage(page: number): number {
  if (!Number.isFinite(page) || page < 1) return 1
  return Math.min(Math.floor(page), MAX_LIST_PAGE)
}

/**
 * Страница листинга города: карточки БЕЗ телефонов (быстро, 1 HTTP-запрос).
 * Кэш 5 минут; `fresh: true` — принудительно заново.
 */
export async function getRealtorsPage(page = 1, options: { fresh?: boolean } = {}): Promise<RgrRealtorsResponse> {
  const fresh = options.fresh === true
  const safePage = clampListPage(page)

  const cached = readCache(listCache, safePage, fresh)
  if (cached) return { ...cached, cached: true }

  const running = inflightList.get(safePage)
  if (running && !fresh) return { ...(await running), cached: true }

  const task = (async (): Promise<RgrRealtorsResponse> => {
    const parsed = parseRealtorsList(await fetchHtml(buildListUrl(safePage)), safePage)
    return {
      page: parsed.page,
      totalPages: parsed.totalPages,
      totalSpecialists: parsed.totalSpecialists,
      sourceUrl: RGR_SOURCE_URL,
      fetchedAt: new Date().toISOString(),
      cached: false,
      items: parsed.items
    }
  })()

  inflightList.set(safePage, task)

  try {
    const result = await task
    setCache(listCache, safePage, result, LIST_TTL_MS)
    return result
  } finally {
    inflightList.delete(safePage)
  }
}

/**
 * Телефоны карточек указанной страницы листинга.
 *
 * URL-ы карточек берутся из листинга, который парсим сами, — клиент не может
 * подставить произвольный адрес (защита от SSRF).
 *
 * @param indices 0-based индексы карточек страницы; пусто/undefined → вся страница
 * @param options.fresh true → перепарсить номера (номера подменные!)
 */
export async function getRealtorPhones(
  page = 1,
  indices?: number[],
  options: { fresh?: boolean } = {}
): Promise<RgrPhonesResponse> {
  const fresh = options.fresh === true
  const listing = await getRealtorsPage(page)

  const wanted =
    indices && indices.length > 0
      ? indices
          .slice(0, MAX_PHONE_BATCH)
          .map(index => listing.items[index])
          .filter((item): item is RgrRealtor => Boolean(item))
      : listing.items.slice(0, MAX_PHONE_BATCH)

  const items = await mapWithConcurrency<RgrRealtor, RgrPhoneItem>(wanted, CONCURRENCY, async (item) => {
    const cached = readCache(phoneCache, item.url, fresh)
    if (cached) {
      return {
        index: item.index,
        url: item.url,
        name: item.name,
        phone: cached.phone,
        digits: cached.digits,
        error: null
      }
    }

    let task = inflightPhone.get(item.url)
    if (!task) {
      task = (async () => parseRealtorPhone(await fetchHtml(item.url)))()
      inflightPhone.set(item.url, task)
    }

    try {
      const parsed = await task
      setCache(phoneCache, item.url, parsed, PHONE_TTL_MS)
      return {
        index: item.index,
        url: item.url,
        name: item.name,
        phone: parsed.phone,
        digits: parsed.digits,
        error: null
      }
    } catch (error) {
      return {
        index: item.index,
        url: item.url,
        name: item.name,
        phone: null,
        digits: null,
        error: error instanceof Error ? error.message : 'не удалось получить номер'
      }
    } finally {
      if (inflightPhone.get(item.url) === task) inflightPhone.delete(item.url)
    }
  })

  return {
    page: listing.page,
    sourceUrl: listing.sourceUrl,
    fetchedAt: new Date().toISOString(),
    requested: wanted.length,
    found: items.filter(item => Boolean(item.phone)).length,
    items
  }
}

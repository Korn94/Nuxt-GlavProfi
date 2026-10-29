// server/utils/trafficSource.ts
/**
 * Определение источника трафика: UTM-метки, click-id рекламных систем,
 * реферер и итоговый «канал» (channel) — главная ось аналитики.
 *
 * Работает независимо от Яндекс.Метрики: всё считается на сервере по данным пинга.
 */

/** Тип реферера */
export type ReferrerType = 'direct' | 'search' | 'social' | 'referral'

/** Канал трафика (ключ для группировки в отчётах) */
export type TrafficChannel =
  | 'yandex_direct'
  | 'google_ads'
  | 'paid_other'
  | 'organic_yandex'
  | 'organic_google'
  | 'organic_other'
  | 'social'
  | 'referral'
  | 'direct'

/** Человекочитаемые названия каналов (используются и на сервере, и в UI-копиях) */
export const CHANNEL_LABELS: Record<TrafficChannel, string> = {
  yandex_direct: 'Яндекс.Директ',
  google_ads: 'Google Ads',
  paid_other: 'Прочая реклама',
  organic_yandex: 'Яндекс (органика)',
  organic_google: 'Google (органика)',
  organic_other: 'Другие поисковики',
  social: 'Соцсети',
  referral: 'Переходы с сайтов',
  direct: 'Прямые заходы'
}

export interface UtmParams {
  utmSource: string | null
  utmMedium: string | null
  utmCampaign: string | null
  utmTerm: string | null
  utmContent: string | null
  yclid: string | null
  gclid: string | null
}

export interface TrafficSource extends UtmParams {
  referrerHost: string | null
  referrerType: ReferrerType
  channel: TrafficChannel
}

const SEARCH_HOSTS = /(^|\.)(yandex\.[a-z.]+|ya\.ru|google\.[a-z.]+|bing\.com|duckduckgo\.com|go\.mail\.ru|search\.mail\.ru|rambler\.ru|nova\.rambler\.ru|yahoo\.com|baidu\.com|ecosia\.org|sputnik\.ru)$/i
const SOCIAL_HOSTS = /(^|\.)(vk\.com|vk\.ru|m\.vk\.com|ok\.ru|t\.me|telegram\.org|web\.telegram\.org|instagram\.com|facebook\.com|m\.facebook\.com|l\.facebook\.com|youtube\.com|youtu\.be|dzen\.ru|zen\.yandex\.ru|twitter\.com|x\.com|pinterest\.[a-z.]+|max\.ru|whatsapp\.com|wa\.me)$/i

function clamp(value: string | null | undefined, max: number): string | null {
  if (!value) return null
  const v = value.trim()
  return v ? v.slice(0, max) : null
}

/**
 * Достать UTM-метки и click-id из пути страницы (`/prices?utm_source=yandex&yclid=123`).
 */
export function parseUtmFromPath(path: string | null | undefined): UtmParams {
  const empty: UtmParams = {
    utmSource: null, utmMedium: null, utmCampaign: null, utmTerm: null, utmContent: null,
    yclid: null, gclid: null
  }
  if (!path) return empty
  const qIndex = path.indexOf('?')
  if (qIndex === -1) return empty

  try {
    const params = new URLSearchParams(path.slice(qIndex + 1).split('#')[0])
    return {
      utmSource: clamp(params.get('utm_source'), 100),
      utmMedium: clamp(params.get('utm_medium'), 100),
      utmCampaign: clamp(params.get('utm_campaign'), 255),
      utmTerm: clamp(params.get('utm_term'), 255),
      utmContent: clamp(params.get('utm_content'), 255),
      yclid: clamp(params.get('yclid'), 100),
      gclid: clamp(params.get('gclid'), 150)
    }
  } catch {
    return empty
  }
}

/**
 * Путь без query и hash (для статистики по страницам).
 * Хвостовой слэш убираем, кроме корня.
 */
export function normalizePath(path: string | null | undefined): string {
  const base = (path || '/').split('#')[0]!.split('?')[0]!.trim() || '/'
  const withSlash = base.startsWith('/') ? base : `/${base}`
  return (withSlash.length > 1 ? withSlash.replace(/\/+$/, '') : withSlash).slice(0, 300) || '/'
}

/**
 * Разобрать реферер → host. Собственные страницы сайта (ownHosts) считаются
 * отсутствием реферера (внутренняя навигация/перезагрузка), иначе «прямые» заходы
 * превращались бы в переходы с самого себя.
 */
export function parseReferrerHost(referrer: string | null | undefined, ownHosts: string[]): string | null {
  if (!referrer) return null
  try {
    const host = new URL(referrer).hostname.toLowerCase().replace(/^www\./, '')
    if (!host) return null
    const isOwn = ownHosts.some(h => {
      const own = h.toLowerCase().replace(/^www\./, '').replace(/:\d+$/, '')
      return own && (host === own || host.endsWith(`.${own}`))
    })
    return isOwn ? null : host
  } catch {
    return null
  }
}

/**
 * Итоговая классификация источника визита.
 *
 * Приоритет: click-id/UTM рекламы → поиск → соцсети → прочие сайты → прямой заход.
 */
export function classifyTraffic(
  utm: UtmParams,
  referrerHost: string | null
): TrafficSource {
  let referrerType: ReferrerType = 'direct'
  if (referrerHost) {
    if (SEARCH_HOSTS.test(referrerHost)) referrerType = 'search'
    else if (SOCIAL_HOSTS.test(referrerHost)) referrerType = 'social'
    else referrerType = 'referral'
  }

  const src = (utm.utmSource || '').toLowerCase()
  const medium = (utm.utmMedium || '').toLowerCase()
  const isPaidMedium = /^(cpc|ppc|cpm|paid|paidsearch|paid_search|cpa|banner|display|context|ads?)$/.test(medium)

  let channel: TrafficChannel
  if (utm.yclid || (isPaidMedium && /yandex|яндекс|direct|директ/.test(src))) {
    channel = 'yandex_direct'
  } else if (utm.gclid || (isPaidMedium && /google|adwords|гугл/.test(src))) {
    channel = 'google_ads'
  } else if (isPaidMedium) {
    channel = 'paid_other'
  } else if (referrerType === 'search') {
    if (/yandex|ya\.ru/.test(referrerHost || '')) channel = 'organic_yandex'
    else if (/google/.test(referrerHost || '')) channel = 'organic_google'
    else channel = 'organic_other'
  } else if (referrerType === 'social') {
    channel = 'social'
  } else if (referrerType === 'referral') {
    channel = 'referral'
  } else if (src) {
    // UTM есть, но без платного medium (рассылка, партнёрка и т.п.) — считаем переходом
    channel = 'referral'
  } else {
    channel = 'direct'
  }

  return { ...utm, referrerHost, referrerType, channel }
}

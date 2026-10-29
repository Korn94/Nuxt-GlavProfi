// server/utils/userAgent.ts
/**
 * Определение типа устройства по user-agent.
 *
 * Вынесено в отдельный модуль, т.к. используется в двух независимых потоках:
 * - server/utils/sessions.ts — сессии авторизованных пользователей (user_sessions);
 * - server/utils/visitorRegistry.ts — посетители публичного сайта (in-memory).
 */

export type DeviceType = 'desktop' | 'mobile' | 'unknown'

/**
 * Определить тип устройства по строке user-agent.
 *
 * @param userAgent — сырая строка User-Agent (может отсутствовать)
 * @returns 'mobile' | 'desktop' | 'unknown'
 */
export function getDeviceType(userAgent?: string | null): DeviceType {
  if (!userAgent) return 'unknown'

  const ua = userAgent.toLowerCase()

  // Мобильные устройства
  if (/mobile|android|iphone|ipad|ipod|blackberry|iemobile|opera mini|fennec|webos/i.test(ua)) {
    return 'mobile'
  }

  // Планшеты (iPad, Android планшеты)
  if (/tablet|ipad|playbook|silk/i.test(ua)) {
    return 'mobile'
  }

  // Десктоп
  return 'desktop'
}

// ============================================
// АНАЛИТИКА ПОСЕТИТЕЛЕЙ САЙТА
// ============================================

/** Расширенный тип устройства (планшет отдельно от телефона) */
export type VisitorDeviceType = 'desktop' | 'mobile' | 'tablet' | 'unknown'

export interface ParsedUserAgent {
  deviceType: VisitorDeviceType
  browser: string
  os: string
}

/**
 * Поисковые/служебные боты, парсеры, превью-сервисы и headless-браузеры.
 * Googlebot и YandexBot исполняют JS и иначе попадали бы в «посетители».
 */
const BOT_UA_REGEX = new RegExp(
  [
    'bot', 'crawl', 'spider', 'slurp', 'mediapartners', 'adsbot', 'googlebot', 'google-',
    'apis-google', 'headless', 'phantomjs', 'puppeteer', 'playwright', 'selenium',
    'lighthouse', 'pagespeed', 'gtmetrix', 'pingdom', 'uptime', 'monitor',
    'curl', 'wget', 'python', 'java/', 'go-http', 'okhttp', 'axios', 'node-fetch',
    'scrapy', 'httpclient', 'libwww', 'facebookexternalhit', 'telegrambot', 'whatsapp',
    'skypeuripreview', 'yandex(?!search|browser)', 'bing', 'duckduck', 'baidu',
    'semrush', 'ahrefs', 'mj12', 'dotbot', 'petalbot', 'bytespider', 'preview', 'metrika'
  ].join('|'),
  'i'
)

/**
 * Определить, что User-Agent принадлежит боту/скрипту.
 * Пустой UA считается ботом: реальные браузеры его всегда отправляют.
 */
export function isBotUserAgent(userAgent?: string | null): boolean {
  if (!userAgent || userAgent.trim().length < 10) return true
  return BOT_UA_REGEX.test(userAgent)
}

/**
 * Упрощённый разбор User-Agent: тип устройства (с планшетами), браузер и ОС.
 * Без внешних зависимостей — достаточно для аналитики по крупным группам.
 */
export function parseUserAgent(userAgent?: string | null): ParsedUserAgent {
  if (!userAgent) return { deviceType: 'unknown', browser: 'Unknown', os: 'Unknown' }
  const ua = userAgent

  // --- Устройство ---
  let deviceType: VisitorDeviceType = 'desktop'
  if (/ipad|tablet|playbook|silk|(android(?!.*mobile))/i.test(ua)) {
    deviceType = 'tablet'
  } else if (/mobile|iphone|ipod|android|blackberry|iemobile|opera mini|fennec|webos/i.test(ua)) {
    deviceType = 'mobile'
  }

  // --- Браузер (порядок важен: Chrome-подобные содержат «Safari», Edge — «Chrome») ---
  let browser = 'Other'
  if (/YaBrowser/i.test(ua)) browser = 'Yandex Browser'
  else if (/Edg(e|A|iOS)?\//i.test(ua)) browser = 'Edge'
  else if (/OPR\/|Opera/i.test(ua)) browser = 'Opera'
  else if (/SamsungBrowser/i.test(ua)) browser = 'Samsung Internet'
  else if (/Firefox|FxiOS/i.test(ua)) browser = 'Firefox'
  else if (/Chrome|CriOS/i.test(ua)) browser = 'Chrome'
  else if (/Safari/i.test(ua)) browser = 'Safari'
  else if (/MSIE|Trident/i.test(ua)) browser = 'IE'

  // --- ОС ---
  let os = 'Other'
  if (/Windows/i.test(ua)) os = 'Windows'
  else if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS'
  else if (/Android/i.test(ua)) os = 'Android'
  else if (/Mac OS X|Macintosh/i.test(ua)) os = 'macOS'
  else if (/CrOS/i.test(ua)) os = 'ChromeOS'
  else if (/Linux|X11/i.test(ua)) os = 'Linux'

  return { deviceType, browser, os }
}

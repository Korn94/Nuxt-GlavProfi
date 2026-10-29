// server/utils/visitorTypes.ts
/**
 * Типы и константы аналитики посетителей публичного сайта.
 * Используются реестром (visitorRegistry.ts) и записью в БД (visitorStorage.ts).
 */

import type { VisitorDeviceType } from './userAgent'
import type { ReferrerType, TrafficChannel } from './trafficSource'

// ============================================
// КОНСТАНТЫ
// ============================================

/** Посетитель «онлайн», если активная вкладка пинговала не позже этого окна */
export const VISITOR_ONLINE_MS = 60 * 1000

/** Сколько без пингов посетитель ещё виден в живом списке (как «простой») */
export const VISITOR_TTL_MS = 5 * 60 * 1000

/** Визит завершается после стольких мс без активности */
export const SESSION_TIMEOUT_MS = 30 * 60 * 1000

/** Предохранитель памяти: максимум одновременно открытых визитов */
export const MAX_VISITORS = 2000

/** Отказ: один просмотр, меньше стольки секунд активного времени и без событий */
export const BOUNCE_MAX_SEC = 10

/** Лимит накопленных (ещё не сброшенных в БД) просмотров/событий на визит */
export const MAX_PENDING = 500

/** Допустимые типы событий (остальные отбрасываются) */
export const ALLOWED_EVENT_TYPES = [
  'click_phone',
  'copy_phone',
  'click_messenger',
  'click_email',
  'form_open',
  'form_submit',
  'cta_click'
] as const
export type VisitorEventType = typeof ALLOWED_EVENT_TYPES[number]

/** События, считающиеся конверсией (обращением) */
export const CONVERSION_EVENT_TYPES: readonly VisitorEventType[] = [
  'click_phone',
  'copy_phone',
  'click_messenger',
  'click_email',
  'form_submit'
]

/** Формат visitor_id, который генерирует клиент (app/composables/useVisitorTracker.ts) */
export const VISITOR_ID_REGEX = /^v_[A-Za-z0-9_-]{8,60}$/

// ============================================
// ТИПЫ
// ============================================

export type VisitorStatus = 'online' | 'idle'

export interface PageviewRow {
  path: string
  /** ISO */
  enteredAt: string
  durationSec: number
  maxScrollPct: number
}

export interface EventRow {
  type: VisitorEventType
  path: string | null
  meta: Record<string, string | number | boolean | null> | null
  /** ISO */
  createdAt: string
}

export interface TabState {
  lastPing: number
  /** вкладка видима и пользователь взаимодействовал недавно */
  active: boolean
}

export interface CurrentPage {
  path: string
  enteredAt: number
  activeSec: number
  maxScroll: number
}

export interface VisitorRecord {
  id: string
  sessionId: string
  /** Порядковый номер визита этого посетителя (1 — первый) */
  visitNumber: number
  /** Когда посетитель появился впервые (ISO) */
  firstSeenAt: string

  ipAddress: string
  ipHash: string
  userAgent: string
  deviceType: VisitorDeviceType
  browser: string
  os: string
  country: string | null
  region: string | null
  city: string | null
  screenW: number | null
  screenH: number | null
  viewportW: number | null
  viewportH: number | null
  language: string | null
  timezone: string | null
  ymClientId: string | null

  /** Текущая страница (без query) */
  activePath: string
  landingPath: string
  exitPath: string

  referrerHost: string | null
  referrerType: ReferrerType
  channel: TrafficChannel
  utmSource: string | null
  utmMedium: string | null
  utmCampaign: string | null
  utmTerm: string | null
  utmContent: string | null
  yclid: string | null
  gclid: string | null

  /** ISO */
  startedAt: string
  /** ISO */
  lastActivity: string
  activeSeconds: number
  pagesCount: number
  eventsCount: number
  converted: boolean

  tabs: Map<string, TabState>
  currentPage: CurrentPage | null
  pendingPageviews: PageviewRow[]
  pendingEvents: EventRow[]
  dirty: boolean
}

/** То, что уходит в UI (без внутренних структур) */
export interface ActiveVisitor {
  id: string
  status: VisitorStatus
  activePath: string
  landingPath: string
  /** host реферера (имя поля сохранено для обратной совместимости) */
  referrer: string | null
  referrerType: ReferrerType
  channel: TrafficChannel
  channelLabel: string
  utmSource: string | null
  utmMedium: string | null
  utmCampaign: string | null
  startedAt: string
  lastActivity: string
  ipAddress: string
  userAgent: string
  deviceType: VisitorDeviceType
  browser: string
  os: string
  city: string | null
  visitNumber: number
  isReturning: boolean
  pagesCount: number
  eventsCount: number
  activeSeconds: number
  converted: boolean
}

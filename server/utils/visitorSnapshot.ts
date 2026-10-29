// server/utils/visitorSnapshot.ts
/**
 * Снимки визитов для записи в БД (формат между реестром и visitorStorage.ts).
 */

import type { VisitorDeviceType } from './userAgent'
import type { ReferrerType, TrafficChannel } from './trafficSource'
import { BOUNCE_MAX_SEC, type EventRow, type PageviewRow, type VisitorRecord } from './visitorTypes'

/** Снимок визита для записи в БД */
export interface VisitSnapshot {
  /** true — визит завершён (запись окончательная) */
  final: boolean
  visitor: {
    id: string
    firstSeenAt: string
    lastSeenAt: string
    visitNumber: number
    channel: TrafficChannel
    referrerHost: string | null
    utmSource: string | null
    utmMedium: string | null
    utmCampaign: string | null
    landingPath: string
    ymClientId: string | null
    converted: boolean
  }
  session: {
    id: string
    visitorId: string
    visitNumber: number
    startedAt: string
    lastActivityAt: string
    endedAt: string | null
    activeSeconds: number
    pagesCount: number
    eventsCount: number
    isBounce: boolean
    converted: boolean
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
    ipHash: string
    country: string | null
    region: string | null
    city: string | null
    deviceType: VisitorDeviceType
    os: string
    browser: string
    screenW: number | null
    screenH: number | null
    viewportW: number | null
    viewportH: number | null
    language: string | null
    timezone: string | null
  }
  pageviews: PageviewRow[]
  events: EventRow[]
}

/** Отказ: один просмотр, мало активного времени, без событий */
export function computeIsBounce(rec: VisitorRecord): boolean {
  return rec.pagesCount <= 1 && rec.activeSeconds < BOUNCE_MAX_SEC && rec.eventsCount === 0
}

/**
 * Собрать снимок визита и ОЧИСТИТЬ очереди pendingPageviews/pendingEvents
 * (повторно одни и те же строки писать нельзя).
 */
export function buildSnapshot(rec: VisitorRecord, final: boolean): VisitSnapshot {
  const pageviews = rec.pendingPageviews
  const events = rec.pendingEvents
  rec.pendingPageviews = []
  rec.pendingEvents = []
  rec.dirty = false

  return {
    final,
    visitor: {
      id: rec.id,
      firstSeenAt: rec.firstSeenAt,
      lastSeenAt: rec.lastActivity,
      visitNumber: rec.visitNumber,
      channel: rec.channel,
      referrerHost: rec.referrerHost,
      utmSource: rec.utmSource,
      utmMedium: rec.utmMedium,
      utmCampaign: rec.utmCampaign,
      landingPath: rec.landingPath,
      ymClientId: rec.ymClientId,
      converted: rec.converted
    },
    session: {
      id: rec.sessionId,
      visitorId: rec.id,
      visitNumber: rec.visitNumber,
      startedAt: rec.startedAt,
      lastActivityAt: rec.lastActivity,
      endedAt: final ? rec.lastActivity : null,
      activeSeconds: rec.activeSeconds,
      pagesCount: rec.pagesCount,
      eventsCount: rec.eventsCount,
      isBounce: computeIsBounce(rec),
      converted: rec.converted,
      landingPath: rec.landingPath,
      exitPath: rec.exitPath,
      referrerHost: rec.referrerHost,
      referrerType: rec.referrerType,
      channel: rec.channel,
      utmSource: rec.utmSource,
      utmMedium: rec.utmMedium,
      utmCampaign: rec.utmCampaign,
      utmTerm: rec.utmTerm,
      utmContent: rec.utmContent,
      yclid: rec.yclid,
      gclid: rec.gclid,
      ipHash: rec.ipHash,
      country: rec.country,
      region: rec.region,
      city: rec.city,
      deviceType: rec.deviceType,
      os: rec.os,
      browser: rec.browser,
      screenW: rec.screenW,
      screenH: rec.screenH,
      viewportW: rec.viewportW,
      viewportH: rec.viewportH,
      language: rec.language,
      timezone: rec.timezone
    },
    pageviews,
    events
  }
}

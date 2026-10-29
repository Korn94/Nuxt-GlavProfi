// server/utils/visitorHelpers.ts
/**
 * Чистые хелперы реестра посетителей (без состояния).
 * Состояние и публичное API — в server/utils/visitorRegistry.ts.
 */

import { createHash } from 'node:crypto'
import { CHANNEL_LABELS, type UtmParams } from './trafficSource'
import {
  MAX_PENDING,
  VISITOR_ONLINE_MS,
  VISITOR_TTL_MS,
  type ActiveVisitor,
  type EventRow,
  type VisitorRecord,
  type VisitorStatus
} from './visitorTypes'

export function clampString(value: unknown, maxLength: number): string {
  if (typeof value !== 'string') return ''
  return value.length > maxLength ? value.slice(0, maxLength) : value
}

export function toInt(value: unknown, min: number, max: number): number | null {
  if (value === null || value === undefined || value === '') return null
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n)) return null
  return Math.min(max, Math.max(min, Math.round(n)))
}

export function nullable(value: unknown, max: number): string | null {
  const s = clampString(value, max).trim()
  return s || null
}

export function sanitizeTabId(value: unknown): string {
  const s = clampString(value, 40).replace(/[^A-Za-z0-9_-]/g, '')
  return s || 'default'
}

/** IP храним только в виде хэша с солью (в БД попадает именно он) */
export function hashIp(ip: string): string {
  const salt = process.env.VISITOR_IP_SALT || process.env.NUXT_JWT_SECRET || 'glavprofi-visitors'
  return createHash('sha256').update(`${salt}:${ip}`).digest('hex')
}

export function sanitizeMeta(meta: unknown): EventRow['meta'] {
  if (!meta || typeof meta !== 'object' || Array.isArray(meta)) return null
  const out: Record<string, string | number | boolean | null> = {}
  let count = 0
  for (const [key, value] of Object.entries(meta as Record<string, unknown>)) {
    if (count >= 8) break
    const k = key.slice(0, 40)
    if (typeof value === 'string') out[k] = value.slice(0, 200)
    else if (typeof value === 'number' && Number.isFinite(value)) out[k] = value
    else if (typeof value === 'boolean' || value === null) out[k] = value
    else continue
    count++
  }
  return count ? out : null
}

export function hasCampaignMarkers(utm: UtmParams): boolean {
  return !!(utm.utmSource || utm.yclid || utm.gclid)
}

export function sameCampaign(rec: VisitorRecord, utm: UtmParams): boolean {
  return rec.utmSource === utm.utmSource
    && rec.utmCampaign === utm.utmCampaign
    && rec.yclid === utm.yclid
    && rec.gclid === utm.gclid
}

/** Закрыть открытую страницу: перенести в очередь на запись */
export function closeCurrentPage(rec: VisitorRecord): void {
  const page = rec.currentPage
  if (!page) return
  if (rec.pendingPageviews.length < MAX_PENDING) {
    rec.pendingPageviews.push({
      path: page.path,
      enteredAt: new Date(page.enteredAt).toISOString(),
      durationSec: page.activeSec,
      maxScrollPct: page.maxScroll
    })
  }
  rec.currentPage = null
  rec.dirty = true
}

export function pruneTabs(rec: VisitorRecord, now: number): void {
  for (const [tabId, tab] of rec.tabs) {
    if (now - tab.lastPing > VISITOR_TTL_MS) rec.tabs.delete(tabId)
  }
}

/** Запись реестра → объект для UI со статусом online/idle */
export function toActive(rec: VisitorRecord, now: number): ActiveVisitor {
  const last = new Date(rec.lastActivity).getTime()
  let hasActiveTab = false
  for (const tab of rec.tabs.values()) {
    if (tab.active && now - tab.lastPing <= VISITOR_ONLINE_MS) { hasActiveTab = true; break }
  }
  const status: VisitorStatus = hasActiveTab && Number.isFinite(last) && now - last <= VISITOR_ONLINE_MS
    ? 'online'
    : 'idle'

  return {
    id: rec.id,
    status,
    activePath: rec.activePath,
    landingPath: rec.landingPath,
    referrer: rec.referrerHost,
    referrerType: rec.referrerType,
    channel: rec.channel,
    channelLabel: CHANNEL_LABELS[rec.channel] || rec.channel,
    utmSource: rec.utmSource,
    utmMedium: rec.utmMedium,
    utmCampaign: rec.utmCampaign,
    startedAt: rec.startedAt,
    lastActivity: rec.lastActivity,
    ipAddress: rec.ipAddress,
    userAgent: rec.userAgent,
    deviceType: rec.deviceType,
    browser: rec.browser,
    os: rec.os,
    city: rec.city,
    visitNumber: rec.visitNumber,
    isReturning: rec.visitNumber > 1,
    pagesCount: rec.pagesCount,
    eventsCount: rec.eventsCount,
    activeSeconds: rec.activeSeconds,
    converted: rec.converted
  }
}

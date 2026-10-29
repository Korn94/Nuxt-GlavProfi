// server/utils/visitorRegistry.ts
/**
 * 👥 Реестр посетителей публичного сайта (горячее состояние в памяти).
 *
 * Роль реестра:
 * - realtime «кто сейчас на сайте» для /cabinet/online;
 * - сборка ВИЗИТА (сессии) на сервере: новый визит начинается после 30 минут
 *   без активности либо при заходе с новой рекламной меткой (utm/yclid/gclid);
 * - накопление просмотров страниц и событий (клик по телефону, форма…);
 * - выдача «снимков» (VisitSnapshot) для записи в БД (server/utils/visitorStorage.ts).
 *
 * Реестр сам в БД не ходит. Перед остановкой процесса плагин visitor-flush
 * сбрасывает всё накопленное в БД.
 */

import { nanoid } from 'nanoid'
import { parseUserAgent } from './userAgent'
import {
  CHANNEL_LABELS,
  classifyTraffic,
  normalizePath,
  parseReferrerHost,
  parseUtmFromPath
} from './trafficSource'
import {
  ALLOWED_EVENT_TYPES,
  CONVERSION_EVENT_TYPES,
  MAX_PENDING,
  MAX_VISITORS,
  SESSION_TIMEOUT_MS,
  VISITOR_TTL_MS,
  type ActiveVisitor,
  type VisitorEventType,
  type VisitorRecord
} from './visitorTypes'
import { buildSnapshot, type VisitSnapshot } from './visitorSnapshot'
import {
  clampString,
  closeCurrentPage,
  hasCampaignMarkers,
  hashIp,
  nullable,
  pruneTabs,
  sameCampaign,
  sanitizeMeta,
  sanitizeTabId,
  toActive,
  toInt
} from './visitorHelpers'


export interface TouchInput {
  visitorId: string
  tabId?: unknown
  ipAddress: string
  userAgent: string
  path?: unknown
  referrer?: unknown
  visible?: unknown
  idle?: unknown
  activeSec?: unknown
  scroll?: unknown
  prevPath?: unknown
  prevScroll?: unknown
  screenW?: unknown
  screenH?: unknown
  viewportW?: unknown
  viewportH?: unknown
  language?: unknown
  timezone?: unknown
  ymClientId?: unknown
  geo?: { country?: string | null; region?: string | null; city?: string | null }
  /** Хосты нашего сайта (реферер с них = внутренняя навигация, а не источник) */
  ownHosts: string[]
  /** История из БД для посетителя, которого ещё нет в памяти */
  history?: { visitsCount: number; firstSeenAt: string } | null
}

// ============================================
// СОСТОЯНИЕ (singleton на процесс)
// ============================================

const visitors = new Map<string, VisitorRecord>()

/** Завершённые визиты, ждущие записи в БД */
const finishedVisits: VisitorRecord[] = []

/** Завершить визит: закрыть страницу и поставить в очередь на запись */
function finishVisit(rec: VisitorRecord): void {
  closeCurrentPage(rec)
  finishedVisits.push(rec)
}

/** Есть ли у посетителя открытый (не просроченный) визит в памяти */
export function hasVisitorRecord(visitorId: string): boolean {
  const rec = visitors.get(visitorId)
  if (!rec) return false
  return Date.now() - new Date(rec.lastActivity).getTime() <= SESSION_TIMEOUT_MS
}

/** Сколько визитов сейчас в памяти (для предохранителей и логов) */
export function getRegistrySize(): number {
  return visitors.size
}

/** Создать новую запись визита (внутренняя функция touchVisitor) */
function createRecord(input: TouchInput, ctx: {
  path: string
  nowIso: string
  traffic: ReturnType<typeof classifyTraffic>
  ua: ReturnType<typeof parseUserAgent>
  visitNumber: number
  firstSeenAt: string
}): VisitorRecord {
  const { path, nowIso, traffic, ua } = ctx
  const ip = input.ipAddress || 'unknown'

  return {
    id: input.visitorId,
    sessionId: nanoid(20),
    visitNumber: ctx.visitNumber,
    firstSeenAt: ctx.firstSeenAt,
    ipAddress: ip,
    ipHash: hashIp(ip),
    userAgent: clampString(input.userAgent, 512),
    deviceType: ua.deviceType,
    browser: ua.browser,
    os: ua.os,
    country: null,
    region: null,
    city: null,
    screenW: null,
    screenH: null,
    viewportW: null,
    viewportH: null,
    language: null,
    timezone: null,
    ymClientId: null,
    activePath: path,
    landingPath: path,
    exitPath: path,
    referrerHost: traffic.referrerHost,
    referrerType: traffic.referrerType,
    channel: traffic.channel,
    utmSource: traffic.utmSource,
    utmMedium: traffic.utmMedium,
    utmCampaign: traffic.utmCampaign,
    utmTerm: traffic.utmTerm,
    utmContent: traffic.utmContent,
    yclid: traffic.yclid,
    gclid: traffic.gclid,
    startedAt: nowIso,
    lastActivity: nowIso,
    activeSeconds: 0,
    pagesCount: 0,
    eventsCount: 0,
    converted: false,
    tabs: new Map(),
    currentPage: null,
    pendingPageviews: [],
    pendingEvents: [],
    dirty: true
  }
}

/** Обновить общие данные устройства/окружения из пинга */
function applyEnvironment(rec: VisitorRecord, input: TouchInput, ua: ReturnType<typeof parseUserAgent>): void {
  rec.ipAddress = input.ipAddress || rec.ipAddress
  rec.userAgent = clampString(input.userAgent, 512) || rec.userAgent
  rec.deviceType = ua.deviceType
  rec.browser = ua.browser
  rec.os = ua.os

  rec.country = input.geo?.country || rec.country
  rec.region = input.geo?.region || rec.region
  rec.city = input.geo?.city || rec.city
  rec.screenW = toInt(input.screenW, 0, 20000) ?? rec.screenW
  rec.screenH = toInt(input.screenH, 0, 20000) ?? rec.screenH
  rec.viewportW = toInt(input.viewportW, 0, 20000) ?? rec.viewportW
  rec.viewportH = toInt(input.viewportH, 0, 20000) ?? rec.viewportH
  rec.language = nullable(input.language, 20) || rec.language
  rec.timezone = nullable(input.timezone, 64) || rec.timezone
  rec.ymClientId = nullable(input.ymClientId, 64) || rec.ymClientId
}

/** Учесть страницу, время и скролл из пинга */
function applyPage(rec: VisitorRecord, input: TouchInput, path: string, now: number): void {
  const activeSec = toInt(input.activeSec, 0, 120) ?? 0
  const scroll = toInt(input.scroll, 0, 100) ?? 0
  const page = rec.currentPage

  if (page && page.path !== path) {
    // Переход на другую страницу: время и скролл до перехода относятся к старой
    const prevNorm = input.prevPath ? normalizePath(clampString(input.prevPath, 500)) : null
    if (prevNorm === page.path) {
      page.maxScroll = Math.max(page.maxScroll, toInt(input.prevScroll, 0, 100) ?? 0)
    }
    page.activeSec += activeSec
    closeCurrentPage(rec)
    rec.currentPage = { path, enteredAt: now, activeSec: 0, maxScroll: scroll }
    rec.pagesCount++
  } else if (!page) {
    rec.currentPage = { path, enteredAt: now, activeSec, maxScroll: scroll }
    rec.pagesCount++
  } else {
    page.activeSec += activeSec
    page.maxScroll = Math.max(page.maxScroll, scroll)
  }

  rec.activeSeconds += activeSec
  rec.activePath = path
  rec.exitPath = path
}

/**
 * Зафиксировать активность посетителя (пинг): создать/продолжить визит.
 * @returns запись или null, если реестр переполнен
 */
export function touchVisitor(input: TouchInput): VisitorRecord | null {
  const now = Date.now()
  const nowIso = new Date(now).toISOString()
  const id = input.visitorId

  const rawPath = clampString(input.path, 500) || '/'
  const path = normalizePath(rawPath)
  const utm = parseUtmFromPath(rawPath)
  const referrerHost = parseReferrerHost(clampString(input.referrer, 500), input.ownHosts)
  const ua = parseUserAgent(input.userAgent)

  let rec = visitors.get(id)
  let prevVisitNumber: number | null = null
  let prevFirstSeen: string | null = null

  if (rec) {
    const gap = now - new Date(rec.lastActivity).getTime()
    const newCampaign = hasCampaignMarkers(utm) && !sameCampaign(rec, utm)
    if (gap > SESSION_TIMEOUT_MS || newCampaign) {
      // Старый визит закрываем (уйдёт в БД), начинаем новый
      prevVisitNumber = rec.visitNumber
      prevFirstSeen = rec.firstSeenAt
      finishVisit(rec)
      visitors.delete(id)
      rec = undefined
    }
  }

  if (!rec) {
    if (visitors.size >= MAX_VISITORS) {
      console.warn(`[VisitorRegistry] ⚠️ Достигнут лимит визитов (${MAX_VISITORS}) — новая запись не создана`)
      return null
    }
    rec = createRecord(input, {
      path,
      nowIso,
      ua,
      traffic: classifyTraffic(utm, referrerHost),
      visitNumber: (prevVisitNumber ?? input.history?.visitsCount ?? 0) + 1,
      firstSeenAt: prevFirstSeen || input.history?.firstSeenAt || nowIso
    })
    visitors.set(id, rec)
  }

  applyEnvironment(rec, input, ua)
  rec.lastActivity = nowIso
  rec.dirty = true

  // --- Вкладки: у каждой свой tabId, «активной» считается видимая и не простаивающая ---
  rec.tabs.set(sanitizeTabId(input.tabId), {
    lastPing: now,
    active: input.visible !== false && input.idle !== true
  })
  pruneTabs(rec, now)

  applyPage(rec, input, path, now)
  return rec
}


/**
 * Явный «уход» вкладки (sendBeacon при закрытии). Визит НЕ завершается:
 * при перезагрузке или возврате в течение 30 минут он продолжится.
 * @returns изменился ли живой список
 */
export function leaveVisitor(input: {
  visitorId: string
  tabId?: unknown
  activeSec?: unknown
  scroll?: unknown
}): boolean {
  const rec = visitors.get(input.visitorId)
  if (!rec) return false

  const activeSec = toInt(input.activeSec, 0, 120) ?? 0
  const scroll = toInt(input.scroll, 0, 100) ?? 0
  if (rec.currentPage) {
    rec.currentPage.activeSec += activeSec
    rec.currentPage.maxScroll = Math.max(rec.currentPage.maxScroll, scroll)
  }
  rec.activeSeconds += activeSec
  rec.tabs.delete(sanitizeTabId(input.tabId))
  rec.dirty = true
  return true
}

/**
 * Записать событие (клик по телефону, отправка формы…) в текущий визит.
 * @returns запись визита или null (нет активного визита / тип не разрешён)
 */
export function recordVisitorEvent(input: {
  visitorId: string
  type: string
  path?: unknown
  meta?: unknown
}): VisitorRecord | null {
  if (!(ALLOWED_EVENT_TYPES as readonly string[]).includes(input.type)) return null

  const rec = visitors.get(input.visitorId)
  if (!rec) return null

  const now = Date.now()
  if (now - new Date(rec.lastActivity).getTime() > SESSION_TIMEOUT_MS) return null

  const type = input.type as VisitorEventType
  const path = input.path ? normalizePath(clampString(input.path, 500)) : rec.activePath

  // Дубли (двойной слушатель / двойной клик) в пределах 3 секунд
  const last = rec.pendingEvents[rec.pendingEvents.length - 1]
  if (last && last.type === type && last.path === path && now - new Date(last.createdAt).getTime() < 3000) {
    return rec
  }

  if (rec.pendingEvents.length < MAX_PENDING) {
    rec.pendingEvents.push({
      type,
      path,
      meta: sanitizeMeta(input.meta),
      createdAt: new Date(now).toISOString()
    })
  }
  rec.eventsCount++
  if (CONVERSION_EVENT_TYPES.includes(type)) rec.converted = true
  rec.lastActivity = new Date(now).toISOString()
  rec.dirty = true
  return rec
}

/** Контекст визита для подстановки в заявку (send-message) */
export function getVisitorContext(visitorId: string | null | undefined): {
  sessionId: string
  channelLabel: string
  utmSource: string | null
  utmCampaign: string | null
  referrerHost: string | null
  visitNumber: number
  pagesCount: number
  landingPath: string
  activeSeconds: number
} | null {
  if (!visitorId) return null
  const rec = visitors.get(visitorId)
  if (!rec) return null
  return {
    sessionId: rec.sessionId,
    channelLabel: CHANNEL_LABELS[rec.channel] || rec.channel,
    utmSource: rec.utmSource,
    utmCampaign: rec.utmCampaign,
    referrerHost: rec.referrerHost,
    visitNumber: rec.visitNumber,
    pagesCount: rec.pagesCount,
    landingPath: rec.landingPath,
    activeSeconds: rec.activeSeconds
  }
}

/**
 * Список посетителей для UI: вкладка открыта и активность была не позже 5 минут назад.
 */
export function getActiveVisitors(now: number = Date.now()): ActiveVisitor[] {
  const result: ActiveVisitor[] = []
  for (const rec of visitors.values()) {
    pruneTabs(rec, now)
    if (rec.tabs.size === 0) continue
    const last = new Date(rec.lastActivity).getTime()
    if (!Number.isFinite(last) || now - last > VISITOR_TTL_MS) continue
    result.push(toActive(rec, now))
  }
  return result.sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime())
}

/** Количество посетителей в живом списке */
export function getVisitorsCount(): number {
  return getActiveVisitors().length
}

/**
 * Собрать пачку снимков для записи в БД:
 * - визиты с простоем > 30 минут завершаются и удаляются из памяти;
 * - «грязные» живые визиты отдаются частично (будут дописаны следующим flush).
 *
 * @param opts.finishAll завершить все визиты (остановка процесса)
 */
export function takeFlushBatch(
  now: number = Date.now(),
  opts: { finishAll?: boolean } = {}
): VisitSnapshot[] {
  for (const [id, rec] of visitors) {
    const last = new Date(rec.lastActivity).getTime()
    if (opts.finishAll || !Number.isFinite(last) || now - last > SESSION_TIMEOUT_MS) {
      finishVisit(rec)
      visitors.delete(id)
    }
  }

  const batch: VisitSnapshot[] = []
  for (const rec of finishedVisits.splice(0)) {
    batch.push(buildSnapshot(rec, true))
  }
  for (const rec of visitors.values()) {
    if (rec.dirty) batch.push(buildSnapshot(rec, false))
  }
  return batch
}

/**
 * Вернуть снимки обратно в очередь, если запись в БД не удалась
 * (иначе данные визита потеряются). Страницы/события возвращаются в начало очереди.
 */
export function requeueFailedBatch(batch: VisitSnapshot[]): void {
  for (const snap of batch) {
    const live = visitors.get(snap.visitor.id)
    if (live && live.sessionId === snap.session.id) {
      live.pendingPageviews = [...snap.pageviews, ...live.pendingPageviews].slice(0, MAX_PENDING)
      live.pendingEvents = [...snap.events, ...live.pendingEvents].slice(0, MAX_PENDING)
      live.dirty = true
    }
    // Завершённые визиты при ошибке БД не возвращаем: повтор через dirty-запись невозможен,
    // visitorStorage логирует ошибку. Это осознанный компромисс (аналитика, не финансы).
  }
}


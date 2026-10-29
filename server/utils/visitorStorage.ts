// server/utils/visitorStorage.ts
/**
 * 🗄️ Запись аналитики посетителей в БД (flush из памяти реестра) и очистка.
 *
 * Схема вызова: плагин server/plugins/visitor-flush.ts раз в минуту вызывает
 * flushVisitorsToDb(): реестр отдаёт пачку снимков, мы делаем upsert визитов и
 * вставляем накопленные просмотры/события.
 */

import { db } from '../db'
import { siteVisitors, siteVisitorSessions, siteVisitorPageviews, siteVisitorEvents } from '../db/schema'
import { eq, lt, sql } from 'drizzle-orm'
import { formatMySQLDate } from './sessions'
import { requeueFailedBatch, takeFlushBatch } from './visitorRegistry'
import type { VisitSnapshot } from './visitorSnapshot'

/** Сколько дней хранить сырые просмотры и события (визиты хранятся дольше) */
export const RAW_RETENTION_DAYS = 90

/** ISO → 'YYYY-MM-DD HH:mm:ss' (МСК, как в остальных таблицах проекта) */
function toDb(iso: string): string {
  return formatMySQLDate(new Date(iso))
}

/**
 * История посетителя из БД (сколько визитов было раньше, когда впервые пришёл).
 * Нужна, когда посетителя нет в памяти (после рестарта или долгого отсутствия).
 */
export async function getVisitorHistory(visitorId: string): Promise<{ visitsCount: number; firstSeenAt: string } | null> {
  try {
    const rows = await db
      .select({ visitsCount: siteVisitors.visitsCount, firstSeenAt: siteVisitors.firstSeenAt })
      .from(siteVisitors)
      .where(eq(siteVisitors.id, visitorId))
      .limit(1)
    const row = rows[0]
    if (!row) return null
    // datetime в режиме string хранит локальное время без зоны (процесс тоже в МСК)
    const parsed = new Date(String(row.firstSeenAt).replace(' ', 'T'))
    const iso = Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString()
    return { visitsCount: row.visitsCount, firstSeenAt: iso }
  } catch (error) {
    console.error('[VisitorStorage] ❌ Не удалось получить историю посетителя:', error)
    return null
  }
}

async function writeVisitor(snap: VisitSnapshot): Promise<void> {
  const v = snap.visitor
  await db.insert(siteVisitors).values({
    id: v.id,
    firstSeenAt: toDb(v.firstSeenAt),
    lastSeenAt: toDb(v.lastSeenAt),
    visitsCount: v.visitNumber,
    firstChannel: v.channel,
    firstReferrerHost: v.referrerHost,
    firstUtmSource: v.utmSource,
    firstUtmMedium: v.utmMedium,
    firstUtmCampaign: v.utmCampaign,
    firstLandingPath: v.landingPath,
    ymClientId: v.ymClientId,
    hasConverted: v.converted
  }).onDuplicateKeyUpdate({
    set: {
      lastSeenAt: toDb(v.lastSeenAt),
      visitsCount: sql`GREATEST(${siteVisitors.visitsCount}, ${v.visitNumber})`,
      hasConverted: sql`GREATEST(${siteVisitors.hasConverted}, ${v.converted ? 1 : 0})`,
      ymClientId: sql`COALESCE(${v.ymClientId}, ${siteVisitors.ymClientId})`
    }
  })
}

async function writeSession(snap: VisitSnapshot): Promise<void> {
  const s = snap.session
  const values = {
    id: s.id,
    visitorId: s.visitorId,
    visitNumber: s.visitNumber,
    startedAt: toDb(s.startedAt),
    lastActivityAt: toDb(s.lastActivityAt),
    endedAt: s.endedAt ? toDb(s.endedAt) : null,
    activeSeconds: s.activeSeconds,
    pagesCount: s.pagesCount,
    eventsCount: s.eventsCount,
    isBounce: s.isBounce,
    converted: s.converted,
    landingPath: s.landingPath,
    exitPath: s.exitPath,
    referrerHost: s.referrerHost,
    referrerType: s.referrerType,
    channel: s.channel,
    utmSource: s.utmSource,
    utmMedium: s.utmMedium,
    utmCampaign: s.utmCampaign,
    utmTerm: s.utmTerm,
    utmContent: s.utmContent,
    yclid: s.yclid,
    gclid: s.gclid,
    ipHash: s.ipHash,
    country: s.country,
    region: s.region,
    city: s.city,
    deviceType: s.deviceType,
    os: s.os,
    browser: s.browser,
    screenW: s.screenW,
    screenH: s.screenH,
    viewportW: s.viewportW,
    viewportH: s.viewportH,
    language: s.language,
    timezone: s.timezone
  }

  await db.insert(siteVisitorSessions).values(values).onDuplicateKeyUpdate({
    set: {
      lastActivityAt: values.lastActivityAt,
      endedAt: values.endedAt,
      activeSeconds: s.activeSeconds,
      pagesCount: s.pagesCount,
      eventsCount: s.eventsCount,
      isBounce: s.isBounce,
      converted: s.converted,
      exitPath: s.exitPath,
      country: s.country,
      region: s.region,
      city: s.city,
      screenW: s.screenW,
      screenH: s.screenH,
      viewportW: s.viewportW,
      viewportH: s.viewportH,
      language: s.language,
      timezone: s.timezone
    }
  })
}

async function writeSnapshot(snap: VisitSnapshot): Promise<void> {
  const s = snap.session

  await writeVisitor(snap)
  await writeSession(snap)

  // Просмотры страниц и события (каждая строка пишется один раз — очередь очищается в buildSnapshot)
  if (snap.pageviews.length) {
    await db.insert(siteVisitorPageviews).values(snap.pageviews.map(p => ({
      sessionId: s.id,
      visitorId: s.visitorId,
      path: p.path,
      enteredAt: toDb(p.enteredAt),
      durationSec: p.durationSec,
      maxScrollPct: p.maxScrollPct
    })))
  }
  if (snap.events.length) {
    await db.insert(siteVisitorEvents).values(snap.events.map(e => ({
      sessionId: s.id,
      visitorId: s.visitorId,
      type: e.type,
      path: e.path,
      meta: e.meta,
      createdAt: toDb(e.createdAt)
    })))
  }
}

/**
 * Сбросить накопленное в реестре в БД.
 * @returns количество записанных снимков
 */
export async function flushVisitorsToDb(opts: { finishAll?: boolean } = {}): Promise<number> {
  const batch = takeFlushBatch(Date.now(), opts)
  if (!batch.length) return 0

  const failed: VisitSnapshot[] = []
  let written = 0

  for (const snap of batch) {
    try {
      await writeSnapshot(snap)
      written++
    } catch (error) {
      failed.push(snap)
      console.error('[VisitorStorage] ❌ Ошибка записи визита:', error)
    }
  }

  if (failed.length) requeueFailedBatch(failed)
  return written
}

function affectedRows(result: unknown): number {
  return Number((result as any)?.[0]?.affectedRows ?? 0)
}

/** Удалить сырые просмотры и события старше RAW_RETENTION_DAYS */
export async function cleanupOldVisitorData(days: number = RAW_RETENTION_DAYS): Promise<number> {
  const border = formatMySQLDate(new Date(Date.now() - days * 24 * 60 * 60 * 1000))
  const pv = await db.delete(siteVisitorPageviews).where(lt(siteVisitorPageviews.enteredAt, border))
  const ev = await db.delete(siteVisitorEvents).where(lt(siteVisitorEvents.createdAt, border))
  return affectedRows(pv) + affectedRows(ev)
}


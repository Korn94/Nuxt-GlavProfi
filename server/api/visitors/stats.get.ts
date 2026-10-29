/**
 * 📍 Эндпоинт: GET /api/visitors/stats?days=30
 *
 * Простые сводные таблицы аналитики из БД для блока на /cabinet/online:
 * - channels: источники трафика (визиты, посетители, обращения, отказы, средняя длительность);
 * - pages: страницы (просмотры, среднее время, скролл, выходы);
 * - conversions: последние обращения с источником и путём посетителя;
 * - eventTypes: количество событий по типам;
 * - visits: последние визиты.
 *
 * Доступ: право users:view (префикс /api/visitors в PROTECTED_PATHS).
 * Данные приходят в БД с задержкой до минуты (flush реестра из памяти).
 */

import { desc, eq, gte, inArray, sql } from 'drizzle-orm'
import { getQuery } from 'h3'
import { defineApi } from '../../utils/defineApi'
import { db } from '../../db'
import { siteVisitorEvents, siteVisitorPageviews, siteVisitorSessions } from '../../db/schema'
import { formatMySQLDate } from '../../utils/sessions'
import { CHANNEL_LABELS, type TrafficChannel } from '../../utils/trafficSource'
import { CONVERSION_EVENT_TYPES } from '../../utils/visitorTypes'

const num = (value: unknown): number => {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

export default defineApi(async (event) => {
  const query = getQuery(event)
  const days = Math.min(90, Math.max(1, Math.round(num(query.days) || 30)))
  const border = formatMySQLDate(new Date(Date.now() - days * 24 * 60 * 60 * 1000))

  const s = siteVisitorSessions
  const pv = siteVisitorPageviews
  const ev = siteVisitorEvents

  const [channelRows, pageRows, exitRows, eventTypeRows, conversionRows, visitRows] = await Promise.all([
    db.select({
      channel: s.channel,
      visits: sql<number>`COUNT(*)`,
      visitors: sql<number>`COUNT(DISTINCT ${s.visitorId})`,
      conversions: sql<number>`COALESCE(SUM(${s.converted}), 0)`,
      bounces: sql<number>`COALESCE(SUM(${s.isBounce}), 0)`,
      avgSeconds: sql<number>`COALESCE(AVG(${s.activeSeconds}), 0)`,
      avgPages: sql<number>`COALESCE(AVG(${s.pagesCount}), 0)`
    }).from(s).where(gte(s.startedAt, border)).groupBy(s.channel).orderBy(desc(sql`COUNT(*)`)),

    db.select({
      path: pv.path,
      views: sql<number>`COUNT(*)`,
      avgSeconds: sql<number>`COALESCE(AVG(${pv.durationSec}), 0)`,
      avgScroll: sql<number>`COALESCE(AVG(${pv.maxScrollPct}), 0)`
    }).from(pv).where(gte(pv.enteredAt, border)).groupBy(pv.path).orderBy(desc(sql`COUNT(*)`)).limit(30),

    db.select({
      path: s.exitPath,
      exits: sql<number>`COUNT(*)`
    }).from(s).where(gte(s.startedAt, border)).groupBy(s.exitPath),

    db.select({
      type: ev.type,
      total: sql<number>`COUNT(*)`
    }).from(ev).where(gte(ev.createdAt, border)).groupBy(ev.type).orderBy(desc(sql`COUNT(*)`)),

    db.select({
      id: ev.id,
      type: ev.type,
      path: ev.path,
      createdAt: ev.createdAt,
      visitorId: ev.visitorId,
      channel: s.channel,
      utmCampaign: s.utmCampaign,
      referrerHost: s.referrerHost,
      visitNumber: s.visitNumber,
      pagesCount: s.pagesCount,
      landingPath: s.landingPath,
      city: s.city
    }).from(ev)
      .innerJoin(s, eq(ev.sessionId, s.id))
      .where(sql`${ev.createdAt} >= ${border} AND ${inArray(ev.type, [...CONVERSION_EVENT_TYPES])}`)
      .orderBy(desc(ev.createdAt))
      .limit(30),

    db.select({
      id: s.id,
      visitorId: s.visitorId,
      visitNumber: s.visitNumber,
      startedAt: s.startedAt,
      channel: s.channel,
      utmCampaign: s.utmCampaign,
      referrerHost: s.referrerHost,
      landingPath: s.landingPath,
      exitPath: s.exitPath,
      pagesCount: s.pagesCount,
      activeSeconds: s.activeSeconds,
      isBounce: s.isBounce,
      converted: s.converted,
      deviceType: s.deviceType,
      browser: s.browser,
      city: s.city
    }).from(s).where(gte(s.startedAt, border)).orderBy(desc(s.startedAt)).limit(40)
  ])

  const label = (channel: string) => CHANNEL_LABELS[channel as TrafficChannel] || channel
  const exitsByPath = new Map(exitRows.map(r => [r.path || '', num(r.exits)]))

  return {
    days,
    channels: channelRows.map((r) => {
      const visits = num(r.visits)
      const conversions = num(r.conversions)
      return {
        channel: r.channel,
        channelLabel: label(r.channel),
        visits,
        visitors: num(r.visitors),
        conversions,
        conversionRate: visits ? Math.round((conversions / visits) * 1000) / 10 : 0,
        bounceRate: visits ? Math.round((num(r.bounces) / visits) * 1000) / 10 : 0,
        avgSeconds: Math.round(num(r.avgSeconds)),
        avgPages: Math.round(num(r.avgPages) * 10) / 10
      }
    }),
    pages: pageRows.map((r) => {
      const views = num(r.views)
      const exits = exitsByPath.get(r.path) || 0
      return {
        path: r.path,
        views,
        avgSeconds: Math.round(num(r.avgSeconds)),
        avgScroll: Math.round(num(r.avgScroll)),
        exits,
        exitRate: views ? Math.round((exits / views) * 1000) / 10 : 0
      }
    }),
    eventTypes: eventTypeRows.map(r => ({ type: r.type, total: num(r.total) })),
    conversions: conversionRows.map(r => ({ ...r, channelLabel: label(r.channel) })),
    visits: visitRows.map(r => ({ ...r, channelLabel: label(r.channel) }))
  }
})

// server/api/visitors/profiles/[id].get.ts
/**
 * 📍 Эндпоинт: GET /api/visitors/profiles/[id]?limit=100
 *
 * Назначение: карточка посетителя сайта для страницы /cabinet/online
 * (переход из детализации страницы: «Все сессии»).
 * - visitor: агрегат из site_visitors (первый визит, канал, конверсии, сотрудник);
 * - totals: суммарные метрики по ВСЕМ визитам посетителя;
 * - latest: последняя сессия (город, устройство, кампания, реферер);
 * - sessions: все визиты посетителя (для просмотра каждой сессии).
 *
 * Доступ: право users:view (префикс '/api/visitors' в PROTECTED_PATHS).
 */

import { desc, eq, sql } from 'drizzle-orm'
import { createError, getQuery, getRouterParam } from 'h3'
import { defineApi } from '../../../utils/defineApi'
import { db } from '../../../db'
import { siteVisitorSessions, siteVisitors, users } from '../../../db/schema'
import { CHANNEL_LABELS, type TrafficChannel } from '../../../utils/trafficSource'
import { VISITOR_ID_REGEX } from '../../../utils/visitorTypes'

const num = (value: unknown): number => {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

export default defineApi(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id || !VISITOR_ID_REGEX.test(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Некорректный ID посетителя' })
  }

  const query = getQuery(event)
  const limit = Math.min(200, Math.max(1, Math.round(num(query.limit) || 100)))

  const s = siteVisitorSessions

  const [visitorRows, sessionRows, totalsRows] = await Promise.all([
    db.select({
      id: siteVisitors.id,
      firstSeenAt: siteVisitors.firstSeenAt,
      lastSeenAt: siteVisitors.lastSeenAt,
      visitsCount: siteVisitors.visitsCount,
      firstChannel: siteVisitors.firstChannel,
      firstReferrerHost: siteVisitors.firstReferrerHost,
      firstUtmSource: siteVisitors.firstUtmSource,
      firstUtmMedium: siteVisitors.firstUtmMedium,
      firstUtmCampaign: siteVisitors.firstUtmCampaign,
      firstLandingPath: siteVisitors.firstLandingPath,
      hasConverted: siteVisitors.hasConverted,
      linkedUserId: siteVisitors.linkedUserId,
      linkedUserName: users.name
    })
      .from(siteVisitors)
      .leftJoin(users, eq(siteVisitors.linkedUserId, users.id))
      .where(eq(siteVisitors.id, id))
      .limit(1),

    db.select({
      id: s.id,
      visitNumber: s.visitNumber,
      startedAt: s.startedAt,
      lastActivityAt: s.lastActivityAt,
      endedAt: s.endedAt,
      activeSeconds: s.activeSeconds,
      pagesCount: s.pagesCount,
      eventsCount: s.eventsCount,
      isBounce: s.isBounce,
      converted: s.converted,
      channel: s.channel,
      utmSource: s.utmSource,
      utmCampaign: s.utmCampaign,
      referrerHost: s.referrerHost,
      landingPath: s.landingPath,
      exitPath: s.exitPath,
      city: s.city,
      deviceType: s.deviceType,
      browser: s.browser,
      os: s.os,
      linkedUserId: s.linkedUserId,
      linkedUserName: users.name
    })
      .from(s)
      .leftJoin(users, eq(s.linkedUserId, users.id))
      .where(eq(s.visitorId, id))
      .orderBy(desc(s.startedAt))
      .limit(limit),

    db.select({
      sessions: sql<number>`COUNT(*)`,
      pages: sql<number>`COALESCE(SUM(${s.pagesCount}), 0)`,
      events: sql<number>`COALESCE(SUM(${s.eventsCount}), 0)`,
      activeSeconds: sql<number>`COALESCE(SUM(${s.activeSeconds}), 0)`,
      conversions: sql<number>`COALESCE(SUM(${s.converted}), 0)`,
      bounces: sql<number>`COALESCE(SUM(${s.isBounce}), 0)`,
      firstVisitAt: sql<string | null>`MIN(${s.startedAt})`,
      lastVisitAt: sql<string | null>`MAX(${s.startedAt})`
    })
      .from(s)
      .where(eq(s.visitorId, id))
  ])

  const visitor = visitorRows[0]
  const totals = totalsRows[0]
  const sessionsTotal = num(totals?.sessions)

  if (!visitor && sessionsTotal === 0) {
    throw createError({ statusCode: 404, statusMessage: 'Посетитель не найден' })
  }

  const label = (channel: string | null | undefined) =>
    CHANNEL_LABELS[(channel || 'direct') as TrafficChannel] || channel || 'direct'

  const latest = sessionRows[0]

  return {
    visitor: {
      id,
      firstSeenAt: visitor?.firstSeenAt || totals?.firstVisitAt || null,
      lastSeenAt: visitor?.lastSeenAt || totals?.lastVisitAt || null,
      visitsCount: num(visitor?.visitsCount) || sessionsTotal,
      firstChannel: visitor?.firstChannel || null,
      firstChannelLabel: label(visitor?.firstChannel),
      firstReferrerHost: visitor?.firstReferrerHost || null,
      firstUtmSource: visitor?.firstUtmSource || null,
      firstUtmMedium: visitor?.firstUtmMedium || null,
      firstUtmCampaign: visitor?.firstUtmCampaign || null,
      firstLandingPath: visitor?.firstLandingPath || null,
      hasConverted: Boolean(visitor?.hasConverted),
      linkedUserId: visitor?.linkedUserId ?? null,
      linkedUserName: visitor?.linkedUserName ?? null
    },
    totals: {
      sessions: sessionsTotal,
      pages: num(totals?.pages),
      events: num(totals?.events),
      activeSeconds: num(totals?.activeSeconds),
      conversions: num(totals?.conversions),
      bounces: num(totals?.bounces)
    },
    latest: latest
      ? {
          city: latest.city,
          deviceType: latest.deviceType,
          browser: latest.browser,
          os: latest.os,
          utmCampaign: latest.utmCampaign,
          referrerHost: latest.referrerHost
        }
      : null,
    sessions: sessionRows.map(r => ({ ...r, channelLabel: label(r.channel) })),
    sessionsTotal
  }
})

/**
 * 📍 Эндпоинт: GET /api/visitors/stats?days=30
 *
 * Простые сводные таблицы аналитики из БД для блока на /cabinet/online:
 * - channels: источники трафика (визиты, посетители, обращения, отказы, средняя длительность);
 * - pages: страницы (просмотры, среднее время, скролл, выходы);
 * - eventTypes / eventStats: количество событий по типам;
 * - events: последние события ВСЕХ типов (клик, форма, CTA) с местом и meta;
 * - formFunnel: воронка «CTA → форма открыта → заявка отправлена» по страницам;
 * - conversions: последние обращения с источником и путём посетителя;
 * - visits: последние визиты.
 *
 * Доступ: право users:view (префикс /api/visitors в PROTECTED_PATHS).
 * Данные приходят в БД с задержкой до минуты (flush реестра из памяти).
 */

import { and, desc, eq, gte, inArray, sql } from 'drizzle-orm'
import { getQuery } from 'h3'
import { defineApi } from '../../utils/defineApi'
import { db } from '../../db'
import { siteVisitorEvents, siteVisitorPageviews, siteVisitorSessions, users } from '../../db/schema'
import { formatMySQLDate } from '../../utils/sessions'
import { CHANNEL_LABELS, type TrafficChannel } from '../../utils/trafficSource'
import {
  CONVERSION_EVENT_TYPES,
  CTA_CLICK_EVENT_TYPE,
  FORM_OPEN_EVENT_TYPE,
  LEAD_EVENT_TYPE,
  VISITOR_EVENT_TYPES,
  isConversionEvent
} from '../../utils/visitorTypes'

/** Сколько последних событий отдаём в таблицу (полное число — eventsTotal) */
const EVENTS_LIMIT = 100

const num = (value: unknown): number => {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

/** Процент с одним знаком после запятой */
const pct = (part: number, total: number): number =>
  total ? Math.round((part / total) * 1000) / 10 : 0

export default defineApi(async (event) => {
  const query = getQuery(event)
  const days = Math.min(90, Math.max(1, Math.round(num(query.days) || 30)))
  const border = formatMySQLDate(new Date(Date.now() - days * 24 * 60 * 60 * 1000))

  const s = siteVisitorSessions
  const pv = siteVisitorPageviews
  const ev = siteVisitorEvents

  // Воронка CTA/формы считается по уникальным визитам: одно действие на визит
  const formEvents = and(
    gte(ev.createdAt, border),
    inArray(ev.type, [CTA_CLICK_EVENT_TYPE, FORM_OPEN_EVENT_TYPE, LEAD_EVENT_TYPE])
  )
  const ctaClicksExpr = sql<number>`COUNT(DISTINCT CASE WHEN ${ev.type} = ${CTA_CLICK_EVENT_TYPE} THEN ${ev.sessionId} END)`
  const formOpensExpr = sql<number>`COUNT(DISTINCT CASE WHEN ${ev.type} = ${FORM_OPEN_EVENT_TYPE} THEN ${ev.sessionId} END)`
  const formSubmitsExpr = sql<number>`COUNT(DISTINCT CASE WHEN ${ev.type} = ${LEAD_EVENT_TYPE} THEN ${ev.sessionId} END)`

  const [
    channelRows,
    pageRows,
    exitRows,
    eventTypeRows,
    conversionRows,
    visitRows,
    dailyRows,
    totalsRows,
    eventRows,
    eventTotalRows,
    formFunnelRows,
    formTotalsRows
  ] = await Promise.all([
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
      city: s.city,
      linkedUserId: s.linkedUserId,
      linkedUserName: users.name
    }).from(ev)
      .innerJoin(s, eq(ev.sessionId, s.id))
      .leftJoin(users, eq(s.linkedUserId, users.id))
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
      city: s.city,
      linkedUserId: s.linkedUserId,
      linkedUserName: users.name
    }).from(s).leftJoin(users, eq(s.linkedUserId, users.id)).where(gte(s.startedAt, border)).orderBy(desc(s.startedAt)).limit(40),

    db.select({
      day: sql<string>`DATE(${s.startedAt})`,
      visits: sql<number>`COUNT(*)`,
      visitors: sql<number>`COUNT(DISTINCT ${s.visitorId})`,
      conversions: sql<number>`COALESCE(SUM(${s.converted}), 0)`
    }).from(s).where(gte(s.startedAt, border)).groupBy(sql`DATE(${s.startedAt})`).orderBy(sql`DATE(${s.startedAt})`),

    db.select({
      visits: sql<number>`COUNT(*)`,
      visitors: sql<number>`COUNT(DISTINCT ${s.visitorId})`,
      conversions: sql<number>`COALESCE(SUM(${s.converted}), 0)`,
      bounces: sql<number>`COALESCE(SUM(${s.isBounce}), 0)`,
      avgSeconds: sql<number>`COALESCE(AVG(${s.activeSeconds}), 0)`,
      avgPages: sql<number>`COALESCE(AVG(${s.pagesCount}), 0)`
    }).from(s).where(gte(s.startedAt, border)),

    // Все события за период: таблица «События» (место + meta + переход в визит)
    db.select({
      id: ev.id,
      sessionId: ev.sessionId,
      visitorId: ev.visitorId,
      type: ev.type,
      path: ev.path,
      meta: ev.meta,
      createdAt: ev.createdAt,
      channel: s.channel,
      utmCampaign: s.utmCampaign,
      referrerHost: s.referrerHost,
      visitNumber: s.visitNumber,
      pagesCount: s.pagesCount,
      landingPath: s.landingPath,
      city: s.city,
      linkedUserId: s.linkedUserId,
      linkedUserName: users.name
    }).from(ev)
      .innerJoin(s, eq(ev.sessionId, s.id))
      .leftJoin(users, eq(s.linkedUserId, users.id))
      .where(gte(ev.createdAt, border))
      .orderBy(desc(ev.createdAt))
      .limit(EVENTS_LIMIT),

    db.select({
      total: sql<number>`COUNT(*)`
    }).from(ev).where(gte(ev.createdAt, border)),

    db.select({
      path: ev.path,
      ctaClicks: ctaClicksExpr,
      opens: formOpensExpr,
      submits: formSubmitsExpr
    }).from(ev)
      .where(formEvents)
      .groupBy(ev.path)
      .orderBy(desc(formOpensExpr))
      .limit(20),

    db.select({
      ctaClicks: ctaClicksExpr,
      opens: formOpensExpr,
      submits: formSubmitsExpr,
      submitEvents: sql<number>`COALESCE(SUM(CASE WHEN ${ev.type} = ${LEAD_EVENT_TYPE} THEN 1 ELSE 0 END), 0)`
    }).from(ev).where(formEvents)
  ])

  const label = (channel: string) => CHANNEL_LABELS[channel as TrafficChannel] || channel
  const exitsByPath = new Map(exitRows.map(r => [r.path || '', num(r.exits)]))

  const totalsRow = totalsRows?.[0]
  const totalVisits = num(totalsRow?.visits)
  const totalConversions = num(totalsRow?.conversions)

  const eventCounts = new Map(eventTypeRows.map(r => [r.type, num(r.total)]))
  const formTotals = formTotalsRows?.[0]
  const ctaClicksTotal = num(formTotals?.ctaClicks)
  const formOpensTotal = num(formTotals?.opens)
  const formSubmitsTotal = num(formTotals?.submits)

  return {
    days,
    totals: {
      visits: totalVisits,
      visitors: num(totalsRow?.visitors),
      conversions: totalConversions,
      conversionRate: pct(totalConversions, totalVisits),
      bounceRate: pct(num(totalsRow?.bounces), totalVisits),
      avgSeconds: Math.round(num(totalsRow?.avgSeconds)),
      avgPages: Math.round(num(totalsRow?.avgPages) * 10) / 10,
      leadEvents: num(formTotals?.submitEvents),
      ctaClicks: ctaClicksTotal,
      formOpens: formOpensTotal,
      formSubmits: formSubmitsTotal,
      formSubmitRate: pct(formSubmitsTotal, formOpensTotal)
    },
    daily: dailyRows.map(r => ({
      day: r.day,
      visits: num(r.visits),
      visitors: num(r.visitors),
      conversions: num(r.conversions)
    })),
    channels: channelRows.map((r) => {
      const visits = num(r.visits)
      const conversions = num(r.conversions)
      return {
        channel: r.channel,
        channelLabel: label(r.channel),
        visits,
        visitors: num(r.visitors),
        conversions,
        conversionRate: pct(conversions, visits),
        bounceRate: pct(num(r.bounces), visits),
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
        exitRate: pct(exits, views)
      }
    }),
    eventTypes: eventTypeRows.map(r => ({ type: r.type, total: num(r.total) })),
    eventStats: VISITOR_EVENT_TYPES.map(type => ({
      type,
      total: eventCounts.get(type) || 0,
      isConversion: isConversionEvent(type)
    })),
    eventsTotal: num(eventTotalRows?.[0]?.total),
    events: eventRows.map(r => ({
      ...r,
      channelLabel: label(r.channel),
      isConversion: isConversionEvent(r.type)
    })),
    formFunnel: formFunnelRows.map((r) => {
      const ctaClicks = num(r.ctaClicks)
      const opens = num(r.opens)
      const submits = num(r.submits)
      return {
        path: r.path,
        ctaClicks,
        opens,
        submits,
        ctaToFormRate: pct(opens, ctaClicks),
        submitRate: pct(submits, opens)
      }
    }),
    formFunnelTotals: {
      ctaClicks: ctaClicksTotal,
      opens: formOpensTotal,
      submits: formSubmitsTotal,
      ctaToFormRate: pct(formOpensTotal, ctaClicksTotal),
      submitRate: pct(formSubmitsTotal, formOpensTotal),
      submitEvents: num(formTotals?.submitEvents)
    },
    conversions: conversionRows.map(r => ({ ...r, channelLabel: label(r.channel) })),
    visits: visitRows.map(r => ({ ...r, channelLabel: label(r.channel) }))
  }
})

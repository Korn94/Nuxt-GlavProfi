// server/api/visitors/page.get.ts
/**
 * 📍 Эндпоинт: GET /api/visitors/page?path=/offers/...&days=30&limit=100
 *
 * Назначение: подробная аналитика ОДНОЙ страницы сайта для карточки
 * «Аналитика сайта» на /cabinet/online (клик по строке таблицы «Страницы»):
 * - summary: просмотры, посетители, сессии, входы (landing), выходы, время,
 *   скролл, обращения, конверсия, отказы, доля первых визитов;
 * - daily: просмотры/посетители по дням (для графика);
 * - channels / devices / scroll / eventTypes / eventStats: разрезы по этой странице;
 * - events: последние события ВСЕХ типов на странице (клик, форма, CTA) с meta
 *   и переходом в визит (полное число — eventsTotal);
 * - conversions: последние обращения, совершённые на странице;
 * - sessions: заходы на страницу по сессиям (для перехода к посетителю
 *   и его полной истории визитов).
 *
 * Доступ: право users:view (префикс '/api/visitors' в PROTECTED_PATHS).
 * Данные приходят в БД с задержкой до минуты (flush реестра из памяти).
 */

import { and, desc, eq, gte, inArray, sql } from 'drizzle-orm'
import { createError, getQuery } from 'h3'
import { defineApi } from '../../utils/defineApi'
import { db } from '../../db'
import { siteVisitorEvents, siteVisitorPageviews, siteVisitorSessions, users } from '../../db/schema'
import { formatMySQLDate } from '../../utils/sessions'
import { CHANNEL_LABELS, normalizePath, type TrafficChannel } from '../../utils/trafficSource'
import {
  CONVERSION_EVENT_TYPES,
  VISITOR_EVENT_TYPES,
  isConversionEvent
} from '../../utils/visitorTypes'

const num = (value: unknown): number => {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

/** Процент с одним знаком после запятой */
const pct = (part: number, total: number): number =>
  total > 0 ? Math.round((part / total) * 1000) / 10 : 0

/** Фиксированный порядок бакетов скролла */
const SCROLL_ORDER = ['0-25', '25-50', '50-75', '75-100']

export default defineApi(async (event) => {
  const query = getQuery(event)
  const rawPath = typeof query.path === 'string' ? query.path.trim() : ''
  if (!rawPath) {
    throw createError({ statusCode: 400, statusMessage: 'Не указан путь страницы' })
  }

  const path = normalizePath(rawPath)
  const days = Math.min(90, Math.max(1, Math.round(num(query.days) || 30)))
  const limit = Math.min(300, Math.max(1, Math.round(num(query.limit) || 100)))
  const border = formatMySQLDate(new Date(Date.now() - days * 24 * 60 * 60 * 1000))

  const pv = siteVisitorPageviews
  const s = siteVisitorSessions
  const ev = siteVisitorEvents

  const onPage = and(eq(pv.path, path), gte(pv.enteredAt, border))
  const scrollBucket = sql<string>`CASE
    WHEN ${pv.maxScrollPct} < 25 THEN '0-25'
    WHEN ${pv.maxScrollPct} < 50 THEN '25-50'
    WHEN ${pv.maxScrollPct} < 75 THEN '50-75'
    ELSE '75-100'
  END`

  const [
    totalsRows,
    entryRows,
    exitRows,
    dailyRows,
    channelRows,
    deviceRows,
    scrollRows,
    eventTypeRows,
    eventRows,
    conversionCountRows,
    conversionRows,
    sessionRows
  ] = await Promise.all([
    // Просмотры страницы + метрики сессий, в которых она открывалась
    db.select({
      views: sql<number>`COUNT(*)`,
      visitors: sql<number>`COUNT(DISTINCT ${pv.visitorId})`,
      sessions: sql<number>`COUNT(DISTINCT ${pv.sessionId})`,
      avgSeconds: sql<number>`COALESCE(AVG(${pv.durationSec}), 0)`,
      avgScroll: sql<number>`COALESCE(AVG(${pv.maxScrollPct}), 0)`,
      firstViewAt: sql<string | null>`MIN(${pv.enteredAt})`,
      lastViewAt: sql<string | null>`MAX(${pv.enteredAt})`,
      convertedSessions: sql<number>`COUNT(DISTINCT CASE WHEN ${s.converted} = 1 THEN ${pv.sessionId} END)`,
      bouncedSessions: sql<number>`COUNT(DISTINCT CASE WHEN ${s.isBounce} = 1 THEN ${pv.sessionId} END)`,
      firstVisits: sql<number>`COUNT(DISTINCT CASE WHEN ${s.visitNumber} = 1 THEN ${pv.sessionId} END)`
    })
      .from(pv)
      .innerJoin(s, eq(pv.sessionId, s.id))
      .where(onPage),

    // Входы на сайт со страницы
    db.select({ entries: sql<number>`COUNT(*)` })
      .from(s)
      .where(and(eq(s.landingPath, path), gte(s.startedAt, border))),

    // Выходы со страницы
    db.select({ exits: sql<number>`COUNT(*)` })
      .from(s)
      .where(and(eq(s.exitPath, path), gte(s.startedAt, border))),

    // Динамика по дням
    db.select({
      day: sql<string>`DATE(${pv.enteredAt})`,
      views: sql<number>`COUNT(*)`,
      visitors: sql<number>`COUNT(DISTINCT ${pv.visitorId})`
    })
      .from(pv)
      .where(onPage)
      .groupBy(sql`DATE(${pv.enteredAt})`)
      .orderBy(sql`DATE(${pv.enteredAt})`),

    // Источники трафика, с которых открывали страницу
    db.select({
      channel: s.channel,
      views: sql<number>`COUNT(*)`,
      visitors: sql<number>`COUNT(DISTINCT ${pv.visitorId})`,
      avgSeconds: sql<number>`COALESCE(AVG(${pv.durationSec}), 0)`
    })
      .from(pv)
      .innerJoin(s, eq(pv.sessionId, s.id))
      .where(onPage)
      .groupBy(s.channel)
      .orderBy(desc(sql`COUNT(*)`)),

    // Устройства
    db.select({
      deviceType: s.deviceType,
      views: sql<number>`COUNT(*)`,
      visitors: sql<number>`COUNT(DISTINCT ${pv.visitorId})`
    })
      .from(pv)
      .innerJoin(s, eq(pv.sessionId, s.id))
      .where(onPage)
      .groupBy(s.deviceType)
      .orderBy(desc(sql`COUNT(*)`)),

    // Распределение глубины скролла
    db.select({
      bucket: scrollBucket,
      views: sql<number>`COUNT(*)`
    })
      .from(pv)
      .where(onPage)
      .groupBy(scrollBucket),

    // События на странице по типам
    db.select({
      type: ev.type,
      total: sql<number>`COUNT(*)`
    })
      .from(ev)
      .where(and(eq(ev.path, path), gte(ev.createdAt, border)))
      .groupBy(ev.type)
      .orderBy(desc(sql`COUNT(*)`)),

    // Все события страницы: таблица «События» (тип + meta + переход в визит).
    // Лимит общий с заходами на страницу (параметр limit).
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
    })
      .from(ev)
      .innerJoin(s, eq(ev.sessionId, s.id))
      .leftJoin(users, eq(s.linkedUserId, users.id))
      .where(and(eq(ev.path, path), gte(ev.createdAt, border)))
      .orderBy(desc(ev.createdAt))
      .limit(limit),

    // Сколько всего обращений на странице
    db.select({ total: sql<number>`COUNT(*)` })
      .from(ev)
      .where(and(
        eq(ev.path, path),
        gte(ev.createdAt, border),
        inArray(ev.type, [...CONVERSION_EVENT_TYPES])
      )),

    // Последние обращения с путём посетителя
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
    })
      .from(ev)
      .innerJoin(s, eq(ev.sessionId, s.id))
      .leftJoin(users, eq(s.linkedUserId, users.id))
      .where(and(
        eq(ev.path, path),
        gte(ev.createdAt, border),
        inArray(ev.type, [...CONVERSION_EVENT_TYPES])
      ))
      .orderBy(desc(ev.createdAt))
      .limit(20),

    // Заходы на страницу: по строке на просмотр (для перехода к посетителю)
    db.select({
      sessionId: pv.sessionId,
      visitorId: pv.visitorId,
      enteredAt: pv.enteredAt,
      durationSec: pv.durationSec,
      maxScrollPct: pv.maxScrollPct,
      visitNumber: s.visitNumber,
      startedAt: s.startedAt,
      lastActivityAt: s.lastActivityAt,
      endedAt: s.endedAt,
      channel: s.channel,
      utmCampaign: s.utmCampaign,
      referrerHost: s.referrerHost,
      city: s.city,
      deviceType: s.deviceType,
      browser: s.browser,
      os: s.os,
      pagesCount: s.pagesCount,
      eventsCount: s.eventsCount,
      activeSeconds: s.activeSeconds,
      isBounce: s.isBounce,
      converted: s.converted,
      linkedUserId: s.linkedUserId,
      linkedUserName: users.name
    })
      .from(pv)
      .innerJoin(s, eq(pv.sessionId, s.id))
      .leftJoin(users, eq(s.linkedUserId, users.id))
      .where(onPage)
      .orderBy(desc(pv.enteredAt))
      .limit(limit)
  ])

  const totals = totalsRows[0]
  const views = num(totals?.views)
  const sessions = num(totals?.sessions)
  const convertedSessions = num(totals?.convertedSessions)
  const bouncedSessions = num(totals?.bouncedSessions)
  const firstVisits = num(totals?.firstVisits)
  const entries = num(entryRows[0]?.entries)
  const exits = num(exitRows[0]?.exits)

  const label = (channel: string | null | undefined) =>
    CHANNEL_LABELS[(channel || 'direct') as TrafficChannel] || channel || 'direct'

  const scrollByBucket = new Map(scrollRows.map(r => [r.bucket, num(r.views)]))
  const eventCounts = new Map(eventTypeRows.map(r => [r.type, num(r.total)]))
  const eventsTotal = eventTypeRows.reduce((sum, r) => sum + num(r.total), 0)

  return {
    path,
    days,
    summary: {
      views,
      visitors: num(totals?.visitors),
      sessions,
      entries,
      exits,
      exitRate: pct(exits, views),
      avgSeconds: Math.round(num(totals?.avgSeconds)),
      avgScroll: Math.round(num(totals?.avgScroll)),
      conversions: num(conversionCountRows[0]?.total),
      conversionRate: pct(convertedSessions, sessions),
      bounceRate: pct(bouncedSessions, sessions),
      firstVisits,
      firstVisitsShare: pct(firstVisits, sessions),
      firstViewAt: totals?.firstViewAt || null,
      lastViewAt: totals?.lastViewAt || null
    },
    daily: dailyRows.map(r => ({
      day: r.day,
      views: num(r.views),
      visitors: num(r.visitors)
    })),
    channels: channelRows.map(r => ({
      channel: r.channel,
      channelLabel: label(r.channel),
      views: num(r.views),
      visitors: num(r.visitors),
      avgSeconds: Math.round(num(r.avgSeconds))
    })),
    devices: deviceRows.map(r => ({
      deviceType: r.deviceType,
      views: num(r.views),
      visitors: num(r.visitors)
    })),
    scroll: SCROLL_ORDER.map((bucket) => {
      const bucketViews = scrollByBucket.get(bucket) || 0
      return { bucket, views: bucketViews, share: pct(bucketViews, views) }
    }),
    eventTypes: eventTypeRows.map(r => ({ type: r.type, total: num(r.total) })),
    eventStats: VISITOR_EVENT_TYPES.map(type => ({
      type,
      total: eventCounts.get(type) || 0,
      isConversion: isConversionEvent(type)
    })),
    eventsTotal,
    events: eventRows.map(r => ({
      ...r,
      channelLabel: label(r.channel),
      isConversion: isConversionEvent(r.type)
    })),
    conversions: conversionRows.map(r => ({ ...r, channelLabel: label(r.channel) })),
    conversionsTotal: num(conversionCountRows[0]?.total),
    sessions: sessionRows.map(r => ({ ...r, channelLabel: label(r.channel) })),
    sessionsTotal: sessions
  }
})

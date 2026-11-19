// server/api/visitors/sessions/[id].get.ts
/**
 * 📍 Эндпоинт: GET /api/visitors/sessions/[id]
 *
 * Назначение: карточка одного визита посетителя сайта (третий уровень
 * детализации на /cabinet/online): параметры сессии, полная хронология
 * просмотров страниц и события (клики по телефону, мессенджеру, формы).
 *
 * Доступ: право users:view (префикс '/api/visitors' в PROTECTED_PATHS).
 */

import { eq } from 'drizzle-orm'
import { createError, getRouterParam } from 'h3'
import { defineApi } from '../../../utils/defineApi'
import { db } from '../../../db'
import {
  siteVisitorEvents,
  siteVisitorPageviews,
  siteVisitorSessions,
  siteVisitors,
  users
} from '../../../db/schema'
import { CHANNEL_LABELS, type TrafficChannel } from '../../../utils/trafficSource'

/** Формат ID визита: nanoid(20) в createRecord (visitorRegistry.ts) */
const SESSION_ID_REGEX = /^[A-Za-z0-9_-]{20}$/

export default defineApi(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id || !SESSION_ID_REGEX.test(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Некорректный ID визита' })
  }

  const s = siteVisitorSessions
  const pv = siteVisitorPageviews
  const ev = siteVisitorEvents

  const sessionRows = await db
    .select({
      id: s.id,
      visitorId: s.visitorId,
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
      utmMedium: s.utmMedium,
      utmCampaign: s.utmCampaign,
      referrerHost: s.referrerHost,
      referrerType: s.referrerType,
      landingPath: s.landingPath,
      exitPath: s.exitPath,
      city: s.city,
      country: s.country,
      region: s.region,
      deviceType: s.deviceType,
      browser: s.browser,
      os: s.os,
      language: s.language,
      linkedUserId: s.linkedUserId,
      linkedUserName: users.name,
      visitorVisitsCount: siteVisitors.visitsCount,
      visitorFirstSeenAt: siteVisitors.firstSeenAt,
      visitorHasConverted: siteVisitors.hasConverted
    })
    .from(s)
    .leftJoin(users, eq(s.linkedUserId, users.id))
    .leftJoin(siteVisitors, eq(s.visitorId, siteVisitors.id))
    .where(eq(s.id, id))
    .limit(1)

  const session = sessionRows[0]
  if (!session) {
    throw createError({ statusCode: 404, statusMessage: 'Визит не найден' })
  }

  const [pageviews, events] = await Promise.all([
    db.select({
      path: pv.path,
      enteredAt: pv.enteredAt,
      durationSec: pv.durationSec,
      maxScrollPct: pv.maxScrollPct
    })
      .from(pv)
      .where(eq(pv.sessionId, id))
      .orderBy(pv.enteredAt),

    db.select({
      id: ev.id,
      type: ev.type,
      path: ev.path,
      createdAt: ev.createdAt,
      meta: ev.meta
    })
      .from(ev)
      .where(eq(ev.sessionId, id))
      .orderBy(ev.createdAt)
  ])

  const label = (channel: string | null | undefined) =>
    CHANNEL_LABELS[(channel || 'direct') as TrafficChannel] || channel || 'direct'

  const { visitorVisitsCount, visitorFirstSeenAt, visitorHasConverted, ...sessionFields } = session

  return {
    session: { ...sessionFields, channelLabel: label(session.channel) },
    visitor: {
      id: session.visitorId,
      visitsCount: Number(visitorVisitsCount ?? session.visitNumber ?? 0),
      firstSeenAt: visitorFirstSeenAt || session.startedAt,
      hasConverted: Boolean(visitorHasConverted ?? session.converted),
      linkedUserId: session.linkedUserId ?? null,
      linkedUserName: session.linkedUserName ?? null
    },
    pageviews,
    events
  }
})

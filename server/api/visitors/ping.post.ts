/**
 * 📍 Эндпоинт: POST /api/visitors/ping
 *
 * Публичный «пинг» от браузера посетителя сайта (без авторизации).
 * Обновляет визит в in-memory реестре (server/utils/visitorRegistry.ts); оттуда
 * данные раз в минуту сбрасываются в БД (server/plugins/visitor-flush.ts).
 *
 * Защита: формат visitorId, rate limit по IP, лимит новых посетителей с IP,
 * фильтр ботов, исключение /cabinet и своих IP (VISITOR_EXCLUDE_IPS).
 *
 * Публичный доступ: путь добавлен в PUBLIC_PATHS (server/middleware/auth.ts).
 *
 * Тело запроса:
 *   {
 *     visitorId, tabId, path, referrer,
 *     visible, idle,                    // вкладка видима / нет действий пользователя
 *     activeSec, scroll,                // активные секунды с прошлого пинга, глубина скролла %
 *     prevPath, prevScroll,             // при смене страницы: откуда ушли
 *     screenW, screenH, viewportW, viewportH, language, timezone, ymClientId,
 *     leave                             // закрытие вкладки (sendBeacon)
 *   }
 *
 * Ответ: { success: true, visitorId, total, ignored? }
 */

import { defineEventHandler, readBody, createError } from 'h3'
import { getRequestIp } from '../../utils/requestIp'
import { getRequestGeo } from '../../utils/requestGeo'
import { isBotUserAgent } from '../../utils/userAgent'
import {
  getOwnHosts,
  isExcludedIp,
  isExcludedPath,
  isNewVisitorFlood,
  isRateLimited,
  resolveVisitorId
} from '../../utils/visitorGuard'
import { hasVisitorRecord, leaveVisitor, touchVisitor, getVisitorsCount } from '../../utils/visitorRegistry'
import { getVisitorHistory } from '../../utils/visitorStorage'
import { scheduleVisitorsBroadcast } from '../../utils/visitor-broadcast'

export default defineEventHandler(async (event) => {
  // ✅ CORS preflight (на случай запросов не с того же origin)
  if (event.method === 'OPTIONS') return null

  if (event.method !== 'POST') {
    throw createError({ statusCode: 405, statusMessage: 'Method Not Allowed' })
  }

  const ipAddress = getRequestIp(event)
  if (isRateLimited('ping', ipAddress)) {
    throw createError({ statusCode: 429, statusMessage: 'Too Many Requests' })
  }

  const body = (await readBody(event).catch(() => null)) as Record<string, unknown> | null
  const visitorId = resolveVisitorId(body?.visitorId)
  if (!body || !visitorId) {
    return { success: true, visitorId: null, total: getVisitorsCount(), ignored: 'invalid' }
  }

  const userAgent = event.headers.get('user-agent') || ''

  // 🤖 Боты, внутренние страницы и свои IP в аналитику не попадают
  if (isBotUserAgent(userAgent)) {
    return { success: true, visitorId, total: getVisitorsCount(), ignored: 'bot' }
  }
  if (isExcludedIp(ipAddress) || isExcludedPath(body.path)) {
    return { success: true, visitorId, total: getVisitorsCount(), ignored: 'excluded' }
  }

  // 🚪 Закрытие вкладки: визит не завершаем (перезагрузка/возврат продолжат его),
  // просто снимаем вкладку и учитываем последние секунды/скролл
  if (body.leave) {
    const changed = leaveVisitor({
      visitorId,
      tabId: body.tabId,
      activeSec: body.activeSec,
      scroll: body.scroll
    })
    if (changed) scheduleVisitorsBroadcast()
    return { success: true, visitorId, total: getVisitorsCount() }
  }

  // Посетителя нет в памяти — это новый ID (лимит с IP) либо возврат после рестарта/простоя
  let history = null
  if (!hasVisitorRecord(visitorId)) {
    if (isNewVisitorFlood(ipAddress)) {
      throw createError({ statusCode: 429, statusMessage: 'Too Many Requests' })
    }
    history = await getVisitorHistory(visitorId)
  }

  const record = touchVisitor({
    visitorId,
    tabId: body.tabId,
    ipAddress,
    userAgent,
    path: body.path,
    referrer: body.referrer,
    visible: body.visible,
    idle: body.idle,
    activeSec: body.activeSec,
    scroll: body.scroll,
    prevPath: body.prevPath,
    prevScroll: body.prevScroll,
    screenW: body.screenW,
    screenH: body.screenH,
    viewportW: body.viewportW,
    viewportH: body.viewportH,
    language: body.language,
    timezone: body.timezone,
    ymClientId: body.ymClientId,
    geo: getRequestGeo(event),
    ownHosts: getOwnHosts(event),
    history
  })

  // ✅ Оповещаем зрителей онлайна (debounced внутри)
  scheduleVisitorsBroadcast()

  return {
    success: true,
    visitorId: record?.id || visitorId,
    total: getVisitorsCount()
  }
})

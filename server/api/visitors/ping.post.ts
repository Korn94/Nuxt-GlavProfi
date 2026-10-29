/**
 * 📍 Эндпоинт: POST /api/visitors/ping
 *
 * Назначение:
 * - Публичный «пинг» от браузера посетителя сайта (анонимного, без авторизации).
 * - Фиксирует/обновляет запись в in-memory реестре (server/utils/visitorRegistry.ts).
 * - Данные НЕ пишутся в БД (пока). Реестр хранит всё необходимое для будущей
 *   аналитики, поэтому позже сюда достаточно добавить persist.
 *
 * Публичный доступ: путь добавлен в PUBLIC_PATHS (server/middleware/auth.ts),
 * т.к. у посетителя нет JWT.
 *
 * Тело запроса (все поля необязательны, кроме visitorId по смыслу):
 *   { visitorId?: string, path?: string, referrer?: string, leave?: boolean }
 *
 * Ответ: { success: true, visitorId: string | null, total: number }
 */

import { defineEventHandler, readBody, createError } from 'h3'
import { getRequestIp } from '../../utils/requestIp'
import { touchVisitor, removeVisitor, getVisitorsCount } from '../../utils/visitorRegistry'
import { scheduleVisitorsBroadcast } from '../../utils/visitor-broadcast'

export default defineEventHandler(async (event) => {
  // ✅ CORS preflight (на случай запросов не с того же origin)
  if (event.method === 'OPTIONS') return null

  if (event.method !== 'POST') {
    throw createError({ statusCode: 405, statusMessage: 'Method Not Allowed' })
  }

  const body = (await readBody(event).catch(() => null)) as {
    visitorId?: string
    path?: string
    referrer?: string
    leave?: boolean
  } | null

  const visitorId = body?.visitorId

  // 🚪 Явный «уход» посетителя (закрытие вкладки / переход на другую вкладку через beacon)
  if (body?.leave) {
    const removed = removeVisitor(visitorId)
    if (removed) scheduleVisitorsBroadcast()
    return { success: true, visitorId: visitorId || null, total: getVisitorsCount() }
  }

  const ipAddress = getRequestIp(event)
  const userAgent = event.headers.get('user-agent') || ''
  const referrer = body?.referrer || event.headers.get('referer') || ''

  const record = touchVisitor({
    visitorId,
    ipAddress,
    userAgent,
    path: body?.path,
    referrer
  })

  // ✅ Мгновенно оповещаем зрителей онлайна (debounced внутри)
  scheduleVisitorsBroadcast()

  return {
    success: true,
    visitorId: record?.id || (visitorId || null),
    total: getVisitorsCount()
  }
})

/**
 * 📍 Эндпоинт: POST /api/visitors/event
 *
 * Публичное событие посетителя: клик по телефону/мессенджеру, открытие формы и т. п.
 * Привязывается к текущему визиту в реестре; при событии-конверсии визит получает
 * признак converted. Отправка формы дополнительно фиксируется на сервере в
 * /api/send-message (по visitorId), поэтому клиенту достаточно слать visitorId.
 *
 * Тело: { visitorId, type, path?, meta? }. Допустимые type — ALLOWED_EVENT_TYPES.
 */

import { defineEventHandler, readBody, createError } from 'h3'
import { getRequestIp } from '../../utils/requestIp'
import { isBotUserAgent } from '../../utils/userAgent'
import { isExcludedIp, isExcludedPath, isRateLimited, resolveVisitorId } from '../../utils/visitorGuard'
import { recordVisitorEvent } from '../../utils/visitorRegistry'
import { scheduleVisitorsBroadcast } from '../../utils/visitor-broadcast'

export default defineEventHandler(async (event) => {
  if (event.method === 'OPTIONS') return null
  if (event.method !== 'POST') {
    throw createError({ statusCode: 405, statusMessage: 'Method Not Allowed' })
  }

  const ipAddress = getRequestIp(event)
  if (isRateLimited('event', ipAddress)) {
    throw createError({ statusCode: 429, statusMessage: 'Too Many Requests' })
  }

  const body = (await readBody(event).catch(() => null)) as Record<string, unknown> | null
  const visitorId = resolveVisitorId(body?.visitorId)
  if (!body || !visitorId || typeof body.type !== 'string') {
    return { success: true, recorded: false }
  }

  const userAgent = event.headers.get('user-agent') || ''
  if (isBotUserAgent(userAgent) || isExcludedIp(ipAddress) || isExcludedPath(body.path)) {
    return { success: true, recorded: false }
  }

  const record = recordVisitorEvent({
    visitorId,
    type: body.type,
    path: body.path,
    meta: body.meta
  })

  if (record) scheduleVisitorsBroadcast()
  return { success: true, recorded: !!record }
})

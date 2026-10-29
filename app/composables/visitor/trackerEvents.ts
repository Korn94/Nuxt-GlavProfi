// app/composables/visitor/trackerEvents.ts
/**
 * Конверсионные события посетителя: клик по телефону, мессенджеру, email, форма.
 * Отправка — sendBeacon (переживает переход по tel:/внешней ссылке).
 */

import {
  EVENT_URL,
  isExcludedPath,
  readVisitorIdFromCookie,
  visitorId,
  type VisitorEventType
} from './trackerCore'

/**
 * Отправить конверсионное событие. Безопасно вызывать где угодно на клиенте:
 * ошибки глушатся, на сервере (SSR) вызов игнорируется.
 */
export function trackVisitorEvent(
  type: VisitorEventType,
  meta?: Record<string, string | number | boolean | null>
): void {
  if (typeof window === 'undefined') return
  try {
    const id = visitorId.value || readVisitorIdFromCookie()
    if (!id || isExcludedPath(window.location.pathname)) return

    const path = window.location.pathname + window.location.search
    const payload = JSON.stringify({ visitorId: id, type, path, meta: meta || null })
    if (typeof navigator.sendBeacon === 'function') {
      navigator.sendBeacon(EVENT_URL, new Blob([payload], { type: 'application/json' }))
    } else {
      fetch(EVENT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true
      }).catch(() => {})
    }
  } catch {
    // молча — трекинг не должен ломать страницу
  }
}

/** Определить тип события по href ссылки (null — ссылка не конверсионная) */
export function classifyHref(href: string): { type: VisitorEventType; meta: Record<string, string> } | null {
  const h = href.trim().toLowerCase()
  if (h.startsWith('tel:')) return { type: 'click_phone', meta: {} }
  if (h.startsWith('mailto:')) return { type: 'click_email', meta: {} }
  if (h.startsWith('viber:')) return { type: 'click_messenger', meta: { messenger: 'viber' } }
  if (/^https?:\/\/(t\.me|telegram\.me)\//.test(h)) return { type: 'click_messenger', meta: { messenger: 'telegram' } }
  if (/^https?:\/\/(wa\.me|api\.whatsapp\.com)\//.test(h)) return { type: 'click_messenger', meta: { messenger: 'whatsapp' } }
  if (/^https?:\/\/max\.ru\//.test(h)) return { type: 'click_messenger', meta: { messenger: 'max' } }
  return null
}

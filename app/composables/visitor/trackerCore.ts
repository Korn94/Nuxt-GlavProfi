// app/composables/visitor/trackerCore.ts
/**
 * Ядро клиентского трекера посетителей: состояние, константы и чистые хелперы.
 * Лежит в подпапке, поэтому Nuxt НЕ делает его авто-импорт (нет конфликтов имён).
 * Основной композабл — app/composables/useVisitorTracker.ts.
 */

import { ref } from 'vue'

// ============================================
// MODULE-LEVEL STATE (singleton на приложение)
// ============================================
export const isTracking = ref(false)
export const visitorId = ref<string | null>(null)

/** Накопители данных между пингами */
export const trackerState = {
  pendingActiveSec: 0,
  maxScroll: 0,
  lastInteraction: Date.now(),
  referrerSent: false,
  ymClientId: null as string | null,
  tabId: ''
}

// ============================================
// КОНСТАНТЫ
// ============================================
export const PING_URL = '/api/visitors/ping'
export const EVENT_URL = '/api/visitors/event'
export const PING_INTERVAL_MS = 30 * 1000
/** Нет действий дольше этого времени — пользователь «простаивает» */
export const IDLE_AFTER_MS = 60 * 1000
export const VISITOR_ID_COOKIE = 'visitor_id'
export const VISITOR_ID_MAX_AGE = 60 * 60 * 24 * 30 // 30 дней
const VISITOR_ID_PATTERN = /^v_[A-Za-z0-9_-]{8,60}$/
const EXCLUDED_PREFIXES = ['/cabinet', '/login', '/access-denied']

export type VisitorEventType =
  | 'click_phone' | 'copy_phone' | 'click_messenger' | 'click_email'
  | 'form_open' | 'form_submit' | 'cta_click'

export function generateId(prefix: string): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return `${prefix}${crypto.randomUUID()}`
    }
  } catch {
    // ignore — fallback ниже
  }
  return `${prefix}${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
}

export function isValidVisitorId(value: string | null | undefined): value is string {
  return !!value && VISITOR_ID_PATTERN.test(value)
}

/** Внутренние страницы (кабинет, логин) не трекаем */
export function isExcludedPath(path: string): boolean {
  return EXCLUDED_PREFIXES.some(p => path === p || path.startsWith(`${p}/`) || path.startsWith(`${p}?`))
}

/** Короткий ID вкладки: хранится в sessionStorage (живёт, пока вкладка открыта) */
export function getTabId(): string {
  if (trackerState.tabId) return trackerState.tabId
  const fresh = () => generateId('t').split('-').join('').slice(0, 24)
  try {
    const stored = sessionStorage.getItem('visitor_tab_id')
    if (stored) { trackerState.tabId = stored; return stored }
    trackerState.tabId = fresh()
    sessionStorage.setItem('visitor_tab_id', trackerState.tabId)
  } catch {
    trackerState.tabId = trackerState.tabId || fresh()
  }
  return trackerState.tabId
}

export function readVisitorIdFromCookie(): string | null {
  try {
    const match = document.cookie.match(new RegExp(`(?:^|; )${VISITOR_ID_COOKIE}=([^;]*)`))
    const value = match?.[1] ? decodeURIComponent(match[1]) : null
    return isValidVisitorId(value) ? value : null
  } catch {
    return null
  }
}

/** Глубина прокрутки текущей страницы, % */
export function currentScrollPct(): number {
  try {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight
    if (scrollable <= 0) return 100
    return Math.min(100, Math.max(0, Math.round((window.scrollY / scrollable) * 100)))
  } catch {
    return 0
  }
}

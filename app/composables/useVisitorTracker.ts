// app/composables/useVisitorTracker.ts
/**
 * Композабл-трекер посетителей публичного сайта (анонимных).
 *
 * Зачем: авторизованные пользователи отслеживаются через сокет + user_sessions,
 * а у анонимного посетителя нет ни JWT (сокет-авторизация отклонит подключение),
 * ни записи в БД. Поэтому анонимный браузер шлёт лёгкий «пинг» на публичный
 * эндпоинт, а сервер держит их в in-memory реестре (без записи в БД).
 *
 * Архитектура:
 * - Singleton на всё приложение: монтируется ОДИН раз — в app/app.vue
 *   (`if (process.client) useVisitorTracker()`), рядом с useActivityTracker().
 * - Работает ТОЛЬКО для неавторизованных: если есть cookie auth_token — трекинг
 *   не стартует (такие пользователи уже есть в списке «Пользователи»).
 * - ID посетителя хранится в cookie `visitor_id` (переживает переходы/перезагрузки).
 * - Пинги: при старте, при смене маршрута, раз в 30 секунд.
 * - Уход: navigator.sendBeacon с { leave: true } на pagehide (мобильный Safari не
 *   кидает beforeunload) и сразу после появления auth_token (вход в систему).
 */

import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useCookie } from 'nuxt/app'
import { useRoute } from 'vue-router'

// ============================================
// MODULE-LEVEL STATE (singleton на приложение)
// ============================================
const isTracking = ref(false)
const visitorId = ref<string | null>(null)

let pingTimer: ReturnType<typeof setInterval> | null = null
let routeWatcher: (() => void) | null = null
let visibilityHandler: (() => void) | null = null
let pageHideHandler: (() => void) | null = null
let lifecycleRegistered = false

// ============================================
// КОНСТАНТЫ
// ============================================
const PING_URL = '/api/visitors/ping'
/** Интервал пингов (мс). Сервер считает посетителя online при активности < 60 c */
const PING_INTERVAL_MS = 30 * 1000 // 30 секунд
const VISITOR_ID_COOKIE = 'visitor_id'
const VISITOR_ID_MAX_AGE = 60 * 60 * 24 * 30 // 30 дней

/**
 * Сгенерировать устойчивый ID посетителя.
 */
function generateVisitorId(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return `v_${crypto.randomUUID()}`
    }
  } catch {
    // ignore — fallback ниже
  }
  return `v_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
}

/**
 * Композабл-трекер посетителей сайта.
 * ✅ Singleton: вызывается ОДИН раз из app/app.vue. Повторные вызовы безопасны.
 */
export function useVisitorTracker() {
  const route = useRoute()
  const authToken = useCookie<string | null>('auth_token')
  const visitorIdCookie = useCookie<string | null>(VISITOR_ID_COOKIE, {
    maxAge: VISITOR_ID_MAX_AGE,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production'
  })

  // ============================================
  // ВНУТРЕННИЕ ФУНКЦИИ
  // ============================================
  function ensureVisitorId(): string {
    if (visitorId.value) return visitorId.value

    const fromCookie = visitorIdCookie.value
    if (fromCookie && fromCookie.length > 0) {
      visitorId.value = fromCookie
      return fromCookie
    }

    const created = generateVisitorId()
    visitorIdCookie.value = created
    visitorId.value = created
    return created
  }

  /** Обычный пинг (fire-and-forget; ошибки глушим — это телеметрия) */
  function sendPing(): void {
    if (!process.client) return
    try {
      const id = ensureVisitorId()
      const referrer = typeof document !== 'undefined' ? (document.referrer || '') : ''
      $fetch(PING_URL, {
        method: 'POST',
        body: { visitorId: id, path: route.fullPath, referrer }
      }).catch(() => {})
    } catch {
      // молча — трекинг не должен ломать страницу
    }
  }

  /** Явный «уход» — через sendBeacon, чтобы точно успеть при закрытии вкладки */
  function sendLeave(): void {
    if (!process.client) return
    const id = visitorId.value
    if (!id) return

    try {
      const payload = JSON.stringify({ visitorId: id, leave: true })
      if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
        navigator.sendBeacon(PING_URL, new Blob([payload], { type: 'application/json' }))
      } else {
        $fetch(PING_URL, { method: 'POST', body: { visitorId: id, leave: true } }).catch(() => {})
      }
    } catch {
      // молча
    }
  }

  function startTracking(): void {
    if (!process.client) return
    if (isTracking.value) return

    isTracking.value = true
    ensureVisitorId()
    sendPing()

    pingTimer = setInterval(sendPing, PING_INTERVAL_MS)

    // Реагируем на клиентские переходы
    routeWatcher = watch(() => route.fullPath, () => sendPing())

    visibilityHandler = () => {
      // При возврате во вкладку обновляем «свежесть» и путь
      if (document.visibilityState === 'visible') sendPing()
    }
    document.addEventListener('visibilitychange', visibilityHandler)

    pageHideHandler = () => sendLeave()
    window.addEventListener('pagehide', pageHideHandler)
    window.addEventListener('beforeunload', pageHideHandler)

    console.log('[VisitorTracker] ▶️ Отслеживание посетителя запущено')
  }

  function stopTracking(): void {
    if (!process.client) return
    if (!isTracking.value) return

    if (pingTimer) { clearInterval(pingTimer); pingTimer = null }
    if (routeWatcher) { routeWatcher(); routeWatcher = null }

    if (visibilityHandler) {
      document.removeEventListener('visibilitychange', visibilityHandler)
      visibilityHandler = null
    }
    if (pageHideHandler) {
      window.removeEventListener('pagehide', pageHideHandler)
      window.removeEventListener('beforeunload', pageHideHandler)
      pageHideHandler = null
    }

    // Сообщаем серверу, что посетитель ушёл (удаляем из реестра сразу)
    sendLeave()

    isTracking.value = false
    console.log('[VisitorTracker] ⏹️ Отслеживание посетителя остановлено')
  }

  // ============================================
  // API
  // ============================================
  const api = { isTracking, visitorId, startTracking, stopTracking, debug: { sendPing, sendLeave } }

  // ============================================
  // LIFECYCLE (регистрируем ровно один раз)
  // ============================================
  if (lifecycleRegistered) return api
  lifecycleRegistered = true

  onMounted(() => {
    if (!process.client) return

    // ✅ Гейт: аноним → трекаем, авторизован → не трекаем (он уже в «Пользователях»)
    watch(
      () => !!authToken.value,
      (isAuthenticated) => {
        if (isAuthenticated) stopTracking()
        else startTracking()
      },
      { immediate: true }
    )
  })

  onUnmounted(() => {
    stopTracking()
  })

  return api
}

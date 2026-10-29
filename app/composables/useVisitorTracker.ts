// app/composables/useVisitorTracker.ts
/**
 * Композабл-трекер посетителей публичного сайта (анонимных).
 *
 * Анонимный браузер шлёт лёгкий «пинг» на публичный эндпоинт, сервер собирает визит
 * (источник, страницы, время, события) и раз в минуту сохраняет его в БД.
 *
 * - Singleton: монтируется один раз в app/app.vue.
 * - Работает только для неавторизованных (нет cookie auth_token).
 * - Не трекает внутренние страницы: /cabinet/**, /login.
 * - visitor_id — cookie (30 дней); tabId — sessionStorage (уникален для вкладки).
 * - Пинги: старт, смена маршрута, раз в 30 с, пока вкладка ВИДИМА.
 *   Скрытая вкладка по таймеру не пингует (одно сообщение visible:false при скрытии).
 * - Активное время: секунды, когда вкладка видима и были действия за последние 60 с.
 * - Скролл: максимальная глубина текущей страницы (%).
 * - Уход: sendBeacon с leave:true на pagehide.
 * - Конверсии: trackVisitorEvent(type, meta) + авто-клики по tel:/mailto:/мессенджерам.
 */

import { onMounted, onUnmounted, watch } from 'vue'
import { useCookie, useRuntimeConfig } from 'nuxt/app'
import { useRoute } from 'vue-router'
import {
  IDLE_AFTER_MS,
  PING_INTERVAL_MS,
  PING_URL,
  VISITOR_ID_COOKIE,
  VISITOR_ID_MAX_AGE,
  currentScrollPct,
  generateId,
  getTabId,
  isExcludedPath,
  isTracking,
  isValidVisitorId,
  trackerState,
  visitorId
} from './visitor/trackerCore'
import { classifyHref, trackVisitorEvent } from './visitor/trackerEvents'

// Реэкспорт: trackVisitorEvent доступен как авто-импорт Nuxt в любом компоненте
export { trackVisitorEvent }

let pingTimer: ReturnType<typeof setInterval> | null = null
let tickTimer: ReturnType<typeof setInterval> | null = null
let routeWatcher: (() => void) | null = null
let cleanupListeners: (() => void) | null = null
let lifecycleRegistered = false

/**
 * Композабл-трекер посетителей сайта.
 * ✅ Singleton: вызывается ОДИН раз из app/app.vue. Повторные вызовы безопасны.
 */
export function useVisitorTracker() {
  const route = useRoute()
  const authToken = useCookie<string | null>('auth_token')
  // Счётчик Яндекс.Метрики захватываем на этапе setup: внутри setInterval вызов
  // useRuntimeConfig() вне контекста компонента может дать предупреждение/ошибку.
  const metricaCounterId = Number(useRuntimeConfig().public.yandexMetricaId) || null
  const visitorIdCookie = useCookie<string | null>(VISITOR_ID_COOKIE, {
    maxAge: VISITOR_ID_MAX_AGE,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production'
  })

  function ensureVisitorId(): string {
    if (visitorId.value) return visitorId.value
    const fromCookie = visitorIdCookie.value
    // ID старого формата заменяем: сервер принимает только v_[A-Za-z0-9_-]{8,60}
    if (isValidVisitorId(fromCookie)) {
      visitorId.value = fromCookie
      return fromCookie
    }
    const created = generateId('v_')
    visitorIdCookie.value = created
    visitorId.value = created
    return created
  }

  /** Собрать пинг и забрать накопленные секунды/скролл */
  function buildPayload(extra: Record<string, unknown> = {}): Record<string, unknown> {
    const payload: Record<string, unknown> = {
      visitorId: ensureVisitorId(),
      tabId: getTabId(),
      path: route.fullPath,
      visible: document.visibilityState === 'visible',
      idle: Date.now() - trackerState.lastInteraction > IDLE_AFTER_MS,
      activeSec: trackerState.pendingActiveSec,
      scroll: Math.max(trackerState.maxScroll, currentScrollPct()),
      screenW: window.screen?.width,
      screenH: window.screen?.height,
      viewportW: window.innerWidth,
      viewportH: window.innerHeight,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      ymClientId: trackerState.ymClientId,
      ...extra
    }
    // document.referrer актуален только для первой загрузки страницы
    if (!trackerState.referrerSent) {
      payload.referrer = document.referrer || ''
      trackerState.referrerSent = true
    }
    trackerState.pendingActiveSec = 0
    return payload
  }

  /** Обычный пинг (fire-and-forget; ошибки глушим — это телеметрия) */
  function sendPing(extra: Record<string, unknown> = {}): void {
    if (!process.client || isExcludedPath(route.path)) return
    try {
      $fetch(PING_URL, { method: 'POST', body: buildPayload(extra) }).catch(() => {})
    } catch {
      // молча
    }
  }

  /** Beacon: переживает закрытие вкладки */
  function sendBeaconPing(extra: Record<string, unknown>): void {
    if (!process.client || isExcludedPath(route.path)) return
    try {
      const payload = JSON.stringify(buildPayload(extra))
      if (typeof navigator.sendBeacon === 'function') {
        navigator.sendBeacon(PING_URL, new Blob([payload], { type: 'application/json' }))
      } else {
        $fetch(PING_URL, { method: 'POST', body: JSON.parse(payload) }).catch(() => {})
      }
    } catch {
      // молча
    }
  }

  /** Подтянуть clientID Яндекс.Метрики (если счётчик загружен) — для сверки отчётов */
  function tryReadYmClientId(): void {
    try {
      const ym = (window as any).ym
      if (!trackerState.ymClientId && typeof ym === 'function' && metricaCounterId) {
        ym(metricaCounterId, 'getClientID', (cid: string) => { trackerState.ymClientId = cid || null })
      }
    } catch {
      // Метрика недоступна/заблокирована — не критично
    }
  }

  function startTracking(): void {
    if (!process.client || isTracking.value) return

    isTracking.value = true
    ensureVisitorId()
    getTabId()
    trackerState.lastInteraction = Date.now()
    trackerState.maxScroll = currentScrollPct()
    sendPing()

    // Пинг по таймеру — только пока вкладка видима
    pingTimer = setInterval(() => {
      if (document.visibilityState === 'visible') sendPing()
    }, PING_INTERVAL_MS)

    // Тик 1 с: активное время (вкладка видима и были действия за последнюю минуту)
    tickTimer = setInterval(() => {
      tryReadYmClientId()
      if (document.visibilityState !== 'visible') return
      if (Date.now() - trackerState.lastInteraction > IDLE_AFTER_MS) return
      trackerState.pendingActiveSec++
    }, 1000)

    // Смена маршрута: сообщаем, откуда ушли и докуда доскроллили
    routeWatcher = watch(() => route.fullPath, (_newPath, oldPath) => {
      const prevScroll = trackerState.maxScroll
      trackerState.maxScroll = 0
      sendPing({ prevPath: oldPath, prevScroll })
    })

    const onInteraction = () => { trackerState.lastInteraction = Date.now() }
    const onScroll = () => {
      trackerState.lastInteraction = Date.now()
      trackerState.maxScroll = Math.max(trackerState.maxScroll, currentScrollPct())
    }
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        trackerState.lastInteraction = Date.now()
        sendPing()
      } else {
        // Вкладка скрыта: фиксируем последние секунды, по таймеру больше не пингуем
        sendBeaconPing({ visible: false })
      }
    }
    const onPageHide = () => sendBeaconPing({ leave: true, visible: false })
    const onClick = (e: MouseEvent) => {
      trackerState.lastInteraction = Date.now()
      const anchor = (e.target as HTMLElement | null)?.closest?.('a[href]')
      const found = anchor ? classifyHref(anchor.getAttribute('href') || '') : null
      if (found) trackVisitorEvent(found.type, found.meta)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('mousemove', onInteraction, { passive: true })
    window.addEventListener('keydown', onInteraction, { passive: true })
    window.addEventListener('touchstart', onInteraction, { passive: true })
    document.addEventListener('click', onClick, true)
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pagehide', onPageHide)

    cleanupListeners = () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('mousemove', onInteraction)
      window.removeEventListener('keydown', onInteraction)
      window.removeEventListener('touchstart', onInteraction)
      document.removeEventListener('click', onClick, true)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pagehide', onPageHide)
    }
  }

  function stopTracking(): void {
    if (!process.client || !isTracking.value) return

    if (pingTimer) { clearInterval(pingTimer); pingTimer = null }
    if (tickTimer) { clearInterval(tickTimer); tickTimer = null }
    if (routeWatcher) { routeWatcher(); routeWatcher = null }
    if (cleanupListeners) { cleanupListeners(); cleanupListeners = null }

    // Сообщаем серверу, что вкладка закрыта (визит продолжится при возврате)
    sendBeaconPing({ leave: true, visible: false })
    isTracking.value = false
  }

  const api = { isTracking, visitorId, startTracking, stopTracking, debug: { sendPing } }

  // LIFECYCLE (регистрируем ровно один раз)
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


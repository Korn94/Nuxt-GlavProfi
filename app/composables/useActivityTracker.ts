// app/composables/useActivityTracker.ts
/**
 * Композабл для отслеживания активности пользователя
 *
 * Архитектура:
 * - Отслеживание действий пользователя (мышь, клавиатура, скролл)
 * - Автоматическое определение AFK-статуса (5 минут бездействия)
 * - Отправка событий активности через SocketService
 * - Отслеживание навигации по страницам
 * - ✅ Обработка visibilitychange для фоновых вкладок
 * - ✅ Singleton на всё приложение: монтируется ОДИН раз — в app/app.vue
 *   (`if (process.client) useActivityTracker()`), поэтому трекинг работает
 *   и на публичных страницах, и в кабинете (раньше жил только в layout кабинета).
 * - Автоматический запуск/остановка при появлении/потере «живой» сессии
 */

import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useSocketStore } from '../../stores/socket'
import { useCookie } from 'nuxt/app'
import { useRoute } from 'vue-router'
import { socketService } from 'services/socket.service'

// ============================================
// MODULE-LEVEL STATE (singleton на приложение)
// ============================================
// ✅ Состояние и таймеры живут на уровне модуля: app.vue монтирует трекер один раз,
// а повторный вызов useActivityTracker() не создаёт второй набор слушателей
// и не дублирует события 'activity'.
// ⚠️ Мутации происходят только на клиенте (все входные точки под process.client),
// поэтому SSR-рендер этот модульный стейт не изменяет.
const isTracking = ref(false)
const isAFK = ref(false)
const lastActivity = ref<Date>(new Date())

let activityTimer: NodeJS.Timeout | null = null
let navigationWatcher: (() => void) | null = null
let visibilityHandler: (() => void) | null = null
// ✅ P0-1: время последней отправки 'activity' (для троттлинга)
let lastActivitySentAt = 0
// ✅ Lifecycle-хуки регистрируются ровно один раз
let lifecycleRegistered = false

/**
 * Композабл для отслеживания активности пользователя
 *
 * ✅ Singleton: вызывается ОДИН раз — из app/app.vue (только на клиенте).
 * Возвращает общий на всё приложение API, повторные вызовы безопасны.
 *
 * @example
 * ```ts
 * // app/app.vue
 * if (process.client) useActivityTracker()
 * ```
 */
export function useActivityTracker() {
  // ============================================
  // STORES & UTILS
  // ============================================
  const socketStore = useSocketStore()
  const route = useRoute()
  const sessionIdCookie = useCookie('session_id')

  // ============================================
  // CONSTANTS
  // ============================================
  const AFK_TIMEOUT = 5 * 60 * 1000 // 5 минут
  const HEARTBEAT_INTERVAL = 60000  // Проверка AFK каждую минуту

  // ✅ P0-1: минимальный интервал между событиями 'activity' (мс).
  // Раньше mousemove/scroll слали событие на каждое движение → флуд UPDATE в user_sessions.
  const ACTIVITY_THROTTLE_MS = 60000 // 1 минута

  // ============================================
  // ГЕЙТ «ЖИВОЙ СЕССИИ»
  // ============================================
  /**
   * Готов ли трекинг: сокет подключён И сервер подтвердил сессию
   * (session:initialized → stores/socket/index.ts пишет cookie session_id).
   *
   * ⚠️ authStore.isAuthenticated использовать нельзя: app/middleware/auth.ts
   * НЕ глобальный — он подключён только там, где в definePageMeta указан
   * middleware: ['auth', ...] (страницы кабинета, /login). На публичных маршрутах
   * (например /) isAuthenticated остаётся false и трекер не стартовал бы.
   *
   * ⚠️ useAuthCookie().hasCookie тоже не подходит: это computed без реактивных
   * зависимостей — значение «замерзает» после первого чтения.
   *
   * session_id из cookie реактивен: useCookie рассылает изменение через
   * BroadcastChannel('nuxt:cookies:session_id'), поэтому запись из setSessionId()
   * доходит и до этого ref (в т.ч. при логине без перезагрузки страницы).
   */
  const isSessionReady = () => socketStore.isConnected && !!sessionIdCookie.value

  // ============================================
  // METHODS - Отправка событий
  // ============================================

  /**
   * Отправка события активности на сервер
   */
  const sendActivity = (status: 'online' | 'afk' | 'offline') => {
    // ✅ Работаем только на клиенте
    if (!process.client) return
    
    // ✅ Проверяем подключение и сессию
    if (!socketStore.isConnected || !sessionIdCookie.value) {
      return
    }

    // ✅ P2: fire-and-forget — сервер не отвечает ack на событие 'activity'
    // ✅ P7: IP не передаём — сервер берёт его из сокета (server/socket/utils.ts → getSocketIp)
    socketService.emitNoAck('activity', {
      sessionId: sessionIdCookie.value,
      status
    })
  }

  /**
   * ✅ P0-1: отправка «online»-активности с троттлингом (не чаще ACTIVITY_THROTTLE_MS).
   * @param force — игнорировать троттлинг (используется при возврате из AFK)
   */
  const sendActivityThrottled = (force = false) => {
    if (!process.client) return
    const now = Date.now()
    if (!force && now - lastActivitySentAt < ACTIVITY_THROTTLE_MS) return
    lastActivitySentAt = now
    sendActivity('online')
  }

  /**
   * Отправка события навигации на сервер
   */
  const sendNavigation = (currentPath: string) => {
    if (!process.client) return
    if (!socketStore.isConnected || !sessionIdCookie.value) return

    console.log('[ActivityTracker] 🧭 Навигация:', currentPath)

    // ✅ P2: fire-and-forget — сервер не отвечает ack на событие 'tab:navigate'
    socketService.emitNoAck('tab:navigate', {
      sessionId: sessionIdCookie.value,
      currentPath
    })
  }

  // ============================================
  // METHODS - Управление активностью
  // ============================================

  /**
   * Обновление времени последней активности
   * Вызывается при любом действии пользователя
   */
  const updateActivity = () => {
    lastActivity.value = new Date()

    const wasAFK = isAFK.value          // ✅ P0-1: запоминаем до сброса

    // Если пользователь был в AFK, отправляем событие возврата
    if (wasAFK) {
      isAFK.value = false
      
      if (process.client && socketStore.isConnected && sessionIdCookie.value) {
        // ✅ P2: fire-and-forget — сервер не отвечает ack на событие 'activity:resume'
        socketService.emitNoAck('activity:resume', {
          sessionId: sessionIdCookie.value
        })
      }
    }

    // ✅ P0-1: троттлинг вместо отправки на каждое событие мыши/скролла.
    // После возврата из AFK отправляем немедленно (force).
    sendActivityThrottled(wasAFK)
  }

  /**
   * Проверка AFK-статуса
   * Вызывается по таймеру каждую минуту
   */
  const checkAFK = () => {
    if (!process.client) return
    if (!isSessionReady()) return

    const now = new Date()
    const diff = now.getTime() - lastActivity.value.getTime()

    if (diff >= AFK_TIMEOUT && !isAFK.value) {
      isAFK.value = true
      
      if (sessionIdCookie.value) {
        // ✅ P2: fire-and-forget — сервер не отвечает ack на событие 'activity:afk'
        socketService.emitNoAck('activity:afk', {
          sessionId: sessionIdCookie.value
        })
      }
    }
  }

  // ============================================
  // ✅ НОВОЕ: Обработчик visibilitychange
  // ============================================

  /**
   * Обработка переключения видимости вкладки
   * Критично для борьбы с "засыпанием" фоновых вкладок
   */
  const handleVisibilityChange = () => {
    if (!process.client) return

    if (document.visibilityState === 'visible') {
      console.log('[ActivityTracker] 👁️ Вкладка стала видимой, обновляем активность')
      
      // ✅ Принудительно обновляем активность при возврате вкладки
      updateActivity()
      
      // ✅ Отправляем текущий путь (вдруг пользователь переключился в другой таб и вернулся)
      sendNavigation(route.fullPath)
    } else {
      console.log('[ActivityTracker] 🌑 Вкладка скрыта')
    }
  }

  // ============================================
  // METHODS - Запуск/остановка отслеживания
  // ============================================

  /**
   * Запуск отслеживания активности
   */
  const startTracking = () => {
    if (!process.client) return
    if (isTracking.value) {
      console.log('[ActivityTracker] ⚠️ Уже отслеживается')
      return
    }

    console.log('[ActivityTracker] 🚀 Запуск отслеживания активности...')

    // ✅ Слушатели событий активности пользователя
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click', 'focus']
    events.forEach(event => {
      window.addEventListener(event, updateActivity, { passive: true })
    })

    // ✅ P0-1: раз в минуту — проверка AFK + подтверждение активности («сердцебиение»).
    // Это гарантирует, что lastActivity в БД не протухает (сервер считает AFK по порогу 5 мин)
    // и что другие клиенты получают свежий online-users:update.
    activityTimer = setInterval(() => {
      checkAFK()
      if (!isAFK.value) sendActivityThrottled()
    }, HEARTBEAT_INTERVAL)

    // ✅ Отслеживаем изменение маршрута
    navigationWatcher = watch(
      () => route.fullPath,
      (newPath) => {
        sendNavigation(newPath)
      },
      { immediate: true }
    )

    // ✅ P0-1: подписываем ИМЕННО handleVisibilityChange — иначе removeEventListener ниже не сработает
    visibilityHandler = handleVisibilityChange
    document.addEventListener('visibilitychange', visibilityHandler)

    lastActivitySentAt = 0   // ✅ P0-1: после рестарта трекинга первое событие уходит сразу

    isTracking.value = true

    // Отправляем начальное событие активности
    updateActivity()

    console.log('[ActivityTracker] ✅ Отслеживание запущено')
  }

  /**
   * Остановка отслеживания активности
   */
  const stopTracking = () => {
    if (!process.client) return
    if (!isTracking.value) {
      console.log('[ActivityTracker] ⚠️ Уже остановлено')
      return
    }

    console.log('[ActivityTracker] ⏹️ Остановка отслеживания...')

    // ✅ Удаляем слушатели событий
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click', 'focus']
    events.forEach(event => {
      window.removeEventListener(event, updateActivity)
    })

    // ✅ Удаляем visibilitychange
    if (visibilityHandler) {
      document.removeEventListener('visibilitychange', visibilityHandler)
      visibilityHandler = null
    }

    // ✅ Очищаем таймеры
    if (activityTimer) {
      clearInterval(activityTimer)
      activityTimer = null
    }

    // ✅ Останавливаем отслеживание навигации
    if (navigationWatcher) {
      navigationWatcher()
      navigationWatcher = null
    }

    // ✅ Отправляем событие выхода
    if (socketStore.isConnected && sessionIdCookie.value) {
      // ✅ P2: fire-and-forget — сервер не отвечает ack на событие 'activity'
      socketService.emitNoAck('activity', {
        sessionId: sessionIdCookie.value,
        status: 'offline'
      })
    }

    isTracking.value = false
    console.log('[ActivityTracker] ✅ Отслеживание остановлено')
  }

  // ============================================
  // API
  // ============================================

  const api = {
    // State
    isTracking,
    isAFK,
    lastActivity,

    // Actions
    startTracking,
    stopTracking,

    // Utility (для отладки)
    debug: {
      sendActivity,
      sendNavigation,
      updateActivity,
      checkAFK,
      handleVisibilityChange
    }
  }

  // ============================================
  // LIFECYCLE
  // ============================================
  // ✅ Регистрируем ровно один раз: единственная точка входа — app/app.vue.
  // Повторные вызовы просто получают тот же API без вторых watch'ей/хуков.
  if (lifecycleRegistered) return api
  lifecycleRegistered = true

  onMounted(() => {
    console.log('[ActivityTracker] 📦 Компонент смонтирован')

    // ✅ Запуск/остановка по «живой сессии» (подключённый сокет + session_id),
    // а не по authStore.isAuthenticated: трекер работает на ВСЕХ маршрутах,
    // включая публичные, где auth-middleware не выполняется.
    // Оба источника реактивны: isConnected — ref стора, session_id — cookie-реф,
    // который обновляется при записи из stores/socket (session:initialized).
    watch(
      () => [socketStore.isConnected, sessionIdCookie.value] as const,
      ([isConnected, sessionId]) => {
        const ready = isConnected && !!sessionId

        if (ready && !isTracking.value) {
          console.log('[ActivityTracker] ✅ Socket + session ready, starting tracking')
          startTracking()
        } else if (!ready && isTracking.value) {
          console.log('[ActivityTracker] ⏹️ Socket or session lost, stopping tracking')
          stopTracking()
        }
      },
      { immediate: true }
    )
  })

  onUnmounted(() => {
    console.log('[ActivityTracker] 🗑️ Компонент уничтожается')
    stopTracking()
  })

  // ============================================
  // RETURN
  // ============================================

  return api
}

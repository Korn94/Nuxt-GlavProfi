// app/composables/useActivityTracker.ts
/**
 * Композабл для отслеживания активности пользователя
 *
 * Архитектура:
 * - Отслеживание действий пользователя (мышь, клавиатура, скролл)
 * - Автоматическое определение AFK-статуса (5 минут бездействия)
 * - Отправка событий активности через SocketService
 * - Отслеживание навигации по страницам
 * - ✅ НОВОЕ: Обработка visibilitychange для фоновых вкладок
 * - Автоматический запуск/остановка при авторизации
 */

import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useSocketStore } from '../../stores/socket'
import { useAuthStore } from '../../stores/auth'
import { useCookie } from 'nuxt/app'
import { useRoute } from 'vue-router'
import { socketService } from 'services/socket.service'

/**
 * Композабл для отслеживания активности пользователя
 *
 * @example
 * ```ts
 * const { isTracking, isAFK, startTracking, stopTracking } = useActivityTracker()
 *
 * // Автоматически запускается при авторизации и подключении сокета
 * ```
 */
export function useActivityTracker() {
  // ============================================
  // STORES & UTILS
  // ============================================
  const socketStore = useSocketStore()
  const authStore = useAuthStore()
  const route = useRoute()
  const sessionIdCookie = useCookie('session_id')

  // ============================================
  // STATE
  // ============================================
  const isTracking = ref(false)
  const isAFK = ref(false)
  const lastActivity = ref<Date>(new Date())

  // ============================================
  // CONSTANTS
  // ============================================
  const AFK_TIMEOUT = 5 * 60 * 1000 // 5 минут
  const HEARTBEAT_INTERVAL = 60000  // Проверка AFK каждую минуту

  // ============================================
  // PRIVATE STATE
  // ============================================
  let activityTimer: NodeJS.Timeout | null = null
  let navigationWatcher: (() => void) | null = null
  let visibilityHandler: (() => void) | null = null

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

    socketService.emit('activity', {
      sessionId: sessionIdCookie.value,
      status,
      ipAddress: window.location.hostname
    }).catch(err => {
      console.warn('[ActivityTracker] Failed to send activity:', err)
    })
  }

  /**
   * Отправка события навигации на сервер
   */
  const sendNavigation = (currentPath: string) => {
    if (!process.client) return
    if (!socketStore.isConnected || !sessionIdCookie.value) return

    console.log('[ActivityTracker] 🧭 Навигация:', currentPath)

    socketService.emit('tab:navigate', {
      sessionId: sessionIdCookie.value,
      currentPath
    }).catch(err => {
      console.warn('[ActivityTracker] Failed to send navigation:', err)
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

    // Если пользователь был в AFK, отправляем событие возврата
    if (isAFK.value) {
      isAFK.value = false
      
      if (process.client && socketStore.isConnected && sessionIdCookie.value) {
        socketService.emit('activity:resume', {
          sessionId: sessionIdCookie.value,
          ipAddress: window.location.hostname
        }).catch(err => {
          console.warn('[ActivityTracker] Failed to send resume:', err)
        })
      }
    }

    // Отправляем событие активности
    sendActivity('online')
  }

  /**
   * Проверка AFK-статуса
   * Вызывается по таймеру каждую минуту
   */
  const checkAFK = () => {
    if (!process.client) return
    if (!authStore.isAuthenticated || !socketStore.isConnected) return

    const now = new Date()
    const diff = now.getTime() - lastActivity.value.getTime()

    if (diff >= AFK_TIMEOUT && !isAFK.value) {
      isAFK.value = true
      
      if (sessionIdCookie.value) {
        socketService.emit('activity:afk', {
          sessionId: sessionIdCookie.value,
          ipAddress: window.location.hostname
        }).catch(err => {
          console.warn('[ActivityTracker] Failed to send afk:', err)
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

    // ✅ Запускаем таймер для проверки AFK
    activityTimer = setInterval(checkAFK, HEARTBEAT_INTERVAL)

    // ✅ Отслеживаем изменение маршрута
    navigationWatcher = watch(
      () => route.fullPath,
      (newPath) => {
        sendNavigation(newPath)
      },
      { immediate: true }
    )

    // ✅ НОВОЕ: Слушаем visibilitychange
    visibilityHandler = handleVisibilityChange
    document.addEventListener('visibilitychange', visibilityHandler)

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
      socketService.emit('activity', {
        sessionId: sessionIdCookie.value,
        status: 'offline',
        ipAddress: window.location.hostname
      }).catch(err => {
        console.warn('[ActivityTracker] Failed to send offline:', err)
      })
    }

    isTracking.value = false
    console.log('[ActivityTracker] ✅ Отслеживание остановлено')
  }

  // ============================================
  // LIFECYCLE
  // ============================================

  onMounted(() => {
    console.log('[ActivityTracker] 📦 Компонент смонтирован')

    // Запускаем отслеживание только если пользователь авторизован И сокет подключен
    watch(
      () => [authStore.isAuthenticated, socketStore.isConnected] as const,
      ([isAuth, isConnected]) => {
        if (isAuth && isConnected && !isTracking.value) {
          console.log('[ActivityTracker] ✅ Auth + Socket ready, starting tracking')
          startTracking()
        } else if ((!isAuth || !isConnected) && isTracking.value) {
          console.log('[ActivityTracker] ⏹️ Auth or Socket lost, stopping tracking')
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

  return {
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
}

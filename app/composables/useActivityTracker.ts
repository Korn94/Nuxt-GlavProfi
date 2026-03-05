// app/composables/useActivityTracker.ts
/**
 * Композабл для отслеживания активности пользователя
 * 
 * Архитектура:
 * - Отслеживание действий пользователя (мышь, клавиатура, скролл)
 * - Автоматическое определение AFK-статуса (5 минут бездействия)
 * - Отправка событий активности через SocketService
 * - Отслеживание навигации по страницам
 * - Автоматический запуск/остановка при авторизации
 */

import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useSocketStore } from '../../stores/socket'
import { useAuthStore } from '../../stores/auth'
import { useCookie } from 'nuxt/app'
import { useRoute } from 'vue-router'
import { socketService } from 'services/socket.service' // ✅ Импортируем SocketService

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
  
  const socketStore = useSocketStore() // ✅ Только для чтения состояния (isConnected)
  const authStore = useAuthStore()
  const route = useRoute()
  const sessionIdCookie = useCookie('session_id')
  
  // ============================================
  // STATE
  // ============================================
  
  /**
   * Флаг активного отслеживания
   */
  const isTracking = ref(false)
  
  /**
   * Флаг AFK-статуса
   */
  const isAFK = ref(false)
  
  /**
   * Время последней активности пользователя
   */
  const lastActivity = ref<Date>(new Date())
  
  /**
   * Таймаут для определения AFK (5 минут)
   */
  const AFK_TIMEOUT = 5 * 60 * 1000
  
  // ============================================
  // PRIVATE STATE
  // ============================================
  
  let activityTimer: NodeJS.Timeout | null = null
  let navigationWatcher: (() => void) | null = null
  
  // ============================================
  // METHODS - Отправка событий
  // ============================================
  
  /**
   * Отправка события активности на сервер
   * @param status - Статус активности: 'online' | 'afk' | 'offline'
   */
  const sendActivity = (status: 'online' | 'afk' | 'offline') => {
    // ✅ Проверяем подключение через socketStore (реактивное состояние)
    if (!socketStore.isConnected || !sessionIdCookie.value) {
      return
    }
    
    const ipAddress = typeof window !== 'undefined' ? window.location.hostname : 'unknown'
    
    // ✅ ИСПРАВЛЕНО: Используем socketService.emit() вместо socketStore.emit()
    socketService.emit('activity', {
      sessionId: sessionIdCookie.value,
      status,
      ipAddress
    }).catch(err => {
      console.warn('[ActivityTracker] Failed to send activity:', err)
    })
  }
  
  /**
   * Отправка события навигации на сервер
   * @param currentPath - Текущий путь маршрута
   */
  const sendNavigation = (currentPath: string) => {
    if (!socketStore.isConnected || !sessionIdCookie.value) {
      return
    }
    
    console.log('[ActivityTracker] 🧭 Навигация:', currentPath)
    
    // ✅ ИСПРАВЛЕНО: Используем socketService.emit()
    socketService.emit('tab:navigate', {
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
      
      if (socketStore.isConnected && sessionIdCookie.value) {
        // ✅ ИСПРАВЛЕНО: Используем socketService.emit()
        socketService.emit('activity:resume', {
          sessionId: sessionIdCookie.value,
          ipAddress: typeof window !== 'undefined' ? window.location.hostname : 'unknown'
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
    if (!authStore.isAuthenticated || !socketStore.isConnected) {
      return
    }
    
    const now = new Date()
    const diff = now.getTime() - lastActivity.value.getTime()
    
    if (diff >= AFK_TIMEOUT && !isAFK.value) {
      isAFK.value = true
      
      if (sessionIdCookie.value) {
        // ✅ ИСПРАВЛЕНО: Используем socketService.emit()
        socketService.emit('activity:afk', {
          sessionId: sessionIdCookie.value,
          ipAddress: typeof window !== 'undefined' ? window.location.hostname : 'unknown'
        }).catch(err => {
          console.warn('[ActivityTracker] Failed to send afk:', err)
        })
      }
    }
  }
  
  // ============================================
  // METHODS - Запуск/остановка отслеживания
  // ============================================
  
  /**
   * Запуск отслеживания активности
   */
  const startTracking = () => {
    if (isTracking.value) {
      console.log('[ActivityTracker] ⚠️ Уже отслеживается')
      return
    }
    
    console.log('[ActivityTracker] 🚀 Запуск отслеживания активности...')
    
    // Слушаем события активности пользователя
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click', 'focus']
    
    events.forEach(event => {
      window.addEventListener(event, updateActivity, { passive: true })
    })
    
    // Запускаем таймер для проверки AFK
    activityTimer = setInterval(checkAFK, 60000) // Проверяем каждую минуту
    
    // Отслеживаем изменение маршрута
    navigationWatcher = watch(
      () => route.fullPath,
      (newPath) => {
        sendNavigation(newPath)
      },
      { immediate: true } // Отправляем текущий путь сразу при запуске
    )
    
    isTracking.value = true
    
    // Отправляем начальное событие активности
    updateActivity()
    
    console.log('[ActivityTracker] ✅ Отслеживание запущено')
  }
  
  /**
   * Остановка отслеживания активности
   */
  const stopTracking = () => {
    if (!isTracking.value) {
      console.log('[ActivityTracker] ⚠️ Уже остановлено')
      return
    }
    
    console.log('[ActivityTracker] ⏹️ Остановка отслеживания...')
    
    // Удаляем слушатели событий
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click', 'focus']
    events.forEach(event => {
      window.removeEventListener(event, updateActivity)
    })
    
    // Очищаем таймеры
    if (activityTimer) {
      clearInterval(activityTimer)
      activityTimer = null
    }
    
    // Останавливаем отслеживание навигации
    if (navigationWatcher) {
      navigationWatcher()
      navigationWatcher = null
    }
    
    // Отправляем событие выхода
    if (socketStore.isConnected && sessionIdCookie.value) {
      // ✅ ИСПРАВЛЕНО: Используем socketService.emit()
      socketService.emit('activity', {
        sessionId: sessionIdCookie.value,
        status: 'offline',
        ipAddress: typeof window !== 'undefined' ? window.location.hostname : 'unknown'
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
      checkAFK
    }
  }
}

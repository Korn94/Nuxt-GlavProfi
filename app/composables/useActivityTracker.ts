// app/composables/useActivityTracker.ts
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useSocketStore } from '../../stores/socket'
import { useAuthStore } from '../../stores/auth'
import { useCookie } from 'nuxt/app'
import { useRoute } from 'vue-router'

/**
* Композабл для отслеживания активности пользователя
*/
export function useActivityTracker() {
  const socketStore = useSocketStore()
  const authStore = useAuthStore()
  const route = useRoute()
  const sessionIdCookie = useCookie('session_id')
  
  const isTracking = ref(false)
  const isAFK = ref(false)
  const lastActivity = ref<Date>(new Date())
  const AFK_TIMEOUT = 5 * 60 * 1000 // 5 минут
  
  let activityTimer: NodeJS.Timeout | null = null
  let navigationWatcher: (() => void) | null = null
  
  /**
  * Отправка события активности на сервер
  */
  const sendActivity = (status: 'online' | 'afk' | 'offline') => {
    if (!socketStore.isConnected || !sessionIdCookie.value) {
      return
    }
    
    const ipAddress = window.location.hostname
    socketStore.emit('activity', {
      sessionId: sessionIdCookie.value,
      status,
      ipAddress
    })
  }
  
  /**
  * Отправка события навигации на сервер
  */
  const sendNavigation = (currentPath: string) => {
    if (!socketStore.isConnected || !sessionIdCookie.value) {
      return
    }
    
    console.log('[ActivityTracker] 🧭 Navigation to:', currentPath)
    socketStore.emit('tab:navigate', {
      currentPath
    })
  }
  
  /**
  * Обновление времени последней активности
  */
  const updateActivity = () => {
    lastActivity.value = new Date()
    
    // Если пользователь был в АФК, отправляем событие возврата
    if (isAFK.value) {
      isAFK.value = false
      if (socketStore.isConnected && sessionIdCookie.value) {
        socketStore.emit('activity:resume', {
          sessionId: sessionIdCookie.value,
          ipAddress: window.location.hostname
        })
      }
    }
    
    // Отправляем событие активности
    sendActivity('online')
  }
  
  /**
  * Проверка АФК статуса
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
        socketStore.emit('activity:afk', {
          sessionId: sessionIdCookie.value,
          ipAddress: window.location.hostname
        })
      }
    }
  }
  
  /**
  * Запуск отслеживания активности
  */
  const startTracking = () => {
    if (isTracking.value) return
    
    // Слушаем события активности пользователя
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart']
    events.forEach(event => {
      window.addEventListener(event, updateActivity, true)
    })
    
    // Запускаем таймер для проверки АФК
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
    
    console.log('[ActivityTracker] ✅ Started tracking')
  }
  
  /**
  * Остановка отслеживания активности
  */
  const stopTracking = () => {
    if (!isTracking.value) return
    
    // Удаляем слушатели событий
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart']
    events.forEach(event => {
      window.removeEventListener(event, updateActivity, true)
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
      socketStore.emit('activity', {
        sessionId: sessionIdCookie.value,
        status: 'offline'
      })
    }
    
    isTracking.value = false
    console.log('[ActivityTracker] ⏸️ Stopped tracking')
  }
  
  // Автоматический запуск/остановка при монтировании/размонтировании
  onMounted(() => {
    // Запускаем отслеживание только если пользователь авторизован И сокет подключен
    watch(
      () => [authStore.isAuthenticated, socketStore.isConnected],
      ([isAuth, isConnected]) => {
        if (isAuth && isConnected && !isTracking.value) {
          startTracking()
        } else if ((!isAuth || !isConnected) && isTracking.value) {
          stopTracking()
        }
      },
      { immediate: true }
    )
  })
  
  onUnmounted(() => {
    stopTracking()
  })
  
  return {
    isTracking,
    isAFK,
    lastActivity,
    startTracking,
    stopTracking
  }
}

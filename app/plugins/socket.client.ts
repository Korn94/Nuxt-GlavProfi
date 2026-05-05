// plugins/socket.client.ts
/**
 * Nuxt Plugin для автоматического управления Socket.IO подключением
 * 
 * Архитектура:
 * - Инициализация сервиса ТОЛЬКО на клиенте
 * - Автоматическое подключение при наличии валидного токена
 * - Автоматическое отключение при выходе
 * - Корректная очистка при закрытии страницы
 * - Реактивное отслеживание токена БЕЗ задержек
 */

import { defineNuxtPlugin, useCookie } from 'nuxt/app'
import { computed, watch } from 'vue'
import { useSocketStore } from 'stores/socket'
import { socketService } from 'services/socket.service'

export default defineNuxtPlugin(() => {
  // ⛔ Работаем только на клиенте
  if (!process.client) {
    console.log('[SocketPlugin] ⚠️ Запуск на сервере, пропускаем инициализацию')
    return
  }

  console.log('[SocketPlugin] 🚀 Инициализация плагина...')
  const socketStore = useSocketStore()

  // ============================================
  // ✅ 1. Инициализация сервиса (один раз)
  // ============================================
  try {
    socketService.init()
    console.log('[SocketPlugin] ✅ SocketService инициализирован')
  } catch (error) {
    console.error('[SocketPlugin] ❌ Ошибка инициализации:', error)
  }

  // ============================================
  // ✅ 2. Безопасное извлечение JWT из куки
  // ============================================
  /**
   * Вычисляемое значение: чистый JWT из куки (поддержка старого и нового формата)
   * Кэшируется автоматически благодаря computed
   */
  const jwtToken = computed(() => {
    const rawCookie = useCookie('auth_token').value
    if (!rawCookie) return null

    try {
      // Новый формат: JSON { token, userId, role }
      const parsed = JSON.parse(rawCookie)
      return parsed.token || null
    } catch {
      // Старый формат: просто строка JWT (обратная совместимость)
      return rawCookie.length > 20 ? rawCookie : null
    }
  })

  // ============================================
  // ✅ 3. Реактивное управление подключением
  // ============================================
  watch(
    jwtToken,
    (token, oldToken) => {
      // 📍 Токен появился (вход или обновление)
      if (token && !oldToken) {
        console.log('[SocketPlugin] 🔑 Токен обнаружен, подключаем сокет...')
        try {
          socketService.connect()
        } catch (err) {
          console.error('[SocketPlugin] ❌ Ошибка подключения:', err)
          socketStore.error = 'Не удалось подключиться к серверу'
        }
      }
      // 📍 Токен исчез (выход)
      else if (!token && oldToken) {
        console.log('[SocketPlugin] 🔓 Токен отсутствует, отключаем сокет...')
        socketService.disconnect()
        // Сбрасываем состояние стора, чтобы UI сразу отреагировал
        socketStore.isConnected = false
        socketStore.userId = null
      }
      // 📍 Токен изменился (перелогин под другим пользователем)
      else if (token && oldToken && token !== oldToken) {
        console.log('[SocketPlugin] 🔄 Токен обновился, переподключаем сокет...')
        try {
          socketService.disconnect()
          socketService.connect()
        } catch (err) {
          console.error('[SocketPlugin] ❌ Ошибка переподключения:', err)
        }
      }
    },
    { immediate: true } // Срабатывает сразу при загрузке плагина
  )

  // ============================================
  // ✅ 4. Синхронизация состояния с событиями сокета
  // ============================================
  socketService.on('connect', () => {
    socketStore.isConnected = true
    socketStore.error = null
    console.log('[SocketPlugin] 🟢 Сокет подключён')
  })

  socketService.on('disconnect', (reason: string) => {
    socketStore.isConnected = false
    console.log(`[SocketPlugin] 🔴 Сокет отключён: ${reason}`)
  })

  socketService.on('connect_error', (error: any) => {
    socketStore.isConnected = false
    socketStore.error = error.message || 'Ошибка подключения'
    console.error(`[SocketPlugin] ❌ Ошибка подключения: ${error.message}`)
    
    // 🔐 Автоматический логаут при невалидном токене
    const isInvalidToken = 
      error.message?.includes('Unauthorized') ||
      error.message?.includes('Invalid token') ||
      error.message?.includes('User not found')
    
    if (isInvalidToken) {
      console.log('[SocketPlugin] 🔐 Невалидный токен, очищаем состояние')
      useCookie('auth_token').value = null
      useCookie('session_id').value = null
    }
  })

  // ============================================
  // ✅ 5. Корректная очистка при закрытии вкладки
  // ============================================
  const handleBeforeUnload = () => {
    console.log('[SocketPlugin] 🧹 beforeunload: отключаем сокет...')
    socketService.disconnect()
  }
  
  if (process.client) {
    window.addEventListener('beforeunload', handleBeforeUnload)
  }

  console.log('[SocketPlugin] ✅ Плагин успешно запущен')
})

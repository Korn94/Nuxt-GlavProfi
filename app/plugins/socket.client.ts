// plugins/socket.client.ts
/**
 * Nuxt Plugin для автоматического управления Socket.IO подключением
 *
 * Архитектура:
 * - Инициализация сервиса ТОЛЬКО на клиенте
 * - Автоматическое подключение при загрузке страницы (если токен уже есть)
 * - Подключение при логине вызывается из auth store
 * - Автоматическое отключение при выходе
 * - Корректная очистка при закрытии страницы
 */

import { defineNuxtPlugin, useCookie } from 'nuxt/app'
import { computed, watch, nextTick } from 'vue'
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
  // ✅ 1. Безопасное извлечение JWT из куки
  // ============================================
  /**
   * Вычисляемое значение: чистый JWT из куки (поддержка старого и нового формата)
   * Кэшируется автоматически благодаря computed
   */
  const jwtToken = computed(() => {
    const rawCookie = useCookie('auth_token').value
    if (!rawCookie) return null
    try {
      const parsed = JSON.parse(rawCookie)
      return parsed.token || null
    } catch {
      return rawCookie.length > 20 ? rawCookie : null
    }
  })

  // ============================================
  // ✅ 2. Инициализация сервиса (отложена до появления токена)
  // ============================================
  // Не инициализируем сокет сразу - это будет сделано при подключении с токеном
  console.log('[SocketPlugin] ✅ SocketService готов к инициализации')

  // ============================================
  // ✅ 3. Подключение при загрузке страницы (если токен уже был)
  // ============================================
  // Проверяем наличие токена сразу при инициализации плагина
  // Это нужно для случаев перезагрузки страницы, когда пользователь уже авторизован
  ;(async () => {
    await nextTick()
    const token = jwtToken.value

    if (token) {
      console.log('[SocketPlugin] 🔑 Токен найден при загрузке, подключаем сокет...')
      try {
        // Инициализируем с токеном и подключаемся
        socketService.init(token)
        socketService.connect(token)
      } catch (err) {
        console.error('[SocketPlugin] ❌ Ошибка подключения:', err)
        socketStore.error = 'Не удалось подключиться к серверу'
      }
    } else {
      console.log('[SocketPlugin] ℹ️ Токен не найден, ожидаем вход пользователя')
    }
  })()

  // ============================================
  // ✅ 4. Реактивное управление подключением
  // ============================================
  // Следим за изменениями токена для обработки выхода или перелогина
  watch(
    jwtToken,
    async (token, oldToken) => {
      // 📍 Токен исчез (выход)
      if (!token && oldToken) {
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
          // Небольшая задержка перед переподключением
          await new Promise(resolve => setTimeout(resolve, 100))
          socketService.connect(token)
        } catch (err) {
          console.error('[SocketPlugin] ❌ Ошибка переподключения:', err)
        }
      }
      // 🎯 При появлении токена (login) - НЕ подключаем, это делает auth store
      // Это предотвращает дублирование подключений
    }
  )

  // ============================================
  // ✅ 5. Синхронизация состояния с событиями сокета
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
      // Не используем navigateTo здесь чтобы избежать циклических зависимостей
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
  })

  // ============================================
  // ✅ 6. Корректная очистка при закрытии вкладки
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

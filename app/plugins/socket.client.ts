// plugins/socket.client.ts
/**
 * Nuxt Plugin для автоматического управления Socket.IO подключением
 * 
 * Архитектура:
 * - Инициализация сервиса ТОЛЬКО на клиенте
 * - Автоматическое подключение при аутентификации
 * - Автоматическое отключение при выходе
 * - Корректная очистка при закрытии страницы
 */

import { defineNuxtPlugin, useCookie } from 'nuxt/app'
import { watch } from 'vue'
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

  // ✅ 1. Инициализируем сервис один раз
  try {
    socketService.init()
    console.log('[SocketPlugin] ✅ SocketService инициализирован')
  } catch (error) {
    console.error('[SocketPlugin] ❌ Ошибка инициализации:', error)
  }

  // ✅ 2. Безопасное получение JWT из куки (поддержка старого и нового формата)
  const getJwtToken = (): string | null => {
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
  }

  // ✅ 3. Реактивное управление подключением БЕЗ задержек
  watch(
    () => getJwtToken(),
    (token) => {
      if (token) {
        console.log('[SocketPlugin] 🔑 Токен обнаружен, подключаем сокет...')
        socketService.connect()
      } else {
        console.log('[SocketPlugin] 🔓 Токен отсутствует, отключаем сокет...')
        socketService.disconnect()
        // Сбрасываем состояние стора, чтобы UI сразу отреагировал
        socketStore.isConnected = false
        socketStore.userId = null
      }
    },
    { immediate: true } // Срабатывает сразу при загрузке плагина
  )

  // ✅ 4. Синхронизация состояния с событиями сокета
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
  })

  // ✅ 5. Корректная очистка при закрытии/перезагрузке вкладки
  window.addEventListener('beforeunload', () => {
    console.log('[SocketPlugin] 🧹 beforeunload: отключаем сокет...')
    socketService.disconnect()
  })

  console.log('[SocketPlugin] ✅ Плагин успешно запущен')
})

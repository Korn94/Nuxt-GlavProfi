// plugins/socket.client.ts
/**
 * Nuxt Plugin для автоматического управления Socket.IO подключением
 * 
 * Архитектура:
 * - Автоматическое подключение при аутентификации
 * - Автоматическое отключение при выходе
 * - Интеграция с SocketService (не с Pinia store напрямую)
 * - Обработчики событий подключения/ошибок
 */

import { defineNuxtPlugin } from 'nuxt/app'
import { watch } from 'vue'
import { useAuthStore } from 'stores/auth'
import { useSocketStore } from 'stores/socket'
import { socketService } from 'services/socket.service'

export default defineNuxtPlugin(async (nuxtApp) => {
  // ⛔ Работаем только на клиенте
  if (!process.client) {
    console.log('[SocketClientPlugin] ⚠️ Запуск на сервере, пропускаем инициализацию')
    return
  }
  
  console.log('[SocketClientPlugin] 🚀 Инициализация...')
  
  const authStore = useAuthStore()
  const socketStore = useSocketStore()
  
  // ============================================
  // ИНИЦИАЛИЗАЦИЯ SOCKET SERVICE
  // ============================================
  
  // ✅ Инициализируем SocketService ТОЛЬКО если пользователь уже авторизован
  // Для незалогиненных пользователей сокет не нужен — не создаём соединение
  if (authStore.isAuthenticated) {
    socketService.init()
    socketService.connect()
  }
  
  // ============================================
  // АВТО-ПОДКЛЮЧЕНИЕ ПРИ АУТЕНТИФИКАЦИИ
  // ============================================
  
  watch(
    () => authStore.isAuthenticated,
    async (isAuthenticated, wasAuthenticated) => {
      // Пропускаем первый запуск (initial: true)
      if (wasAuthenticated === undefined) return
      
      if (isAuthenticated) {
        console.log('[SocketClientPlugin] 🔐 Пользователь аутентифицирован, подключаем сокет...')
        
        // Небольшая задержка для гарантии, что токен сохранён в куки
        await new Promise(resolve => setTimeout(resolve, 100))
        
        try {
          // ✅ Только connect() — init() уже был вызван выше при старте плагина
          // Повторный вызов init() создал бы дублирующий сокет и forced server close
          socketService.connect()
          console.log('[SocketClientPlugin] ✅ Сокет подключён')
        } catch (error) {
          console.error('[SocketClientPlugin] ❌ Ошибка подключения сокета:', error)
          socketStore.error = 'Не удалось подключиться к серверу'
        }
      } else {
        console.log('[SocketClientPlugin] 🔓 Пользователь вышел, отключаем сокет...')
        
        try {
          socketService.disconnect()
          console.log('[SocketClientPlugin] ✅ Сокет отключён')
        } catch (error) {
          console.error('[SocketClientPlugin] ❌ Ошибка отключения сокета:', error)
        }
      }
    },
    { immediate: true }
  )
  
  // ============================================
  // ОБРАБОТЧИКИ СОБЫТИЙ ПОДКЛЮЧЕНИЯ
  // ============================================
  
  // Подписываемся на события сокета для обновления состояния store
  socketService.on('connect', () => {
    socketStore.isConnected = true
    socketStore.error = null
    console.log('[SocketClientPlugin] 🟢 Сокет подключён')
  })
  
  socketService.on('disconnect', (reason: string) => {
    socketStore.isConnected = false
    console.log(`[SocketClientPlugin] 🔴 Сокет отключён: ${reason}`)
  })
  
  socketService.on('connect_error', (error: any) => {
    socketStore.isConnected = false
    socketStore.error = error.message || 'Ошибка подключения'
    console.error(`[SocketClientPlugin] ❌ Ошибка подключения сокета: ${error.message}`)
  })
  
  // ============================================
  // ОЧИСТКА ПРИ ЗАКРЫТИИ СТРАНИЦЫ
  // ============================================
  
  window.addEventListener('beforeunload', () => {
    console.log('[SocketClientPlugin] 🧹 Очистка: отключаем сокет...')
    socketService.disconnect()
  })
  
  console.log('[SocketClientPlugin] ✅ Плагин успешно инициализирован')
})

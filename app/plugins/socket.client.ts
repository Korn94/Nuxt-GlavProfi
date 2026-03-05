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
    console.log('[SocketClientPlugin] ⚠️ Running on server, skipping initialization')
    return
  }
  
  console.log('[SocketClientPlugin] 🚀 Initializing...')
  
  const authStore = useAuthStore()
  const socketStore = useSocketStore()
  
  // ============================================
  // ИНИЦИАЛИЗАЦИЯ SOCKET SERVICE
  // ============================================
  
  // Инициализируем SocketService один раз
  socketService.init()
  
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
          // ✅ ИСПРАВЛЕНО: Используем socketService.connect()
          socketService.connect()
          console.log('[SocketClientPlugin] ✅ Socket подключён')
        } catch (error) {
          console.error('[SocketClientPlugin] ❌ Ошибка подключения сокета:', error)
          socketStore.error = 'Не удалось подключиться к серверу'
        }
      } else {
        console.log('[SocketClientPlugin] 🔓 Пользователь вышел, отключаем сокет...')
        
        try {
          // ✅ ИСПРАВЛЕНО: Используем socketService.disconnect()
          socketService.disconnect()
          console.log('[SocketClientPlugin] ✅ Socket отключён')
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
    console.log('[SocketClientPlugin] 🟢 Socket connected')
  })
  
  socketService.on('disconnect', (reason: string) => {
    socketStore.isConnected = false
    console.log(`[SocketClientPlugin] 🔴 Socket disconnected: ${reason}`)
  })
  
  socketService.on('connect_error', (error: any) => {
    socketStore.isConnected = false
    socketStore.error = error.message || 'Ошибка подключения'
    console.error(`[SocketClientPlugin] ❌ Socket connection error: ${error.message}`)
  })
  
  // ============================================
  // ОЧИСТКА ПРИ УНИЧТОЖЕНИИ ПЛАГИНА
  // ============================================
  
  nuxtApp.hook('app:unmounted', () => {
    console.log('[SocketClientPlugin] 🧹 Cleanup: disconnecting socket...')
    socketService.disconnect()
  })
  
  console.log('[SocketClientPlugin] ✅ Plugin initialized successfully')
})

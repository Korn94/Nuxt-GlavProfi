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
  // ✅ ИНИЦИАЛИЗАЦИЯ SOCKET SERVICE
  // ============================================
  
  // ✅ Инициализируем сервис ВСЕГДА на клиенте
  // Это гарантирует, что сокет будет готов к подключению в любой момент
  try {
    socketService.init()
    console.log('[SocketClientPlugin] ✅ SocketService инициализирован')
  } catch (error) {
    console.error('[SocketClientPlugin] ❌ Ошибка инициализации SocketService:', error)
  }
  
  // ============================================
  // ✅ ПОДКЛЮЧЕНИЕ ПРИ АВТОРИЗАЦИИ
  // ============================================
  
  watch(
    () => authStore.isAuthenticated,
    async (isAuthenticated, wasAuthenticated) => {
      // Пропускаем первый запуск (initial: true)
      if (wasAuthenticated === undefined) {
        console.log('[SocketClientPlugin] 📦 Первый запуск watch, пропускаем')
        
        // ✅ Если пользователь уже авторизован при загрузке — подключаем сокет
        if (isAuthenticated) {
          await new Promise(resolve => setTimeout(resolve, 100))
          socketService.connect()
          console.log('[SocketClientPlugin] ✅ Пользователь уже авторизован, сокет подключён')
        }
        return
      }
      
      if (isAuthenticated) {
        console.log('[SocketClientPlugin] 🔐 Пользователь аутентифицирован, подключаем сокет...')
        
        // Небольшая задержка для гарантии, что токен сохранён в куки
        await new Promise(resolve => setTimeout(resolve, 100))
        
        try {
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
  // ✅ ОБРАБОТЧИКИ СОБЫТИЙ ПОДКЛЮЧЕНИЯ
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
  // ✅ ОЧИСТКА ПРИ ЗАКРЫТИИ СТРАНИЦЫ
  // ============================================
  
  const handleBeforeUnload = () => {
    console.log('[SocketClientPlugin] 🧹 beforeunload: отключаем сокет...')
    socketService.disconnect()
  }
  
  window.addEventListener('beforeunload', handleBeforeUnload)
  
  console.log('[SocketClientPlugin] ✅ Плагин успешно инициализирован')
})

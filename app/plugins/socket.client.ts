// plugins/socket.client.ts
import { defineNuxtPlugin } from 'nuxt/app'
import { useAuthStore } from '../../stores/auth'
import { useSocketStore } from '../../stores/socket'
import { watch } from 'vue'

export default defineNuxtPlugin(async () => {
  console.log('[SocketClientPlugin] Initializing...')
  
  const authStore = useAuthStore()
  const socketStore = useSocketStore()
  
  /**
   * Автоматическое подключение/отключение сокета при изменении статуса аутентификации
   */
  watch(
    () => authStore.isAuthenticated,
    async (isAuthenticated) => {
      if (isAuthenticated) {
        console.log('[SocketClientPlugin] User authenticated, connecting socket...')
        
        // Небольшая задержка для гарантии, что токен сохранен в куки
        await new Promise(resolve => setTimeout(resolve, 100))
        
        try {
          await socketStore.connect()
          console.log('[SocketClientPlugin] ✅ Socket connected')
        } catch (error) {
          console.error('[SocketClientPlugin] ❌ Socket connection failed:', error)
        }
      } else {
        console.log('[SocketClientPlugin] User logged out, disconnecting socket...')
        
        try {
          await socketStore.disconnect()
          console.log('[SocketClientPlugin] ✅ Socket disconnected')
        } catch (error) {
          console.error('[SocketClientPlugin] ❌ Socket disconnection failed:', error)
        }
      }
    },
    { immediate: true }
  )
  
  console.log('[SocketClientPlugin] ✅ Plugin initialized')
})

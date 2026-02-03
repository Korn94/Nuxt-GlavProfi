// plugins/socket.client.ts
import { defineNuxtPlugin } from 'nuxt/app'
import { useSocketStore } from '../../stores/socket'

export default defineNuxtPlugin(async (nuxtApp) => {
  // if (process.server) return
  
  // const socketStore = useSocketStore()
  
  // console.log('[SocketPlugin] Initializing socket...')
  
  // try {
  //   await socketStore.init()
  //   console.log('[SocketPlugin] Socket initialized successfully')
  // } catch (error) {
  //   console.error('[SocketPlugin] Socket initialization failed:', error)
  // }
})
// server/ws/index.ts
import { defineWebSocketHandler } from 'h3'
import { authenticatePeer } from './auth'
import { addClient, removeClient } from './clients'
import { handleMessage } from './handlers'
import { getContext, clearContext } from './context'
import { broadcastPresence } from './handlers/presence'

export default defineWebSocketHandler({
  async open(peer) {
    try {
      await authenticatePeer(peer)
      addClient(peer)
      const ctx = getContext(peer)
      console.log('[WS] connected:', ctx?.user?.login)
      
      // Обновляем информацию о присутствии при подключении
      broadcastPresence()
    } catch (e: any) {
      peer.close(4001, e.message ?? 'Unauthorized')
    }
  },
  
  async message(peer, message) {
    const ctx = getContext(peer)
    if (!ctx || !ctx.ready) return
    
    let data
    try {
      data = JSON.parse(message.toString())
    } catch {
      return
    }
    
    await handleMessage(peer, data)
  },
  
  close(peer) {
    const ctx = getContext(peer)
    if (ctx?.user) {
      console.log('[WS] disconnected:', ctx.user.login)
    }
    
    clearContext(peer)
    removeClient(peer)
    
    // Обновляем информацию о присутствии при отключении
    broadcastPresence()
  }
})

// stores/socket/actions/emit.ts
import type { QueuedMessage } from '../types'

export function emit<K extends keyof any>(
  this: any,
  event: K,
  ...args: any[]
): void {
  if (!this.isConnected || !this.socket) {
    console.warn(`[SocketStore] Cannot emit "${String(event)}": not connected`)
    
    // ✅ СТАВИМ В ОЧЕРЕДЬ
    const payload = args[0]
    this.messageQueue.push({
      event,
      payload,
      timestamp: Date.now()
    } as QueuedMessage)
    
    console.log(`[SocketStore] Queued message: ${String(event)}`)
    return
  }

  try {
    // @ts-ignore - Socket.IO имеет сложную типизацию для emit
    this.socket.emit(event, ...args)
    console.log(`[SocketStore] ✉️ Emitted "${String(event)}"`, args)
  } catch (error) {
    console.error(`[SocketStore] Error emitting "${String(event)}":`, error)
  }
}

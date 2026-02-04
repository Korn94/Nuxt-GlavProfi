// stores/socket/actions/queue.ts
import type { QueuedMessage } from '../types'

export function sendQueuedMessages(this: any) {
  if (this.messageQueue.length === 0) return

  console.log(`[SocketStore] Sending ${this.messageQueue.length} queued messages...`)

  const now = Date.now()
  const MAX_QUEUE_AGE = 5 * 60 * 1000 // 5 минут

  // Фильтруем старые сообщения (старше 5 минут)
  const validMessages = this.messageQueue.filter((msg: QueuedMessage) => {
    const age = now - msg.timestamp
    return age < MAX_QUEUE_AGE
  })

  // Отправляем валидные сообщения
  validMessages.forEach((msg: QueuedMessage) => {
    try {
      // @ts-ignore - Socket.IO имеет сложную типизацию для emit
      this.socket?.emit(msg.event, msg.payload)
      console.log(`[SocketStore] Sent queued message: ${String(msg.event)}`)
    } catch (error) {
      console.error(`[SocketStore] Failed to send queued message: ${String(msg.event)}`, error)
    }
  })

  // Очищаем очередь
  this.messageQueue = []
}

// server/utils/online-broadcast.ts
import type { Server } from 'socket.io'
import { getOnlineUsers } from './sessions'
import { invalidateOnlineCache } from '../api/online.get'

let broadcastTimeout: ReturnType<typeof setTimeout> | null = null
let pendingBroadcast = false
const DEBOUNCE_MS = 1500 // 1.5 секунды

/**
 * Debounced broadcast списка онлайн-пользователей
 * Накапливает изменения и отправляет пакетом раз в 1.5 секунды
 * вместо отправки при каждом событии
 */
export function scheduleOnlineBroadcast(io: Server): void {
  pendingBroadcast = true
  
  // Если таймер уже запущен, не создаём новый
  if (broadcastTimeout) return
  
  broadcastTimeout = setTimeout(async () => {
    if (!pendingBroadcast) return
    
    try {
      const onlineUsers = await getOnlineUsers()
      io.emit('online-users:update', onlineUsers)
      invalidateOnlineCache()
      
      // console.log(`[OnlineBroadcast] 📡 Отправлено ${onlineUsers.length} пользователей (debounced)`)
    } catch (error) {
      console.error('[OnlineBroadcast] ❌ Ошибка отправки:', error)
    } finally {
      pendingBroadcast = false
      broadcastTimeout = null
    }
  }, DEBOUNCE_MS)
}

/**
 * Немедленная отправка (для критичных событий: вход/выход)
 */
export async function immediateOnlineBroadcast(io: Server): Promise<void> {
  // Сбрасываем debounce таймер
  if (broadcastTimeout) {
    clearTimeout(broadcastTimeout)
    broadcastTimeout = null
  }
  
  try {
    const onlineUsers = await getOnlineUsers()
    io.emit('online-users:update', onlineUsers)
    invalidateOnlineCache()
    
    console.log(`[OnlineBroadcast] 📡 Немедленная отправка: ${onlineUsers.length} пользователей`)
  } catch (error) {
    console.error('[OnlineBroadcast] ❌ Ошибка немедленной отправки:', error)
  }
  
  pendingBroadcast = false
}

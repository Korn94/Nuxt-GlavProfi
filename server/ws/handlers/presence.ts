// server/ws/handlers/presence.ts
import { joinRoom, leaveRoom, broadcast } from '../rooms'
import { getExtendedPresenceUsers, updateActivity, getClientMeta, updateClientMeta } from '../clients'
import { getContext } from '../context'
import type { WSPeer } from '../types' // Изменено с '../../types' на '../types'

/**
 * Обрабатывает сообщения, связанные с присутствием пользователей
 */
export async function handlePresence(peer: WSPeer, data: any) {
  switch (data.type) {
    case 'presence:subscribe': {
      joinRoom(peer, 'presence:all')
      peer.send(JSON.stringify({
        type: 'presence:update',
        users: getExtendedPresenceUsers()
      }))
      break
    }
    
    case 'presence:unsubscribe': {
      leaveRoom(peer, 'presence:all')
      break
    }
    
    case 'presence:activity': {
      updateActivity(peer)
      broadcastPresence()
      break
    }
    
    case 'presence:idle': {
      const meta = getClientMeta().get(peer)
      if (meta) {
        meta.status = 'idle'
      }
      broadcastPresence()
      break
    }
    
    case 'presence:page-update': {
      const { currentPage } = data
      if (currentPage) {
        updateClientMeta(peer, { currentPage })
        broadcastPresence()
      }
      break
    }
    
    case 'presence:device-info': {
      const { deviceType, tabCount } = data
      if (deviceType || tabCount !== undefined) {
        updateClientMeta(peer, { deviceType, tabCount })
        broadcastPresence()
      }
      break
    }
    
    case 'presence:request-update': {
      peer.send(JSON.stringify({
        type: 'presence:update',
        users: getExtendedPresenceUsers()
      }))
      break
    }
  }
}

/**
 * Отправляет обновление присутствия всем подписанным клиентам
 */
export function broadcastPresence() {
  const users = getExtendedPresenceUsers()
  broadcast('presence:all', {
    type: 'presence:update',
    users
  })
}

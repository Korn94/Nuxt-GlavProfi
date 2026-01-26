// server/ws/handlers/notifications.ts
import { joinRoom, leaveRoom, broadcast } from '../rooms'

type WSPeer = any

function getUserRoom(userId: number) {
  return `notifications:user:${userId}`
}

export async function handleNotifications(peer: WSPeer, data: any) {
  const user = peer.context.user
  if (!user) return

  switch (data.type) {
    case 'notifications:subscribe': {
      joinRoom(peer, getUserRoom(user.id))

      peer.send(JSON.stringify({
        type: 'notifications:subscribed'
      }))

      break
    }

    case 'notifications:unsubscribe': {
      leaveRoom(peer, getUserRoom(user.id))
      break
    }

    case 'notifications:push': {
      // этот кейс обычно вызывается сервером,
      // но оставляем как пример
      broadcast(getUserRoom(user.id), {
        type: 'notifications:new',
        notification: data.notification
      })
      break
    }
  }
}

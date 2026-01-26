// server/ws/handlers/tasks.ts
import { joinRoom, leaveRoom, broadcast } from '../rooms'
import { getContext } from '../context'
import type { WSPeer } from '../types'

/**
 * Обрабатывает сообщения, связанные с задачами
 */
export async function handleTasks(peer: WSPeer, data: any) {
  const ctx = getContext(peer)
  const user = ctx?.user
  
  if (!user) return
  
  switch (data.type) {
    case 'tasks:subscribe': {
      const objectId = Number(data.objectId)
      if (!objectId) return
      if (!user.objects.includes(objectId)) return
      
      // Подписываемся на комнату задач для этого объекта
      joinRoom(peer, `tasks:object:${objectId}`)
      
      // Отправляем подтверждение подписки
      peer.send(JSON.stringify({
        type: 'tasks:subscribed',
        objectId
      }))
      break
    }
    
    case 'tasks:unsubscribe': {
      const objectId = Number(data.objectId)
      if (!objectId) return
      
      // Отписываемся от комнаты задач для этого объекта
      leaveRoom(peer, `tasks:object:${objectId}`)
      break
    }
    
    case 'tasks:update': {
      const { objectId, task } = data
      if (!objectId || !task) return
      if (!user.objects.includes(objectId)) return
      
      // Проверяем, что задача принадлежит объекту
      if (task.objectId !== objectId) {
        console.warn(`[Tasks] Task object ID mismatch: ${task.objectId} != ${objectId}`)
        return
      }
      
      // Отправляем обновление всем подписанным на этот объект
      broadcast(`tasks:object:${objectId}`, {
        type: 'tasks:updated',
        task,
        updatedBy: {
          id: user.id,
          login: user.login,
          name: user.name
        },
        timestamp: Date.now()
      })
      break
    }
    
    case 'tasks:request-update': {
      const objectId = Number(data.objectId)
      if (!objectId || !user.objects.includes(objectId)) return
      
      // Здесь можно добавить логику отправки текущих задач
      // Это зависит от реализации на стороне клиента
      
      break
    }
  }
}

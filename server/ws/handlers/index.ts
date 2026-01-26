// server/ws/handlers/index.ts
import { handleTasks } from './tasks'
import { handlePresence } from './presence'

export async function handleMessage(peer: any, data: any) {
  if (!data?.type || typeof data.type !== 'string') return

  if (data.type.startsWith('tasks:')) {
    await handleTasks(peer, data)
  }
  // <-- Добавьте блок для presence -->
  else if (data.type.startsWith('presence:')) {
    await handlePresence(peer, data)
  }
}

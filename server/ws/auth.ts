// server/ws/auth.ts
import { verifyToken } from '../utils/jwt'
import { getObjectsByUser } from '../utils/objects'
import { setContext } from './context'
import type { WSUser } from './types'
import { db } from '../db'
import { users } from '../db/schema'
import { eq } from 'drizzle-orm'

export async function authenticatePeer(peer: any) {
  // ⬅️ сразу создаём контекст
  setContext(peer, { ready: false })
  
  const req = peer.request
  const url = new URL(req.url, `http://${req.headers.host}`)
  const token = url.searchParams.get('token')
  
  if (!token) {
    throw new Error('Token required')
  }
  
  const payload = await verifyToken(token)
  
  // Получаем полную информацию о пользователе из базы данных
  const [userFromDb] = await db
    .select({
      id: users.id,
      login: users.login,
      name: users.name,
      role: users.role
    })
    .from(users)
    .where(eq(users.id, payload.id))
  
  if (!userFromDb) {
    throw new Error('User not found')
  }
  
  const objects = await getObjectsByUser(userFromDb.id)
  
  // Создаем объект WSUser с дополнительным полем name
  const user: WSUser = {
    id: userFromDb.id,
    login: userFromDb.login,
    name: userFromDb.name,
    roles: [userFromDb.role],
    objects: objects.map(o => o.id)
  }
  
  // ✅ теперь контекст полностью готов
  setContext(peer, {
    user,
    ready: true
  })
  
  console.log('[WS] context set for user:', user.login, 'with name:', user.name)
}

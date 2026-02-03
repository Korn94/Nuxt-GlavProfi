// server/api/online.get.ts
import { eventHandler, createError } from 'h3'
import { getOnlineUsers } from '../utils/sessions'
import { db } from '../db'
import { users } from '../db/schema'
import { eq } from 'drizzle-orm'

export default eventHandler(async (event) => {
  try {
    // Получаем онлайн-пользователей
    const sessions = await getOnlineUsers()
    
    // Получаем информацию о пользователях
    const sessionsWithUsers = await Promise.all(
      sessions.map(async (session) => {
        const [user] = await db
          .select({
            name: users.name,
            role: users.role,
            login: users.login
          })
          .from(users)
          .where(eq(users.id, session.userId))
        
        return {
          ...session,
 user: user || undefined
        }
      })
    )
    
    return {
      users: sessionsWithUsers,
      total: sessionsWithUsers.length,
      online: sessionsWithUsers.filter(s => s.status === 'online').length,
      afk: sessionsWithUsers.filter(s => s.status === 'afk').length
    }
  } catch (error) {
    console.error('Error fetching online users:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch online users'
    })
  }
})

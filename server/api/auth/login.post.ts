// server/api/auth/login.post.ts
import { db } from '../../db'
import { users } from '../../db/schema'
import { eq } from 'drizzle-orm'
import { generateToken } from '../../utils/jwt'
import bcryptjs from 'bcryptjs'
import { eventHandler, readBody, createError, getRequestHeader, getRequestIP } from 'h3'
import { getObjectsByUser } from '../../utils/objects'
import { createSession } from '../../utils/sessions'

interface LoginBody {
  login: string
  password: string
  role: string
  objects?: { id: number }[]
}

export default eventHandler(async (event) => {
  const body = await readBody<LoginBody>(event)
  
  // Получаем информацию о запросе для сессии
  const ipAddress = getRequestIP(event, { xForwardedFor: true })
  const userAgent = getRequestHeader(event, 'user-agent') || undefined

  const [user] = await db.select().from(users).where(eq(users.login, body.login))

  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid credentials' })
  }

  const isPasswordValid = await bcryptjs.compare(body.password, user.password)
  if (!isPasswordValid) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid credentials' })
  }

  const objects = await getObjectsByUser(user.id)
  
  const token = await generateToken({ 
    id: user.id, 
    login: user.login,
    role: user.role,
    objects: objects.map(o => ({ id: o.id }))
  })

  // Создаем сессию пользователя
  const session = await createSession(user.id, ipAddress, userAgent)

  // Возвращаем и токен, и данные пользователя
  return { 
    token,
    user: {
      id: user.id,
      email: user.login,
      name: user.name || user.login,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      isVerified: true
    },
    sessionId: session?.sessionId // Возвращаем ID сессии
  }
})

// server/api/auth/login.post.ts
import { db } from '../../db'
import { users } from '../../db/schema'
import { eq } from 'drizzle-orm'
import { generateToken } from '../../utils/jwt'
import bcryptjs from 'bcryptjs'
import { eventHandler, readBody, createError } from 'h3'
import { getObjectsByUser } from '../../utils/objects'

interface LoginBody {
  login: string
  password: string
  role: string
  objects?: { id: number }[]
}

export default eventHandler(async (event) => {
  const body = await readBody<LoginBody>(event)
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

  return { token }
})

// server/api/auth/login.post.ts

import { db } from '../../db'
import { users } from '../../db/schema'
import { eq } from 'drizzle-orm'
import { generateToken } from '~/server/utils/jwt'
import bcrypt from 'bcrypt'
import { eventHandler, readBody, createError } from 'h3'

interface LoginBody {
  login: string
  password: string
}

export default eventHandler(async (event) => {
  const body = await readBody<LoginBody>(event)

  const [user] = await db.select().from(users).where(eq(users.login, body.login))

  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid credentials' })
  }

  const isPasswordValid = await bcrypt.compare(body.password, user.password)

  if (!isPasswordValid) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid credentials' })
  }

  const token = await generateToken({ id: user.id, login: user.login })

  return { token }
})

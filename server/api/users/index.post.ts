// server/api/users/post.ts
/**
 * Назначение: Создание нового пользователя
 * ⚠️ Требует роль `manager` (проверяется в мидлваре)
 * 
 * @body { name: string, login: string, password: string, role?: string }
 * @returns { User } — созданный пользователь (без пароля)
 */

import { defineEventHandler, readBody, createError } from 'h3'
import { db } from '../../db'
import { users } from '../../db/schema'
import { eq } from 'drizzle-orm'
import bcryptjs from 'bcryptjs'

export default defineEventHandler(async (event) => {
  // ✅ Авторизация и права уже проверены мидлваром
  const { name, login, password, role } = await readBody(event)

  if (!name || !login || !password) {
    throw createError({ statusCode: 400, message: 'Имя, логин и пароль обязательны' })
  }

  const hashedPassword = await bcryptjs.hash(password, 10)

  await db.insert(users).values({
    name,
    login,
    password: hashedPassword,
    role: role || 'worker'
  })

  const [newUser] = await db.select().from(users).where(eq(users.login, login))
  
  if (!newUser) {
    throw createError({ statusCode: 500, message: 'Не удалось получить созданного пользователя' })
  }
  
  // ✅ Возвращаем пользователя без пароля (явное указание типа для обхода строгой типизации)
  const { password: _, ...safeUser } = newUser as typeof users.$inferSelect
  return safeUser
})

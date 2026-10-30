// server/api/users/index.post.ts
/**
 * Назначение: Создание нового пользователя
 * ⚠️ Требует роль `manager` (проверяется в мидлваре)
 * 
 * @body { name: string, login: string, password: string, role?: string }
 * @returns { User } — созданный пользователь (без пароля)
 */

import { defineEventHandler, readBody, createError } from 'h3'
import { db } from '../../db'
import { users, partners } from '../../db/schema'
import { eq } from 'drizzle-orm'
import bcryptjs from 'bcryptjs'

export default defineEventHandler(async (event) => {
  // ✅ Авторизация и права уже проверены мидлваром
  const { name, login, password, role, partnerId } = await readBody(event)

  if (!name || !login || !password) {
    throw createError({ statusCode: 400, message: 'Имя, логин и пароль обязательны' })
  }

  const resolvedRole = role || 'worker'

  // Предварительная проверка привязываемого профиля партнёра
  let targetPartner: { id: number; userId: number | null } | null = null
  if (resolvedRole === 'partner' && partnerId) {
    const [t] = await db
      .select({ id: partners.id, userId: partners.userId })
      .from(partners)
      .where(eq(partners.id, Number(partnerId)))
    if (!t) throw createError({ statusCode: 400, message: 'Партнёр для привязки не найден' })
    if (t.userId) throw createError({ statusCode: 409, message: 'Партнёр уже привязан к другому пользователю' })
    targetPartner = t
  }

  const hashedPassword = await bcryptjs.hash(password, 10)

  await db.insert(users).values({
    name,
    login,
    password: hashedPassword,
    role: resolvedRole
  })

  const [newUser] = await db.select().from(users).where(eq(users.login, login))
  
  if (!newUser) {
    throw createError({ statusCode: 500, message: 'Не удалось получить созданного пользователя' })
  }

  // Привязка/автосоздание профиля партнёра
  if (resolvedRole === 'partner') {
    if (targetPartner) {
      await db.update(partners).set({ userId: newUser.id }).where(eq(partners.id, targetPartner.id))
    } else {
      await db.insert(partners).values({
        userId: newUser.id,
        companyName: null,
        contactPerson: name,
        isActive: true,
      })
    }
  }
  
  // ✅ Возвращаем пользователя без пароля (явное указание типа для обхода строгой типизации)
  const { password: _, ...safeUser } = newUser as typeof users.$inferSelect
  return safeUser
})

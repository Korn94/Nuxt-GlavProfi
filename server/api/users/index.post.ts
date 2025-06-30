// server/api/users/post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { db } from '../../db'
import { users } from '../../db/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcrypt'

export default defineEventHandler(async (event) => {
  try {
    const { name, login, password, role } = await readBody(event)

    // Проверка обязательных полей
    if (!name || !login || !password) {
      throw createError({ 
        statusCode: 400,
        message: 'Имя, логин и пароль обязательны' 
      })
    }

    // Хэширование пароля
    const hashedPassword = await bcrypt.hash(password, 10)

    // Вставка нового пользователя
    await db.insert(users).values({
      name,
      login,
      password: hashedPassword,
      role: role || 'worker'
    })

    // Получаем только что созданного пользователя
    const [newUser] = await db.select().from(users).where(eq(users.login, login))

    return newUser
  } catch (error) {
    console.error('Ошибка создания пользователя:', error)
    throw createError({ 
      statusCode: 500,
      message: 'Ошибка сервера при создании пользователя' 
    })
  }
})

// server/api/partners/index.post.ts
/**
 * Создание партнёра. Опционально — создание соответствующего пользователя (роль 'partner')
 * с логином/паролем для входа в кабинет.
 *
 * @body {
 *   companyName?: string, contactPerson?: string, phone?: string, email?: string, comment?: string,
 *   createUser?: boolean, name?: string, login?: string, password?: string
 * }
 */
import { defineEventHandler, readBody, createError } from 'h3'
import { db } from '../../db'
import { partners, users } from '../../db/schema'
import { eq, desc } from 'drizzle-orm'
import bcryptjs from 'bcryptjs'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const companyName = body.companyName?.toString()?.trim() || null
  const contactPerson = body.contactPerson?.toString()?.trim() || null
  const phone = body.phone?.toString()?.trim() || null
  const email = body.email?.toString()?.trim() || null
  const comment = body.comment?.toString()?.trim() || null

  // Базовое требование: у партнёра должно быть хотя бы имя компании или контактное лицо
  if (!companyName && !contactPerson) {
    throw createError({ statusCode: 400, statusMessage: 'Укажите название компании или контактное лицо' })
  }

  let userId: number | null = null

  // ── Вариант 1: привязка к существующему пользователю ──
  if (body.userId !== undefined && body.userId !== null && body.userId !== '') {
    const linkUserId = Number(body.userId)
    if (Number.isNaN(linkUserId)) {
      throw createError({ statusCode: 400, statusMessage: 'Некорректный ID пользователя' })
    }
    const [linkUser] = await db.select({ id: users.id }).from(users).where(eq(users.id, linkUserId))
    if (!linkUser) {
      throw createError({ statusCode: 404, statusMessage: 'Пользователь не найден' })
    }
    const [existingLink] = await db.select({ id: partners.id }).from(partners).where(eq(partners.userId, linkUserId))
    if (existingLink) {
      throw createError({ statusCode: 409, statusMessage: 'К этому пользователю уже привязан партнёр' })
    }
    userId = linkUserId
  }
  // ── Вариант 2: создание нового аккаунта (роль 'partner') ──
  else if (body.createUser === true) {
    const name = body.name?.toString()?.trim()
    const login = body.login?.toString()?.trim()
    const password = body.password?.toString()

    if (!name || !login || !password) {
      throw createError({ statusCode: 400, statusMessage: 'Для создания аккаунта нужны имя, логин и пароль' })
    }
    if ((password as string).length < 6) {
      throw createError({ statusCode: 400, statusMessage: 'Пароль должен содержать минимум 6 символов' })
    }

    // Проверка уникальности логина
    const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.login, login))
    if (existing) {
      throw createError({ statusCode: 409, statusMessage: 'Пользователь с таким логином уже существует' })
    }

    const hashedPassword = await bcryptjs.hash(password, 10)

    await db.insert(users).values({
      name,
      login,
      password: hashedPassword,
      role: 'partner',
    })

    const [newUser] = await db.select({ id: users.id }).from(users).where(eq(users.login, login))
    userId = newUser?.id ?? null
  }

  // ── Создание профиля партнёра ──
  await db.insert(partners).values({
    userId,
    companyName,
    contactPerson,
    phone,
    email,
    comment,
    isActive: true,
  })

  // Возвращаем созданного партнёра (последний по id)
  const [created] = await db.select().from(partners).orderBy(desc(partners.id)).limit(1)
  return created
})
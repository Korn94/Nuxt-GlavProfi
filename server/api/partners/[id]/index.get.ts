// server/api/partners/[id]/index.get.ts
/**
 * Получение профиля партнёра по ID (включая связанного пользователя).
 */
import { defineEventHandler, createError, getRouterParam } from 'h3'
import { db } from '../../../db'
import { partners, users } from '../../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const idParam = getRouterParam(event, 'id')
  const id = Number(idParam)

  if (!id || Number.isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Некорректный ID партнёра' })
  }

  const [row] = await db
    .select({
      partner: partners,
      login: users.login,
      userName: users.name,
    })
    .from(partners)
    .leftJoin(users, eq(partners.userId, users.id))
    .where(eq(partners.id, id))

  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Партнёр не найден' })
  }

  return {
    ...row.partner,
    login: row.login ?? null,
    userName: row.userName ?? null,
  }
})
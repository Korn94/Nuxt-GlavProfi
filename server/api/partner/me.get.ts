// server/api/partner/me.get.ts
/**
 * Личный кабинет партнёра: профиль + его сделки (лиды).
 * Доступ ограничен ролью 'partner' (проверяется в server/middleware/auth.ts через custom-чек).
 */
import { defineEventHandler, createError } from 'h3'
import { db } from '../../db'
import { partners, partnerLeads } from '../../db/schema'
import { eq, desc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Требуется авторизация' })
  }

  // Находим профиль партнёра по текущему пользователю
  const [partner] = await db
    .select()
    .from(partners)
    .where(eq(partners.userId, user.id))

  if (!partner) {
    return { partner: null, leads: [] }
  }

  const leads = await db
    .select()
    .from(partnerLeads)
    .where(eq(partnerLeads.partnerId, partner.id))
    .orderBy(desc(partnerLeads.createdAt))

  return { partner, leads }
})
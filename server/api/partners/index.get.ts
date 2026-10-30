// server/api/partners/index.get.ts
/**
 * Список партнёров для админ-раздела.
 * Возвращает профили партнёров + связанный логин/имя пользователя + количество сделок.
 */
import { defineEventHandler, getQuery } from 'h3'
import { db } from '../../db'
import { partners, users, partnerLeads } from '../../db/schema'
import { eq, desc, count, and, like } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const search = query.search?.toString()?.trim() || ''
  const includeInactive = query.includeInactive === 'true'

  const conditions = []
  if (search) {
    conditions.push(
      like(partners.companyName, `%${search}%`)
    )
  }
  if (!includeInactive) {
    conditions.push(eq(partners.isActive, true))
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined

  const rows = await db
    .select({
      partner: partners,
      login: users.login,
      userName: users.name,
    })
    .from(partners)
    .leftJoin(users, eq(partners.userId, users.id))
    .where(where)
    .orderBy(desc(partners.createdAt))

  // Количество сделок по каждому партнёру
  const counts = await db
    .select({ partnerId: partnerLeads.partnerId, cnt: count() })
    .from(partnerLeads)
    .groupBy(partnerLeads.partnerId)

  const countMap = new Map(counts.map(c => [c.partnerId, Number(c.cnt)]))

  return rows.map(r => ({
    ...r.partner,
    login: r.login ?? null,
    userName: r.userName ?? null,
    leadsCount: countMap.get(r.partner.id) ?? 0,
  }))
})
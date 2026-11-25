// server/api/partner/check-phone.post.ts
/**
 * Проверка номера телефона клиента в базе лидов партнёрской программы.
 * Отвечает только фактом наличия (boolean) — без самого номера и без владельца.
 * Доступ ограничен ролью 'partner' (server/middleware/auth.ts).
 *
 * @body { phone: string }
 * @returns { found: boolean }
 */
import { defineEventHandler, readBody, createError } from 'h3'
import { db } from '../../db'
import { partnerLeads } from '../../db/schema'
import { normalizeRuPhone } from 'shared/utils/phone'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Требуется авторизация' })
  }

  const body = await readBody(event)
  const phone = normalizeRuPhone(body?.phone)

  // Ответ даём только при полностью заполненном РФ-номере (7XXXXXXXXXX),
  // чтобы нельзя было перебирать и «подсматривать» чужие номера.
  if (!phone) {
    throw createError({ statusCode: 400, statusMessage: 'Введите номер телефона полностью' })
  }

  const rows = await db
    .select({ clientPhone: partnerLeads.clientPhone })
    .from(partnerLeads)

  const found = rows.some((row) => normalizeRuPhone(row.clientPhone) === phone)

  // Никогда не возвращаем сам номер и его владельца — только факт наличия.
  return { found }
})

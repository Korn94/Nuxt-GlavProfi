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

/**
 * Приведение номера к каноничному виду для сравнения.
 * Русские 8…/7… и 10-значные номера приводим к виду 7XXXXXXXXXX.
 */
function normalizePhone(value: unknown): string {
  if (typeof value !== 'string') return ''
  let digits = value.replace(/\D/g, '')

  if (digits.length === 11 && (digits.startsWith('7') || digits.startsWith('8'))) {
    digits = '7' + digits.slice(1)
  } else if (digits.length === 10) {
    digits = '7' + digits
  }

  return digits
}

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Требуется авторизация' })
  }

  const body = await readBody(event)
  const phone = normalizePhone(body?.phone)

  // Ответ даём только при полностью заполненном номере (≥ 11 цифр),
  // чтобы нельзя было перебирать и «подсматривать» чужие номера.
  if (phone.length < 11) {
    throw createError({ statusCode: 400, statusMessage: 'Введите номер телефона полностью' })
  }

  const rows = await db
    .select({ clientPhone: partnerLeads.clientPhone })
    .from(partnerLeads)

  const found = rows.some((row) => normalizePhone(row.clientPhone) === phone)

  // Никогда не возвращаем сам номер и его владельца — только факт наличия.
  return { found }
})

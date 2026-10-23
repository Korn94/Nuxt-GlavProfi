// server/api/works/reject/[id].post.ts
/**
 * Назначение: Отклонение работы с указанием причины
 * ⚠️ Требует право `canApproveWorks` (проверяется в мидлваре)
 * 
 * @param {string} id — ID работы (из пути)
 * @body { reason: string } — причина отклонения
 *        легаси-ключ { comment } тоже принимается (обратная совместимость)
 * @returns { success: boolean, rejectedReason: string }
 */

import { defineEventHandler, getRouterParam, readBody, createError } from 'h3'
import { db } from '../../../db'
import { works } from '../../../db/schema'
import { eq } from 'drizzle-orm'

const MAX_REASON_LENGTH = 2000

export default defineEventHandler(async (event) => {
  // ✅ Авторизация и права уже проверены мидлваром
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ID работы обязателен' })

  const workId = parseInt(id)
  if (Number.isNaN(workId)) throw createError({ statusCode: 400, message: 'Некорректный ID работы' })

  const body = await readBody(event)
  // Каноничное поле — reason; comment принимается ради старых/закэшированных клиентов
  const reason = String(body?.reason ?? body?.comment ?? '').trim()
  if (!reason) throw createError({ statusCode: 400, message: 'Требуется указать причину' })
  if (reason.length > MAX_REASON_LENGTH) {
    throw createError({ statusCode: 400, message: `Причина не длиннее ${MAX_REASON_LENGTH} символов` })
  }

  const [work] = await db.select({ id: works.id }).from(works).where(eq(works.id, workId))
  if (!work) throw createError({ statusCode: 404, message: 'Работа не найдена' })

  await db.update(works)
    .set({
      accepted: false,
      rejectedReason: reason
    })
    .where(eq(works.id, workId))

  return { success: true, rejectedReason: reason }
})

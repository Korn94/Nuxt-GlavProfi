// server/api/works/reject/[id].post.ts
/**
 * Назначение: Отклонение работы с указанием причины
 * ⚠️ Требует право `canApproveWorks` (проверяется в мидлваре)
 * 
 * @param {string} id — ID работы (из пути)
 * @body { reason: string } — причина отклонения
 * @returns { success: boolean }
 */

import { defineEventHandler, getRouterParam, readBody, createError } from 'h3'
import { db } from '../../../db'
import { works } from '../../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  // ✅ Авторизация и права уже проверены мидлваром
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ID работы обязателен' })

  const body = await readBody(event)
  if (!body?.reason) throw createError({ statusCode: 400, message: 'Требуется указать причину' })

  await db.update(works)
    .set({
      accepted: false,
      rejectedReason: body.reason
    })
    .where(eq(works.id, parseInt(id)))

  return { success: true }
})

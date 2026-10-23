// server/api/works/accept/[id].post.ts
/**
 * Назначение: Принятие работы (подтверждение выполнения)
 * ⚠️ Требует право `canApproveWorks` (проверяется в мидлваре)
 * 
 * @param {string} id — ID работы (из пути)
 * @returns { success: boolean }
 */

import { defineEventHandler, getRouterParam, createError } from 'h3'
import { db } from '../../../db'
import { works } from '../../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  // ✅ Авторизация и права уже проверены мидлваром
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ID работы обязателен' })

  const [work] = await db.select().from(works).where(eq(works.id, parseInt(id)))
  if (!work) throw createError({ statusCode: 404, message: 'Работа не найдена' })
  if (work.accepted) throw createError({ statusCode: 400, message: 'Работа уже принята' })

  // rejectedReason сбрасываем: иначе после «отклонить → принять» работа
  // останется помеченной отклонённой (см. mine.get: pending = accepted=false
  // AND rejectedReason IS NULL), а UI покажет устаревшую причину.
  await db.update(works).set({
    accepted: true,
    acceptedDate: new Date(),
    rejectedReason: null
  }).where(eq(works.id, parseInt(id)))

  return { success: true }
})

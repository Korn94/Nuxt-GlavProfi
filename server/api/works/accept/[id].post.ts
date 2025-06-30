// server/api/works/accept/[id].post.ts
import { defineEventHandler, getRouterParam, createError } from 'h3'
import { db } from '../../../db'
import { works, foremans, foremanProfitHistory } from '../../../db/schema'
import { eq, sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ID работы обязателен' })

  try {
    const [work] = await db.select().from(works).where(eq(works.id, parseInt(id)))
    if (!work) throw createError({ statusCode: 404, message: 'Работа не найдена' })
    if (work.accepted) throw createError({ statusCode: 400, message: 'Работа уже принята' })
    if (!work.foremanId) throw createError({ statusCode: 400, message: 'У работы не указан прораб' })

    // Расчет 8% от profit
    const profit = Number(work.profit)
    const foremanProfit = profit * 0.08

    // Обновляем статус работы
    await db.update(works).set({
      accepted: true,
      acceptedDate: new Date()
    }).where(eq(works.id, parseInt(id)))

    // Обновляем баланс прораба
    await db.update(foremans)
      .set({ balance: sql`${foremans.balance} + ${foremanProfit}` })
      .where(eq(foremans.id, work.foremanId))

    // Логируем начисление
    await db.insert(foremanProfitHistory).values({
      workId: work.id,
      objectId: work.objectId,
      foremanId: work.foremanId,
      amount: foremanProfit.toFixed(2)
    });

    return { success: true }
  } catch (error) {
    console.error('Ошибка принятия работы:', error)
    throw createError({ statusCode: 500, message: 'Ошибка сервера при принятии работы' })
  }
})

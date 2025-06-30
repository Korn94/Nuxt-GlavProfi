// server/api/expenses/[id].put.ts
import { defineEventHandler, readBody, getRouterParam, createError } from 'h3'
import { db } from '../../../db'
import { expenses } from '../../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ID обязателен' })

  try {
    const body = await readBody(event)

    const updates: any = {}
    if (body.amount !== undefined) updates.amount = body.amount
    if (body.comment) updates.comment = body.comment
    if (body.contractorId !== undefined) updates.contractorId = body.contractorId
    if (body.contractorType) updates.contractorType = body.contractorType
    if (body.works) updates.works = body.works
    if (body.paymentDate) updates.paymentDate = body.paymentDate
    if (body.operationDate) updates.operationDate = body.operationDate

    if (Object.keys(updates).length === 0) {
      throw createError({ statusCode: 400, message: 'Нет данных для обновления' })
    }

    await db.update(expenses).set(updates).where(eq(expenses.id, parseInt(id)))

    const [updated] = await db.select().from(expenses).where(eq(expenses.id, parseInt(id)))
    if (!updated) throw createError({ statusCode: 404, message: 'Расход не найден' })

    return updated
  } catch (error) {
    console.error('Ошибка обновления расхода:', error)
    throw createError({ 
      statusCode: 500,
      message: 'Ошибка сервера при обновлении расхода' 
    })
  }
})

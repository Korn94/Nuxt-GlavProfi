// server/api/objects/expenses/[id].get.ts
import { defineEventHandler, getRouterParam, createError } from 'h3'
import { db } from '../../../db'
import { expenses } from '../../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ID объекта обязателен' })

  try {
    const expensesList = await db.select().from(expenses).where(eq(expenses.objectId, parseInt(id)))
    return expensesList
  } catch (error) {
    console.error('Ошибка получения расходов:', error)
    throw createError({ statusCode: 500, message: 'Ошибка сервера при получении расходов' })
  }
})

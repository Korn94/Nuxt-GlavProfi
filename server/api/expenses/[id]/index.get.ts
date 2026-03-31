// server/api/expenses/[id]/index.get.ts
import { defineEventHandler, getRouterParam, createError } from 'h3'
import { db } from '../../../db'
import { 
  expenses, 
  masters, 
  workers, 
  foremans, 
  offices,
  objects 
} from '../../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ID обязателен' })

  try {
    // Получаем расход с джойнами для получения имён
    const [result] = await db
      .select({
        expense: expenses,
        master: masters,
        worker: workers,
        foreman: foremans,
        office: offices,
        object: objects
      })
      .from(expenses)
      .leftJoin(masters, eq(expenses.contractorId, masters.id))
      .leftJoin(workers, eq(expenses.contractorId, workers.id))
      .leftJoin(foremans, eq(expenses.contractorId, foremans.id))
      .leftJoin(offices, eq(expenses.contractorId, offices.id))
      .leftJoin(objects, eq(expenses.objectId, objects.id))
      .where(eq(expenses.id, parseInt(id)))

    if (!result?.expense) throw createError({ statusCode: 404, message: 'Расход не найден' })

    // Формируем ответ с удобными полями
    const contractorName = 
      result.expense.contractorType === 'master' ? result.master?.name :
      result.expense.contractorType === 'worker' ? result.worker?.name :
      result.expense.contractorType === 'foreman' ? result.foreman?.name :
      result.expense.contractorType === 'office' ? result.office?.name :
      null

    return {
      ...result.expense,
      amount: Number(result.expense.amount),
      contractorName,
      objectName: result.object?.name || null
    }
  } catch (error) {
    console.error('Ошибка получения расхода:', error)
    throw createError({ 
      statusCode: 500,
      message: error instanceof Error ? error.message : 'Ошибка сервера при получении расхода' 
    })
  }
})

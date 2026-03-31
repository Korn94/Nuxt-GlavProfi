// server/api/expenses/[id]/index.put.ts
import { defineEventHandler, readBody, getRouterParam, createError } from 'h3'
import { db } from '../../../db'
import { 
  expenses, 
  masters, 
  workers, 
  foremans, 
  offices 
} from '../../../db/schema'
import { eq } from 'drizzle-orm'
import type { ContractorType } from '~/types/contractors'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ID обязателен' })

  try {
    const body = await readBody(event)

    // 1. Получаем текущую запись для сравнения
    const [currentExpense] = await db.select().from(expenses).where(eq(expenses.id, parseInt(id)))
    if (!currentExpense) throw createError({ statusCode: 404, message: 'Расход не найден' })

    // 2. Собираем обновления
    const updates: Record<string, any> = {}
    if (body.amount !== undefined) updates.amount = String(body.amount)
    if (body.comment !== undefined) updates.comment = body.comment
    if (body.contractorId !== undefined) updates.contractorId = body.contractorId
    if (body.contractorType !== undefined) updates.contractorType = body.contractorType
    if (body.expenseType !== undefined) updates.expenseType = body.expenseType
    if (body.objectId !== undefined) updates.objectId = body.objectId
    if (body.paymentDate !== undefined) updates.paymentDate = body.paymentDate
    if (body.operationDate !== undefined) {
      const parsedDate = new Date(body.operationDate)
      if (!isNaN(parsedDate.getTime())) {
        updates.operationDate = parsedDate
      }
    }

    if (Object.keys(updates).length === 0) {
      throw createError({ statusCode: 400, message: 'Нет данных для обновления' })
    }

    // 3. Обновляем запись
    await db.update(expenses).set(updates).where(eq(expenses.id, parseInt(id)))

    // 4. Получаем обновлённую запись — ✅ с проверкой на undefined
    const [updatedExpense] = await db.select().from(expenses).where(eq(expenses.id, parseInt(id)))
    
    if (!updatedExpense) {
      throw createError({ statusCode: 404, message: 'Не удалось получить обновлённый расход' })
    }

    // 5. Пересчёт баланса контрагента — ТОЛЬКО для типа "Работа"
    if (
      updatedExpense.expenseType === 'Работа' && 
      updatedExpense.contractorType && 
      updatedExpense.contractorId
    ) {
      const ContractorModel = getContractorTable(updatedExpense.contractorType as ContractorType)
      
      if (ContractorModel) {
        const [contractor] = await db.select()
          .from(ContractorModel)
          .where(eq(ContractorModel.id, updatedExpense.contractorId))

        if (contractor) {
          const oldAmount = Number(currentExpense.amount)
          const newAmount = Number(updatedExpense.amount)
          const oldType = currentExpense.expenseType
          const newType = updatedExpense.expenseType
          
          let balanceAdjustment = 0
          
          if (oldType === 'Работа' && newType === 'Работа') {
            balanceAdjustment = newAmount - oldAmount
          } else if (oldType !== 'Работа' && newType === 'Работа') {
            balanceAdjustment = newAmount
          } else if (oldType === 'Работа' && newType !== 'Работа') {
            balanceAdjustment = -oldAmount
          }
          
          if (balanceAdjustment !== 0) {
            const currentBalance = Number(contractor.balance)
            const updatedBalance = currentBalance + balanceAdjustment
            
            await db.update(ContractorModel)
              .set({ balance: updatedBalance.toFixed(2) })
              .where(eq(ContractorModel.id, updatedExpense.contractorId))
          }
        }
      }
    }

    // 6. Возвращаем результат
    return {
      ...updatedExpense,
      amount: Number(updatedExpense.amount)
    }
  } catch (error) {
    console.error('Ошибка обновления расхода:', error)
    throw createError({ 
      statusCode: 500,
      message: error instanceof Error ? error.message : 'Ошибка сервера при обновлении расхода' 
    })
  }
})

// Вспомогательная функция
function getContractorTable(type: ContractorType) {
  const tables = {
    master: masters,
    worker: workers,
    foreman: foremans,
    office: offices
  }
  return tables[type] || null
}

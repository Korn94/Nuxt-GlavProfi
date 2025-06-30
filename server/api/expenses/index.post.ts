// server/api/expenses/index.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { db } from '../../db'
import { expenses, masters, workers, objects } from '../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { amount, comment, contractorId, contractorType, objectId } = body

    // contractorId и contractorType обязательны, objectId — необязательный
    if (!amount || !contractorId || !contractorType) {
      throw createError({ 
        statusCode: 400,
        message: 'Сумма, тип и ID контрагента обязательны' 
      })
    }

    let object = null
    if (objectId) {
      const [found] = await db.select()
        .from(objects)
        .where(eq(objects.id, parseInt(objectId)))

      if (!found) {
        throw createError({ statusCode: 404, message: 'Объект не найден' })
      }
      object = found
    }

    // Обновляем баланс контрагента (мастера или рабочего)
    const ContractorModel = 
      contractorType === 'master' ? masters : 
      contractorType === 'worker' ? workers : null

    if (ContractorModel) {
      const [contractor] = await db.select()
        .from(ContractorModel)
        .where(eq(ContractorModel.id, parseInt(contractorId)))

      if (contractor) {
        const updatedContractorBalance = Number(contractor.balance) + Number(amount)

        await db.update(ContractorModel)
          .set({ balance: updatedContractorBalance.toFixed(2) })
          .where(eq(ContractorModel.id, parseInt(contractorId)))
      }
    }

    // Добавляем запись о расходе
    const [newExpense] = await db.insert(expenses).values({
      amount: amount.toString(),
      comment,
      contractorId: parseInt(contractorId),
      contractorType,
      objectId: objectId ? parseInt(objectId) : null,
      paymentDate: new Date(),
      operationDate: new Date()
    }).$returningId()

    return newExpense
  } catch (error) {
    console.error('Ошибка создания расхода:', error)
    throw createError({ 
      statusCode: 500,
      message: 'Ошибка сервера при создании расхода' 
    })
  }
})

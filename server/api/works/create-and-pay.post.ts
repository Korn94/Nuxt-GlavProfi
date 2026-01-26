// server/api/works/create-and-pay.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { db } from '../../db'
import { 
  works, 
  expenses, 
  objects, 
  masters, 
  workers,
  foremans
} from '../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    
    // Проверяем обязательные поля
    if (!body.workerAmount || !body.contractorId || !body.contractorType || !body.objectId) {
      throw createError({ 
        statusCode: 400,
        message: 'Недостаточно данных для создания и оплаты работы' 
      })
    }

    // Используем переданную дату операции или текущую, если не передана
    const operationDate = body.operationDate 
      ? new Date(body.operationDate) 
      : new Date();

    // Начинаем транзакцию для всех операций
    return await db.transaction(async (tx) => {
      const now = new Date()
      
      // 1. Создаем работу как принятую и оплаченную
      const [newWork] = await tx.insert(works).values({
        workerAmount: body.workerAmount,
        comment: body.comment || '',
        contractorId: body.contractorId,
        contractorType: body.contractorType,
        workTypes: body.workTypes || 'Прочее',
        foremanId: body.foremanId || null,
        accepted: true,
        acceptedDate: now,
        rejectedReason: null,
        paid: true,
        paymentDate: now,
        operationDate: operationDate,
        objectId: body.objectId
      }).$returningId()

      // Проверяем, что работа была создана
      if (!newWork) {
        throw new Error('Не удалось создать работу')
      }

      // 2. Создаем расход (увеличиваем долг компании перед контрагентом)
      await tx.insert(expenses).values({
        amount: body.workerAmount.toString(),
        comment: `${body.comment ? `${body.comment}` : ''}`,
        contractorId: body.contractorId,
        contractorType: body.contractorType,
        objectId: body.objectId,
        expenseType: 'Работа',
        paymentDate: now,
        operationDate: now
      })

      // 4. Обновляем totalWorks и totalBalance объекта
      const [object] = await tx.select().from(objects).where(eq(objects.id, body.objectId))
      if (!object) {
        throw createError({ statusCode: 404, message: 'Объект не найден' })
      }

      const newTotalWorks = Number(object.totalWorks) + Number(body.workerAmount)
      const newTotalBalance = Number(object.totalIncome) - newTotalWorks

      await tx.update(objects)
        .set({
          totalWorks: newTotalWorks.toFixed(2),
          totalBalance: newTotalBalance.toFixed(2)
        })
        .where(eq(objects.id, body.objectId))

      return newWork
    })
  } catch (error) {
    console.error('Ошибка создания и оплаты работы:', error)
    throw createError({ 
      statusCode: 500,
      message: 'Ошибка сервера при создании и оплаты работы' 
    })
  }
})

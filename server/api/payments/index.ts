// server/api/payments/index.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { db } from '../../db'
import { comings, expenses, objects, masters, workers } from '../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  // Обработка POST-запроса (создание платежа через приход/расход)
  if (event.method === 'POST') {
    try {
      const { amount, comment, contractorId, contractorType, objectId, type } = await readBody(event)

      // Проверка обязательных полей
      if (!amount || !contractorId || !contractorType || !objectId || !type) {
        throw createError({ 
          statusCode: 400,
          message: 'Все поля обязательны: amount, contractorId, contractorType, objectId, type' 
        })
      }

      if (!['incoming', 'outgoing'].includes(type)) {
        throw createError({ 
          statusCode: 400,
          message: 'Поле type может быть только "incoming" или "outgoing"' 
        })
      }

      // Приведение типов к числам
      const paymentAmount = Number(amount)
      if (isNaN(paymentAmount)) {
        throw createError({ 
          statusCode: 400,
          message: 'Поле amount должно быть числом' 
        })
      }

      // Обновляем баланс контрагента
      const ContractorModel = 
        contractorType === 'master' ? masters : 
        contractorType === 'worker' ? workers : null

      if (ContractorModel) {
        const [contractor] = await db.select().from(ContractorModel).where(eq(ContractorModel.id, contractorId))
        if (!contractor) {
          throw createError({ 
            statusCode: 404,
            message: 'Контрагент не найден' 
          })
        }

        // Приведение баланса к числу
        const contractorBalance = Number(contractor.balance)
        if (isNaN(contractorBalance)) {
          throw createError({ 
            statusCode: 500,
            message: 'Ошибка преобразования баланса контрагента' 
          })
        }

        // Расчет нового баланса
        const updatedBalance = contractorBalance + (type === 'incoming' ? paymentAmount : -paymentAmount)
        
        // Обновление баланса
        await db.update(ContractorModel)
          .set({ balance: updatedBalance.toString() })
          .where(eq(ContractorModel.id, contractorId))
      }

      // Обновляем баланс объекта
      const [object] = await db.select().from(objects).where(eq(objects.id, objectId))
      if (!object) {
        throw createError({ 
          statusCode: 404,
          message: 'Объект не найден' 
        })
      }

      // Приведение баланса объекта к числу
      const currentIncome = Number(object.totalIncome)
      const currentExpenses = Number(object.totalWorks)
      const currentBalance = Number(object.totalBalance)
      
      if ([currentIncome, currentExpenses, currentBalance].some(isNaN)) {
        throw createError({ 
          statusCode: 500,
          message: 'Ошибка преобразования баланса объекта' 
        })
      }

      // Обновление баланса объекта
      const updatedObjectIncome = type === 'incoming' 
        ? currentIncome + paymentAmount 
        : currentIncome
        
      const updatedObjectExpenses = type === 'outgoing' 
        ? currentExpenses + paymentAmount 
        : currentExpenses
        
      const updatedObjectBalance = updatedObjectIncome - updatedObjectExpenses

      await db.update(objects)
        .set({
          totalIncome: updatedObjectIncome.toString(),
          totalWorks: updatedObjectExpenses.toString(),
          totalBalance: updatedObjectBalance.toString()
        })
        .where(eq(objects.id, objectId))

      // Создаем запись в comings или expenses
      if (type === 'incoming') {
        await db.insert(comings).values({
          amount: amount.toString(),
          comment,
          objectId,
          paymentDate: new Date(),
          operationDate: new Date()
        })
      } else {
        await db.insert(expenses).values({
          amount: amount.toString(),
          comment,
          contractorId,
          contractorType,
          objectId,
          paymentDate: new Date(),
          operationDate: new Date()
        })
      }

      return {
        message: 'Платеж успешно обработан',
        type,
        amount: amount.toString(),
        objectId,
        contractorId,
        contractorType
      }
    } catch (error) {
      console.error('Ошибка обработки платежа:', error)
      throw createError({ 
        statusCode: 500,
        message: 'Ошибка сервера при обработке платежа' 
      })
    }
  }

  throw createError({ 
    statusCode: 405,
    message: `Метод ${event.method} не поддерживается для /api/payments` 
  })
})
// server/api/expenses/index.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { db } from '../../db'
import { expenses, masters, workers, foremans, offices, objects } from '../../db/schema'
import { eq } from 'drizzle-orm'

// Типы расходов (литеральный тип)
type ExpenseType = 'Работа' | 'Налог' | 'Зарплата' | 'Реклама' | 'Кредит' | 'Топливо' | 'ГлавПрофи'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { amount, comment, contractorId, contractorType, objectId, expenseType, operationDate } = body

    // Список допустимых типов
    const validExpenseTypes = ['Работа', 'Налог', 'Зарплата', 'Реклама', 'Кредит', 'Топливо', 'ГлавПрофи'] as const
    if (!validExpenseTypes.includes(expenseType as ExpenseType)) {
      throw createError({ 
        statusCode: 400, 
        message: `Неверный тип расхода. Допустимые значения: ${validExpenseTypes.join(', ')}` 
      })
    }

    // Типизация expenseType явно
    const typedExpenseType = expenseType as ExpenseType

    // Проверка даты операции
    let parsedDate: Date
    if (operationDate) {
      parsedDate = new Date(operationDate)
      if (isNaN(parsedDate.getTime())) {
        throw createError({ 
          statusCode: 400, 
          message: 'Некорректный формат даты операции' 
        })
      }
    } else {
      parsedDate = new Date() // По умолчанию - текущая дата
    }

    // Объект с обязательными полями
    const requiredFields: Record<ExpenseType, (keyof typeof body)[]> = {
      'Работа': ['amount', 'contractorId', 'contractorType'],
      'Налог': ['amount'],
      'Зарплата': ['amount', 'contractorId', 'contractorType'],
      'Реклама': ['amount'],
      'Кредит': ['amount'],
      'Топливо': ['amount', 'contractorId', 'contractorType'],
      'ГлавПрофи': ['amount']
    }

    // Проверка обязательных полей
    const missingFields = requiredFields[typedExpenseType].filter((field: keyof typeof body) => !body[field])
    if (missingFields.length > 0) {
      throw createError({ 
        statusCode: 400,
        message: `Отсутствуют обязательные поля: ${missingFields.join(', ')}` 
      })
    }

    // Проверка объекта (только для типов "Работа", "Топливо")
    const requiresObject = ['Работа', 'Топливо'].includes(typedExpenseType)
    if (objectId && requiresObject) {
      const [foundObject] = await db.select().from(objects).where(eq(objects.id, parseInt(objectId)))
      if (!foundObject) {
        throw createError({ statusCode: 404, message: 'Объект не найден' })
      }
    }

    // Проверка контрагента (только для типов "Работа", "Зарплата", "Топливо")
    let ContractorModel = null
    if (['Работа', 'Зарплата', 'Топливо'].includes(typedExpenseType)) {
      switch (contractorType) {
        case 'worker': ContractorModel = workers; break
        case 'master': ContractorModel = masters; break
        case 'foreman': ContractorModel = foremans; break
        case 'office': ContractorModel = offices; break
        default:
          throw createError({ statusCode: 400, message: 'Неверный тип контрагента' })
      }

      const [contractor] = await db.select().from(ContractorModel).where(eq(ContractorModel.id, parseInt(contractorId)))
      if (!contractor) {
        throw createError({ statusCode: 404, message: 'Контрагент не найден' })
      }

      // Обновление баланса контрагента (только для "Работа", "Зарплата")
      if (['Работа', 'Зарплата'].includes(typedExpenseType)) {
        const updatedBalance = Number(contractor.balance) + Number(amount)
        await db.update(ContractorModel)
          .set({ balance: updatedBalance.toFixed(2) })
          .where(eq(ContractorModel.id, parseInt(contractorId)))
      }
    }

    // Добавление расхода
    const [newExpense] = await db.insert(expenses).values({
      amount: amount.toString(),
      comment,
      contractorId: contractorId ? parseInt(contractorId) : null,
      contractorType,
      objectId: objectId ? parseInt(objectId) : null,
      expenseType: typedExpenseType,
      paymentDate: new Date(), // Текущая дата оплаты
      operationDate: parsedDate // Используем переданную дату
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

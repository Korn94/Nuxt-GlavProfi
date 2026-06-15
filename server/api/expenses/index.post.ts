// server/api/expenses/index.post.ts
/**
 * Назначение: Создание новой записи расхода с валидацией по типу
 * ⚠️ Требует право `canEditFinance` (проверяется в мидлваре)
 * 
 * @body { amount: number, expenseType: 'Работа'|'Налог'|'Зарплата'|'Реклама'|'Кредит'|'Топливо'|'ГлавПрофи', comment?, contractorId?, contractorType?, objectId?, operationDate? }
 * @returns { Expense } — созданная запись расхода
 */

import { defineEventHandler, readBody, createError } from 'h3'
import { db } from '../../db'
import { expenses, masters, workers, foremans, offices, objects } from '../../db/schema'
import { eq, sql } from 'drizzle-orm'

type ExpenseType = 'Работа' | 'Налог' | 'Зарплата' | 'Реклама' | 'Кредит' | 'Топливо' | 'ГлавПрофи'

const VALID_EXPENSE_TYPES = ['Работа', 'Налог', 'Зарплата', 'Реклама', 'Кредит', 'Топливо', 'ГлавПрофи'] as const
const CONTRACTOR_MODELS = { worker: workers, master: masters, foreman: foremans, office: offices } as const

const REQUIRED_FIELDS: Record<ExpenseType, (keyof any)[]> = {
  'Работа': ['amount', 'contractorId', 'contractorType'],
  'Налог': ['amount'],
  'Зарплата': ['amount', 'contractorId', 'contractorType'],
  'Реклама': ['amount'],
  'Кредит': ['amount'],
  'Топливо': ['amount', 'contractorId', 'contractorType'],
  'ГлавПрофи': ['amount']
}

const REQUIRES_OBJECT = ['Работа', 'Топливо'] as const
const REQUIRES_CONTRACTOR = ['Работа', 'Зарплата', 'Топливо'] as const
const UPDATES_BALANCE = ['Работа'] as const

export default defineEventHandler(async (event) => {
  // ✅ Авторизация и права уже проверены мидлваром
  const body = await readBody(event)
  const { amount, comment, contractorId, contractorType, objectId, expenseType, operationDate } = body

  if (!VALID_EXPENSE_TYPES.includes(expenseType as ExpenseType)) {
    throw createError({ statusCode: 400, message: `Неверный тип расхода: ${expenseType}` })
  }
  const typedExpenseType = expenseType as ExpenseType

  // Проверка обязательных полей
  const missing = REQUIRED_FIELDS[typedExpenseType].filter((f: keyof typeof body) => !body[f])
  if (missing.length > 0) throw createError({ statusCode: 400, message: `Отсутствуют поля: ${missing.join(', ')}` })

  // Проверка даты
  const parsedDate = operationDate ? new Date(operationDate) : new Date()
  if (isNaN(parsedDate.getTime())) throw createError({ statusCode: 400, message: 'Некорректная дата' })

  // Проверка контрагента
  if (contractorId && contractorType && REQUIRES_CONTRACTOR.includes(typedExpenseType as any)) {
    const ContractorModel = CONTRACTOR_MODELS[contractorType as keyof typeof CONTRACTOR_MODELS]
    if (!ContractorModel) throw createError({ statusCode: 400, message: 'Неверный тип контрагента' })

    const [contractor] = await db.select().from(ContractorModel).where(eq(ContractorModel.id, parseInt(contractorId)))
    if (!contractor) throw createError({ statusCode: 404, message: 'Контрагент не найден' })
  }

  // ✅ Обёрнуто в транзакцию
  return await db.transaction(async (tx) => {
    // 1. Создаём расход
    const [newExpense] = await tx.insert(expenses).values({
      amount: amount.toString(),
      comment,
      contractorId: contractorId ? parseInt(contractorId) : null,
      contractorType,
      objectId: objectId ? parseInt(objectId) : null,
      expenseType: typedExpenseType,
      paymentDate: new Date(),
      operationDate: parsedDate
    }).$returningId()

    // 2. Обновляем баланс ТОЛЬКО для типа "Работа" (атомарно!)
    if (
      contractorId &&
      contractorType &&
      UPDATES_BALANCE.includes(typedExpenseType as any)
    ) {
      const ContractorModel = CONTRACTOR_MODELS[contractorType as keyof typeof CONTRACTOR_MODELS]
      if (ContractorModel) {
        // ✅ Атомарное обновление: SQL сам прибавит к текущему балансу
        await tx.update(ContractorModel)
          .set({ balance: sql`balance + ${amount}` })
          .where(eq(ContractorModel.id, parseInt(contractorId)))
      }
    }

    return newExpense
  })
})

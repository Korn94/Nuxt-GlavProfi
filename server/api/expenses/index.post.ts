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
import { eq } from 'drizzle-orm'

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

  // Проверка объекта (если требуется)
  if (objectId && REQUIRES_OBJECT.includes(typedExpenseType as any)) {
    const [obj] = await db.select().from(objects).where(eq(objects.id, parseInt(objectId)))
    if (!obj) throw createError({ statusCode: 404, message: 'Объект не найден' })
  }

  // Проверка контрагента + обновление баланса (если требуется)
  if (contractorId && contractorType && REQUIRES_CONTRACTOR.includes(typedExpenseType as any)) {
    const ContractorModel = CONTRACTOR_MODELS[contractorType as keyof typeof CONTRACTOR_MODELS]
    if (!ContractorModel) throw createError({ statusCode: 400, message: 'Неверный тип контрагента' })

    const [contractor] = await db.select().from(ContractorModel).where(eq(ContractorModel.id, parseInt(contractorId)))
    if (!contractor) throw createError({ statusCode: 404, message: 'Контрагент не найден' })

    // Обновляем баланс ТОЛЬКО для типа "Работа"
    if (UPDATES_BALANCE.includes(typedExpenseType as any)) {
      const newBalance = Number(contractor.balance) + Number(amount)
      await db.update(ContractorModel).set({ balance: newBalance.toFixed(2) }).where(eq(ContractorModel.id, parseInt(contractorId)))
    }
  }

  const [newExpense] = await db.insert(expenses).values({
    amount: amount.toString(),
    comment,
    contractorId: contractorId ? parseInt(contractorId) : null,
    contractorType,
    objectId: objectId ? parseInt(objectId) : null,
    expenseType: typedExpenseType,
    paymentDate: new Date(),
    operationDate: parsedDate
  }).$returningId()

  return newExpense
})

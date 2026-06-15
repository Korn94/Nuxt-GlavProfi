// server/api/contractors/[type]/[id]/recalculate-balance.post.ts
/**
 * 📍 Эндпоинт: `POST /api/contractors/[type]/[id]/recalculate-balance`
 *
 * Назначение: Пересчёт баланса контрагента на основе всех операций
 * ⚠️ Требует право `canEditContractors` (проверяется в мидлваре)
 *
 * Логика:
 * - Блокируем строку контрагента через SELECT ... FOR UPDATE
 * - Считаем сумму оплаченных работ (только для master/worker)
 * - Считаем сумму выплат (расходы типа "Работа")
 * - Баланс = Выплаты - Оплаченные работы
 * - Всё в одной транзакции с защитой от race condition
 *
 * @param {string} type — тип контрагента: 'master'|'worker'|'foreman'|'office'
 * @param {string} id — ID контрагента
 * @returns { success: boolean, oldBalance: number, newBalance: number, diff: number, breakdown: {...} }
 */

import { defineEventHandler, getRouterParam, createError } from 'h3'
import { db } from '../../../../db'
import { works, expenses, masters, workers, foremans, offices } from '../../../../db/schema'
import { eq, and, sql } from 'drizzle-orm'
import { CONTRACTOR_TYPES } from '~/types/contractors'
import type { ContractorType } from '~/types/contractors'

const CONTRACTOR_MODELS = {
  master: masters,
  worker: workers,
  foreman: foremans,
  office: offices
} as const

export default defineEventHandler(async (event) => {
  // ✅ Авторизация и права уже проверены мидлваром
  const type = getRouterParam(event, 'type') as ContractorType
  const id = parseInt(getRouterParam(event, 'id') || '0')

  if (!CONTRACTOR_TYPES.includes(type)) {
    throw createError({ statusCode: 400, message: 'Неверный тип контрагента' })
  }

  if (!id || id <= 0) {
    throw createError({ statusCode: 400, message: 'Неверный ID' })
  }

  const ContractorModel = CONTRACTOR_MODELS[type]
  if (!ContractorModel) {
    throw createError({ statusCode: 400, message: `Неизвестный тип: ${type}` })
  }

  // ✅ Всё в одной транзакции с блокировкой строки
  return await db.transaction(async (tx) => {
    // 🔒 1. Блокируем строку контрагента на время пересчёта
    //    SELECT ... FOR UPDATE предотвращает параллельные изменения
    const [contractor] = await tx
      .select()
      .from(ContractorModel)
      .where(eq(ContractorModel.id, id))
      .for('update')  // Блокировка строки

    if (!contractor) {
      throw createError({ statusCode: 404, message: 'Контрагент не найден' })
    }

    const oldBalance = Number(contractor.balance)

    // 2. Считаем сумму оплаченных работ (только для master/worker)
    let totalPaidWorks = 0
    if (type === 'master' || type === 'worker') {
      const [paidWorksResult] = await tx
        .select({ total: sql<number>`COALESCE(SUM(worker_amount), 0)` })
        .from(works)
        .where(and(
          eq(works.contractorType, type),
          eq(works.contractorId, id),
          eq(works.paid, true)
        ))
      
      totalPaidWorks = Number(paidWorksResult?.total || 0)
    }

    // 3. Считаем сумму выплат (расходы типа "Работа")
    const [expensesResult] = await tx
      .select({ total: sql<number>`COALESCE(SUM(amount), 0)` })
      .from(expenses)
      .where(and(
        eq(expenses.contractorType, type),
        eq(expenses.contractorId, id),
        eq(expenses.expenseType, 'Работа')
      ))
    
    const totalExpenses = Number(expensesResult?.total || 0)

    // 4. Баланс = Выплаты - Оплаченные работы
    const newBalance = totalExpenses - totalPaidWorks

    // 5. Обновляем баланс
    await tx.update(ContractorModel)
      .set({ balance: newBalance.toFixed(2), updatedAt: new Date() })
      .where(eq(ContractorModel.id, id))

    console.log(`[Contractors/Recalculate] 🔄 ${type} ID ${id}: ${oldBalance} → ${newBalance} (diff: ${newBalance - oldBalance})`)

    return {
      success: true,
      oldBalance,
      newBalance,
      diff: newBalance - oldBalance,
      breakdown: {
        totalPaidWorks,
        totalExpenses
      }
    }
  })
})

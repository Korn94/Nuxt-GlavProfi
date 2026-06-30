// server/api/contractors/[type]/[id]/daily-stats.get.ts
/**
 * Назначение: Получение статистики подневки за последние 3 месяца
 * 
 * Логика подсчёта:
 * - Для каждого дня считаем totalAmount (сумма всех amount)
 * - ratio = totalAmount / dailyRate (это количество "человеко-дней")
 *   Пример: 1 человек = 1, 2 человека = 2, 1.5 человека = 1.5
 * - Итог за месяц = сумма всех ratio за дни месяца
 * 
 * @returns { Array<{ month, monthName, year, days: number, uniqueDays: number }> }
 */

import { defineEventHandler, getRouterParam, createError } from 'h3'
import { db } from '../../../../db'
import { works, masters, workers } from '../../../../db/schema'
import { and, eq, gte, isNotNull } from 'drizzle-orm'
import { CONTRACTOR_TYPES } from '~/types/contractors'
import type { ContractorType } from '~/types/contractors'

export default defineEventHandler(async (event) => {
  const type = getRouterParam(event, 'type') as ContractorType
  const id = parseInt(getRouterParam(event, 'id') || '0')

  if (!CONTRACTOR_TYPES.includes(type)) {
    throw createError({ statusCode: 400, message: 'Неверный тип контрагента' })
  }
  if (!id || id <= 0) {
    throw createError({ statusCode: 400, message: 'Неверный ID' })
  }

  if (!['master', 'worker'].includes(type)) {
    return []
  }

  const contractorType = type as 'master' | 'worker'

  // ── 1. Получаем дневную ставку контрагента ─────────────────────────
  let dailyRate = 0
  if (contractorType === 'master') {
    const [master] = await db
      .select({ dailyRate: masters.dailyRate })
      .from(masters)
      .where(eq(masters.id, id))
    dailyRate = Number(master?.dailyRate ?? 0)
  } else {
    const [worker] = await db
      .select({ dailyRate: workers.dailyRate })
      .from(workers)
      .where(eq(workers.id, id))
    dailyRate = Number(worker?.dailyRate ?? 0)
  }

  if (dailyRate === 0) {
    // Контрагент не на подневке — возвращаем нули за 3 месяца
    const now = new Date()
    return [2, 1, 0].map(offset => {
      const d = new Date(now.getFullYear(), now.getMonth() - offset, 1)
      return {
        month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        monthName: getMonthName(d),
        year: d.getFullYear(),
        days: 0,
        uniqueDays: 0
      }
    })
  }

  // ── 2. Вычисляем диапазон (последние 3 месяца) ─────────────────────
  const now = new Date()
  const twoMonthsAgoStart = new Date(now.getFullYear(), now.getMonth() - 2, 1)

  // ── 3. Получаем все подневные работы ───────────────────────────────
  const dailyWorks = await db
    .select({
      operationDate: works.operationDate,
      amount: works.workerAmount
    })
    .from(works)
    .where(
      and(
        eq(works.contractorType, contractorType),
        eq(works.contractorId, id),
        eq(works.workTypes, 'Подневка'),
        isNotNull(works.operationDate),
        gte(works.operationDate, twoMonthsAgoStart)
      )
    )

  // ── 4. Группируем по дате и считаем totalAmount за каждый день ─────
  const dateMap = new Map<string, number>() // dateKey -> totalAmount
  
  for (const work of dailyWorks) {
    if (!work.operationDate) continue
    const date = new Date(work.operationDate)
    const dateKey = date.toISOString().split('T')[0]
    if (!dateKey) continue
    
    const amount = parseFloat(String(work.amount ?? 0))
    dateMap.set(dateKey, (dateMap.get(dateKey) ?? 0) + amount)
  }

  // ── 5. Группируем по месяцам и считаем сумму ratio ─────────────────
  // ratio = totalAmount / dailyRate (количество "человеко-дней")
  const monthStats = new Map<string, { sumRatio: number; uniqueDays: number }>()

  for (const [dateKey, totalAmount] of dateMap.entries()) {
    const date = new Date(dateKey)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    
    const ratio = totalAmount / dailyRate
    
    if (!monthStats.has(monthKey)) {
      monthStats.set(monthKey, { sumRatio: 0, uniqueDays: 0 })
    }
    const stat = monthStats.get(monthKey)
    if (stat) {
      stat.sumRatio += ratio
      stat.uniqueDays += 1
    }
  }

  // ── 6. Формируем результат для 3 месяцев ───────────────────────────
  const result = [2, 1, 0].map(offset => {
    const d = new Date(now.getFullYear(), now.getMonth() - offset, 1)
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const stat = monthStats.get(monthKey)

    return {
      month: monthKey,
      monthName: getMonthName(d),
      year: d.getFullYear(),
      days: stat ? Math.round(stat.sumRatio * 10) / 10 : 0,  // округляем до 0.1
      uniqueDays: stat?.uniqueDays ?? 0
    }
  })

  return result
})

function getMonthName(date: Date): string {
  const months = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ]
  return months[date.getMonth()] ?? 'Неизвестный месяц'
}

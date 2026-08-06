// server/api/contractors/[type]/[id]/daily-stats.get.ts
/**
 * Назначение: Получение статистики подневки за выбранный период
 * 
 * Логика подсчёта:
 * - Для каждого дня считаем totalAmount (сумма всех amount)
 * - ratio = totalAmount / dailyRate (это количество "человеко-дней")
 *   Пример: 1 человек = 1, 2 человека = 2, 1.5 человека = 1.5
 * - Итог за месяц = сумма всех ratio за дни месяца
 * 
 * Query-параметры:
 * - preset: week | month | quarter | year (пресеты)
 * - from / to: произвольный диапазон дат (YYYY-MM-DD)
 * Если параметры не переданы — по умолчанию последние 3 месяца
 * 
 * @returns { Array<{ month, monthName, year, days: number, uniqueDays: number }> }
 */

import { defineEventHandler, getRouterParam, getQuery, createError } from 'h3'
import { db } from '../../../../db'
import { works, masters, workers } from '../../../../db/schema'
import { and, eq, gte, lte, isNotNull } from 'drizzle-orm'
import { CONTRACTOR_TYPES } from '~/types/contractors'
import type { ContractorType } from '~/types/contractors'

type Preset = 'week' | 'month' | 'quarter' | 'year'

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

  // ── 0. Определяем диапазон дат ─────────────────────────────────────
  const query = getQuery(event)
  const preset = query.preset as Preset | undefined
  const fromParam = query.from as string | undefined
  const toParam = query.to as string | undefined

  const now = new Date()
  let startDate: Date | null = null
  let endDate: Date | null = null

  // Произвольный диапазон
  if (fromParam || toParam) {
    if (fromParam) {
      const d = new Date(fromParam)
      if (isNaN(d.getTime())) {
        throw createError({ statusCode: 400, message: 'Неверный формат даты from' })
      }
      startDate = d
    }
    if (toParam) {
      const d = new Date(toParam)
      if (isNaN(d.getTime())) {
        throw createError({ statusCode: 400, message: 'Неверный формат даты to' })
      }
      d.setHours(23, 59, 59, 999)
      endDate = d
    }
  } else if (preset) {
    // Пресеты
    switch (preset) {
      case 'week':
        startDate = new Date(now)
        startDate.setDate(now.getDate() - 7)
        break
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        break
      case 'quarter':
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1)
        break
      case 'year':
        startDate = new Date(now.getFullYear(), now.getMonth() - 12, 1)
        break
      default:
        throw createError({ statusCode: 400, message: 'Неверный пресет периода' })
    }
  } else {
    // По умолчанию — последние 3 месяца
    startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1)
  }

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
    // Контрагент не на подневке — возвращаем нули за период
    return buildEmptyResult(startDate, endDate, now, preset)
  }

  // ── 2. Получаем все подневные работы за период ─────────────────────
  const conditions = [
    eq(works.contractorType, contractorType),
    eq(works.contractorId, id),
    eq(works.workTypes, 'Подневка'),
    isNotNull(works.operationDate)
  ]

  if (startDate) conditions.push(gte(works.operationDate, startDate))
  if (endDate) conditions.push(lte(works.operationDate, endDate))

  const dailyWorks = await db
    .select({
      operationDate: works.operationDate,
      amount: works.workerAmount
    })
    .from(works)
    .where(and(...conditions))

  // ── 3. Группируем по дате и считаем totalAmount за каждый день ─────
  const dateMap = new Map<string, number>() // dateKey -> totalAmount
  
  for (const work of dailyWorks) {
    if (!work.operationDate) continue
    const date = new Date(work.operationDate)
    const dateKey = date.toISOString().split('T')[0]
    if (!dateKey) continue
    
    const amount = parseFloat(String(work.amount ?? 0))
    dateMap.set(dateKey, (dateMap.get(dateKey) ?? 0) + amount)
  }

  // ── 4. Группируем по месяцам и считаем сумму ratio ─────────────────
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

  // ── 5. Формируем результат ─────────────────────────────────────────
  // Для недели — группируем по дням, для остальных — по месяцам
  if (preset === 'week' && !fromParam && !toParam) {
    return buildWeekResult(dateMap, dailyRate, startDate, endDate, now)
  }

  return buildMonthResult(monthStats, startDate, endDate, now, preset)
})

/**
 * Формирует результат по месяцам
 */
function buildMonthResult(
  monthStats: Map<string, { sumRatio: number; uniqueDays: number }>,
  startDate: Date | null,
  endDate: Date | null,
  now: Date,
  preset?: Preset
) {
  // Определяем список месяцев для отображения
  const months: Date[] = []

  if (startDate && endDate) {
    // Произвольный диапазон — все месяцы между from и to
    const cursor = new Date(startDate.getFullYear(), startDate.getMonth(), 1)
    const end = new Date(endDate.getFullYear(), endDate.getMonth(), 1)
    while (cursor <= end) {
      months.push(new Date(cursor))
      cursor.setMonth(cursor.getMonth() + 1)
    }
  } else if (startDate) {
    // Пресет или дефолт — от startDate до текущего месяца
    const cursor = new Date(startDate.getFullYear(), startDate.getMonth(), 1)
    const end = new Date(now.getFullYear(), now.getMonth(), 1)
    while (cursor <= end) {
      months.push(new Date(cursor))
      cursor.setMonth(cursor.getMonth() + 1)
    }
  } else {
    // Только endDate — один месяц
    months.push(new Date(now.getFullYear(), now.getMonth(), 1))
  }

  return months.map(d => {
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
}

/**
 * Формирует результат по дням (для пресета "неделя")
 */
function buildWeekResult(
  dateMap: Map<string, number>,
  dailyRate: number,
  startDate: Date | null,
  endDate: Date | null,
  now: Date
) {
  const result: Array<{ month: string; monthName: string; year: number; days: number; uniqueDays: number }> = []

  // Определяем диапазон дней
  const from = startDate || new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7)
  const to = endDate || now

  const cursor = new Date(from)
  cursor.setHours(0, 0, 0, 0)
  const end = new Date(to)
  end.setHours(23, 59, 59, 999)

  while (cursor <= end) {
    const dateKey = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`
    const totalAmount = dateMap.get(dateKey) ?? 0
    const ratio = totalAmount / dailyRate

    result.push({
      month: dateKey,
      monthName: getDayName(cursor),
      year: cursor.getFullYear(),
      days: Math.round(ratio * 10) / 10,
      uniqueDays: totalAmount > 0 ? 1 : 0
    })

    cursor.setDate(cursor.getDate() + 1)
  }

  return result
}

/**
 * Формирует пустой результат (когда dailyRate = 0)
 */
function buildEmptyResult(
  startDate: Date | null,
  endDate: Date | null,
  now: Date,
  preset?: Preset
) {
  if (preset === 'week' && !startDate && !endDate) {
    return buildWeekResult(new Map(), 1, null, null, now)
  }
  return buildMonthResult(new Map(), startDate, endDate, now, preset)
}

function getMonthName(date: Date): string {
  const months = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ]
  return months[date.getMonth()] ?? 'Неизвестный месяц'
}

function getDayName(date: Date): string {
  const days = [
    'Воскресенье', 'Понедельник', 'Вторник', 'Среда',
    'Четверг', 'Пятница', 'Суббота'
  ]
  const day = days[date.getDay()] ?? ''
  return `${day}, ${date.getDate()}`
}
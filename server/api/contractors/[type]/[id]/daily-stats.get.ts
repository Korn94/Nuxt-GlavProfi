// server/api/contractors/[type]/[id]/daily-stats.get.ts
import { defineEventHandler, getRouterParam, createError } from 'h3'
import { db } from '../../../../db'
import { works } from '../../../../db/schema'
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

  // Поддерживаем только master/worker для таблицы works
  if (!['master', 'worker'].includes(type)) {
    return []
  }

  const contractorType = type as 'master' | 'worker'

  // Вычисляем даты для последних 3 месяцев
  const now = new Date()
  
  // Текущий месяц
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  
  // Прошлый месяц
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  
  // Два месяца назад
  const twoMonthsAgoStart = new Date(now.getFullYear(), now.getMonth() - 2, 1)

  // Получаем все подневные работы за период
  const dailyWorks = await db
    .select({
      operationDate: works.operationDate
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
    .orderBy(works.operationDate)

  // Функция для получения ключа месяца (YYYY-MM)
  function getMonthKey(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
  }

  // Функция для получения названия месяца на русском
  function getMonthName(date: Date): string {
    const months = [
      'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
      'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
    ]
    // ✅ Добавляем fallback на случай невалидного индекса
    return months[date.getMonth()] ?? 'Неизвестный месяц'
  }

  // Группируем работы по месяцам и считаем уникальные дни
  const monthStats = new Map<string, Set<string>>()

  for (const work of dailyWorks) {
    if (!work.operationDate) continue
    
    const date = new Date(work.operationDate)
    const monthKey = getMonthKey(date)
    const dateKey = date.toISOString().split('T')[0]
    
    // ✅ Проверяем что dateKey существует
    if (!dateKey) continue

    if (!monthStats.has(monthKey)) {
      monthStats.set(monthKey, new Set())
    }
    // ✅ Теперь TypeScript знает, что Set существует
    const monthSet = monthStats.get(monthKey)
    if (monthSet) {
      monthSet.add(dateKey)
    }
  }

  // Формируем результат для 3 месяцев
  const result = [
    {
      month: getMonthKey(twoMonthsAgoStart),
      monthName: getMonthName(twoMonthsAgoStart),
      year: twoMonthsAgoStart.getFullYear(),
      days: monthStats.get(getMonthKey(twoMonthsAgoStart))?.size || 0
    },
    {
      month: getMonthKey(prevMonthStart),
      monthName: getMonthName(prevMonthStart),
      year: prevMonthStart.getFullYear(),
      days: monthStats.get(getMonthKey(prevMonthStart))?.size || 0
    },
    {
      month: getMonthKey(currentMonthStart),
      monthName: getMonthName(currentMonthStart),
      year: currentMonthStart.getFullYear(),
      days: monthStats.get(getMonthKey(currentMonthStart))?.size || 0
    }
  ]

  return result
})

// server/api/contractors/me/daily-recent.get.ts
/**
 * Назначение: Получение данных подневки текущего мастера за последние 14 дней
 * 
 * @returns { hasData: boolean, contractor: {...}, assignments: DailyAssignment[] }
 */

import { defineEventHandler, createError } from 'h3'
import { db } from '../../../db'
import { masters, workers, works, objects } from '../../../db/schema'
import { eq, and, gte, isNotNull } from 'drizzle-orm'
import { sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  
  if (!user || !user.id) {
    throw createError({ statusCode: 401, message: 'Пользователь не авторизован' })
  }

  // Ищем мастера по userId
  const [masterRecord] = await db
    .select()
    .from(masters)
    .where(eq(masters.userId, user.id))
    .limit(1)

  // Если не мастер - ищем рабочего
  let contractorRecord: any = null
  let contractorType: 'master' | 'worker' = 'master'
  let dailyRate = 0

  if (masterRecord) {
    contractorRecord = masterRecord
    contractorType = 'master'
    dailyRate = parseFloat(String(masterRecord.dailyRate || 0))
  } else {
    const [workerRecord] = await db
      .select()
      .from(workers)
      .where(eq(workers.userId, user.id))
      .limit(1)

    if (!workerRecord) {
      throw createError({ statusCode: 404, message: 'Контрагент не найден' })
    }

    contractorRecord = workerRecord
    contractorType = 'worker'
    dailyRate = parseFloat(String(workerRecord.dailyRate || 0))
  }

  // Вычисляем дату 14 дней назад
  const twoWeeksAgo = new Date()
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)
  twoWeeksAgo.setHours(0, 0, 0, 0)

  // Получаем подневные работы за последние 14 дней
  const rawAssignments = await db
    .select({
      id: works.id,
      date: works.operationDate,
      objectId: works.objectId,
      objectName: objects.name,
      amount: works.workerAmount
    })
    .from(works)
    .leftJoin(objects, eq(works.objectId, objects.id))
    .where(
      and(
        eq(works.contractorType, contractorType),
        eq(works.contractorId, contractorRecord.id),
        eq(works.workTypes, 'Подневка'),
        eq(works.workSource, 'daily'),
        isNotNull(works.operationDate),
        gte(works.operationDate, twoWeeksAgo)
      )
    )
    .orderBy(works.operationDate)

  // Если нет данных за 14 дней - возвращаем пустой ответ
  if (rawAssignments.length === 0) {
    return { hasData: false, contractor: null, assignments: [] }
  }

  // Группируем по дате для расчета percentage
  const groupedByDate = new Map<string, typeof rawAssignments>()
  
  function getDateKey(date: Date | null): string {
    if (!date) return ''
    return date.toISOString().split('T')[0] ?? ''
  }

  for (const r of rawAssignments) {
    const dateKey = getDateKey(r.date)
    if (!dateKey) continue
    
    if (!groupedByDate.has(dateKey)) {
      groupedByDate.set(dateKey, [])
    }
    const group = groupedByDate.get(dateKey)
    if (group) {
      group.push(r)
    }
  }

  // Рассчитываем percentage для каждой записи
  const formattedAssignments = rawAssignments.map(r => {
    const dateKey = getDateKey(r.date)
    const recordsOnDate = groupedByDate.get(dateKey) ?? []
    const amount = parseFloat(String(r.amount ?? 0))
    
    // Суммарная сумма за день
    const totalAmount = recordsOnDate.reduce((sum, rec) => sum + parseFloat(String(rec.amount ?? 0)), 0)
    
    let percentage: number
    
    if (totalAmount > dailyRate) {
      // МУЛЬТИ-КОНТРАГЕНТ: считаем процент от totalAmount
      percentage = Math.round((amount / totalAmount) * 100)
    } else {
      // ОБЫЧНЫЙ КОНТРАГЕНТ: считаем процент от dailyRate
      percentage = Math.round((amount / dailyRate) * 100)
    }

    return {
      id: r.id,
      date: dateKey,
      objectId: r.objectId,
      objectName: r.objectName || 'Неизвестный объект',
      amount,
      percentage
    }
  })

  return {
    hasData: true,
    contractor: {
      id: contractorRecord.id,
      name: contractorRecord.name,
      contractorType,
      dailyRate,
      balance: parseFloat(String(contractorRecord.balance || 0))
    },
    assignments: formattedAssignments
  }
})

// server/api/works/daily-work/log.get.ts
/**
 * Назначение: Получение журнала изменений подневки (таблица `work_daily_log`).
 * ⚠️ Доступ ТОЛЬКО для администраторов.
 *
 * @query { limit?: number, offset?: number } — пагинация (limit по умолчанию 100, макс. 500)
 * @returns { Array<{
 *   id, workId, action, contractorType, contractorId, objectId, objectName,
 *   workDate, amount, changes, createdAt,
 *   userId, userName, workerName, masterName
 * }> } — записи журнала, отсортированные по времени (новые сверху)
 */

import { defineEventHandler, getQuery, createError } from 'h3'
import { db } from '../../../db'
import { workDailyLog, users, workers, masters, objects } from '../../../db/schema'
import { eq, and, desc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const user = (event.context as { user?: { role?: string } }).user
  if (!user) throw createError({ statusCode: 401, message: 'Пользователь не аутентифицирован' })
  if (user.role !== 'admin') {
    throw createError({ statusCode: 403, message: 'Журнал изменений доступен только администраторам' })
  }

  const query = getQuery<{ limit?: string; offset?: string }>(event)
  const limit = Math.min(Math.max(parseInt(query.limit || '100', 10) || 100, 1), 500)
  const offset = Math.max(parseInt(query.offset || '0', 10) || 0, 0)

  const rows = await db
    .select({
      id: workDailyLog.id,
      workId: workDailyLog.workId,
      action: workDailyLog.action,
      contractorType: workDailyLog.contractorType,
      contractorId: workDailyLog.contractorId,
      objectId: workDailyLog.objectId,
      objectName: objects.name,
      workDate: workDailyLog.workDate,
      amount: workDailyLog.amount,
      changes: workDailyLog.changes,
      createdAt: workDailyLog.createdAt,
      userId: workDailyLog.userId,
      userName: users.name,
      workerName: workers.name,
      masterName: masters.name
    })
    .from(workDailyLog)
    .leftJoin(users, eq(workDailyLog.userId, users.id))
    .leftJoin(objects, eq(workDailyLog.objectId, objects.id))
    .leftJoin(
      workers,
      and(
        eq(workDailyLog.contractorId, workers.id),
        eq(workDailyLog.contractorType, 'worker')
      )
    )
    .leftJoin(
      masters,
      and(
        eq(workDailyLog.contractorId, masters.id),
        eq(workDailyLog.contractorType, 'master')
      )
    )
    .orderBy(desc(workDailyLog.createdAt))
    .limit(limit)
    .offset(offset)

  return rows
})
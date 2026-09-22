// server/utils/workDailyLog.ts
/**
 * Назначение: Запись событий в журнал изменений подневки (таблица `work_daily_log`).
 *
 * Подневка хранится в таблице `works` (workSource='daily').
 * Эта утилита вызывается из эндпоинтов мутаций (создание/обновление/удаление),
 * отфильтровывает только записи подневки и пишет «кто и когда что изменил».
 *
 * @example
 *   await logDailyWork(event, 'created', newWork)
 *   await logDailyWork(event, 'deleted', deletedWork)
 *   await logDailyWork(event, 'updated', updatedWork, diff)
 */

import type { H3Event } from 'h3'
import { db } from '../db'
import { workDailyLog } from '../db/schema'

type DailyWorkLike = {
  id?: number | string | null
  workSource?: string | null
  contractorType?: string | null
  contractorId?: number | string | null
  objectId?: number | string | null
  operationDate?: Date | string | null
  workerAmount?: string | number | null
}

/** Является ли запись подневкой */
function isDailyWork(work: DailyWorkLike): boolean {
  return work.workSource === 'daily'
}

/**
 * Записать событие в журнал подневки.
 * Пропускает запись, если пользователь не аутентифицирован или объект — не подневка.
 */
export async function logDailyWork(
  event: H3Event,
  action: 'created' | 'updated' | 'deleted',
  work: DailyWorkLike | DailyWorkLike[],
  changes?: Record<string, unknown> | null
): Promise<void> {
  const user = (event.context as { user?: { id?: number } }).user
  if (!user?.id) return

  const userId = Number(user.id)
  const list = Array.isArray(work) ? work.filter(isDailyWork) : (isDailyWork(work) ? [work] : [])
  if (list.length === 0) return

  const rows = list.map((w) => ({
    workId: w.id != null ? Number(w.id) : null,
    userId,
    action,
    contractorType: w.contractorType || null,
    contractorId: w.contractorId != null ? Number(w.contractorId) : null,
    objectId: w.objectId != null ? Number(w.objectId) : null,
    workDate: w.operationDate ? new Date(w.operationDate) : null,
    amount: w.workerAmount != null ? String(w.workerAmount) : null,
    changes: changes ? JSON.stringify(changes) : null
  }))

  await db.insert(workDailyLog).values(rows)
}
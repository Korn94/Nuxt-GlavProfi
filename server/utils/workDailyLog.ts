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
 *   await logDailyWork(event, 'updated', updatedWork, diff)
 *   // удаление — внутри транзакции и ДО tx.delete (пока родитель живо):
 *   await logDailyWork(event, 'deleted', work, buildDeletionSnapshot(work), tx)
 */

import type { H3Event } from 'h3'
import { db } from '../db'
import { workDailyLog, works } from '../db/schema'

/**
 * Исполнитель запросов: обычное подключение `db` либо транзакция `tx`.
 * Нужен, чтобы журнал писался ВНУТРИ транзакции мутации
 * (см. server/api/works/[id]/index.delete.ts — там FK work_daily_log.work_id).
 * Тип выровнен по `.insert()`, потому что `typeof db` включает драйверный
 * `$client: Pool`, которого у `MySqlTransaction` нет.
 */
type DbExecutor = { insert: typeof db.insert }

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

/** Локальная дата в dd.MM.yyyy (по компонентам Date, без UTC-сдвига) */
function fmtDate(value: Date | string | null | undefined): string | null {
  const d = value instanceof Date ? value : (value ? new Date(value) : null)
  if (!d || isNaN(d.getTime())) return null
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()}`
}

/**
 * Снапшот удаляемой подневки для колонки `changes` — чтобы в «Деталях» журнала
 * было видно, ЧТО именно удалили (сумма, дата, вид работы, комментарий...).
 * Формат { from, to: null } совпадает с diff из PUT, UI отобразит «пусто ← значение».
 * Ключи соответствуют FIELD_LABELS в DailyWorkLogModal.vue.
 * contractorType/contractorId/objectId сюда не кладём — они уже колонками идут
 * в самом журнале («Сотрудник», «Объект»).
 */
export function buildDeletionSnapshot(
  work: typeof works.$inferSelect
): Record<string, { from: unknown; to: null }> {
  const yesNo = (v: boolean | null) => (v == null ? null : (v ? 'да' : 'нет'))

  const pairs: Array<[string, unknown]> = [
    ['workId', work.id],
    ['workerAmount', work.workerAmount],
    ['operationDate', fmtDate(work.operationDate)],
    ['paymentDate', fmtDate(work.paymentDate)],
    ['workTypes', work.workTypes],
    ['foremanId', work.foremanId],
    ['accepted', yesNo(work.accepted)],
    ['paid', yesNo(work.paid)],
    ['comment', work.comment]
  ]

  const changes: Record<string, { from: unknown; to: null }> = {}
  for (const [key, value] of pairs) {
    if (value === null || value === undefined || value === '') continue
    changes[key] = { from: value, to: null }
  }
  return changes
}

/**
 * Записать событие в журнал подневки.
 * Пропускает запись, если пользователь не аутентифицирован или объект — не подневка.
 * `executor` = `tx` используется при вызове из транзакции, чтобы запись журнала
 * была атомарной с самой мутацией.
 */
export async function logDailyWork(
  event: H3Event,
  action: 'created' | 'updated' | 'deleted',
  work: DailyWorkLike | DailyWorkLike[],
  changes?: Record<string, unknown> | null,
  executor: DbExecutor = db
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
    contractorType: (w.contractorType ?? null) as 'master' | 'worker' | null,
    contractorId: w.contractorId != null ? Number(w.contractorId) : null,
    objectId: w.objectId != null ? Number(w.objectId) : null,
    workDate: w.operationDate ? new Date(w.operationDate) : null,
    amount: w.workerAmount != null ? String(w.workerAmount) : null,
    changes: changes ? JSON.stringify(changes) : null
  }))

  await executor.insert(workDailyLog).values(rows)
}
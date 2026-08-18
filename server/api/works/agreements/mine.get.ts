// server/api/works/agreements/mine.get.ts
/**
 * Назначение: Получение договорённостей, назначенных текущему пользователю-контрагенту
 * (только «свои» — фильтр по contractorType/contractorId текущего пользователя).
 *
 * В отличие от GET /api/works/agreements (объект-ориентированный, право objects.view),
 * этот эндпоинт работает для мастеров/рабочих: возвращает договорённости на ВСЕХ объектах,
 * где текущий пользователь является исполнителем.
 *
 * @returns { agreements: WorkAgreement[] } — массив с полями объекта (objectId, objectName)
 */
import { defineEventHandler, createError } from 'h3'
import { eq, and, inArray, isNull } from 'drizzle-orm'
import { db } from '../../../db'
import { workAgreements, workAgreementAcceptances, works, objects, masters, workers } from '../../../db/schema'
import {
  getAgreementPercent,
  isAgreementFullyAccepted,
  round2,
  round3
} from '../../../utils/workAgreements'

export default defineEventHandler(async (event) => {
  const user = event.context.user as any

  if (!user || !user.id) {
    throw createError({ statusCode: 401, message: 'Пользователь не авторизован' })
  }

  const contractorType = user.contractorType
  const contractorId = Number(user.contractorId || 0)

  // Эндпоинт предназначен только для контрагентов (мастер/рабочий)
  if (!contractorType || !contractorId || !['master', 'worker'].includes(contractorType)) {
    throw createError({ statusCode: 404, message: 'Контрагент не найден' })
  }

  const rows = await db
    .select({
      agreement: workAgreements,
      objectName: objects.name
    })
    .from(workAgreements)
    .leftJoin(objects, eq(workAgreements.objectId, objects.id))
    .where(
      and(
        eq(workAgreements.contractorType, contractorType),
        eq(workAgreements.contractorId, contractorId)
      )
    )
    .orderBy(workAgreements.objectId, workAgreements.createdAt)

  // Собираем ID контрагентов для подгрузки имён (на случай назначения на не себя)
  const masterIds = rows
    .filter(r => r.agreement.contractorType === 'master' && r.agreement.contractorId)
    .map(r => r.agreement.contractorId as number)

  const workerIds = rows
    .filter(r => r.agreement.contractorType === 'worker' && r.agreement.contractorId)
    .map(r => r.agreement.contractorId as number)

  const [mastersList, workersList] = await Promise.all([
    masterIds.length > 0
      ? db
          .select({ id: masters.id, name: masters.name })
          .from(masters)
          .where(inArray(masters.id, masterIds))
      : [],
    workerIds.length > 0
      ? db
          .select({ id: workers.id, name: workers.name })
          .from(workers)
          .where(inArray(workers.id, workerIds))
      : []
  ])

  const masterMap = new Map(mastersList.map(m => [m.id, m.name]))
  const workerMap = new Map(workersList.map(w => [w.id, w.name]))

  // Подсчёт «сданных, но ещё не принятых» сдач (pending) по каждой договорённости.
  // Pending = связанная работа ещё не принята (accepted = false) и не отклонена
  // (rejectedReason IS NULL) — т.е. ожидает утверждения администратором/прорабом.
  const agreementIds = rows.map(r => Number(r.agreement.id))

  const pendingRows = agreementIds.length > 0
    ? await db
        .select({
          agreementId: workAgreementAcceptances.agreementId,
          acceptedVolume: workAgreementAcceptances.acceptedVolume,
          acceptedAmount: workAgreementAcceptances.acceptedAmount
        })
        .from(workAgreementAcceptances)
        .leftJoin(works, eq(workAgreementAcceptances.workId, works.id))
        .where(
          and(
            inArray(workAgreementAcceptances.agreementId, agreementIds),
            eq(works.accepted, false),
            isNull(works.rejectedReason)
          )
        )
    : []

  const pendingMap = new Map<number, { volume: number; amount: number; count: number }>()

  for (const row of pendingRows) {
    const id = Number(row.agreementId)
    const entry = pendingMap.get(id) || { volume: 0, amount: 0, count: 0 }
    entry.volume += Number(row.acceptedVolume || 0)
    entry.amount += Number(row.acceptedAmount || 0)
    entry.count += 1
    pendingMap.set(id, entry)
  }

  const agreements = rows.map(({ agreement, objectName }) => {
    const volume = Number(agreement.volume || 0)
    const acceptedVolume = Number(agreement.acceptedVolume || 0)
    const agreedAmount = Number(agreement.agreedAmount || 0)
    const acceptedAmount = Number(agreement.acceptedAmount || 0)

    let contractorName: string | null = null

    if (agreement.contractorType === 'master' && agreement.contractorId) {
      contractorName = masterMap.get(agreement.contractorId) || null
    } else if (agreement.contractorType === 'worker' && agreement.contractorId) {
      contractorName = workerMap.get(agreement.contractorId) || null
    }

    return {
      ...agreement,

      volume,
      acceptedVolume,
      agreedAmount,
      acceptedAmount,

      remainingVolume: round3(volume - acceptedVolume),
      remainingAmount: round2(agreedAmount - acceptedAmount),

      percent: getAgreementPercent({ volume, acceptedVolume }),

      isFullyAccepted: isAgreementFullyAccepted({ volume, acceptedVolume }),

      // Ожидающие приёмки сдачи (сданные, но ещё не принятые/не отклонённые)
      pendingVolume: round3(pendingMap.get(Number(agreement.id))?.volume || 0),
      pendingAmount: round2(pendingMap.get(Number(agreement.id))?.amount || 0),
      pendingCount: pendingMap.get(Number(agreement.id))?.count || 0,

      contractorName,

      // Добавляем имя объекта для группировки карточек по объектам
      objectId: Number(agreement.objectId),
      objectName: objectName || 'Объект'
    }
  })

  return {
    agreements
  }
})

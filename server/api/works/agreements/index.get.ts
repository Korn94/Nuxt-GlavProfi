// server/api/works/agreements/index.get.ts
import { defineEventHandler, getQuery, createError } from 'h3'
import { eq, inArray } from 'drizzle-orm'
import { db } from '../../../db'
import { workAgreements, masters, workers } from '../../../db/schema'
import {
  canViewWorkAgreements,
  canSeeAdminComment,
  getAgreementPercent,
  isAgreementFullyAccepted,
  round2,
  round3
} from '../../../utils/workAgreements'

export default defineEventHandler(async (event) => {
  if (!await canViewWorkAgreements(event)) {
    throw createError({
      statusCode: 403,
      message: 'Недостаточно прав для просмотра договорённостей'
    })
  }

  const query = getQuery(event)

  const objectId = Number(query.objectId || 0)

  if (!objectId) {
    throw createError({
      statusCode: 400,
      message: 'Не указан объект'
    })
  }

  const agreements = await db
    .select()
    .from(workAgreements)
    .where(eq(workAgreements.objectId, objectId))

  const canSeeAdmin = await canSeeAdminComment(event)

  // Собираем ID контрагентов для подгрузки имён
  const masterIds = agreements
    .filter(a => a.contractorType === 'master' && a.contractorId)
    .map(a => a.contractorId as number)

  const workerIds = agreements
    .filter(a => a.contractorType === 'worker' && a.contractorId)
    .map(a => a.contractorId as number)

  // Подгружаем имена контрагентов
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

  // Создаём мапы для быстрого поиска имён
  const masterMap = new Map(mastersList.map(m => [m.id, m.name]))
  const workerMap = new Map(workersList.map(w => [w.id, w.name]))

  return agreements.map((agreement) => {
    const volume = Number(agreement.volume || 0)
    const acceptedVolume = Number(agreement.acceptedVolume || 0)
    const agreedAmount = Number(agreement.agreedAmount || 0)
    const acceptedAmount = Number(agreement.acceptedAmount || 0)

    // Определяем имя контрагента
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

      percent: getAgreementPercent({
        volume,
        acceptedVolume
      }),

      isFullyAccepted: isAgreementFullyAccepted({
        volume,
        acceptedVolume
      }),

      contractorName,

      adminComment: canSeeAdmin ? agreement.adminComment : null
    }
  })
})

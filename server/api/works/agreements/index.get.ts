// server/api/works/agreements/index.get.ts
import { defineEventHandler, getQuery, createError } from 'h3'
import { eq } from 'drizzle-orm'
import { db } from '../../../db'
import { workAgreements } from '../../../db/schema'
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

  return agreements.map((agreement) => {
    const volume = Number(agreement.volume || 0)
    const acceptedVolume = Number(agreement.acceptedVolume || 0)
    const agreedAmount = Number(agreement.agreedAmount || 0)
    const acceptedAmount = Number(agreement.acceptedAmount || 0)

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

      adminComment: canSeeAdmin ? agreement.adminComment : null
    }
  })
})

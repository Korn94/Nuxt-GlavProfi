// server/api/works/agreements/[id]/accept.post.ts
import { defineEventHandler, readBody, createError, getRouterParam } from 'h3'
import { eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../../../../db'
import {
  workAgreements,
  workAgreementAcceptances,
  works
} from '../../../../db/schema'
import {
  canAcceptWorkAgreements,
  calcAcceptAmount,
  round2,
  round3
} from '../../../../utils/workAgreements'

const acceptWorkAgreementSchema = z.object({
  volume: z.number().positive().optional(),

  amount: z.number().min(0).optional(),

  contractorType: z.enum(['master', 'worker']).optional(),

  contractorId: z.number().int().positive().optional(),

  comment: z.string().max(2000).optional()
})

export default defineEventHandler(async (event) => {
  if (!await canAcceptWorkAgreements(event)) {
    throw createError({
      statusCode: 403,
      message: 'Недостаточно прав для приёмки договорённости'
    })
  }

  const id = Number(getRouterParam(event, 'id'))

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Некорректный ID договорённости'
    })
  }

  const [agreement] = await db
    .select()
    .from(workAgreements)
    .where(eq(workAgreements.id, id))

  if (!agreement) {
    throw createError({
      statusCode: 404,
      message: 'Договорённость не найдена'
    })
  }

  if (agreement.status !== 'active') {
    throw createError({
      statusCode: 400,
      message: 'Договорённость недоступна для приёмки'
    })
  }

  const body = await readBody(event)

  const parsed = acceptWorkAgreementSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: parsed.error.issues[0]?.message || 'Некорректные данные приёмки'
    })
  }

  const payload = parsed.data

  const totalVolume = Number(agreement.volume || 0)
  const acceptedVolumeBefore = Number(agreement.acceptedVolume || 0)
  const acceptedAmountBefore = Number(agreement.acceptedAmount || 0)
  const agreedAmount = Number(agreement.agreedAmount || 0)

  const remainingVolume = round3(totalVolume - acceptedVolumeBefore)
  const remainingAmount = round2(agreedAmount - acceptedAmountBefore)

  const acceptedVolume = payload.volume ?? remainingVolume

  if (acceptedVolume <= 0) {
    throw createError({
      statusCode: 400,
      message: 'Некорректный объём приёмки'
    })
  }

  if (acceptedVolume > remainingVolume + 0.0001) {
    throw createError({
      statusCode: 400,
      message: 'Нельзя принять больше оставшегося объёма'
    })
  }

  const contractorType = payload.contractorType || agreement.contractorType
  const contractorId = payload.contractorId || agreement.contractorId

  if (!contractorType || !contractorId) {
    throw createError({
      statusCode: 400,
      message: 'Для приёмки необходимо указать исполнителя'
    })
  }

  let acceptedAmount = payload.amount

  if (acceptedAmount == null) {
    acceptedAmount = calcAcceptAmount({
      priceMode: agreement.priceMode as 'unit' | 'fixed',
      totalVolume,
      acceptedVolume,
      unitPrice: agreement.unitPrice ? Number(agreement.unitPrice) : null,
      fixedTotal: agreement.fixedTotal ? Number(agreement.fixedTotal) : null,
      agreedAmount
    })
  } else {
    acceptedAmount = round2(acceptedAmount)
  }

  if (acceptedAmount > remainingAmount + 0.01) {
    throw createError({
      statusCode: 400,
      message: 'Сумма приёмки превышает оставшуюся сумму договорённости'
    })
  }

  const user = event.context.user as any
  const now = new Date()

  await db.transaction(async (tx) => {
    const [newWork] = await tx
      .insert(works)
      .values({
        workerAmount: String(acceptedAmount),
        comment: `Принято по договорённости «${agreement.title}»`,
        contractorId,
        contractorType,
        workTypes: agreement.workType,
        workSource: 'volume',
        foremanId: agreement.foremanId,
        accepted: true,
        acceptedDate: now,
        rejectedReason: null,
        paid: false,
        paymentDate: null,
        operationDate: now,
        objectId: Number(agreement.objectId),
        createdAt: now,
        updatedAt: now
      })
      .$returningId()

    if (!newWork) {
      throw new Error('Не удалось создать запись работы')
    }

    await tx.insert(workAgreementAcceptances).values({
      agreementId: agreement.id,
      workId: newWork.id,
      acceptedVolume: String(round3(acceptedVolume)),
      acceptedAmount: String(acceptedAmount),
      contractorType,
      contractorId,
      comment: payload.comment || null,
      createdBy: user?.id || null,
      createdAt: now
    })

    await tx
      .update(workAgreements)
      .set({
        acceptedVolume: sql`${workAgreements.acceptedVolume} + ${acceptedVolume}`,
        acceptedAmount: sql`${workAgreements.acceptedAmount} + ${acceptedAmount}`,
        updatedAt: now,
        updatedBy: user?.id || null
      })
      .where(eq(workAgreements.id, agreement.id))
  })

  return {
    success: true
  }
})

// server/api/works/agreements/[id]/accept.post.ts
import { defineEventHandler, readBody, createError, getRouterParam } from 'h3'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../../../../db'
import { workAgreements } from '../../../../db/schema'
import {
  canAcceptWorkAgreements,
  createWorkAgreementAcceptance,
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
  const remainingVolume = round3(totalVolume - acceptedVolumeBefore)

  const acceptedVolume = payload.volume ?? remainingVolume

  const contractorType = payload.contractorType || agreement.contractorType
  const contractorId = payload.contractorId || agreement.contractorId

  if (!contractorType || !contractorId) {
    throw createError({
      statusCode: 400,
      message: 'Для приёмки необходимо указать исполнителя'
    })
  }

  const user = event.context.user as any

  await createWorkAgreementAcceptance({
    agreement,
    volume: acceptedVolume,
    amount: payload.amount,
    contractorType: contractorType as 'master' | 'worker',
    contractorId,
    comment: payload.comment,
    accepted: true,
    user
  })

  return {
    success: true
  }
})

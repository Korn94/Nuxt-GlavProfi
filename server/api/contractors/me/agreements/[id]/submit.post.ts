// server/api/contractors/me/agreements/[id]/submit.post.ts
/**
 * Назначение: «Сдача объёма» по договорённости ТЕКУЩИМ пользователем-контрагентом
 * (мастером/рабочим). В отличие от приёмки администратором (objects.special),
 * здесь право проверяется по принадлежности договорённости самому пользователю.
 *
 * Содаваемая работа создаётся с accepted: false — она уходит на утверждение
 * администратору/прорабу (works/accept → accepted: true, works/reject → отклонение).
 *
 * id/type исполнителя берутся из авторизованного пользователя, а не из body —
 * подставить чужого контрагента невозможно.
 */
import { defineEventHandler, readBody, createError, getRouterParam } from 'h3'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../../../../../db'
import { workAgreements } from '../../../../../db/schema'
import {
  createWorkAgreementAcceptance,
  round3
} from '../../../../../utils/workAgreements'

const submitWorkAgreementSchema = z.object({
  volume: z.number().positive().optional(),
  amount: z.number().min(0).optional(),
  comment: z.string().max(2000).optional()
})

export default defineEventHandler(async (event) => {
  const user = event.context.user as any

  if (!user || !user.id) {
    throw createError({ statusCode: 401, message: 'Пользователь не авторизован' })
  }

  // Исполнитель берётся только из авторизованного пользователя
  const contractorType = user.contractorType as 'master' | 'worker' | undefined
  const contractorId = Number(user.contractorId || 0)

  if (!contractorType || !contractorId || !['master', 'worker'].includes(contractorType)) {
    throw createError({ statusCode: 403, message: 'Контрагент не найден' })
  }

  const id = Number(getRouterParam(event, 'id'))

  if (!id) {
    throw createError({ statusCode: 400, message: 'Некорректный ID договорённости' })
  }

  const [agreement] = await db
    .select()
    .from(workAgreements)
    .where(eq(workAgreements.id, id))

  if (!agreement) {
    throw createError({ statusCode: 404, message: 'Договорённость не найдена' })
  }

  // Нельзя сдать чужую договорённость
  if (
    agreement.contractorType !== contractorType ||
    Number(agreement.contractorId) !== contractorId
  ) {
    throw createError({
      statusCode: 403,
      message: 'Недостаточно прав для сдачи этой договорённости'
    })
  }

  if (agreement.status !== 'active') {
    throw createError({
      statusCode: 400,
      message: 'Договорённость недоступна для сдачи'
    })
  }

  const body = await readBody(event)

  const parsed = submitWorkAgreementSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: parsed.error.issues[0]?.message || 'Некорректные данные сдачи'
    })
  }

  const payload = parsed.data

  const totalVolume = Number(agreement.volume || 0)
  const acceptedVolumeBefore = Number(agreement.acceptedVolume || 0)
  const remainingVolume = round3(totalVolume - acceptedVolumeBefore)

  const acceptedVolume = payload.volume ?? remainingVolume

  await createWorkAgreementAcceptance({
    agreement,
    volume: acceptedVolume,
    amount: payload.amount,
    contractorType,
    contractorId,
    comment: payload.comment,
    accepted: false,
    user
  })

  return {
    success: true
  }
})

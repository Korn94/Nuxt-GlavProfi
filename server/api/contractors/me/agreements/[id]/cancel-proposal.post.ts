// server/api/contractors/me/agreements/[id]/cancel-proposal.post.ts
/**
 * Назначение: исполнитель отзывает СВОЮ неподтверждённую заявку на объём
 * (дубль со статусом 'pending_review' → 'cancelled').
 *
 * Только для заявок, созданных этим исполнителем (проверка по parentAgreementId
 * и contractor в теле договорённости), статус строго 'pending_review'.
 */
import { defineEventHandler, createError, getRouterParam } from 'h3'
import { eq } from 'drizzle-orm'
import { db } from '../../../../../db'
import { workAgreements } from '../../../../../db/schema'

export default defineEventHandler(async (event) => {
  const user = event.context.user as any

  if (!user || !user.id) {
    throw createError({ statusCode: 401, message: 'Пользователь не авторизован' })
  }

  const contractorType = user.contractorType as 'master' | 'worker' | undefined
  const contractorId = Number(user.contractorId || 0)

  if (!contractorType || !contractorId || !['master', 'worker'].includes(contractorType)) {
    throw createError({ statusCode: 403, message: 'Контрагент не найден' })
  }

  const id = Number(getRouterParam(event, 'id'))

  if (!id) {
    throw createError({ statusCode: 400, message: 'Некорректный ID договорённости' })
  }

  const [proposal] = await db
    .select()
    .from(workAgreements)
    .where(eq(workAgreements.id, id))

  if (!proposal) {
    throw createError({ statusCode: 404, message: 'Заявка не найдена' })
  }

  // Только своя заявка-дубль: принадлежность исполнителя сверяется по contractor,
  // статус 'pending_review' выставляется только заявкам (propose-volume)
  if (
    proposal.contractorType !== contractorType ||
    Number(proposal.contractorId) !== contractorId
  ) {
    throw createError({
      statusCode: 403,
      message: 'Недостаточно прав для отмены этой заявки'
    })
  }

  if (proposal.status !== 'pending_review') {
    throw createError({
      statusCode: 400,
      message: 'Отозвать можно только заявку на проверке'
    })
  }

  await db
    .update(workAgreements)
    .set({
      status: 'cancelled',
      updatedAt: new Date(),
      updatedBy: user.id
    })
    .where(eq(workAgreements.id, id))

  return {
    success: true
  }
})
// server/api/works/agreements/[id]/reject-proposal.post.ts
/**
 * Назначение: отклонение заявки исполнителя на объём (дубль прайс-карточки
 * со статусом 'pending_review') — status → 'rejected', причина сохраняется
 * в rejectionReason (отображается исполнителю в карточке).
 *
 * Никакие работы/счётчики не затрагиваются — баланс объекта не менялся
 * и не меняется.
 *
 * Право: objects.special (как у приёмки договорённостей).
 */
import { defineEventHandler, readBody, createError, getRouterParam } from 'h3'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../../../../db'
import { workAgreements } from '../../../../db/schema'
import { canAcceptWorkAgreements } from '../../../../utils/workAgreements'

const rejectProposalSchema = z.object({
  reason: z.string().min(1, 'Укажите причину отклонения').max(2000)
})

export default defineEventHandler(async (event) => {
  if (!await canAcceptWorkAgreements(event)) {
    throw createError({
      statusCode: 403,
      message: 'Недостаточно прав для отклонения заявки'
    })
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
    throw createError({ statusCode: 404, message: 'Заявка не найдена' })
  }

  if (agreement.status !== 'pending_review') {
    throw createError({
      statusCode: 400,
      message: 'Отклонить можно только заявку на проверке'
    })
  }

  // Без проверки parentAgreementId: если прайс удалили (FK set null),
  // заявка всё равно должна оставаться отклоняемой (см. confirm-proposal).

  const body = await readBody(event)
  const parsed = rejectProposalSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: parsed.error.issues[0]?.message || 'Некорректные данные отклонения'
    })
  }

  const user = event.context.user as any

  await db
    .update(workAgreements)
    .set({
      status: 'rejected',
      rejectionReason: parsed.data.reason,
      updatedAt: new Date(),
      updatedBy: user?.id || null
    })
    .where(eq(workAgreements.id, id))

  return {
    success: true
  }
})
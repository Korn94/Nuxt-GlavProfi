// server/api/works/agreements/[id]/confirm-proposal.post.ts
/**
 * Назначение: подтверждение заявки исполнителя на объём (дубль прайс-карточки
 * со статусом 'pending_review') администратором/прорабом.
 *
 * В ОДНОЙ транзакции (через createWorkAgreementAcceptance с newStatus):
 *  1. (опционально) объём/сумма корректируются, если админ замерил иначе;
 *  2. создаётся принятая работа (works, accepted: true) — объём уходит в баланс объекта;
 *  3. увеличиваются acceptedVolume/acceptedAmount дубля;
 *  4. статус дубля → 'active'.
 *
 * Право: objects.special (как у приёмки договорённостей).
 */
import { defineEventHandler, readBody, createError, getRouterParam } from 'h3'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../../../../db'
import { workAgreements } from '../../../../db/schema'
import {
  canAcceptWorkAgreements,
  createWorkAgreementAcceptance,
  calcAgreementAmount,
  round2,
  round3
} from '../../../../utils/workAgreements'

const confirmProposalSchema = z.object({
  // Корректировка объёма при подтверждении (по умолчанию — предложенный исполнителем)
  volume: z.number().positive().optional(),
  // Ручная сумма (иначе volume × unitPrice)
  amount: z.number().min(0).optional(),
  comment: z.string().max(2000).optional()
})

export default defineEventHandler(async (event) => {
  if (!await canAcceptWorkAgreements(event)) {
    throw createError({
      statusCode: 403,
      message: 'Недостаточно прав для подтверждения заявки'
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
      message: 'Подтвердить можно только заявку на проверке'
    })
  }

  // Раньше здесь была проверка parentAgreementId, но если прайс-карточку удалили
  // (FK set null), заявка осталась бы неподтверждаемой. Статуса 'pending_review' достаточно:
  // он выставляется только заявкам (propose-volume).

  const body = await readBody(event)
  const parsed = confirmProposalSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: parsed.error.issues[0]?.message || 'Некорректные данные подтверждения'
    })
  }

  const payload = parsed.data

  const finalVolume = round3(payload.volume ?? Number(agreement.volume || 0))
  const unitPrice = Number(agreement.unitPrice || 0)
  const finalAmount = payload.amount != null
    ? round2(payload.amount)
    : calcAgreementAmount({
        priceMode: 'unit',
        volume: finalVolume,
        unitPrice
      })

  if (finalVolume <= 0) {
    throw createError({ statusCode: 400, message: 'Некорректный объём' })
  }

  const user = event.context.user as any
  const now = new Date()

  const proposalContractorType = agreement.contractorType as 'master' | 'worker' | null
  const proposalContractorId = Number(agreement.contractorId || 0)

  if (!proposalContractorType || !proposalContractorId) {
    throw createError({
      statusCode: 400,
      message: 'У заявки не указан исполнитель'
    })
  }

  // Если админ скорректировал объём/сумму — фиксируем ДО приёмки,
  // чтобы createWorkAgreementAcceptance видел актуальные остатки.
  const volumeChanged = finalVolume !== Number(agreement.volume || 0)

  if (volumeChanged || finalAmount !== Number(agreement.agreedAmount || 0)) {
    await db
      .update(workAgreements)
      .set({
        volume: String(finalVolume),
        agreedAmount: String(finalAmount),
        updatedAt: now,
        updatedBy: user?.id || null
      })
      .where(eq(workAgreements.id, id))
  }

  // Актуальная копия для расчёта остатков внутри транзакции приёмки
  const agreementForAcceptance = {
    ...agreement,
    volume: String(finalVolume),
    agreedAmount: String(finalAmount)
  }

  await createWorkAgreementAcceptance({
    agreement: agreementForAcceptance,
    volume: finalVolume,
    amount: finalAmount,
    contractorType: proposalContractorType,
    contractorId: proposalContractorId,
    comment: payload.comment,
    accepted: true,
    user,
    newStatus: 'active'
  })

  return {
    success: true
  }
})
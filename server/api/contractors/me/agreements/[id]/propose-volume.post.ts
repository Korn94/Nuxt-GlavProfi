// server/api/contractors/me/agreements/[id]/propose-volume.post.ts
/**
 * Назначение: исполнитель (мастер/рабочий) предлагает объём по ПРАЙС-карточке
 * (unitPriceOnly — «просто цена за 1 ед.», объём не согласован заранее).
 *
 * Создаётся ДУБЛЬ договорённости:
 *  - копируется объект/название/тип работ/ед. изм./цена/исполнитель/прораб;
 *  - volume = предложенный исполнителем, agreedAmount = volume × unitPrice;
 *  - status = 'pending_review' (ожидает решения админа/прораба);
 *  - parentAgreementId → оригинал-прайс.
 *
 * Никаких работ (works) и счётчиков не создаётся — до подтверждения баланс не меняется.
 *
 * Защита от дублей: пока есть заявка 'pending_review' по этому прайсу — новую не примем.
 * id/type исполнителя берутся из авторизованного пользователя, не из body.
 */
import { defineEventHandler, readBody, createError, getRouterParam } from 'h3'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../../../../../db'
import { workAgreements } from '../../../../../db/schema'
import { round2, round3 } from '../../../../../utils/workAgreements'

const proposeVolumeSchema = z.object({
  volume: z.number().positive(),
  comment: z.string().max(2000).optional()
})

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

  const [agreement] = await db
    .select()
    .from(workAgreements)
    .where(eq(workAgreements.id, id))

  if (!agreement) {
    throw createError({ statusCode: 404, message: 'Договорённость не найдена' })
  }

  // Нельзя предлагать объём по чужой договорённости
  if (
    agreement.contractorType !== contractorType ||
    Number(agreement.contractorId) !== contractorId
  ) {
    throw createError({
      statusCode: 403,
      message: 'Недостаточно прав для предложения объёма по этой договорённости'
    })
  }

  if (agreement.status !== 'active') {
    throw createError({
      statusCode: 400,
      message: 'Договорённость недоступна для предложения объёма'
    })
  }

  if (!agreement.unitPriceOnly) {
    throw createError({
      statusCode: 400,
      message: 'Объём этой договорённости уже согласован — используйте «Сдать»'
    })
  }

  const body = await readBody(event)
  const parsed = proposeVolumeSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: parsed.error.issues[0]?.message || 'Некорректные данные предложения'
    })
  }

  const { volume, comment } = parsed.data

  // Пока есть нерешённая заявка по этому прайсу — новую не принимаем
  const [pendingProposal] = await db
    .select({ id: workAgreements.id })
    .from(workAgreements)
    .where(
      and(
        eq(workAgreements.parentAgreementId, agreement.id),
        eq(workAgreements.status, 'pending_review')
      )
    )
    .limit(1)

  if (pendingProposal) {
    throw createError({
      statusCode: 400,
      message: 'По этой договорённости уже есть заявка на проверке — дождитесь решения'
    })
  }

  const unitPrice = Number(agreement.unitPrice || 0)
  const proposedVolume = round3(volume)
  const proposedAmount = round2(proposedVolume * unitPrice)
  const now = new Date()

  const [proposal] = await db
    .insert(workAgreements)
    .values({
      objectId: agreement.objectId,
      title: agreement.title,
      workType: agreement.workType,
      volume: String(proposedVolume),
      unit: agreement.unit,
      unitCustom: agreement.unitCustom,
      priceMode: 'unit',
      unitPriceOnly: false,
      parentAgreementId: agreement.id,
      unitPrice: agreement.unitPrice,
      fixedTotal: null,
      agreedAmount: String(proposedAmount),
      acceptedVolume: '0.000',
      acceptedAmount: '0.00',
      contractorType: agreement.contractorType,
      contractorId: agreement.contractorId,
      foremanId: agreement.foremanId,
      publicComment: comment || null,
      adminComment: null,
      rejectionReason: null,
      status: 'pending_review',
      createdBy: user.id,
      updatedBy: user.id,
      createdAt: now,
      updatedAt: now
    })
    .$returningId()

  return {
    success: true,
    proposal
  }
})
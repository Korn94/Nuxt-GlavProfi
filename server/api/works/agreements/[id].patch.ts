// server/api/works/agreements/[id].patch.ts
import { defineEventHandler, readBody, createError, getRouterParam } from 'h3'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../../../db'
import { workAgreements } from '../../../db/schema'
import {
  canManageWorkAgreements,
  calcAgreementAmount,
  round2,
  round3
} from '../../../utils/workAgreements'

const unitEnum = [
  'm2',
  'm3',
  'm',
  'pcs',
  'hour',
  'shift',
  'service',
  'custom'
] as const

const priceModeEnum = [
  'unit',
  'fixed'
] as const

const contractorTypeEnum = [
  'master',
  'worker'
] as const

const statusEnum = [
  'active',
  'cancelled'
] as const

const workTypeEnum = [
  'Отделка',
  'Электрика',
  'Плитка',
  'Сантехника',
  'Перегородки ГКЛ',
  'Потолок',
  'Сварка',
  'Бетонные работы',
  'Кровля',
  'Фасад',
  'Перегородки Камень',
  'Демонтаж',
  'Мусор',
  'Разнорабочий',
  'Смежники',
  'Подневка',
  'Прочее'
] as const

const updateWorkAgreementSchema = z
  .object({
    title: z.string().min(1).max(255).optional(),

    workType: z.enum(workTypeEnum).optional(),

    volume: z.number().positive().optional(),

    unit: z.enum(unitEnum).optional(),

    unitCustom: z
      .string()
      .max(50)
      .optional()
      .nullable(),

    priceMode: z.enum(priceModeEnum).optional(),

    unitPrice: z
      .number()
      .min(0)
      .optional()
      .nullable(),

    fixedTotal: z
      .number()
      .min(0)
      .optional()
      .nullable(),

    contractorType: z
      .enum(contractorTypeEnum)
      .optional()
      .nullable(),

    contractorId: z
      .number()
      .int()
      .positive()
      .optional()
      .nullable(),

    foremanId: z
      .number()
      .int()
      .positive()
      .optional()
      .nullable(),

    publicComment: z
      .string()
      .max(5000)
      .optional()
      .nullable(),

    adminComment: z
      .string()
      .max(5000)
      .optional()
      .nullable(),

    status: z.enum(statusEnum).optional()
  })
  .superRefine((data, ctx) => {
    if (data.contractorType && !data.contractorId) {
      ctx.addIssue({
        code: 'custom',
        path: ['contractorId'],
        message: 'Выберите исполнителя'
      })
    }

    if (!data.contractorType && data.contractorId) {
      ctx.addIssue({
        code: 'custom',
        path: ['contractorType'],
        message: 'Укажите тип исполнителя'
      })
    }
  })

export default defineEventHandler(async (event) => {
  if (!await canManageWorkAgreements(event)) {
    throw createError({
      statusCode: 403,
      message: 'Недостаточно прав для редактирования договорённости'
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

  const body = await readBody(event)

  const parsed = updateWorkAgreementSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: parsed.error.issues[0]?.message || 'Некорректные данные'
    })
  }

  const data = parsed.data

  const currentVolume = Number(agreement.volume || 0)
  const currentAcceptedVolume = Number(agreement.acceptedVolume || 0)
  const currentAcceptedAmount = Number(agreement.acceptedAmount || 0)

  const nextVolume = data.volume != null ? data.volume : currentVolume

  if (nextVolume < currentAcceptedVolume) {
    throw createError({
      statusCode: 400,
      message: 'Нельзя установить объём меньше уже принятого'
    })
  }

  const nextPriceMode = data.priceMode || agreement.priceMode
  const nextUnitPrice =
    data.unitPrice !== undefined
      ? data.unitPrice
      : agreement.unitPrice
        ? Number(agreement.unitPrice)
        : null

  const nextFixedTotal =
    data.fixedTotal !== undefined
      ? data.fixedTotal
      : agreement.fixedTotal
        ? Number(agreement.fixedTotal)
        : null

  if (nextPriceMode === 'unit' && nextUnitPrice == null) {
    throw createError({
      statusCode: 400,
      message: 'Укажите цену за единицу'
    })
  }

  if (nextPriceMode === 'fixed' && nextFixedTotal == null) {
    throw createError({
      statusCode: 400,
      message: 'Укажите итоговую сумму'
    })
  }

  const nextAgreedAmount = calcAgreementAmount({
    priceMode: nextPriceMode as 'unit' | 'fixed',
    volume: nextVolume,
    unitPrice: nextUnitPrice,
    fixedTotal: nextFixedTotal
  })

  if (nextAgreedAmount < currentAcceptedAmount) {
    throw createError({
      statusCode: 400,
      message: 'Нельзя установить сумму меньше уже принятой'
    })
  }

  if (data.unit === 'custom' && !data.unitCustom?.trim()) {
    throw createError({
      statusCode: 400,
      message: 'Укажите единицу измерения'
    })
  }

  const user = event.context.user as any
  const now = new Date()

  const updateData: any = {
    updatedAt: now,
    updatedBy: user?.id || null
  }

  if (data.title !== undefined) {
    updateData.title = data.title
  }

  if (data.workType !== undefined) {
    updateData.workType = data.workType
  }

  if (data.volume !== undefined) {
    updateData.volume = String(round3(data.volume))
  }

  if (data.unit !== undefined) {
    updateData.unit = data.unit
  }

  if (data.unitCustom !== undefined) {
    updateData.unitCustom = data.unit === 'custom' ? data.unitCustom : null
  }

  if (data.priceMode !== undefined) {
    updateData.priceMode = data.priceMode
  }

  if (data.unitPrice !== undefined) {
    updateData.unitPrice =
      nextPriceMode === 'unit' ? String(round2(data.unitPrice ?? 0)) : null
  }

  if (data.fixedTotal !== undefined) {
    updateData.fixedTotal =
      nextPriceMode === 'fixed' ? String(round2(data.fixedTotal ?? 0)) : null
  }

  updateData.agreedAmount = String(nextAgreedAmount)

  if (data.contractorType !== undefined) {
    updateData.contractorType = data.contractorType
  }

  if (data.contractorId !== undefined) {
    updateData.contractorId = data.contractorId
  }

  if (data.foremanId !== undefined) {
    updateData.foremanId = data.foremanId
  }

  if (data.publicComment !== undefined) {
    updateData.publicComment = data.publicComment
  }

  if (data.adminComment !== undefined) {
    updateData.adminComment = data.adminComment
  }

  if (data.status !== undefined) {
    updateData.status = data.status
  }

  await db
    .update(workAgreements)
    .set(updateData)
    .where(eq(workAgreements.id, id))

  const [updatedAgreement] = await db
    .select()
    .from(workAgreements)
    .where(eq(workAgreements.id, id))

  return updatedAgreement
})

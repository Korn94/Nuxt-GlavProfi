// server/api/works/agreements/index.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { z } from 'zod'
import { db } from '../../../db'
import { workAgreements } from '../../../db/schema'
import {
  canManageWorkAgreements,
  calcAgreementAmount,
  round2
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

const createWorkAgreementSchema = z
  .object({
    objectId: z.number().int().positive(),

    title: z.string().min(1).max(255),

    workType: z.enum(workTypeEnum).optional().default('Прочее'),

    volume: z.number().positive(),

    unit: z.enum(unitEnum).default('m2'),

    unitCustom: z
      .string()
      .max(50)
      .optional()
      .nullable(),

    priceMode: z.enum(priceModeEnum).default('unit'),

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
      .nullable()
  })
  .superRefine((data, ctx) => {
    if (data.unit === 'custom' && !data.unitCustom?.trim()) {
      ctx.addIssue({
        code: 'custom',
        path: ['unitCustom'],
        message: 'Укажите единицу измерения'
      })
    }

    if (data.priceMode === 'unit' && data.unitPrice == null) {
      ctx.addIssue({
        code: 'custom',
        path: ['unitPrice'],
        message: 'Укажите цену за единицу'
      })
    }

    if (data.priceMode === 'fixed' && data.fixedTotal == null) {
      ctx.addIssue({
        code: 'custom',
        path: ['fixedTotal'],
        message: 'Укажите итоговую сумму'
      })
    }

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
      message: 'Недостаточно прав для создания договорённости'
    })
  }

  const body = await readBody(event)

  const parsed = createWorkAgreementSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: parsed.error.issues[0]?.message || 'Некорректные данные'
    })
  }

  const data = parsed.data

  const user = event.context.user as any

  const agreedAmount = calcAgreementAmount({
    priceMode: data.priceMode,
    volume: data.volume,
    unitPrice: data.unitPrice,
    fixedTotal: data.fixedTotal
  })

  const now = new Date()

  const [newAgreement] = await db
    .insert(workAgreements)
    .values({
      objectId: data.objectId,
      title: data.title,
      workType: data.workType,
      volume: String(data.volume),
      unit: data.unit,
      unitCustom: data.unit === 'custom' ? data.unitCustom : null,
      priceMode: data.priceMode,
      unitPrice: data.priceMode === 'unit' ? String(data.unitPrice ?? '0') : null,
      fixedTotal: data.priceMode === 'fixed' ? String(data.fixedTotal ?? '0') : null,
      agreedAmount: String(agreedAmount),
      acceptedVolume: '0.000',
      acceptedAmount: '0.00',
      contractorType: data.contractorType || null,
      contractorId: data.contractorId || null,
      foremanId: data.foremanId || null,
      publicComment: data.publicComment || null,
      adminComment: data.adminComment || null,
      status: 'active',
      createdBy: user?.id || null,
      updatedBy: user?.id || null,
      createdAt: now,
      updatedAt: now
    })
    .$returningId()

  return newAgreement
})

// server/api/works/agreements/index.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { z } from 'zod'
import { db } from '../../../db'
import { workAgreements } from '../../../db/schema'
import {
  canCreateWorkAgreements,
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

    volume: z.number().positive().optional(),

    unit: z.enum(unitEnum).default('m2'),

    unitCustom: z
      .string()
      .max(50)
      .optional()
      .nullable(),

    priceMode: z.enum(priceModeEnum).default('unit'),

    // Галочка «просто цена за 1 ед.» (прайс): объём укажет исполнитель
    unitPriceOnly: z.boolean().default(false),

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

    // Прайс-карточка (unitPriceOnly): без объёма, только цена за единицу
    if (data.unitPriceOnly) {
      if (data.priceMode !== 'unit') {
        ctx.addIssue({
          code: 'custom',
          path: ['priceMode'],
          message: 'Для цены без объёма выберите тип «Цена за единицу»'
        })
      }

      if (data.unitPrice == null) {
        ctx.addIssue({
          code: 'custom',
          path: ['unitPrice'],
          message: 'Укажите цену за единицу'
        })
      }

      return
    }

    if (data.volume == null || data.volume <= 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['volume'],
        message: 'Укажите объём'
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
  if (!await canCreateWorkAgreements(event)) {
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

  // Для прайс-карточки объём неизвестен → сумма договорённости 0 (наберётся подтверждёнными заявками)
  const agreedAmount = data.unitPriceOnly
    ? 0
    : calcAgreementAmount({
        priceMode: data.priceMode,
        volume: data.volume ?? 0,
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
      volume: data.unitPriceOnly ? null : String(data.volume ?? 0),
      unit: data.unit,
      unitCustom: data.unit === 'custom' ? data.unitCustom : null,
      priceMode: data.unitPriceOnly ? 'unit' : data.priceMode,
      unitPrice: (data.unitPriceOnly || data.priceMode === 'unit') ? String(data.unitPrice ?? '0') : null,
      fixedTotal: !data.unitPriceOnly && data.priceMode === 'fixed' ? String(data.fixedTotal ?? '0') : null,
      unitPriceOnly: data.unitPriceOnly,
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

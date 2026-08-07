// server/utils/workAgreements.ts
import type { H3Event } from 'h3'
import { createError } from 'h3'
import { eq, sql } from 'drizzle-orm'
import { db } from '../db'
import { works, workAgreements, workAgreementAcceptances } from '../db/schema'
import { hasUserPermission } from './permissions'

export type AgreementUnit =
  | 'm2'
  | 'm3'
  | 'm'
  | 'pcs'
  | 'hour'
  | 'shift'
  | 'service'
  | 'custom'

export type AgreementPriceMode = 'unit' | 'fixed'

export type AgreementContractorType = 'master' | 'worker'

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

export function round3(value: number): number {
  return Math.round((value + Number.EPSILON) * 1000) / 1000
}

export function calcAgreementAmount(input: {
  priceMode: AgreementPriceMode
  volume: number
  unitPrice?: number | null
  fixedTotal?: number | null
}): number {
  if (input.priceMode === 'fixed') {
    return round2(input.fixedTotal ?? 0)
  }

  return round2((input.volume ?? 0) * (input.unitPrice ?? 0))
}

export function calcAcceptAmount(input: {
  priceMode: AgreementPriceMode
  totalVolume: number
  acceptedVolume: number
  unitPrice?: number | null
  fixedTotal?: number | null
  agreedAmount?: number | null
}): number {
  const acceptedVolume = Number(input.acceptedVolume || 0)

  if (input.priceMode === 'unit') {
    return round2(acceptedVolume * Number(input.unitPrice || 0))
  }

  const baseAmount = Number(input.fixedTotal ?? input.agreedAmount ?? 0)
  const totalVolume = Number(input.totalVolume || 0)

  if (!totalVolume) {
    return 0
  }

  return round2((acceptedVolume / totalVolume) * baseAmount)
}

export function getAgreementPercent(input: {
  volume: number | string
  acceptedVolume: number | string
}): number {
  const volume = Number(input.volume || 0)
  const acceptedVolume = Number(input.acceptedVolume || 0)

  if (!volume) {
    return 0
  }

  return Math.min(100, Math.round((acceptedVolume / volume) * 100))
}

export function isAgreementFullyAccepted(input: {
  volume: number | string
  acceptedVolume: number | string
}): boolean {
  const volume = Number(input.volume || 0)
  const acceptedVolume = Number(input.acceptedVolume || 0)

  return acceptedVolume >= volume - 0.0001
}

// ============================================
// Права доступа (синхронизированы с системой прав)
// ============================================

/**
 * Просмотр договорённостей — право 'objects.view'
 */
export async function canViewWorkAgreements(event: H3Event): Promise<boolean> {
  const user = event.context.user as any

  if (!user) {
    return false
  }

  return hasUserPermission(user, 'objects', 'view')
}

/**
 * Создание/редактирование/удаление договорённостей — право 'objects.create'
 */
export async function canCreateWorkAgreements(event: H3Event): Promise<boolean> {
  const user = event.context.user as any
  if (!user) return false
  return hasUserPermission(user, 'objects', 'create')
}

export async function canEditWorkAgreements(event: H3Event): Promise<boolean> {
  const user = event.context.user as any
  if (!user) return false
  return hasUserPermission(user, 'objects', 'edit')
}

export async function canDeleteWorkAgreements(event: H3Event): Promise<boolean> {
  const user = event.context.user as any
  if (!user) return false
  return hasUserPermission(user, 'objects', 'delete')
}

/**
 * Приёмка объёмов по договорённостям — право 'objects.special'
 */
export async function canAcceptWorkAgreements(event: H3Event): Promise<boolean> {
  const user = event.context.user as any

  if (!user) {
    return false
  }

  return hasUserPermission(user, 'objects', 'special')
}

/**
 * Просмотр admin-комментария — только для роли admin
 */
export async function canSeeAdminComment(event: H3Event): Promise<boolean> {
  const user = event.context.user as any

  if (!user) {
    return false
  }

  return user.role === 'admin'
}

// ============================================
// Общая логика приёмки/сдачи объёма по договорённости
// ============================================

/**
 * Создание записи приёмки/сдачи по договорённости.
 *
 * Единая бизнес-логика для двух сценариев:
 * - Приёмка (администратор/прораб) — accepted: true;
 * - Сдача объёма исполнителем (мастер/рабочий) — accepted: false (на утверждение).
 *
 * В рамках транзакции:
 *   1. создаёт запись работы (works);
 *   2. создаёт запись приёмки (workAgreementAcceptances);
 *   3. увеличивает принятые объём/сумму договорённости (workAgreements).
 */
export async function createWorkAgreementAcceptance(input: {
  agreement: any
  volume: number
  amount?: number
  contractorType: 'master' | 'worker'
  contractorId: number
  comment?: string
  accepted: boolean
  user?: any
}): Promise<void> {
  const {
    agreement,
    volume,
    amount,
    contractorType,
    contractorId,
    comment,
    accepted,
    user
  } = input

  const now = new Date()

  const totalVolume = Number(agreement.volume || 0)
  const acceptedVolumeBefore = Number(agreement.acceptedVolume || 0)
  const acceptedAmountBefore = Number(agreement.acceptedAmount || 0)
  const agreedAmount = Number(agreement.agreedAmount || 0)

  const remainingVolume = round3(totalVolume - acceptedVolumeBefore)
  const remainingAmount = round2(agreedAmount - acceptedAmountBefore)

  const acceptedVolume = round3(volume)

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

  let acceptedAmount = amount

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
        accepted,
        acceptedDate: accepted ? now : null,
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
      comment: comment || null,
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
}

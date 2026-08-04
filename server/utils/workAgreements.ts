// server/utils/workAgreements.ts
import type { H3Event } from 'h3'
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
export async function canManageWorkAgreements(event: H3Event): Promise<boolean> {
  const user = event.context.user as any

  if (!user) {
    return false
  }

  return hasUserPermission(user, 'objects', 'create')
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

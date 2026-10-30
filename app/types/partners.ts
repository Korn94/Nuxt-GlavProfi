// app/types/partners.ts
import type { PartnerLeadStatus } from 'shared/constants/partners'

export interface Partner {
  id: number
  userId: number | null
  companyName: string | null
  contactPerson: string | null
  phone: string | null
  email: string | null
  comment: string | null
  isActive: boolean
  createdAt: string | Date | null
  updatedAt: string | Date | null
  // Агрегированные/связанные поля (приходят из API)
  login?: string | null
  userName?: string | null
  leadsCount?: number
}

export interface PartnerLead {
  id: number
  leadNumber: string
  partnerId: number
  objectId: number | null
  clientName: string
  clientPhone: string
  objectAddress: string | null
  objectArea: string | null
  description: string | null
  status: PartnerLeadStatus
  contractAmount: string | null
  rewardAmount: string
  createdAt: string | Date | null
  updatedAt: string | Date | null
  // Приходит из API (join с объектом)
  objectName?: string | null
}
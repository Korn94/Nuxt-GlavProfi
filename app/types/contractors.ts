// app/types/contractors.ts
/**
 * Унифицированные типы для работы с контрагентами
 */

export type ContractorType = 'master' | 'worker' | 'foreman' | 'office'

export const CONTRACTOR_TYPES: ContractorType[] = ['master', 'worker', 'foreman', 'office']

// Данные из БД (raw)
export interface ContractorModel {
  id: number
  name: string
  phone: string | null
  comment: string | null
  balance: string | number
  userId: number | null
  createdAt: Date
  updatedAt: Date
}

// Контрагент + тип
export interface Contractor extends ContractorModel {
  type: ContractorType
}

// DTO для API (JSON)
export interface ContractorDTO {
  id: number
  type: ContractorType
  name: string
  phone: string | null
  comment: string | null
  balance: string
  userId: number | null
  createdAt: string
  updatedAt: string
  user?: {
    id: number
    name: string
    login: string
    role: string
  } | null
}

// Input для создания
export interface ContractorCreateInput {
  name: string
  phone?: string | null
  comment?: string | null
  balance?: string | number
  userId?: number | null
}

// Input для обновления
export interface ContractorUpdateInput {
  name?: string
  phone?: string | null
  comment?: string | null
  balance?: string | number
  userId?: number | null
}

// Кастомные ошибки
export class ContractorNotFoundError extends Error {
  constructor(type: ContractorType, id: number) {
    super(`${type} contractor with id ${id} not found`)
    this.name = 'ContractorNotFoundError'
  }
}

export class InvalidContractorTypeError extends Error {
  constructor(type: string) {
    super(`Invalid contractor type: ${type}`)
    this.name = 'InvalidContractorTypeError'
  }
}

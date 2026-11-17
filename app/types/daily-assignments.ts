// app/types/daily-assignments.ts

import type { ContractorType } from './contractors'

export type WorkSource = 'daily' | 'volume'
/** В подневке участвуют только мастера и рабочие (см. ContractorType) */
export type DailyContractorType = Extract<ContractorType, 'worker' | 'master'>
export type SplitMode = 'percent' | 'amount'

/** Базовая структура записи подневки */
export interface DailyAssignment {
  id?: number
  workId?: number // ID записи в таблице `works`, если уже сохранена
  workerId: number
  contractorType: DailyContractorType
  date: string // YYYY-MM-DD
  objectId: number
  objectName: string
  percentage: number // 1-100
  amount: number // итоговая сумма (после округления до 50₽)
  workSource: WorkSource
}

/** Группировка назначений по дате для UI */
export interface DailyGroup {
  date: string
  assignments: DailyAssignment[]
  totalAmount: number // строго равняется dailyRate рабочего
}

/** Рабочий/мастер для списка подневки */
export interface DailyWorker {
  id: number
  name: string
  dailyRate: number // 0 = не на подневке
  balance: number
  contractorType: DailyContractorType
}

/** Активный объект для выбора в модалке */
export interface ActiveObject {
  id: number
  name: string
  status: string
}

/** Payload для массового применения смен */
export interface BulkAssignmentPayload {
  workerId: number
  contractorType: DailyContractorType
  dates: string[]
  dailyRate: number
  assignments: {
    objectId: number
    objectName: string
    percentage: number
    amount: number
  }[]
}

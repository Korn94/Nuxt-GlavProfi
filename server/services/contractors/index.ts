// server/services/contractors/index.ts
/**
 * Public API сервиса контрагентов
 * Экспортируем только то, что нужно снаружи
 */

export { ContractorRepository } from './repository'
export { ContractorService } from './service'

export type {
  ContractorType,
  ContractorModel,
  Contractor,
  ContractorDTO,
  ContractorCreateInput,
  ContractorUpdateInput
} from '~/types/contractors'

export { 
  CONTRACTOR_TYPES,
  ContractorNotFoundError,
  InvalidContractorTypeError
} from '~/types/contractors'

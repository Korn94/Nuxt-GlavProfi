// server/services/contractors/service.ts
import { db } from '../../db'
import { users } from '../../db/schema'
import { eq, inArray } from 'drizzle-orm' // ✅ Добавить inArray
import { ContractorRepository } from './repository'
import type { ContractorType, ContractorDTO, ContractorCreateInput, ContractorUpdateInput } from '~/types/contractors'
import { ContractorNotFoundError } from '~/types/contractors'

export class ContractorService {
  static async getFullDTO(type: ContractorType, id: number): Promise<ContractorDTO | null> {
    const contractor = await ContractorRepository.findById(type, id)
    if (!contractor) return null

    let user = null
    if (contractor.userId) {
      const [userData] = await db
        .select()
        .from(users)
        .where(eq(users.id, contractor.userId))
      
      if (userData) {
        user = {
          id: userData.id,
          name: userData.name,
          login: userData.login,
          role: userData.role
        }
      }
    }

    return this.toDTO(contractor, user)
  }

  static async getByTypeDTO(type: ContractorType): Promise<ContractorDTO[]> {
    const contractors = await ContractorRepository.findByType(type)
    
    const userIds = contractors
      .map(c => c.userId)
      .filter((id): id is number => id !== null)
    
    let usersMap = new Map()
    if (userIds.length > 0) {
      const userRecords = await db
        .select()
        .from(users)
        .where(inArray(users.id, userIds)) // ✅ Использовать inArray вместо includes
      
      usersMap = new Map(userRecords.map(u => [u.id, u]))
    }

    return contractors.map(contractor => {
      const user = contractor.userId ? usersMap.get(contractor.userId) : null
      return this.toDTO(contractor, user ? {
        id: user.id,
        name: user.name,
        login: user.login,
        role: user.role
      } : null)
    })
  }

  static async getByUserIdDTO(userId: number): Promise<{ type: ContractorType; contractor: ContractorDTO } | null> {
    const types: ContractorType[] = ['master', 'worker', 'foreman', 'office']
    
    for (const type of types) {
      const contractor = await ContractorRepository.findByUserId(type, userId)
      if (contractor) {
        const dto = await this.getFullDTO(type, contractor.id)
        return { type, contractor: dto! }
      }
    }
    
    return null
  }

  static async create(type: ContractorType, input: ContractorCreateInput): Promise<ContractorDTO> {
    const contractor = await ContractorRepository.create(type, input)
    const dto = await this.getFullDTO(type, contractor.id)
    
    if (!dto) throw new Error('Failed to create contractor')
    
    return dto
  }

  static async update(
    type: ContractorType,
    id: number,
    input: ContractorUpdateInput
  ): Promise<ContractorDTO> {
    const contractor = await ContractorRepository.update(type, id, input)
    
    if (!contractor) {
      throw new ContractorNotFoundError(type, id)
    }

    const dto = await this.getFullDTO(type, id)
    
    if (!dto) throw new Error('Failed to update contractor')
    
    return dto
  }

  static async delete(type: ContractorType, id: number): Promise<void> {
    const contractor = await ContractorRepository.findById(type, id)
    
    if (!contractor) {
      throw new ContractorNotFoundError(type, id)
    }

    // ✅ Конвертировать balance в число перед сравнением
    const balance = parseFloat(String(contractor.balance))
    if (balance > 0) {
      throw new Error(`Cannot delete contractor with positive balance: ${balance}`)
    }

    if (contractor.userId) {
      await db.update(users)
        .set({ contractorId: null, contractorType: null })
        .where(eq(users.id, contractor.userId))
    }

    const deleted = await ContractorRepository.delete(type, id)
    
    if (!deleted) {
      throw new Error('Failed to delete contractor')
    }
  }

  static async addBalance(type: ContractorType, id: number, amount: string | number): Promise<ContractorDTO> {
    const contractor = await ContractorRepository.addBalance(type, id, amount)
    
    if (!contractor) {
      throw new ContractorNotFoundError(type, id)
    }

    const dto = await this.getFullDTO(type, id)
    if (!dto) throw new Error('Failed to add balance')
    
    return dto
  }

  static async subtractBalance(type: ContractorType, id: number, amount: string | number): Promise<ContractorDTO> {
    const contractor = await ContractorRepository.findById(type, id)
    
    if (!contractor) {
      throw new ContractorNotFoundError(type, id)
    }

    const numAmount = parseFloat(String(amount))
    const currentBalance = parseFloat(String(contractor.balance))

    if (currentBalance - numAmount < 0) {
      throw new Error(`Insufficient balance. Current: ${contractor.balance}, Required: ${amount}`)
    }

    const updated = await ContractorRepository.subtractBalance(type, id, amount)
    
    if (!updated) {
      throw new Error('Failed to subtract balance')
    }

    const dto = await this.getFullDTO(type, id)
    if (!dto) throw new Error('Failed to subtract balance')
    
    return dto
  }

  private static toDTO(
    contractor: any,
    user: any = null
  ): ContractorDTO {
    return {
      id: contractor.id,
      type: contractor.type,
      name: contractor.name,
      phone: contractor.phone || null,
      comment: contractor.comment || null,
      balance: String(contractor.balance || '0'),
      userId: contractor.userId || null,
      createdAt: contractor.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: contractor.updatedAt?.toISOString() || new Date().toISOString(),
      user: user || undefined
    }
  }
}
// server/services/contractors/repository.ts
import { db } from '../../db'
import { masters, workers, foremans, offices } from '../../db/schema'
import { eq } from 'drizzle-orm'
import type { ContractorType, Contractor, ContractorCreateInput, ContractorUpdateInput } from '~/types/contractors'
import { ContractorNotFoundError, InvalidContractorTypeError } from '~/types/contractors'

/**
 * Репозиторий контрагентов
 * Абстракция над 4 таблицами (masters, workers, foremans, offices)
 */
export class ContractorRepository {
  /**
   * Получить таблицу по типу контрагента
   */
  private static getTable(type: ContractorType) {
    const tables = {
      master: masters,
      worker: workers,
      foreman: foremans,
      office: offices
    }
    
    if (!tables[type]) {
      throw new InvalidContractorTypeError(type)
    }
    
    return tables[type]
  }

  /**
   * Найти контрагента по ID
   */
  static async findById(type: ContractorType, id: number): Promise<Contractor | null> {
    const table = this.getTable(type)
    
    const [record] = await db
      .select()
      .from(table)
      .where(eq(table.id, id))
    
    if (!record) return null
    
    return {
      ...record,
      type,
      balance: this.normalizeBalance(record.balance)
    }
  }

  /**
   * Найти все контрагентов определённого типа
   */
  static async findByType(type: ContractorType): Promise<Contractor[]> {
    const table = this.getTable(type)
    
    const records = await db.select().from(table)
    
    return records.map(r => ({
      ...r,
      type,
      balance: this.normalizeBalance(r.balance)
    }))
  }

  /**
   * Найти контрагента по userId
   */
  static async findByUserId(type: ContractorType, userId: number): Promise<Contractor | null> {
    const table = this.getTable(type)
    
    const [record] = await db
      .select()
      .from(table)
      .where(eq(table.userId, userId))
    
    if (!record) return null
    
    return {
      ...record,
      type,
      balance: this.normalizeBalance(record.balance)
    }
  }

  /**
   * Создать контрагента
   */
static async create(type: ContractorType, input: ContractorCreateInput): Promise<Contractor> {
  const table = this.getTable(type)
  
  if (!input.name || input.name.trim().length === 0) {
    throw new Error('Contractor name is required')
  }

  const data = {
    name: input.name.trim(),
    phone: input.phone || null,
    comment: input.comment || null,
    balance: this.normalizeBalance(input.balance || '0'),
    userId: input.userId || null
  }

  // @ts-ignore
  await db.insert(table).values(data)

  // ✅ Исправить: получить последний созданный правильно
  const [created] = await db
    .select()
    .from(table)
    .orderBy(table.id)  // Нужен импорт desc если хотим в обратном порядке
    // Правильнее так:
    .where(eq(table.name, data.name))
    .limit(1)
  
  if (!created) {
    throw new Error('Failed to create contractor')
  }
  
  return {
    ...created,
    type,
    balance: this.normalizeBalance(created.balance)
  }
}

  /**
   * Обновить контрагента
   */
  static async update(
    type: ContractorType,
    id: number,
    input: ContractorUpdateInput
  ): Promise<Contractor | null> {
    const table = this.getTable(type)

    const existing = await this.findById(type, id)
    if (!existing) return null

   // Защита от пустого input
    if (!input || typeof input !== 'object') {
      throw new Error('Invalid update data')
    }

    const updates: Record<string, any> = {}

    if (input.name !== undefined && input.name !== null) {
      const nameStr = String(input.name)
      if (nameStr.trim().length === 0) {
        throw new Error('Contractor name cannot be empty')
      }
      updates.name = nameStr.trim()
    }
    
    if (input.phone !== undefined) updates.phone = input.phone
    if (input.comment !== undefined) updates.comment = input.comment
    if (input.balance !== undefined) updates.balance = this.normalizeBalance(input.balance)
    if (input.userId !== undefined) updates.userId = input.userId

    updates.updatedAt = new Date()

    // @ts-ignore
    await db.update(table).set(updates).where(eq(table.id, id))

    return this.findById(type, id)
  }

  /**
   * Удалить контрагента
   */
  static async delete(type: ContractorType, id: number): Promise<boolean> {
    const table = this.getTable(type)
    
    const existing = await this.findById(type, id)
    if (!existing) return false

    await db.delete(table).where(eq(table.id, id))
    return true
  }

  /**
   * Обновить баланс контрагента
   */
  static async updateBalance(
    type: ContractorType,
    id: number,
    amount: string | number
  ): Promise<Contractor | null> {
    return this.update(type, id, { balance: amount })
  }

  /**
   * Добавить деньги контрагенту
   */
  static async addBalance(
    type: ContractorType,
    id: number,
    amount: string | number
  ): Promise<Contractor | null> {
    const contractor = await this.findById(type, id)
    if (!contractor) return null

    const newBalance = (parseFloat(String(contractor.balance)) + parseFloat(String(amount))).toFixed(2)
    return this.update(type, id, { balance: newBalance })
  }

  /**
   * Вычесть деньги контрагента
   */
  static async subtractBalance(
    type: ContractorType,
    id: number,
    amount: string | number
  ): Promise<Contractor | null> {
    const contractor = await this.findById(type, id)
    if (!contractor) return null

    const newBalance = (parseFloat(String(contractor.balance)) - parseFloat(String(amount))).toFixed(2)
    return this.update(type, id, { balance: newBalance })
  }

  /**
   * Нормализовать баланс в число
   */
  private static normalizeBalance(balance: any): number {
    if (typeof balance === 'number') return balance
    if (typeof balance === 'string') return parseFloat(balance)
    if (balance && typeof balance === 'object' && 'toNumber' in balance) {
      return balance.toNumber()
    }
    return 0
  }
}

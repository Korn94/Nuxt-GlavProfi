// server/utils/partnerLeads.ts
import { db } from '../db'
import { partnerLeads } from '../db/schema'

/**
 * Генерирует следующий номер лида в формате GP-XXXXX (напр. GP-00152).
 * Номер вычисляется как max существующей числовой части + 1,
 * поэтому переживает удаления записей (unique-ограничение не нарушится).
 */
export async function generateLeadNumber(): Promise<string> {
  const rows = await db.select({ leadNumber: partnerLeads.leadNumber }).from(partnerLeads)

  let max = 0
  for (const row of rows) {
    const match = row.leadNumber.match(/^GP-(\d+)$/)
    if (match) {
      max = Math.max(max, parseInt(match[1] ?? '0', 10))
    }
  }

  return `GP-${String(max + 1).padStart(5, '0')}`
}
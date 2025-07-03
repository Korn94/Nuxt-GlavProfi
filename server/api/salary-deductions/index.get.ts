// server/api/salary-deductions/index.get.ts
import { defineEventHandler, getQuery } from 'h3'
import { db } from '../../db'
import { salaryDeductions } from '../../db/schema'
import { eq, and } from 'drizzle-orm' // Импорт `and`

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  
  // Преобразование параметров в числа
  const month = query.month ? parseInt(query.month as string) : null
  const year = query.year ? parseInt(query.year as string) : null

  let filters = []
  if (month) filters.push(eq(salaryDeductions.month, month))
  if (year) filters.push(eq(salaryDeductions.year, year))

  const result = await db.select().from(salaryDeductions)
    .where(filters.length > 0 ? and(...filters) : undefined) // Использование `and`

  return result
})

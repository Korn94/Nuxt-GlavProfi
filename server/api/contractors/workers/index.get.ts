// server/api/contractors/workers/index.get.ts
import { defineEventHandler } from 'h3'
import { db } from '../../../db'
import { workers } from '../../../db/schema'

export default defineEventHandler(async (event) => {
  try {
    const data = await db.select().from(workers)
    return data.map(item => ({ ...item, type: 'worker' }))
  } catch (error) {
    console.error('Ошибка получения рабочих:', error)
    throw new Error('Не удалось загрузить список рабочих')
  }
})

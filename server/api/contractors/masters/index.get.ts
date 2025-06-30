// server/api/contractors/masters/index.get.ts
import { defineEventHandler } from 'h3'
import { db } from '../../../db'
import { masters } from '../../../db/schema'

export default defineEventHandler(async () => {
  try {
    const allMasters = await db.select().from(masters)
    return allMasters
  } catch (error) {
    console.error('Ошибка получения мастеров:', error)
    throw new Error('Ошибка сервера при получении мастеров')
  }
})

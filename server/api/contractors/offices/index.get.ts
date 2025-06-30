// server/api/contractors/offices/index.get.ts
import { defineEventHandler } from 'h3'
import { db } from '../../../db'
import { offices } from '../../../db/schema'

export default defineEventHandler(async () => {
  try {
    const allOffices = await db.select().from(offices)
    return allOffices
  } catch (error) {
    console.error('Ошибка получения работника офиса:', error)
    throw new Error('Ошибка сервера при получении работника офиса')
  }
})

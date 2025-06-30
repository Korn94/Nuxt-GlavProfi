// server/api/objects/index.get.ts
import { defineEventHandler } from 'h3'
import { db } from '../../db'
import { objects } from '../../db/schema'

export default defineEventHandler(async () => {
  try {
    const allObjects = await db.select().from(objects)
    return allObjects
  } catch (error) {
    console.error('Ошибка получения объектов:', error)
    throw new Error('Не удалось получить список объектов')
  }
})

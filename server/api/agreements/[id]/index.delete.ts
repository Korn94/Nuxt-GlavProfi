// server/api/agreements/[id].delete.ts
import { defineEventHandler, getRouterParam } from 'h3'
import { db } from '../../../db'
import { agreements } from '../../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw new Error('ID договоренности обязателен')

  try {
    const [deletedAgreement] = await db.select().from(agreements).where(eq(agreements.id, parseInt(id)))
    if (!deletedAgreement) throw new Error('Договоренность не найдена')

    await db.delete(agreements).where(eq(agreements.id, parseInt(id)))

    return {
      message: 'Договоренность успешно удалена',
      deletedAgreement
    }
  } catch (error) {
    console.error('Ошибка удаления договоренности:', error)
    throw new Error('Ошибка сервера при удалении договоренности')
  }
})

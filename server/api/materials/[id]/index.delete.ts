// server/api/materials/[id].delete.ts
import { defineEventHandler, getRouterParam, createError } from 'h3'
import { db } from '../../../db'
import { materials, objects } from '../../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ID обязателен' })

  try {
    const [deleted] = await db.select().from(materials).where(eq(materials.id, parseInt(id)))
    if (!deleted) throw createError({ statusCode: 404, message: 'Материал не найден' })

    // Обновление баланса объекта
    if (deleted.objectId) {
      const [object] = await db.select().from(objects).where(eq(objects.id, deleted.objectId))
      if (object) {
        const currentBalance = Number(object.totalBalance)
        const materialAmount = Number(deleted.amount)
        const updatedBalance = currentBalance - materialAmount

        await db.update(objects)
          .set({ totalBalance: updatedBalance.toString() })
          .where(eq(objects.id, deleted.objectId))
      }
    }

    // Удаление
    await db.delete(materials).where(eq(materials.id, parseInt(id)))

    return {
      message: 'Материал успешно удален',
      deleted
    }
  } catch (error) {
    console.error('Ошибка удаления материала:', error)
    throw createError({ 
      statusCode: 500,
      message: 'Ошибка сервера при удалении материала' 
    })
  }
})

// server/api/users/[id]/delete.ts
import { defineEventHandler, getRouterParam, createError } from 'h3'
import { db } from '../../../db'
import { users, masters, workers, foremans, offices } from '../../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ID пользователя обязателен' })

  try {
    const [user] = await db.select().from(users).where(eq(users.id, parseInt(id)))
    if (!user) throw createError({ statusCode: 404, message: 'Пользователь не найден' })

    const { contractorType, contractorId } = user

    // Очищаем userId у контрагента, если он был
    if (contractorType && contractorId) {
      const ContractorModel = {
        master: masters,
        worker: workers,
        foreman: foremans,
        office: offices,
      }[contractorType]

      if (ContractorModel) {
        await db.update(ContractorModel)
          .set({ userId: null })
          .where(eq(ContractorModel.id, contractorId))
      }
    }

    // Удаляем пользователя
    await db.delete(users).where(eq(users.id, parseInt(id)))

    return { status: 'success', message: 'Пользователь удален' }
  } catch (error) {
    console.error('Ошибка удаления пользователя:', error)
    throw createError({
      statusCode: 500,
      message: 'Ошибка сервера при удалении пользователя'
    })
  }
})

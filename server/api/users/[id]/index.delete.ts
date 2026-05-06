/**
 * 📍 Файл: `server/api/users/[id]/delete.ts`
 * 📍 Эндпоинт: `DELETE /api/users/[id]`
 * 
 * Назначение: Удаление пользователя + отвязка от контрагента
 * ⚠️ Требует право `canDeleteRecords` (проверяется в мидлваре)
 * 
 * @param {string} id — ID пользователя (из пути)
 * @returns { status: 'success', message: string }
 */

import { defineEventHandler, getRouterParam, createError } from 'h3'
import { db } from '../../../db'
import { users, masters, workers, foremans, offices } from '../../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  // ✅ Авторизация и права уже проверены мидлваром
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ID пользователя обязателен' })

  try {
    const [user] = await db.select().from(users).where(eq(users.id, parseInt(id)))
    if (!user) throw createError({ statusCode: 404, message: 'Пользователь не найден' })

    const { contractorType, contractorId } = user

    // Отвязываем пользователя от контрагента (если был привязан)
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

    await db.delete(users).where(eq(users.id, parseInt(id)))
    return { status: 'success', message: 'Пользователь удален' }
    
  } catch (error) {
    console.error('[API/Users/Delete] Ошибка:', error)
    throw createError({ statusCode: 500, message: 'Ошибка сервера при удалении' })
  }
})

/**
* 📍 Файл: `server/api/users/[id]/delete.ts`
* 📍 Эндпоинт: `DELETE /api/users/[id]`
*
* Назначение: Удаление пользователя + отвязка от контрагента
* ⚠️ Требует право `canDeleteRecords` (проверяется в мидлваре)
*
* Логика:
* - Отвязка от старого контрагента (обнуление userId)
* - Удаление самого пользователя
* - Всё в одной транзакции: если удаление упадёт, отвязка откатится
*
* @param {string} id — ID пользователя (из пути)
* @returns { status: 'success', message: string }
*/

import { defineEventHandler, getRouterParam, createError } from 'h3'
import { db } from '../../../db'
import { users, masters, workers, foremans, offices } from '../../../db/schema'
import { eq } from 'drizzle-orm'

type ContractorType = 'master' | 'worker' | 'foreman' | 'office'

const CONTRACTOR_MODELS = {
  master: masters,
  worker: workers,
  foreman: foremans,
  office: offices
} as const

export default defineEventHandler(async (event) => {
  // ✅ Авторизация и права уже проверены мидлваром
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ID пользователя обязателен' })
  
  const userId = parseInt(id)

  try {
    // Получаем пользователя ПЕРЕД транзакцией (read-only)
    const [user] = await db.select().from(users).where(eq(users.id, userId))
    if (!user) throw createError({ statusCode: 404, message: 'Пользователь не найден' })

    const { contractorType, contractorId } = user

    // ✅ Все изменения в одной транзакции
    return await db.transaction(async (tx) => {
      // 1. Отвязываем пользователя от контрагента (если был привязан)
      if (contractorType && contractorId) {
        const ContractorModel = CONTRACTOR_MODELS[contractorType as ContractorType]
        if (ContractorModel) {
          await tx.update(ContractorModel)
            .set({ userId: null })
            .where(eq(ContractorModel.id, contractorId))
        }
      }

      // 2. Удаляем самого пользователя
      await tx.delete(users).where(eq(users.id, userId))

      return { status: 'success', message: 'Пользователь удален' }
    })
  } catch (error: any) {
    console.error('[API/Users/Delete] Ошибка:', error)
    
    // Пробрасываем HTTP-ошибки (404, 400) как есть
    if (error.statusCode) throw error
    
    throw createError({ statusCode: 500, message: 'Ошибка сервера при удалении' })
  }
})

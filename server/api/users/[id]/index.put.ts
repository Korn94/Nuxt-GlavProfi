// server/api/users/[id]/put.ts
/**
 * Назначение: Обновление данных пользователя + перепривязка к контрагенту
 * ⚠️ Требует роль `manager` (проверяется в мидлваре)
 * 
 * Логика:
 * - Отвязка от старого контрагента
 * - Привязка к новому контрагенту
 * - Обновление пользователя
 * - Всё в одной транзакции — если что-то упадёт, всё откатится
 * 
 * @body { name?, login?, role?, password?, contractorType?, contractorId? }
 * @returns { User } — обновлённые данные пользователя
 */

import { defineEventHandler, readBody, getRouterParam, createError } from 'h3'
import { db } from '../../../db'
import { users, masters, workers, foremans, offices } from '../../../db/schema'
import { eq } from 'drizzle-orm'
import bcryptjs from 'bcryptjs'

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
    const body = await readBody(event)
    const { name, login, role, password, contractorType, contractorId } = body

    if (!name && !login && !role && !password && contractorType === undefined && contractorId === undefined) {
      throw createError({ statusCode: 400, message: 'Нет данных для обновления' })
    }

    const updates: any = {}
    if (name) updates.name = name
    if (login) updates.login = login
    if (role) updates.role = role
    if (password) updates.password = await bcryptjs.hash(password, 10)

    // Получаем старого пользователя (read-only, вне транзакции)
    const [oldUser] = await db.select().from(users).where(eq(users.id, userId))
    if (!oldUser) throw createError({ statusCode: 404, message: 'Пользователь не найден' })

    // ✅ Все изменения в одной транзакции
    return await db.transaction(async (tx) => {
      // 1. Отвязываем от старого контрагента
      if (oldUser.contractorType && oldUser.contractorId) {
        const OldModel = CONTRACTOR_MODELS[oldUser.contractorType as ContractorType]
        if (OldModel) {
          await tx.update(OldModel)
            .set({ userId: null })
            .where(eq(OldModel.id, oldUser.contractorId))
        }
      }

      // 2. Привязываем к новому контрагенту
      if (contractorType && contractorId) {
        const NewModel = CONTRACTOR_MODELS[contractorType.toLowerCase() as ContractorType]
        if (!NewModel) throw createError({ statusCode: 400, message: `Неизвестный тип: ${contractorType}` })
        await tx.update(NewModel)
          .set({ userId: userId })
          .where(eq(NewModel.id, contractorId))
      }

      updates.contractorType = contractorType || null
      updates.contractorId = contractorId || null

      // 3. Обновляем пользователя
      await tx.update(users).set(updates).where(eq(users.id, userId))

      // 4. Получаем обновлённого пользователя
      const [updatedUser] = await tx.select().from(users).where(eq(users.id, userId))
      return updatedUser
    })
  } catch (error) {
    console.error('[API/Users/Update] Ошибка:', error)
    throw createError({ statusCode: 500, message: 'Ошибка сервера при обновлении' })
  }
})

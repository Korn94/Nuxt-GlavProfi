// server/api/users/[id]/put.ts
/**
 * Назначение: Обновление данных пользователя + перепривязка к контрагенту
 * ⚠️ Требует роль `manager` (проверяется в мидлваре)
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

    const [oldUser] = await db.select().from(users).where(eq(users.id, parseInt(id)))
    if (!oldUser) throw createError({ statusCode: 404, message: 'Пользователь не найден' })

    // Отвязываем от старого контрагента
    if (oldUser.contractorType && oldUser.contractorId) {
      const OldModel = CONTRACTOR_MODELS[oldUser.contractorType as ContractorType]
      if (OldModel) {
        await db.update(OldModel).set({ userId: null }).where(eq(OldModel.id, oldUser.contractorId))
      }
    }

    // Привязываем к новому контрагенту
    if (contractorType && contractorId) {
      const NewModel = CONTRACTOR_MODELS[contractorType.toLowerCase() as ContractorType]
      if (!NewModel) throw createError({ statusCode: 400, message: `Неизвестный тип: ${contractorType}` })
      await db.update(NewModel).set({ userId: parseInt(id) }).where(eq(NewModel.id, contractorId))
    }

    updates.contractorType = contractorType || null
    updates.contractorId = contractorId || null

    await db.update(users).set(updates).where(eq(users.id, parseInt(id)))
    const [updatedUser] = await db.select().from(users).where(eq(users.id, parseInt(id)))

    return updatedUser
  } catch (error) {
    console.error('[API/Users/Update] Ошибка:', error)
    throw createError({ statusCode: 500, message: 'Ошибка сервера при обновлении' })
  }
})

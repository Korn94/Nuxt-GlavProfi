// server/api/users/[id]/put.ts
import { defineEventHandler, readBody, getRouterParam, createError } from 'h3'
import { db } from '../../../db'
import {
  users,
  masters,
  workers,
  foremans,
  offices
} from '../../../db/schema'
import { eq } from 'drizzle-orm'
import bcryptjs from 'bcryptjs'

// Допустимые типы контрагентов
type ContractorType = 'master' | 'worker' | 'foreman' | 'office'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, message: 'ID пользователя обязателен' })
  }

  try {
    const {
      name,
      login,
      role,
      password,
      contractorType,
      contractorId
    } = await readBody(event)

    // Проверяем, есть ли данные для обновления
    if (
      !name &&
      !login &&
      !role &&
      !password &&
      contractorType === undefined &&
      contractorId === undefined
    ) {
      throw createError({ statusCode: 400, message: 'Нет данных для обновления' })
    }

    const updates: any = {}

    if (name) updates.name = name
    if (login) updates.login = login
    if (role) updates.role = role
    if (password) updates.password = await bcryptjs.hash(password, 10)

    // Получаем текущего пользователя
    const [oldUser] = await db.select().from(users).where(eq(users.id, parseInt(id)))

    if (!oldUser) {
      throw createError({ statusCode: 404, message: 'Пользователь не найден' })
    }

    const oldContractorType = oldUser.contractorType as ContractorType | null
    const oldContractorId = oldUser.contractorId

    // Если был предыдущий контрагент — очищаем его userId
    if (oldContractorType && oldContractorId) {
      let OldContractorModel = null

      switch (oldContractorType) {
        case 'master':
          OldContractorModel = masters
          break
        case 'worker':
          OldContractorModel = workers
          break
        case 'foreman':
          OldContractorModel = foremans
          break
        case 'office':
          OldContractorModel = offices
          break
        default:
          console.warn('Неизвестный тип контрагента:', oldContractorType)
      }

      if (OldContractorModel) {
        await db
          .update(OldContractorModel)
          .set({ userId: null })
          .where(eq(OldContractorModel.id, oldContractorId))
      }
    }

    // Проставляем новый userId у нового контрагента
    if (contractorType && contractorId) {
      let ContractorModel = null

      switch (contractorType.toLowerCase()) {
        case 'master':
          ContractorModel = masters
          break
        case 'worker':
          ContractorModel = workers
          break
        case 'foreman':
          ContractorModel = foremans
          break
        case 'office':
          ContractorModel = offices
          break
        default:
          throw createError({
            statusCode: 400,
            message: `Неизвестный тип контрагента: ${contractorType}`
          })
      }

      await db
        .update(ContractorModel)
        .set({ userId: parseInt(id) })
        .where(eq(ContractorModel.id, contractorId))
    }

    // Обновляем пользователя
    updates.contractorType = contractorType || null
    updates.contractorId = contractorId || null

    await db.update(users).set(updates).where(eq(users.id, parseInt(id)))

    // Возвращаем обновлённого пользователя
    const [updatedUser] = await db.select().from(users).where(eq(users.id, parseInt(id)))

    return updatedUser
  } catch (error) {
    console.error('Ошибка обновления пользователя:', error)
    throw createError({
      statusCode: 500,
      message: 'Ошибка сервера при обновлении пользователя'
    })
  }
})

// server/api/contractors/index.post.ts
import { defineEventHandler, readBody } from 'h3'
import { db } from '../../db'
import {
  masters,
  workers,
  foremans,
  offices,
  users
} from '../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)

    if (!body.type || !body.data) {
      throw new Error('Не указан тип или данные')
    }

    const { type, data } = body
    let ContractorModel

    switch (type.toLowerCase()) {
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
        throw new Error('Неверный тип контрагента')
    }

    // Добавляем контрагента
    const [newContractor] = await db.insert(ContractorModel).values(data).$returningId()

    // Если указан userId — обновляем пользователя
    if (data.userId) {
      await db
        .update(users)
        .set({
          contractorType: type,
          contractorId: newContractor.id
        })
        .where(eq(users.id, data.userId))
    }

    return {
      status: 'success',
      data: newContractor
    }
  } catch (error) {
    console.error('Ошибка создания контрагента:', error)
    throw new Error('Ошибка сервера при создании контрагента')
  }
})

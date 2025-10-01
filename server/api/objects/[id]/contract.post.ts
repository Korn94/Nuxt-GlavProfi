// server/api/objects/[id]/contract.post.ts
import { defineEventHandler, readBody, getRouterParam, createError } from 'h3'
import { db } from '../../../db'
import { objectContracts } from '../../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (isNaN(id)) {
    throw createError({ statusCode: 400, message: 'Неверный ID' })
  }

  const body = await readBody(event)
  const { type, status = 'prepared', comment } = body

  if (!type || !['edo', 'paper', 'invoice'].includes(type)) {
    throw createError({ statusCode: 400, message: 'Укажите корректный тип договора' })
  }

  try {
    // Проверяем, нет ли уже договора
    const existingContract = await db
      .select()
      .from(objectContracts)
      .where(eq(objectContracts.objectId, id))
      .limit(1)

    if (existingContract.length > 0) {
      throw createError({ statusCode: 409, message: 'Договор уже существует' })
    }

    // Вставляем новый договор
    // Не передаём createdAt, updatedAt, statusDate — они будут установлены по умолчанию
    const [newContract] = await db
      .insert(objectContracts)
      .values({
        objectId: id,
        type,
        status,
        comment
      })
      .$returningId()

    return newContract
  } catch (error) {
    console.error('Ошибка создания договора:', error)
    throw createError({ statusCode: 500, message: 'Не удалось создать договор' })
  }
})

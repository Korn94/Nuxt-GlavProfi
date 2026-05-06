// server/api/objects/[id]/contract.get.ts
/**
 * Назначение: Получение договора объекта (один договор на объект)
 * ⚠️ Требует право `canViewObjects` (проверяется в мидлваре)
 * 
 * @param {string} id — ID объекта (из пути)
 * @returns { Contract | null } — договор или null, если не создан
 */

import { defineEventHandler, getRouterParam, createError } from 'h3'
import { db } from '../../../db'
import { objectContracts } from '../../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  // ✅ Авторизация и права уже проверены мидлваром
  const id = Number(getRouterParam(event, 'id'))
  if (isNaN(id)) throw createError({ statusCode: 400, message: 'Неверный ID' })

  const [contract] = await db.select().from(objectContracts).where(eq(objectContracts.objectId, id))
  return contract || null
})

// server/api/objects/[id]/index.get.ts
/**
 * Назначение: Получение данных объекта с информацией о прорабе
 * ⚠️ Требует право `canViewObjects` (проверяется в мидлваре)
 * 
 * @param {string} id — ID объекта (из пути)
 * @returns { Object & { foreman: { id, name, phone } | null } }
 */

import { defineEventHandler, getRouterParam, createError } from 'h3'
import { db } from '../../../db'
import { objects, foremans } from '../../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  // ✅ Авторизация и права уже проверены мидлваром
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ID объекта обязателен' })

  const [objectWithForeman] = await db
    .select({ object: objects, foreman: foremans })
    .from(objects)
    .leftJoin(foremans, eq(objects.foremanId, foremans.id))
    .where(eq(objects.id, parseInt(id)))

  if (!objectWithForeman?.object) throw createError({ statusCode: 404, message: 'Объект не найден' })

  return {
    ...objectWithForeman.object,
    foreman: objectWithForeman.foreman
      ? { id: objectWithForeman.foreman.id, name: objectWithForeman.foreman.name, phone: objectWithForeman.foreman.phone }
      : null
  }
})

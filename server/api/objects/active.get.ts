// server/api/objects/active.get.ts
/**
 * Назначение: Получение списка только активных объектов.
 * ⚠️ Требует право `objects: view` (проверяется в мидлваре).
 *
 * @returns { Array<{ id: number, name: string, status: string }> } — активные объекты
 */

import { defineEventHandler } from 'h3'
import { db } from '../../db'
import { objects } from '../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async () => {
  return await db
    .select({
      id: objects.id,
      name: objects.name,
      status: objects.status
    })
    .from(objects)
    .where(eq(objects.status, 'active'))
    .orderBy(objects.name)
})
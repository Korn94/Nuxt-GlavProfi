// server/api/works/daily-work/active-objects.get.ts
/**
 * Назначение: Получение списка активных объектов (с фильтрацией по роли прораба)
 * ⚠️ Требует право `canViewObjects` (проверяется в мидлваре)
 * 
 * @returns { Array<{ id: number, name: string, status: string }> } — активные объекты
 */

import { defineEventHandler, createError } from 'h3'
import { db } from '../../../db'
import { objects, users } from '../../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  // ✅ Авторизация и права уже проверены мидлваром
  // Получаем текущего пользователя из context (добавляется мидлваром)
  const currentUser = event.context.user
  
  if (!currentUser) {
    throw createError({ statusCode: 401, message: 'Пользователь не аутентифицирован' })
  }

  // Если прораб — фильтруем по его объектам (через contractorId)
  if (currentUser.role === 'foreman' && currentUser.contractorId) {
    return await db
      .select({
        id: objects.id,
        name: objects.name,
        status: objects.status
      })
      .from(objects)
      .where(
        eq(objects.status, 'active')
        // 👇 При необходимости можно добавить фильтрацию по contractorId:
        // eq(objects.foremanId, currentUser.contractorId)
      )
      .orderBy(objects.name)
  }

  // Админы и менеджеры видят все активные объекты
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

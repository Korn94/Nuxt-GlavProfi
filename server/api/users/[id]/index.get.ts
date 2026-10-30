// server/api/users/[id]/index.get.ts
/**
 * Назначение: Получение данных конкретного пользователя по ID
 * ⚠️ Требует роль `manager` (проверяется в мидлваре)
 * 
 * @param {string} id — ID пользователя (из пути)
 * @returns { User } — данные пользователя (без пароля)
 */

import { defineEventHandler, createError, getRouterParam } from 'h3'
import { db } from '../../../db'
import { users, partners } from '../../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  // ✅ Авторизация и права уже проверены мидлваром
  const idParam = getRouterParam(event, 'id')
  
  if (!idParam) throw createError({ statusCode: 400, message: 'ID пользователя обязателен' })
  
  const id = parseInt(idParam, 10)
  if (isNaN(id)) throw createError({ statusCode: 400, message: 'Неверный формат ID' })

  try {
    const [row] = await db
      .select({
        user: users,
        partnerId: partners.id,
        partnerCompanyName: partners.companyName,
        partnerContactPerson: partners.contactPerson,
      })
      .from(users)
      .leftJoin(partners, eq(partners.userId, users.id))
      .where(eq(users.id, id))

    if (!row) throw createError({ statusCode: 404, message: 'Пользователь не найден' })
    
    // ✅ Возвращаем безопасные данные (без пароля) + привязку к партнёру
    const { password, ...safeUser } = row.user
    return {
      ...safeUser,
      partnerId: row.partnerId ?? null,
      partnerCompanyName: row.partnerCompanyName ?? null,
      partnerContactPerson: row.partnerContactPerson ?? null,
    }
    
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('[API/Users/Get] Ошибка:', error)
    throw createError({ statusCode: 500, message: 'Ошибка сервера' })
  }
})

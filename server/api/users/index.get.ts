// server/api/users/index.get.ts
/**
 * Назначение: Получение списка всех пользователей (для админ-панели)
 * ⚠️ Требует роль `manager` (проверяется в мидлваре)
 * 
 * @returns { users: User[] } — массив пользователей (без паролей)
 */

import { eventHandler } from 'h3'
import { db } from '../../db'
import { users, partners } from '../../db/schema'
import { eq } from 'drizzle-orm'

export default eventHandler(async (event) => {
  // ✅ Авторизация и права уже проверены мидлваром
  // const currentUser = event.context.user // если нужно

  const rows = await db
    .select({
      user: users,
      partnerId: partners.id,
      partnerCompanyName: partners.companyName,
      partnerContactPerson: partners.contactPerson,
    })
    .from(users)
    .leftJoin(partners, eq(partners.userId, users.id))

  // ✅ Исключаем пароли из ответа + возвращаем привязку к профилю партнёра
  const safeUsers = rows.map(({ user, partnerId, partnerCompanyName, partnerContactPerson }) => {
    const { password, ...u } = user
    return {
      ...u,
      partnerId: partnerId ?? null,
      partnerCompanyName: partnerCompanyName ?? null,
      partnerContactPerson: partnerContactPerson ?? null,
    }
  })

  return { users: safeUsers }
})

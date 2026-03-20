// server/utils/objects.ts
import { db } from '../db'
import { users, objects } from '../db/schema'
import { eq } from 'drizzle-orm'

export async function getObjectsByUser(userId: number) {
  // Получаем роль пользователя
  const [user] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, userId))

  if (!user) {
    return []
  }

  // Админ видит все объекты
  if (user.role === 'admin') {
    return await db.select().from(objects)
  }

  // Прораб видит только свои объекты
  if (user.role === 'foreman') {
    return await db
      .select()
      .from(objects)
      .where(eq(objects.foremanId, userId))
  }

  // Другие роли (по вашей логике)
  return []
}

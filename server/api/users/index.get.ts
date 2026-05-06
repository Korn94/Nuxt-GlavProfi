// server/api/users/index.get.ts
/**
 * Назначение: Получение списка всех пользователей (для админ-панели)
 * ⚠️ Требует роль `manager` (проверяется в мидлваре)
 * 
 * @returns { users: User[] } — массив пользователей (без паролей)
 */

import { eventHandler } from 'h3'
import { db } from '../../db'
import { users } from '../../db/schema'

export default eventHandler(async (event) => {
  // ✅ Авторизация и права уже проверены мидлваром
  // const currentUser = event.context.user // если нужно
  
  const allUsers = await db.select().from(users)
  
  // ✅ Исключаем пароли из ответа
  const safeUsers = allUsers.map(({ password, ...u }) => u)
  
  return { users: safeUsers }
})

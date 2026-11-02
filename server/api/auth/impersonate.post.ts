// server/api/auth/impersonate.post.ts
/**
 * 📍 Эндпоинт: POST /api/auth/impersonate
 *
 * Назначение:
 * - Админ начинает «просмотр кабинета от имени» выбранного пользователя (read-only).
 * - Возвращает короткоживущий `viewToken` + данные целевого пользователя + права,
 *   чтобы клиент переключил интерфейс «как у пользователя».
 *
 * ⚠️ Защищён мидлваром: right `role: admin` (см. server/middleware/auth.ts).
 * Токен просмотра НЕ меняет авторизацию сокета, поэтому целевой пользователь
 * не попадает в онлайн и не получает new session / lastSeenAt.
 *
 * @body { userId: number }
 * @returns { viewToken, user, permissions, impersonatedBy }
 */

import { eventHandler, readBody, createError } from 'h3'
import { z } from 'zod'
import { db } from '../../db'
import { users } from '../../db/schema'
import { eq } from 'drizzle-orm'
import { createImpersonationToken } from '../../utils/impersonation'
import { getUserPermissionsResponse } from '../../utils/permissions'
import type { DbUser } from '../../utils/impersonation'

const BodySchema = z.object({
  userId: z.number().int().positive()
})

export default eventHandler(async (event) => {
  // Реальный пользователь (админ) — установлен мидлваром
  const admin = event.context.user as DbUser | undefined

  // Defence in depth: даже если мидлвар обойдут — проверяем роль ещё раз
  if (!admin || admin.role !== 'admin') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Только администратор может просматривать от имени пользователя'
    })
  }

  const parse = BodySchema.safeParse(await readBody(event))
  if (!parse.success) {
    throw createError({ statusCode: 400, statusMessage: 'Некорректный userId' })
  }
  const { userId } = parse.data

  if (userId === admin.id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Нельзя смотреть от имени самого себя'
    })
  }

  const [target] = await db.select().from(users).where(eq(users.id, userId)).limit(1)

  if (!target) {
    throw createError({ statusCode: 404, statusMessage: 'Пользователь не найден' })
  }
  if (target.deletedAt) {
    throw createError({ statusCode: 404, statusMessage: 'Пользователь удалён' })
  }
  if (target.isBlocked) {
    throw createError({ statusCode: 403, statusMessage: 'Пользователь заблокирован' })
  }

  const viewToken = await createImpersonationToken(admin.id, target.id, target.login, target.role)
  const permissions = await getUserPermissionsResponse(target)

  const adminName = admin.name || admin.login

  console.log(
    `[Impersonation] 🔎 Админ ${adminName} (ID: ${admin.id}) смотрит от имени пользователя ` +
    `"${target.name}" (ID: ${target.id}, роль: ${target.role})`
  )

  return {
    viewToken,
    user: {
      id: target.id,
      login: target.login,
      name: target.name || target.login,
      role: target.role,
      createdAt: target.createdAt,
      updatedAt: target.updatedAt
    },
    permissions,
    impersonatedBy: {
      id: admin.id,
      name: adminName,
      login: admin.login,
      role: admin.role
    }
  }
})

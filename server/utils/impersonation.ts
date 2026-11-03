// server/utils/impersonation.ts
/**
 * 🎭 Имперсонация — «просмотр кабинета от имени пользователя» (read-only).
 *
 * Идея:
 * - Реальный `auth_token` администратора НЕ меняется → сокет и онлайн-статус
 *   остаются админскими, а проверяемый пользователь НЕ появляется онлайн,
 *   для него НЕ создаётся сессия и НЕ обновляется `lastSeenAt`.
 * - Дополнительно выдаётся короткоживущий `view_token` в отдельной cookie.
 *   На каждом запросе сервер резолвит «эффективного» пользователя: если
 *   `view_token` валиден — возвращается целевой пользователь (для данных и прав),
 *   а реальный админ сохраняется в `event.context.realUser` для аудита.
 */

import { getCookie, type H3Event } from 'h3'
import { generateToken, verifyToken } from './jwt'
import { db } from '../db'
import { users } from '../db/schema'
import { eq } from 'drizzle-orm'
// Тип пользователя БД — единый источник в server/utils/permissions
// (иначе Nitro ругается: Duplicated imports "DbUser")
import type { DbUser } from './permissions'

/** Название cookie с токеном просмотра */
export const VIEW_TOKEN_COOKIE = 'view_token'

/** Время жизни токена просмотра (короткое) */
const VIEW_TOKEN_TTL = '60m' as const

/**
 * Создать короткоживущий токен просмотра от имени целевого пользователя.
 * @param adminId — ID реального администратора
 * @param targetId — ID целевого пользователя (за кого смотрим)
 */
export async function createImpersonationToken(
  adminId: number,
  targetId: number,
  login: string,
  role: string
): Promise<string> {
  return generateToken(
    {
      id: targetId,
      login,
      role,
      impersonatorId: adminId,
      imp: true,
    },
    VIEW_TOKEN_TTL
  )
}

/**
 * Извлечь токен просмотра из cookie.
 */
export function getViewToken(event: H3Event): string | null {
  const raw = getCookie(event, VIEW_TOKEN_COOKIE)
  if (!raw || raw.length < 20) return null
  return raw
}

export interface ResolvedEffectiveUser {
  /** Пользователь, от имени которого выполняется запрос (цель или сам админ) */
  user: DbUser
  /** Реальный администратор, если включён режим просмотра (иначе null) */
  realUser: DbUser | null
  /** Флаг активного режима просмотра */
  impersonating: boolean
}

/**
 * Резолв «эффективного» пользователя запроса.
 *
 * @param event — H3 событие
 * @param realUser — реальный пользователь, аутентифицированный по `auth_token`
 * @returns { user, realUser, impersonating }
 *
 * Ошибки view_token (истёк/подделан/несоответствие admin) молча игнорируются:
 * запрос продолжает выполняться от реального (админского) пользователя.
 */
export async function resolveEffectiveUser(
  event: H3Event,
  realUser: DbUser
): Promise<ResolvedEffectiveUser> {
  // Имперсонировать может только администратор
  if (realUser.role !== 'admin') {
    return { user: realUser, realUser: null, impersonating: false }
  }

  const viewToken = getViewToken(event)
  if (!viewToken) {
    return { user: realUser, realUser: null, impersonating: false }
  }

  let payload
  try {
    payload = await verifyToken(viewToken)
  } catch {
    return { user: realUser, realUser: null, impersonating: false }
  }

  // Токен должен быть именно имперсонационным и выдан текущему админу
  if (
    !payload ||
    payload.imp !== true ||
    typeof payload.id !== 'number' ||
    payload.impersonatorId !== realUser.id
  ) {
    return { user: realUser, realUser: null, impersonating: false }
  }

  // Защита от просмотра самого себя
  if (payload.id === realUser.id) {
    return { user: realUser, realUser: null, impersonating: false }
  }

  const [target] = await db
    .select()
    .from(users)
    .where(eq(users.id, payload.id))
    .limit(1)

  if (!target || target.deletedAt || target.isBlocked) {
    return { user: realUser, realUser: null, impersonating: false }
  }

  return { user: target, realUser, impersonating: true }
}

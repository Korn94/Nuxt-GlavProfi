/**
 * 📍 Эндпоинт: GET /api/me
 * 
 * Назначение:
 * - Проверка статуса авторизации текущего пользователя
 * - Возврат базовых данных профиля (без чувствительных полей)
 * - Используется на публичных страницах для отображения шапки/меню
 * 
 * ⚠️ ВАЖНО: Это "мягкая" проверка — эндпоинт НИКОГДА не выбрасывает 401.
 * Если пользователь не авторизован — возвращается { user: null },
 * чтобы не ломать SSR-рендеринг публичных страниц.
 * 
 * @returns { user: UserData | null }
 * 
 * Примеры ответов:
 * ✅ Авторизован: { user: { id: 1, login: "admin", role: "admin", name: "Александр" } }
 * ✅ Гость:      { user: null }
 */

import { eventHandler } from 'h3'
import { db } from '../db'
import { users } from '../db/schema'
import { eq } from 'drizzle-orm'
import { verifyToken } from '../utils/jwt'
import { extractJwt } from '../utils/cookies'
import { resolveEffectiveUser } from '../utils/impersonation'

export default eventHandler(async (event) => {
  // ============================================
  // 1. ИЗВЛЕЧЕНИЕ ТОКЕНА
  // ============================================
  // ✅ Используем централизованный хелпер (поддержка старого и нового формата куки)
  const token = extractJwt(event)

  // ============================================
  // 2. ПРОВЕРКА: НЕТ ТОКЕНА = ГОСТЬ
  // ============================================
  // Это нормальная ситуация для публичных страниц — не ошибка!
  if (!token) {
    return { user: null }
  }

  try {
    // ============================================
    // 3. ВЕРИФИКАЦИЯ ТОКЕНА
    // ============================================
    const payload = await verifyToken(token)
    
    // Проверка формата payload (защита от невалидных токенов)
    if (typeof payload.id !== 'number') {
      return { user: null }
    }

    // ============================================
    // 4. ПОЛУЧЕНИЕ ДАННЫХ ПОЛЬЗОВАТЕЛЯ ИЗ БД
    // ============================================
    const [realUser] = await db.select().from(users).where(eq(users.id, payload.id))
    
    // Пользователь не найден (удалён, деактивирован) — возвращаем null
    if (!realUser) {
      return { user: null }
    }

    // ============================================
    // 5. ФОРМИРОВАНИЕ БЕЗОПАСНОГО ОТВЕТА
    // ============================================
    // ✅ Возвращаем только публичные поля (никаких паролей, токенов, внутренних данных)
    // 🎭 Имперсонация: если админ смотрит «от имени» пользователя — возвращаем целевого
    const resolved = await resolveEffectiveUser(event, realUser)

    return {
      user: {
        id: resolved.user.id,
        login: resolved.user.login,
        role: resolved.user.role,
        name: resolved.user.name,
        contractorId: resolved.user.contractorId || undefined,
        contractorType: resolved.user.contractorType || undefined,
      },
      impersonating: resolved.impersonating
    }
  } catch (error) {
    // ============================================
    // 6. ОБРАБОТКА ОШИБОК
    // ============================================
    // Любая ошибка (БД, крипто, сеть) — логируем и возвращаем null
    // Это предотвращает краш SSR при проблемах с инфраструктурой
    console.error('[/api/me] Ошибка верификации токена:', error)
    return { user: null }
  }
})

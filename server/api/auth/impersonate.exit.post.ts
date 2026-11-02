// server/api/auth/impersonate.exit.post.ts
/**
 * 📍 Эндпоинт: POST /api/auth/impersonate/exit
 *
 * Назначение:
 * - Выход из режима «просмотр от имени пользователя».
 * - Токен просмотра сбрасывается на клиенте (cookie `view_token` удаляется).
 *
 * ⚠️ Публичный эндпоинт (в PUBLIC_PATHS), т.к. реальный auth_token администратора
 * не меняется и выход возможен даже при истёкшем view_token. Здесь ничего не
 * сбрасываем серверно — просто подтверждаем успех (по аналогии с logout).
 */

import { eventHandler } from 'h3'

export default eventHandler(async () => {
  return { success: true }
})

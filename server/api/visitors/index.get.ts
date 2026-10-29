/**
 * 📍 Эндпоинт: GET /api/visitors
 *
 * Назначение:
 * - Возврат списка посетителей публичного сайта (анонимных) из in-memory реестра.
 * - Используется на странице /cabinet/online (карточка «Посетители сайта»).
 *
 * Доступ: право users:view (см. PROTECTED_PATHS в server/middleware/auth.ts) —
 * та же аудитория, что у GET /api/online и socket-события visitors:update.
 *
 * @returns { visitors: ActiveVisitor[], total: number }
 */

import { defineApi } from '../../utils/defineApi'
import { getActiveVisitors } from '../../utils/visitorRegistry'

export default defineApi(async () => {
  const visitors = getActiveVisitors()

  return {
    visitors,
    total: visitors.length
  }
})

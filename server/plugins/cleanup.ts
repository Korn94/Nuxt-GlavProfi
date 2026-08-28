// server/plugins/cleanup.ts
import { defineNitroPlugin } from 'nitropack/runtime/plugin'
import { cleanupOldSessions } from '../utils/sessions'

/**
 * Плагин для автоматической очистки старых сессий из базы данных
 * 
 * ✅ РЕФАКТОРИНГ: устранён костыль для корректировки онлайна.
 * - Убраны MySQL-блокировки GET_LOCK()/RELEASE_LOCK() (спам "Блокировка не получена"
 *   при нескольких инстансах) — cleanup больше не координируется через блокировки.
 * - Убраны таймеры "закрытия висячих offline-сессий" (15 мин) и "очистки зомби-сессий"
 *   (5 мин). Корректный онлайн теперь вычисляется в getOnlineUsers() по lastActivity.
 * - Осталась только легитимная гигиена таблицы user_sessions: удаление старых записей.
 */
export default defineNitroPlugin(() => {
  console.log('[CleanupPlugin] Initializing cleanup plugin...')

  // ============================================
  // Полная дневная очистка (раз в сутки)
  // ============================================
  async function dailyCleanup() {
    const deletedCount = await cleanupOldSessions(30)
    console.log(`[CleanupPlugin] ✅ Дневная очистка завершена: удалено ${deletedCount} старых сессий`)
    return deletedCount
  }

  // Первичный запуск через 5 секунд после старта
  setTimeout(() => {
    dailyCleanup().catch(err =>
      console.error('[CleanupPlugin] ❌ Ошибка dailyCleanup:', err)
    )
  }, 5000)

  // Каждые 24 часа — гигиена таблицы сессий
  setInterval(() => {
    dailyCleanup().catch(err =>
      console.error('[CleanupPlugin] ❌ Ошибка dailyCleanup:', err)
    )
  }, 24 * 60 * 60 * 1000)

  console.log('[CleanupPlugin] ✅ Cleanup plugin initialized')
  console.log('[CleanupPlugin] 📋 Расписание:')
  console.log('[CleanupPlugin]   - Очистка старых сессий: при старте + каждые 24 часа')
})

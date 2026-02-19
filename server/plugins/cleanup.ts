// server/plugins/cleanup.ts
import { defineNitroPlugin } from 'nitropack/runtime/plugin'
import { cleanupOldSessions } from '../utils/sessions'

/**
 * Плагин для автоматической очистки старых сессий из базы данных
 * Запускается раз в сутки в 3:00 по МСК
 */
export default defineNitroPlugin(() => {
  console.log('[CleanupPlugin] Initializing cleanup plugin...')
  
  /**
   * Планирование ежедневной очистки
   * Запускается в 3:00 по МСК (после основной активности пользователей)
   */
  const scheduleDailyCleanup = () => {
    const now = new Date()
    const nextRun = new Date(now)
    
    // Устанавливаем время следующего запуска: 3:00 утра
    nextRun.setHours(3, 0, 0, 0)
    
    // Если время уже прошло сегодня, запускаем завтра
    if (nextRun <= now) {
      nextRun.setDate(nextRun.getDate() + 1)
    }
    
    const delay = nextRun.getTime() - now.getTime()
    
    console.log(`[CleanupPlugin] Next cleanup scheduled at: ${nextRun.toLocaleString('ru-RU')}`)
    console.log(`[CleanupPlugin] Delay: ${Math.floor(delay / 1000 / 60)} минут`)
    
    setTimeout(async () => {
      console.log('[CleanupPlugin] 🧹 Starting daily cleanup...')
      
      try {
        // Очищаем сессии старше 30 дней
        const deletedCount = await cleanupOldSessions(30)
        
        console.log(`[CleanupPlugin] ✅ Cleanup completed: ${deletedCount} old sessions removed`)
      } catch (error) {
        console.error('[CleanupPlugin] ❌ Cleanup failed:', error)
      } finally {
        // Рекурсивно планируем следующий запуск
        scheduleDailyCleanup()
      }
    }, delay)
  }
  
  // Запускаем планировщик
  scheduleDailyCleanup()
  
  console.log('[CleanupPlugin] ✅ Cleanup plugin initialized')
})

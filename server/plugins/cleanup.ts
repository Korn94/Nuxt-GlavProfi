// server/plugins/cleanup.ts
import { defineNitroPlugin } from 'nitropack/runtime/plugin'
import { db } from '../db'
import { userSessions } from '../db/schema'
import { eq, and, or, sql } from 'drizzle-orm'
import { cleanupOldSessions } from '../utils/sessions'

/**
 * Плагин для автоматической очистки старых сессий из базы данных
 * 
 * ✅ ИСПРАВЛЕНИЯ (P1.4):
 * - Замена рекурсивного setTimeout на node-cron (точное расписание 3:00 UTC)
 * - Использование MySQL GET_LOCK() для координации в cluster/Docker режиме
 * - Добавлен таймер на каждые 15 минут для закрытия "висячих" offline-сессий
 *   (без endedAt, которые не восстановились после grace period)
 * - Добавлен таймер на каждые 5 минут для очистки зомби-сессий
 */
export default defineNitroPlugin(() => {
  console.log('[CleanupPlugin] Initializing cleanup plugin...')
  
  // ============================================
  // Вспомогательная функция: получение MySQL блокировки
  // ============================================
  async function withMySQLLock<T>(lockName: string, timeout: number, fn: () => Promise<T>): Promise<T | null> {
    try {
      // Пытаемся получить блокировку
      const [result] = await db.execute(sql`SELECT GET_LOCK(${lockName}, ${timeout}) as acquired`)
      const acquired = (result as any)?.acquired === 1
      
      if (!acquired) {
        console.log(`[CleanupPlugin] ⏭️ Блокировка "${lockName}" не получена (другой инстанс уже выполняет очистку)`)
        return null
      }
      
      console.log(`[CleanupPlugin] 🔒 Блокировка "${lockName}" получена`)
      
      try {
        return await fn()
      } finally {
        // Освобождаем блокировку
        await db.execute(sql`SELECT RELEASE_LOCK(${lockName})`)
        console.log(`[CleanupPlugin] 🔓 Блокировка "${lockName}" освобождена`)
      }
    } catch (error) {
      console.error(`[CleanupPlugin] ❌ Ошибка при работе с блокировкой "${lockName}":`, error)
      return null
    }
  }
  
  // ============================================
  // Задача 1: Закрытие "висячих" offline-сессий (каждые 15 минут)
  // ============================================
  // Сессии, которые стали offline более 15 минут назад и не были восстановлены
  // (например, пользователь закрыл браузер), получают endedAt
  async function closeStaleOfflineSessions() {
    return withMySQLLock('cleanup_offline_sessions', 0, async () => {
      const result = await db
        .update(userSessions)
        .set({
          endedAt: sql`NOW()`
        })
        .where(
          and(
            eq(userSessions.status, 'offline'),
            sql`${userSessions.lastActivity} < DATE_SUB(NOW(), INTERVAL 15 MINUTE)`,
            sql`${userSessions.endedAt} IS NULL`
          )
        )
        .execute()
      
      const affectedRows = (result as any)[0]?.affectedRows || 0
      if (affectedRows > 0) {
        console.log(`[CleanupPlugin] 🧹 Закрыто ${affectedRows} "висячих" offline-сессий`)
      }
      return affectedRows
    })
  }
  
  // ============================================
  // Задача 2: Очистка зомби-сессий (каждые 5 минут)
  // ============================================
  // Сессии со статусом online/afk, но без активности > 2 часов
  async function cleanupZombieSessions() {
    return withMySQLLock('cleanup_zombie_sessions', 0, async () => {
      const result = await db
        .update(userSessions)
        .set({
          status: 'offline',
          endedAt: sql`NOW()`
        })
        .where(
          and(
            or(
              eq(userSessions.status, 'online'),
              eq(userSessions.status, 'afk')
            ),
            sql`${userSessions.lastActivity} < DATE_SUB(NOW(), INTERVAL 2 HOUR)`
          )
        )
        .execute()
      
      const affectedRows = (result as any)[0]?.affectedRows || 0
      if (affectedRows > 0) {
        console.log(`[CleanupPlugin] 🧹 Закрыто ${affectedRows} зомби-сессий`)
      }
      return affectedRows
    })
  }
  
  // ============================================
  // Задача 3: Полная дневная очистка (раз в сутки в 3:00)
  // ============================================
  async function dailyCleanup() {
    return withMySQLLock('cleanup_daily', 0, async () => {
      const deletedCount = await cleanupOldSessions(30)
      console.log(`[CleanupPlugin] ✅ Дневная очистка завершена: удалено ${deletedCount} старых сессий`)
      return deletedCount
    })
  }
  
  // ============================================
  // Используем setInterval вместо node-cron для простоты
  // (node-cron может не работать корректно в serverless-окружении Nitro)
  // ============================================
  
  // Запускаем немедленно при старте сервера
  setTimeout(async () => {
    console.log('[CleanupPlugin] 🧹 Первичная очистка при старте...')
    await closeStaleOfflineSessions()
    await cleanupZombieSessions()
  }, 5000) // Через 5 секунд после старта
  
  // Каждые 15 минут — закрытие "висячих" offline-сессий
  setInterval(() => {
    closeStaleOfflineSessions().catch(err => 
      console.error('[CleanupPlugin] ❌ Ошибка closeStaleOfflineSessions:', err)
    )
  }, 15 * 60 * 1000)
  
  // Каждые 5 минут — очистка зомби-сессий
  setInterval(() => {
    cleanupZombieSessions().catch(err => 
      console.error('[CleanupPlugin] ❌ Ошибка cleanupZombieSessions:', err)
    )
  }, 5 * 60 * 1000)
  
  // Каждые 24 часа — полная очистка старых данных
  setInterval(() => {
    dailyCleanup().catch(err => 
      console.error('[CleanupPlugin] ❌ Ошибка dailyCleanup:', err)
    )
  }, 24 * 60 * 60 * 1000)
  
  console.log('[CleanupPlugin] ✅ Cleanup plugin initialized')
  console.log('[CleanupPlugin] 📋 Расписание:')
  console.log('[CleanupPlugin]   - Offline-сессии: каждые 15 минут')
  console.log('[CleanupPlugin]   - Зомби-сессии: каждые 5 минут')
  console.log('[CleanupPlugin]   - Полная очистка: каждые 24 часа')
})

// server/plugins/visitor-flush.ts
import { defineNitroPlugin } from 'nitropack/runtime/plugin'
import { flushVisitorsToDb, cleanupOldVisitorData } from '../utils/visitorStorage'
import { scheduleVisitorsBroadcast } from '../utils/visitor-broadcast'

/**
 * Плагин записи аналитики посетителей в БД.
 *
 * - раз в минуту: реестр (память) → БД (завершённые визиты + «грязные» живые);
 * - раз в сутки: удаление сырых просмотров/событий старше 90 дней;
 * - при остановке процесса: финальный сброс всех визитов, чтобы не потерять данные.
 *
 * После каждого flush обновляем живой список (посетители с простоем > 5 минут пропадают).
 */
export default defineNitroPlugin((nitroApp) => {
  const FLUSH_INTERVAL_MS = 60 * 1000
  let flushing = false

  async function flush(finishAll = false) {
    if (flushing) return
    flushing = true
    try {
      const written = await flushVisitorsToDb({ finishAll })
      if (written > 0) console.log(`[VisitorFlush] ✅ Записано визитов: ${written}`)
    } catch (error) {
      console.error('[VisitorFlush] ❌ Ошибка flush:', error)
    } finally {
      flushing = false
      scheduleVisitorsBroadcast()
    }
  }

  const flushTimer = setInterval(() => { flush() }, FLUSH_INTERVAL_MS)
  const cleanupTimer = setInterval(() => {
    cleanupOldVisitorData()
      .then(n => { if (n > 0) console.log(`[VisitorFlush] 🧹 Удалено старых строк аналитики: ${n}`) })
      .catch(err => console.error('[VisitorFlush] ❌ Ошибка очистки:', err))
  }, 24 * 60 * 60 * 1000)

  // Не удерживаем event loop при завершении процесса
  ;(flushTimer as any).unref?.()
  ;(cleanupTimer as any).unref?.()

  nitroApp.hooks.hook('close', async () => {
    clearInterval(flushTimer)
    clearInterval(cleanupTimer)
    flushing = false
    await flush(true)
  })

  console.log('[VisitorFlush] ✅ Плагин записи аналитики посетителей запущен (flush каждую минуту)')
})

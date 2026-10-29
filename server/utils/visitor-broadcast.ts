// server/utils/visitor-broadcast.ts
/**
 * 📡 Debounced broadcast списка посетителей сайта.
 *
 * Аналог online-broadcast.ts, но для реестра посетителей (server/utils/visitorRegistry.ts).
 * Отправляем в ту же комнату ONLINE_VIEWERS_ROOM, что и список онлайна:
 * аудитория совпадает с ACL GET /api/visitors и GET /api/online (право users:view).
 *
 * Триггерится из публичного эндпоинта пинга (POST /api/visitors/ping), т.к.
 * сами посетители сокет не держат.
 */

import { getIO } from '../socket/common'
import { ONLINE_VIEWERS_ROOM } from '../socket/utils'
import { getActiveVisitors } from './visitorRegistry'

let broadcastTimeout: ReturnType<typeof setTimeout> | null = null
let pendingBroadcast = false
const DEBOUNCE_MS = 1500 // 1.5 секунды — как у online-broadcast

/**
 * Отправить актуальный список посетителей в комнату зрителей онлайна.
 * Возвращает количество отправленных записей (или -1, если io ещё не готов).
 */
export function emitVisitorsUpdate(): number {
  const io = getIO()
  if (!io) {
    // Нормальная ситуация во время SSR/раннего старта — просто пропускаем
    return -1
  }

  const visitors = getActiveVisitors()
  io.to(ONLINE_VIEWERS_ROOM).emit('visitors:update', visitors)
  return visitors.length
}

/**
 * Debounced-версия: накапливает изменения и отправляет пакетом раз в 1.5 секунды,
 * чтобы один и тот же клиент не провоцировал лавину broadcast'ов.
 */
export function scheduleVisitorsBroadcast(): void {
  pendingBroadcast = true

  // Если таймер уже запущен, не создаём новый
  if (broadcastTimeout) return

  broadcastTimeout = setTimeout(() => {
    if (!pendingBroadcast) return

    try {
      const count = emitVisitorsUpdate()
      if (count >= 0) {
        // console.log(`[VisitorBroadcast] 📡 Отправлено ${count} посетителей (debounced)`)
      }
    } catch (error) {
      console.error('[VisitorBroadcast] ❌ Ошибка отправки:', error)
    } finally {
      pendingBroadcast = false
      broadcastTimeout = null
    }
  }, DEBOUNCE_MS)

  // Не удерживать event loop при завершении процесса
  if (typeof (broadcastTimeout as any).unref === 'function') {
    (broadcastTimeout as any).unref()
  }
}

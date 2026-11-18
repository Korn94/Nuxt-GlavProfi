// app/components/pages/Cabinet/Diagnostics/composables/useDiagnosticsLog.ts
/**
 * 📜 Журнал событий страницы «Диагностика».
 *
 * Один экземпляр на страницу (создаётся в Diagnostics/index.vue): карточки
 * получают записи пропсом, а писать в журнал могут только владельцы логики —
 * соединение (сокет-события, ping), API-пробы и отправка тестовых событий.
 */
import { ref } from 'vue'

export interface LogEntry {
  ts: string
  source: string
  msg: string
  level: 'info' | 'ok' | 'warn' | 'err' | 'dim'
}

/** Сигнатура записи в журнал (передаётся в соседние composables). */
export type AddLogFn = (source: string, msg: string, level?: LogEntry['level']) => void

/** Максимум строк в журнале (старые вытесняются сверху) */
const MAX_LOG = 200

export function useDiagnosticsLog() {
  const eventLog = ref<LogEntry[]>([])
  const logPaused = ref(false)

  function addLog(source: string, msg: string, level: LogEntry['level'] = 'info') {
    if (logPaused.value) return
    const ts = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    eventLog.value.unshift({ ts, source, msg, level })
    if (eventLog.value.length > MAX_LOG) eventLog.value.splice(MAX_LOG)
  }

  function clearLog() {
    eventLog.value = []
  }

  return { eventLog, logPaused, addLog, clearLog }
}

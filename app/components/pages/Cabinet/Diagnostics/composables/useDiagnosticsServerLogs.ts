// app/components/pages/Cabinet/Diagnostics/composables/useDiagnosticsServerLogs.ts
/**
 * 🪵 Серверные логи для блока «Логи сервера» страницы «Диагностика».
 *
 * Читает хвост файлов через GET /api/admin/logs (доступ — только admin) и
 * опрашивает сервер раз в AUTO_REFRESH_MS с возможностью паузы.
 *
 * ⚠️ Буфера логов в памяти нет ни на клиенте, ни на сервере: сервер отдаёт
 * последние ~100 уже разобранных записей, клиент только фильтрует их
 * (уровень + поиск по тексту). Старые ответы отбрасываются (requestId).
 */
import { ref, computed, watch } from 'vue'
import {
  LOG_ENTRY_LIMIT,
  LOG_SOURCES,
  LOG_SOURCE_KEYS,
  type LogSourceKey,
} from 'shared/constants/logs'
import type {
  ClearServerLogResponse,
  ServerLogEntry,
  ServerLogResponse,
} from 'shared/types/logs'
import type { AddLogFn } from './useDiagnosticsLog'

/** Период автообновления хвоста, мс */
const AUTO_REFRESH_MS = 5000

/** Порядок уровней в фильтре: от критичных к отладочным */
const LEVEL_ORDER = ['ERROR', 'WARN', 'INFO', 'DEBUG'] as const

/** Значение фильтра по уровню («ALL» — без фильтра) */
export type ServerLogLevelFilter = 'ALL' | (typeof LEVEL_ORDER)[number]

/** Источники для табов — статичны, собираются из общего реестра */
const SOURCES = LOG_SOURCE_KEYS.map(key => ({
  key,
  label: LOG_SOURCES[key].label,
  hint: LOG_SOURCES[key].hint,
  file: LOG_SOURCES[key].file,
}))

function formatBytes(bytes: number): string {
  if (!bytes) return '0 Б'
  if (bytes < 1024) return `${bytes} Б`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`
}

function timeLabel(): string {
  return new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export function useDiagnosticsServerLogs(addLog: AddLogFn) {
  const sources = SOURCES
  const source = ref<LogSourceKey>('error')
  /** Весь хвост (≤ LOG_ENTRY_LIMIT записей, новые сверху) */
  const entries = ref<ServerLogEntry[]>([])
  const exists = ref(true)
  const sizeBytes = ref(0)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const paused = ref(false)
  const search = ref('')
  const levelFilter = ref<ServerLogLevelFilter>('ALL')
  const lastUpdated = ref('—')
  const clearing = ref(false)

  let timer: ReturnType<typeof setInterval> | null = null
  // 🛡️ Ответ старого запроса (переключили таб / нажали ↺) не должен затирать свежий
  let requestId = 0

  const autoRefreshSec = AUTO_REFRESH_MS / 1000
  const total = computed(() => entries.value.length)
  const sizeLabel = computed(() => formatBytes(sizeBytes.value))

  /** Уровни, реально присутствующие в хвосте (для чипов фильтра) */
  const levels = computed<ServerLogLevelFilter[]>(() => {
    const present = new Set(entries.value.map(entry => entry.level))
    return ['ALL', ...LEVEL_ORDER.filter(level => present.has(level))]
  })

  /** Записи после клиентских фильтров (уровень + поиск) */
  const filtered = computed<ServerLogEntry[]>(() => {
    const query = search.value.trim().toLowerCase()
    return entries.value.filter(entry => {
      if (levelFilter.value !== 'ALL' && entry.level !== levelFilter.value) return false
      if (!query) return true
      const haystack = `${entry.message} ${entry.details || ''} ${entry.stack || ''}`.toLowerCase()
      return haystack.includes(query)
    })
  })

  function describeError(e: any): string {
    const status = e?.status || e?.statusCode
    if (status === 403) return 'Нет доступа: логи видны только администратору'
    if (status === 401) return 'Сессия истекла — обновите страницу'
    return e?.data?.statusMessage || e?.statusMessage || e?.message || 'Не удалось прочитать лог'
  }

  async function refresh(manual = false) {
    const id = ++requestId
    loading.value = true

    try {
      const res = await $fetch<ServerLogResponse>('/api/admin/logs', {
        query: { source: source.value, limit: LOG_ENTRY_LIMIT },
      })
      if (id !== requestId) return

      entries.value = res.entries
      exists.value = res.exists
      sizeBytes.value = res.sizeBytes
      error.value = null
      lastUpdated.value = timeLabel()

      if (manual) {
        addLog('server-log', `${LOG_SOURCES[res.source].label}: ${res.entries.length} записей`, 'ok')
      }
    } catch (e: any) {
      if (id !== requestId) return

      error.value = describeError(e)
      entries.value = []
      if (manual) addLog('server-log', `Ошибка чтения лога: ${error.value}`, 'err')
    } finally {
      if (id === requestId) loading.value = false
    }
  }

  async function clear() {
    clearing.value = true
    try {
      const res = await $fetch<ClearServerLogResponse>('/api/admin/logs', {
        method: 'DELETE',
        query: { source: source.value },
      })

      addLog(
        'server-log',
        res.cleared ? `Файл ${res.file} очищен` : `Файл ${res.file} ещё не создан — очищать нечего`,
        res.cleared ? 'warn' : 'dim'
      )

      await refresh()
    } catch (e: any) {
      error.value = describeError(e)
      addLog('server-log', `Не удалось очистить лог: ${error.value}`, 'err')
    } finally {
      clearing.value = false
    }
  }

  /** Первый запрос + автообновление (вызывать из onMounted) */
  function start() {
    if (timer) return
    refresh()
    timer = setInterval(() => {
      if (!paused.value) refresh()
    }, AUTO_REFRESH_MS)
  }

  /** Остановить автообновление (вызывать из onUnmounted) */
  function stop() {
    if (!timer) return
    clearInterval(timer)
    timer = null
  }

  // Переключение источника — сразу читаем новый файл (даже на паузе)
  watch(source, () => {
    entries.value = []
    sizeBytes.value = 0
    error.value = null
    refresh()
  })

  // Уровень пропал из хвоста (после очистки/ротации) — сбрасываем фильтр
  watch(levels, (available) => {
    if (!available.includes(levelFilter.value)) levelFilter.value = 'ALL'
  })

  return {
    sources,
    source,
    entries,
    filtered,
    total,
    exists,
    sizeLabel,
    loading,
    error,
    paused,
    search,
    levelFilter,
    levels,
    lastUpdated,
    clearing,
    autoRefreshSec,
    refresh,
    clear,
    start,
    stop,
  }
}

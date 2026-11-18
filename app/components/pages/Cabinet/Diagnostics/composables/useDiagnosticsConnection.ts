// app/components/pages/Cabinet/Diagnostics/composables/useDiagnosticsConnection.ts
/**
 * 🔌 Состояние socket-соединения страницы «Диагностика».
 *
 * Что внутри:
 * - состояние подключения читается напрямую из socketService (обход гонки со store);
 * - часы (тик 1 с) + polling `getConnected()`/`getTransport()` как страховка от
 *   пропущенных событий;
 * - ping через 'heartbeat' → 'heartbeat:ack' (раз в 5 с);
 * - регистрация socket-листенеров с сохранением ссылок для отписки (P8);
 * - ручные контролы: reconnect / disconnect / повторная проверка авторизации.
 *
 * ⚠️ Подписки/таймеры НЕ создаются в setup: страница вызывает start() в onMounted
 * и stop() в onUnmounted (порядок важен для гидратации — см. index.vue).
 */
import { ref, computed } from 'vue'
import { useAuthStore } from 'stores/auth'
import { useSocketStore } from 'stores/socket'
import { socketService } from 'services/socket.service'
import type { AddLogFn } from './useDiagnosticsLog'

export function useDiagnosticsConnection(options: {
  addLog: AddLogFn
  /** Перерисовать снимок сторов (вызывается после connect/disconnect/poll) */
  refreshSnapshot: () => void
}) {
  const { addLog, refreshSnapshot } = options

  const authStore = useAuthStore()
  const socketStore = useSocketStore()

  // ── Connection state (read from socketService directly — fixes the race bug) ──
  const isConnected = ref(false)
  const isConnecting = ref(false)
  const socketId = ref<string | null>(null)
  const transport = ref<string>('—')
  const reconnectAttempts = ref(0)
  const pingMs = ref<number | null>(null)
  const pingInFlight = ref(false)

  // ── Clock ────────────────────────────────────────────────────────────
  const currentTime = ref('')
  let clockTimer: ReturnType<typeof setInterval> | null = null

  // ── Ping ─────────────────────────────────────────────────────────────
  const pingBarWidth = computed(() => {
    if (pingMs.value === null) return '0%'
    return Math.min((pingMs.value / 300) * 100, 100) + '%'
  })
  const pingMsClass = computed(() => {
    if (pingMs.value === null) return ''
    if (pingMs.value < 50) return 'kv__v--ok'
    if (pingMs.value < 150) return 'kv__v--warn'
    return 'kv__v--err'
  })

  let pingTimer: ReturnType<typeof setInterval> | null = null

  // ✅ P8: ссылки на socket-листенеры этой страницы — снимаем их в stop().
  // Раньше обработчики вешались на module-level синглтон socketService и никогда не
  // снимались: повторный вход на страницу дублировал их (каждое событие
  // логировалось N раз), а замыкания держали инстанс компонента от сборщика мусора.
  const socketListenerRefs: Array<{ event: string; handler: (data: any) => void }> = []

  /**
   * Регистрация socket-листенера с сохранением ссылки для отписки (P8).
   */
  function onSocket<T = any>(event: string, handler: (data: T) => void) {
    socketService.on(event, handler)
    socketListenerRefs.push({ event, handler: handler as (data: any) => void })
  }

  function measurePing() {
    if (!isConnected.value || pingInFlight.value) return
    pingInFlight.value = true
    const t0 = Date.now()

    let timeout: ReturnType<typeof setTimeout> | null = null

    // ✅ P8: снимаем строго свой листенер и таймаут (идемпотентно)
    function cleanup() {
      if (timeout) {
        clearTimeout(timeout)
        timeout = null
      }
      socketService.off('heartbeat:ack', onAck)
    }

    // ✅ Слушаем событие-ответ вместо Promise.
    // P8: раньше на 'heartbeat:ack' вешалась анонимная обёртка, а снимался onAck —
    // листенер не удалялся: каждые 5 с (интервал measurePing) в socketService
    // появлялся новый обработчик, каждый ack вызывал их все («пинг» искажался,
    // память росла).
    function onAck() {
      pingMs.value = Date.now() - t0
      pingInFlight.value = false
      cleanup()
    }

    // Таймаут на случай если сервер не ответит
    timeout = setTimeout(() => {
      pingMs.value = null
      pingInFlight.value = false
      cleanup()
      addLog('ping', 'Heartbeat timeout', 'warn')
    }, 3000)

    socketService.on('heartbeat:ack', onAck)

    // ✅ P2: fire-and-forget — ответ приходит отдельным событием 'heartbeat:ack'
    if (!socketService.emitNoAck('heartbeat')) {
      cleanup()
      pingMs.value = null
      pingInFlight.value = false
      addLog('ping', 'Socket not connected', 'warn')
    }
  }

  // ── Controls ─────────────────────────────────────────────────────────
  async function doReconnect() {
    addLog('ctrl', 'Manual reconnect triggered', 'warn')
    socketService.disconnect()
    await new Promise(r => setTimeout(r, 400))
    socketService.connect()
  }

  function doDisconnect() {
    addLog('ctrl', 'Manual disconnect', 'warn')
    socketService.disconnect()
  }

  async function doForceReauth() {
    addLog('ctrl', 'Force re-auth check', 'info')
    try {
      await authStore.init()
      addLog('ctrl', 'Auth re-check done', 'ok')
    } catch (e: any) {
      addLog('ctrl', `Auth re-check failed: ${e?.message}`, 'err')
    }
  }

  // ── Socket listeners ─────────────────────────────────────────────────
  function registerSocketListeners() {
    // Read current state immediately (fixes race condition vs socketStore)
    isConnected.value = socketService.getConnected()
    socketId.value = socketService.getSocketId() || null
    transport.value = socketService.getTransport()

    onSocket('connect', () => {
      isConnected.value = true
      isConnecting.value = false
      socketId.value = socketService.getSocketId() || null
      transport.value = socketService.getTransport()
      reconnectAttempts.value = 0
      addLog('socket', `Connected — ID: ${socketId.value} | transport: ${transport.value} | tab: ${socketStore.tabId || '—'}`, 'ok')
      refreshSnapshot()
    })

    onSocket('disconnect', (reason: string) => {
      isConnected.value = false
      isConnecting.value = false
      pingMs.value = null
      addLog('socket', `Disconnected — reason: ${reason}`, 'err')
      refreshSnapshot()
    })

    onSocket('connect_error', (err: any) => {
      isConnecting.value = false
      addLog('socket', `Connect error: ${err?.message}`, 'err')
    })

    onSocket('reconnect_attempt', (attempt: number) => {
      isConnecting.value = true
      reconnectAttempts.value = attempt
      addLog('socket', `Reconnect attempt #${attempt}`, 'warn')
    })

    onSocket('reconnect', (attempt: number) => {
      isConnected.value = true
      isConnecting.value = false
      reconnectAttempts.value = 0
      addLog('socket', `Reconnected after ${attempt} attempts`, 'ok')
    })

    onSocket('reconnect_failed', () => {
      isConnecting.value = false
      addLog('socket', 'Reconnect failed — gave up', 'err')
    })

    // ✅ Транспорт: НЕ читаем приватное поле socketService.socket.io.engine.
    // Сервис сам логирует upgrade (services/socket.service.ts), а страница
    // обновляет transport.value в обработчике 'connect' и в тике часов (getTransport()).

    // ✅ Только события, которые сервер реально эмитит (server/socket/*).
    // 'user:update'/'user:disconnected' удалены на сервере (P7), board:* — досок нет.
    const businessEvents = [
      'session:initialized',
      'user:status',
      // ✅ 'online-users:update' логируем и здесь: подписка онлайн-списка живёт в
      // onlineStore, а off() снимает только свой листенер (P6) — дублирования нет.
      'online-users:update',
      'permissions:changed', 'permissions:check:ack', 'force:disconnect',
      'debug:rooms', 'debug:stats',
    ]

    for (const ev of businessEvents) {
      onSocket(ev, (data: any) => {
        let summary = ''
        if (ev === 'online-users:update') summary = `${Array.isArray(data) ? data.length : '?'} users`
        else if (data && typeof data === 'object') summary = JSON.stringify(data).slice(0, 80)
        else if (data !== undefined) summary = String(data)
        addLog(ev, summary, ev.includes('deleted') ? 'warn' : ev.includes('error') ? 'err' : 'dim')
      })
    }
  }


  // ── Lifecycle ────────────────────────────────────────────────────────
  /** Подписки, часы и ping-интервал. Вызывается страницей в onMounted. */
  function start() {
    registerSocketListeners()

    currentTime.value = new Date().toLocaleTimeString('ru-RU')
    clockTimer = setInterval(() => {
      currentTime.value = new Date().toLocaleTimeString('ru-RU')

      // ✅ Polling как страховка от пропущенных событий
      const nowConnected = socketService.getConnected()
      if (nowConnected !== isConnected.value) {
        isConnected.value = nowConnected
        if (nowConnected) {
          isConnecting.value = false
          socketId.value = socketService.getSocketId() || null
          transport.value = socketService.getTransport()
          addLog('socket', `[poll] Detected connection — ${socketId.value}`, 'ok')
          refreshSnapshot()
        } else {
          addLog('socket', '[poll] Detected disconnect', 'warn')
        }
      }

      // Обновляем транспорт и если уже подключены
      if (isConnected.value) {
        const t = socketService.getTransport()
        if (t && t !== '—') transport.value = t
      }
    }, 1000)

    pingTimer = setInterval(measurePing, 5000)
    if (isConnected.value) measurePing()
  }

  /** Снятие таймеров и socket-листенеров. Вызывается страницей в onUnmounted. */
  function stop() {
    if (clockTimer) {
      clearInterval(clockTimer)
      clockTimer = null
    }
    if (pingTimer) {
      clearInterval(pingTimer)
      pingTimer = null
    }

    // ✅ P8: снимаем socket-листенеры, зарегистрированные этой страницей через onSocket().
    for (const { event, handler } of socketListenerRefs) {
      socketService.off(event, handler)
    }
    socketListenerRefs.length = 0
  }

  return {
    // state
    isConnected,
    isConnecting,
    socketId,
    transport,
    reconnectAttempts,
    pingMs,
    pingBarWidth,
    pingMsClass,
    currentTime,
    // controls
    doReconnect,
    doDisconnect,
    doForceReauth,
    // lifecycle
    start,
    stop,
  }
}


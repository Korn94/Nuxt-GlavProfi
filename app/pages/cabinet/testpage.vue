<!-- app/pages/cabinet/testpage.vue -->
<template>
  <div class="diag">

    <!-- ═══════════════════════════ HEADER ═══════════════════════════ -->
    <div class="diag-header">
      <div class="diag-header__left">
        <span class="diag-header__badge">DIAGNOSTICS</span>
        <h1 class="diag-header__title">Socket &amp; App Monitor</h1>
      </div>
      <div class="diag-header__right">
        <span class="diag-header__ts">{{ currentTime }}</span>
        <div :class="['diag-header__dot', isConnected ? 'diag-header__dot--live' : 'diag-header__dot--dead']" />
        <span class="diag-header__status-text">{{ isConnected ? 'LIVE' : 'OFFLINE' }}</span>
      </div>
    </div>

    <!-- ═══════════════════════════ STATUS STRIP ═══════════════════════ -->
    <div class="status-strip">
      <div v-for="pill in statusPills" :key="pill.label" :class="['pill', `pill--${pill.state}`]">
        <span class="pill__dot" />
        <span class="pill__label">{{ pill.label }}</span>
        <span class="pill__value">{{ pill.value }}</span>
      </div>
    </div>

    <!-- ═══════════════════════════ MAIN GRID ════════════════════════ -->
    <div class="diag-grid">

      <!-- ── Col 1: Connection ── -->
      <div class="card">
        <div class="card__head">
          <span class="card__title">Соединение</span>
          <div class="card__actions">
            <button class="btn btn--sm btn--primary" @click="doReconnect" :disabled="isConnecting">
              {{ isConnecting ? '···' : '⟳ Reconnect' }}
            </button>
            <button class="btn btn--sm btn--danger" @click="doDisconnect" :disabled="!isConnected">
              ✕ Drop
            </button>
          </div>
        </div>
        <div class="kv-list">
          <div class="kv" v-for="row in connectionRows" :key="row.k">
            <span class="kv__k">{{ row.k }}</span>
            <span :class="['kv__v', row.cls]">{{ row.v }}</span>
          </div>
        </div>
        <div class="ping-bar">
          <span class="ping-bar__label">Ping</span>
          <div class="ping-bar__track">
            <div class="ping-bar__fill" :style="{ width: pingBarWidth }" />
          </div>
          <span :class="['ping-bar__ms', pingMsClass]">{{ pingMs !== null ? pingMs + ' ms' : '—' }}</span>
        </div>
      </div>

      <!-- ── Col 2: Auth / User ── -->
      <div class="card">
        <div class="card__head">
          <span class="card__title">Пользователь</span>
          <button class="btn btn--sm" @click="doForceReauth">↺ Recheck</button>
        </div>
        <div class="avatar-block" v-if="authStore.user">
          <div class="avatar">{{ userInitials }}</div>
          <div class="avatar-block__info">
            <div class="avatar-block__name">{{ authStore.user.name || '—' }}</div>
            <div class="avatar-block__role">{{ authStore.user.role }}</div>
          </div>
        </div>
        <div class="kv-list">
          <div class="kv" v-for="row in authRows" :key="row.k">
            <span class="kv__k">{{ row.k }}</span>
            <span :class="['kv__v', row.cls]">{{ row.v }}</span>
          </div>
        </div>
      </div>

      <!-- ── Col 3: Session / Cookies ── -->
      <div class="card">
        <div class="card__head">
          <span class="card__title">Сессия &amp; Куки</span>
        </div>
        <div class="kv-list">
          <div class="kv" v-for="row in sessionRows" :key="row.k">
            <span class="kv__k">{{ row.k }}</span>
            <span :class="['kv__v', row.cls]">{{ row.v }}</span>
          </div>
        </div>
        <div class="divider" />
        <div class="kv-list">
          <div class="kv" v-for="c in cookies" :key="c.name">
            <span class="kv__k kv__k--cookie">{{ c.name }}</span>
            <span class="kv__v kv__v--mono kv__v--truncate">{{ c.value || '—' }}</span>
          </div>
        </div>
      </div>

      <!-- ── Col 4: Online users ── -->
      <div class="card card--tall">
        <div class="card__head">
          <span class="card__title">Онлайн <span class="badge">{{ onlineStore.users.length }}</span></span>
          <button class="btn btn--sm" @click="onlineStore.fetchOnlineUsers()">↺</button>
        </div>
        <div class="online-list">
          <div v-for="u in onlineStore.users" :key="u.userId" class="online-user">
            <div :class="['online-user__dot', `online-user__dot--${u.status}`]" />
            <div class="online-user__info">
              <span class="online-user__name">{{ u.user?.name || u.user?.login || '—' }}</span>
              <span class="online-user__meta">{{ u.user?.role }} · {{ u.activePath || '/' }} · {{ u.tabsCount
                }}tab</span>
            </div>
            <span :class="['online-user__status', `online-user__status--${u.status}`]">{{ u.status }}</span>
          </div>
          <div v-if="!onlineStore.users.length" class="empty">Нет онлайн-пользователей</div>
        </div>
      </div>

      <!-- ── Event log ── -->
      <div class="card card--wide card--tall">
        <div class="card__head">
          <span class="card__title">Лог событий <span class="badge badge--dim">{{ eventLog.length }}</span></span>
          <div class="card__actions">
            <label class="toggle-label">
              <input type="checkbox" v-model="logPaused" class="toggle-cb" />
              <span class="toggle-track" />
              Пауза
            </label>
            <button class="btn btn--sm" @click="eventLog = []">Очистить</button>
          </div>
        </div>
        <div class="log" ref="logEl">
          <div v-for="(entry, i) in eventLog" :key="i" :class="['log__row', `log__row--${entry.level}`]">
            <span class="log__ts">{{ entry.ts }}</span>
            <span class="log__source">{{ entry.source }}</span>
            <span class="log__msg">{{ entry.msg }}</span>
          </div>
          <div v-if="!eventLog.length" class="empty log__empty">События появятся здесь...</div>
        </div>
      </div>

      <!-- ── Store snapshot ── -->
      <div class="card card--wide">
        <div class="card__head">
          <span class="card__title">Store snapshot</span>
          <button class="btn btn--sm" @click="refreshSnapshot">↺ Refresh</button>
        </div>
        <div class="snapshot-tabs">
          <button v-for="tab in snapshotTabs" :key="tab"
            :class="['snap-tab', activeSnapshotTab === tab && 'snap-tab--active']" @click="activeSnapshotTab = tab">{{
            tab }}</button>
        </div>
        <pre class="snapshot-pre">{{ activeSnapshot }}</pre>
      </div>

      <!-- ── Board subscriptions ── -->
      <div class="card">
        <div class="card__head">
          <span class="card__title">Подписки на доски</span>
        </div>
        <div class="sub-input">
          <input v-model.number="boardIdInput" type="number" placeholder="Board ID" class="input" />
          <button class="btn btn--sm btn--primary" @click="subscribeBoard" :disabled="!isConnected">+</button>
          <button class="btn btn--sm btn--danger" @click="unsubscribeBoard" :disabled="!isConnected">−</button>
        </div>
        <div class="board-list">
          <div v-for="id in subscribedBoards" :key="id" class="board-tag">
            <span class="board-tag__icon">⬡</span>
            <span>board:{{ id }}</span>
            <button class="board-tag__remove" @click="socketService.unsubscribeFromBoard(id)">✕</button>
          </div>
          <div v-if="!subscribedBoards.length" class="empty">Нет подписок</div>
        </div>
      </div>

      <!-- ── Fire events ── -->
      <div class="card">
        <div class="card__head">
          <span class="card__title">Тест событий</span>
        </div>
        <div class="event-grid">
          <button v-for="ev in quickEvents" :key="ev.label" :class="['btn', `btn--${ev.color}`]" @click="fireEvent(ev)"
            :disabled="!isConnected">{{ ev.label }}</button>
        </div>
        <div class="divider" />
        <div class="custom-event">
          <input v-model="customEvName" placeholder="event:name" class="input" />
          <textarea v-model="customEvData" placeholder='{ "key": "val" }' class="input textarea" rows="2" />
          <button class="btn btn--primary" @click="fireCustomEvent"
            :disabled="!isConnected || !customEvName">Отправить</button>
        </div>
      </div>

      <!-- ── API tests ── -->
      <div class="card">
        <div class="card__head">
          <span class="card__title">API запросы</span>
        </div>
        <div class="api-list">
          <div v-for="api in apiTests" :key="api.path" class="api-row">
            <button class="btn btn--sm" @click="runApi(api)">▶</button>
            <span class="api-row__method">{{ api.method }}</span>
            <span class="api-row__path">{{ api.path }}</span>
            <span :class="['api-row__status', api.statusClass]">{{ api.status }}</span>
          </div>
        </div>
        <pre v-if="lastApiResult" class="snapshot-pre snapshot-pre--sm">{{ lastApiResult }}</pre>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useAuthStore } from '../../../stores/auth'
import { useSocketStore } from '../../../stores/socket'
import { useOnlineStore } from '../../../stores/online'
import { socketService } from 'services/socket.service'
import { useCookie } from 'nuxt/app'
import { definePageMeta } from 'node_modules/nuxt/dist/pages/runtime'

definePageMeta({
  layout: 'cabinet',
  middleware: ['auth', 'role'],
  allowedRoles: ['admin'] 
})

// ── Stores ──────────────────────────────────────────────────────────
const authStore = useAuthStore()
const socketStore = useSocketStore()
const onlineStore = useOnlineStore()

// ── Cookies ─────────────────────────────────────────────────────────
const authCookieRaw = useCookie('auth_token')
const sessionCookieRaw = useCookie('session_id')
const tabCookieRaw = useCookie('tab_id')

const cookies = computed(() => [
  { name: 'auth_token', value: authCookieRaw.value ? authCookieRaw.value.slice(0, 24) + '…' : null },
  { name: 'session_id', value: sessionCookieRaw.value || null },
  { name: 'tab_id', value: tabCookieRaw.value || null },
])

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
let clockTimer: ReturnType<typeof setInterval>

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

let pingTimer: ReturnType<typeof setInterval>

function measurePing() {
  if (!isConnected.value || pingInFlight.value) return
  pingInFlight.value = true
  const t0 = Date.now()

  // ✅ Слушаем событие-ответ вместо Promise
  const onAck = () => {
    pingMs.value = Date.now() - t0
    pingInFlight.value = false
    socketService.off('heartbeat:ack', onAck)
  }

  // Таймаут на случай если сервер не ответит
  const timeout = setTimeout(() => {
    pingMs.value = null
    pingInFlight.value = false
    socketService.off('heartbeat:ack', onAck)
    addLog('ping', 'Heartbeat timeout', 'warn')
  }, 3000)

  socketService.on('heartbeat:ack', () => {
    clearTimeout(timeout)
    onAck()
  })

  socketService.emit('heartbeat').catch(() => {
    clearTimeout(timeout)
    socketService.off('heartbeat:ack', onAck)
    pingMs.value = null
    pingInFlight.value = false
  })
}

// ── Status pills ─────────────────────────────────────────────────────
const statusPills = computed(() => [
  {
    label: 'Socket',
    value: isConnected.value ? 'connected' : isConnecting.value ? 'connecting' : 'disconnected',
    state: isConnected.value ? 'ok' : isConnecting.value ? 'warn' : 'err'
  },
  {
    label: 'Auth',
    value: authStore.isAuthenticated ? 'ok' : 'none',
    state: authStore.isAuthenticated ? 'ok' : 'err'
  },
  {
    label: 'Transport',
    value: transport.value,
    state: transport.value === 'websocket' ? 'ok' : transport.value === 'polling' ? 'warn' : 'dim'
  },
  {
    label: 'Online',
    value: String(onlineStore.users.length),
    state: 'dim'
  },
  {
    label: 'Subscriptions',
    value: String(subscribedBoards.value.length),
    state: subscribedBoards.value.length > 0 ? 'ok' : 'dim'
  },
  {
    label: 'Reconnects',
    value: String(reconnectAttempts.value),
    state: reconnectAttempts.value > 0 ? 'warn' : 'dim'
  },
])

// ── Connection rows ──────────────────────────────────────────────────
const connectionRows = computed(() => [
  { k: 'Status', v: isConnected.value ? 'CONNECTED' : isConnecting.value ? 'CONNECTING' : 'DISCONNECTED', cls: isConnected.value ? 'kv__v--ok' : 'kv__v--err' },
  { k: 'Socket ID', v: socketId.value || '—', cls: 'kv__v--mono' },
  { k: 'Transport', v: transport.value, cls: transport.value === 'websocket' ? 'kv__v--ok' : transport.value === 'polling' ? 'kv__v--warn' : '' },
  { k: 'Reconnects', v: String(reconnectAttempts.value), cls: reconnectAttempts.value > 0 ? 'kv__v--warn' : '' },
  { k: 'Store conn.', v: String(socketStore.isConnected), cls: socketStore.isConnected ? 'kv__v--ok' : 'kv__v--err' },
  { k: 'Store err.', v: socketStore.error || '—', cls: socketStore.error ? 'kv__v--err' : '' },
])

// ── Auth rows ────────────────────────────────────────────────────────
const userInitials = computed(() => {
  const name = authStore.user?.name || ''
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?'
})

const authRows = computed(() => [
  { k: 'User ID', v: String(authStore.user?.id ?? '—'), cls: '' },
  { k: 'Role', v: authStore.user?.role || '—', cls: '' },
  { k: 'Auth', v: authStore.isAuthenticated ? 'true' : 'false', cls: authStore.isAuthenticated ? 'kv__v--ok' : 'kv__v--err' },
  { k: 'Token', v: authCookieRaw.value ? 'present' : 'absent', cls: authCookieRaw.value ? 'kv__v--ok' : 'kv__v--err' },
  { k: 'Checking', v: String(authStore.isChecking), cls: '' },
])

// ── Session rows ─────────────────────────────────────────────────────
const sessionRows = computed(() => [
  { k: 'Session ID', v: sessionCookieRaw.value || '—', cls: sessionCookieRaw.value ? 'kv__v--ok' : 'kv__v--warn' },
  { k: 'Tab ID', v: tabCookieRaw.value || '—', cls: tabCookieRaw.value ? 'kv__v--mono' : '' },
  { k: 'Socket UID', v: String(socketStore.userId ?? '—'), cls: '' },
  { k: 'Path', v: typeof window !== 'undefined' ? window.location.pathname : '—', cls: 'kv__v--mono' },
])

// ── Event log ────────────────────────────────────────────────────────
interface LogEntry {
  ts: string
  source: string
  msg: string
  level: 'info' | 'ok' | 'warn' | 'err' | 'dim'
}

const eventLog = ref<LogEntry[]>([])
const logPaused = ref(false)
const logEl = ref<HTMLElement | null>(null)
const MAX_LOG = 200

function addLog(source: string, msg: string, level: LogEntry['level'] = 'info') {
  if (logPaused.value) return
  const ts = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  eventLog.value.unshift({ ts, source, msg, level })
  if (eventLog.value.length > MAX_LOG) eventLog.value.splice(MAX_LOG)
}

// ── Store snapshot ───────────────────────────────────────────────────
const snapshotTabs = ['Auth', 'Socket', 'Online', 'Service']
const activeSnapshotTab = ref('Auth')
const snapshotData = ref<Record<string, string>>({})

function refreshSnapshot() {
  snapshotData.value = {
    Auth: JSON.stringify({
      isAuthenticated: authStore.isAuthenticated,
      isChecking: authStore.isChecking,
      userId: authStore.user?.id,
      userRole: authStore.user?.role,
      userName: authStore.user?.name,
      error: authStore.error,
      hasToken: !!authCookieRaw.value,
    }, null, 2),
    Socket: JSON.stringify({
      isConnected: socketStore.isConnected,
      isConnecting: socketStore.isConnecting,
      userId: socketStore.userId,
      error: socketStore.error,
      reconnectAttempts: socketStore.reconnectAttempts,
    }, null, 2),
    Online: JSON.stringify({
      count: onlineStore.users.length,
      isLoading: onlineStore.isLoading,
      error: onlineStore.error,
      isSubscribed: onlineStore.isSubscribed,
      users: onlineStore.users.map(u => ({ id: u.userId, name: u.user?.name, status: u.status, path: u.activePath })),
    }, null, 2),
    Service: JSON.stringify({
      connected: socketService.getConnected(),
      socketId: socketService.getSocketId(),
      transport: socketService.getTransport(),
      subscribedBoards: socketService.getSubscribedBoards(),
      currentBoardId: socketService.getCurrentBoardId(),
    }, null, 2),
  }
}

const activeSnapshot = computed(() => snapshotData.value[activeSnapshotTab.value] || '{}')

// ── Board subscriptions ──────────────────────────────────────────────
const boardIdInput = ref<number | null>(null)
const subscribedBoards = ref<number[]>([])

function subscribeBoard() {
  if (!boardIdInput.value) return
  socketService.subscribeToBoard(boardIdInput.value)
  subscribedBoards.value = socketService.getSubscribedBoards()
  addLog('boards', `Subscribe → board:${boardIdInput.value}`, 'ok')
}

function unsubscribeBoard() {
  if (!boardIdInput.value) return
  socketService.unsubscribeFromBoard(boardIdInput.value)
  subscribedBoards.value = socketService.getSubscribedBoards()
  addLog('boards', `Unsubscribe → board:${boardIdInput.value}`, 'warn')
}

// ── Quick events ─────────────────────────────────────────────────────
const quickEvents = computed(() => [
  { label: '🟢 activity:online', color: 'ok', event: 'activity', payload: () => ({ sessionId: sessionCookieRaw.value, status: 'online', ipAddress: window.location.hostname }) },
  { label: '🟡 activity:afk', color: 'warn', event: 'activity:afk', payload: () => ({ sessionId: sessionCookieRaw.value, ipAddress: window.location.hostname }) },
  { label: '⚫ activity:offline', color: 'dim', event: 'activity', payload: () => ({ sessionId: sessionCookieRaw.value, status: 'offline', ipAddress: window.location.hostname }) },
  { label: '🔄 activity:resume', color: 'primary', event: 'activity:resume', payload: () => ({ sessionId: sessionCookieRaw.value, ipAddress: window.location.hostname }) },
  { label: '💓 heartbeat', color: 'sm', event: 'heartbeat', payload: () => undefined },
  { label: '🔍 debug:rooms', color: 'sm', event: 'debug:rooms', payload: () => undefined },
  { label: '📊 debug:stats', color: 'sm', event: 'debug:stats', payload: () => undefined },
  { label: '📌 tab:register', color: 'sm', event: 'tab:register', payload: () => ({ tabId: tabCookieRaw.value, currentPath: window.location.pathname }) },
])

async function fireEvent(ev: typeof quickEvents.value[0]) {
  try {
    const data = ev.payload()
    await socketService.emit(ev.event, data)
    addLog('emit', `${ev.event} → ${data ? JSON.stringify(data).slice(0, 60) : 'no data'}`, 'ok')
  } catch (e: any) {
    addLog('emit', `${ev.event} FAILED: ${e?.message}`, 'err')
  }
}

const customEvName = ref('')
const customEvData = ref('')

async function fireCustomEvent() {
  if (!customEvName.value) return
  try {
    const data = customEvData.value ? JSON.parse(customEvData.value) : undefined
    await socketService.emit(customEvName.value, data)
    addLog('emit', `${customEvName.value} → ${customEvData.value || 'no data'}`, 'ok')
  } catch (e: any) {
    addLog('emit', `Custom emit failed: ${e?.message}`, 'err')
  }
}

// ── API tests ────────────────────────────────────────────────────────
interface ApiTest {
  method: string
  path: string
  status: string
  statusClass: string
}

const apiTests = ref<ApiTest[]>([
  { method: 'GET', path: '/api/me', status: '—', statusClass: '' },
  { method: 'GET', path: '/api/online', status: '—', statusClass: '' },
  { method: 'GET', path: '/api/auth/check', status: '—', statusClass: '' },
  { method: 'GET', path: '/api/boards', status: '—', statusClass: '' },
])

const lastApiResult = ref<string | null>(null)

async function runApi(api: ApiTest) {
  api.status = '···'
  api.statusClass = ''
  try {
    const t0 = Date.now()
    const data = await $fetch(api.path, { method: api.method as any, credentials: 'include' })
    const ms = Date.now() - t0
    api.status = `200 (${ms}ms)`
    api.statusClass = 'api-row__status--ok'
    lastApiResult.value = JSON.stringify(data, null, 2).slice(0, 800)
    addLog('api', `${api.method} ${api.path} → 200 in ${ms}ms`, 'ok')
  } catch (e: any) {
    const code = e?.status || e?.statusCode || '?'
    api.status = `${code} ERR`
    api.statusClass = 'api-row__status--err'
    lastApiResult.value = JSON.stringify(e?.data || e?.message || e, null, 2).slice(0, 400)
    addLog('api', `${api.method} ${api.path} → ${code} ${e?.message || ''}`, 'err')
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

  socketService.on('connect', () => {
    isConnected.value = true
    isConnecting.value = false
    socketId.value = socketService.getSocketId() || null
    transport.value = socketService.getTransport()
    reconnectAttempts.value = 0
    subscribedBoards.value = socketService.getSubscribedBoards()
    addLog('socket', `Connected — ID: ${socketId.value} | transport: ${transport.value}`, 'ok')
    refreshSnapshot()
  })

  socketService.on('disconnect', (reason: string) => {
    isConnected.value = false
    isConnecting.value = false
    pingMs.value = null
    addLog('socket', `Disconnected — reason: ${reason}`, 'err')
    refreshSnapshot()
  })

  socketService.on('connect_error', (err: any) => {
    isConnecting.value = false
    addLog('socket', `Connect error: ${err?.message}`, 'err')
  })

  socketService.on('reconnect_attempt', (attempt: number) => {
    isConnecting.value = true
    reconnectAttempts.value = attempt
    addLog('socket', `Reconnect attempt #${attempt}`, 'warn')
  })

  socketService.on('reconnect', (attempt: number) => {
    isConnected.value = true
    isConnecting.value = false
    reconnectAttempts.value = 0
    addLog('socket', `Reconnected after ${attempt} attempts`, 'ok')
  })

  socketService.on('reconnect_failed', () => {
    isConnecting.value = false
    addLog('socket', 'Reconnect failed — gave up', 'err')
  })

  // Transport upgrade
  if (socketService.getConnected()) {
    // @ts-ignore
    const engine = (socketService as any).socket?.io?.engine
    if (engine) {
      engine.once('upgrade', (t: any) => {
        transport.value = t?.name || 'websocket'
        addLog('socket', `Transport upgraded → ${transport.value}`, 'ok')
      })
    }
  }

  // Business events
  const businessEvents = [
    'session:initialized', 'board:subscribed', 'board:unsubscribed',
    'board:task:created', 'board:task:updated', 'board:task:deleted',
    'board:subtask:created', 'board:subtask:updated', 'board:subtask:deleted',
    'board:column:created', 'board:column:updated', 'board:column:deleted',
    'board:tasks:reordered', 'board:columns:reordered',
    'user:status', 'user:update', 'user:disconnected',
    // 'online-users:update',
    // 'heartbeat:ack', 'pong',
    'debug:rooms', 'debug:stats',
  ]

  for (const ev of businessEvents) {
    socketService.on(ev, (data: any) => {
      let summary = ''
      if (ev === 'online-users:update') summary = `${Array.isArray(data) ? data.length : '?'} users`
      else if (data && typeof data === 'object') summary = JSON.stringify(data).slice(0, 80)
      else if (data !== undefined) summary = String(data)
      addLog(ev, summary, ev.includes('deleted') ? 'warn' : ev.includes('error') ? 'err' : 'dim')
    })
  }
}

// ── Lifecycle ────────────────────────────────────────────────────────
onMounted(() => {
  registerSocketListeners()
  refreshSnapshot()
  onlineStore.fetchOnlineUsers()
  subscribedBoards.value = socketService.getSubscribedBoards()

  addLog('init', `Page mounted — socket ${socketService.getConnected() ? 'already connected' : 'not connected'}`, 'info')

  currentTime.value = new Date().toLocaleTimeString('ru-RU')
  clockTimer = setInterval(() => {
    currentTime.value = new Date().toLocaleTimeString('ru-RU')
    subscribedBoards.value = socketService.getSubscribedBoards()

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
})

onUnmounted(() => {
  clearInterval(clockTimer)
  clearInterval(pingTimer)
})

watch(activeSnapshotTab, refreshSnapshot)
</script>

<style lang="scss" scoped>
// ─── Tokens ───────────────────────────────────────────────────────────
$bg0: #0d0f14;
$bg1: #13161e;
$bg2: #1a1e28;
$bg3: #222736;
$border: rgba(255, 255, 255, 0.07);
$border2: rgba(255, 255, 255, 0.12);
$text: #e2e4ec;
$muted: #7a7f96;
$ok: #3dd68c;
$warn: #f5a623;
$err: #f25f5c;
$blue: #5b8def;
$mono: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
$sans: inherit;

// ─── Layout ───────────────────────────────────────────────────────────
.diag {
  min-height: 100vh;
  background: $bg0;
  color: $text;
  font-size: 13px;
  line-height: 1.5;
  padding: 0 0 40px;
}

// ─── Header ──────────────────────────────────────────────────────────
.diag-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 24px 14px;
  border-bottom: 1px solid $border;
  background: $bg1;
  position: sticky;
  top: 0;
  z-index: 20;

  &__left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  &__right {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  &__badge {
    font-size: 9px;
    font-weight: 700;
    letter-spacing: .15em;
    color: $muted;
    border: 1px solid $border2;
    padding: 2px 7px;
    border-radius: 3px;
  }

  &__title {
    font-size: 16px;
    font-weight: 600;
    color: $text;
    margin: 0;
  }

  &__ts {
    font-family: $mono;
    font-size: 11px;
    color: $muted;
  }

  &__dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;

    &--live {
      background: $ok;
      box-shadow: 0 0 6px $ok;
      animation: pulse 2s ease-in-out infinite;
    }

    &--dead {
      background: $err;
    }
  }

  &__status-text {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: .08em;
    color: $muted;
  }
}

@keyframes pulse {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: .45;
  }
}

// ─── Status strip ────────────────────────────────────────────────────
.status-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 10px 24px;
  background: $bg1;
  border-bottom: 1px solid $border;
}

.pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: $bg2;
  border: 1px solid $border;
  border-radius: 4px;
  padding: 4px 10px;

  &__dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  &__label {
    color: $muted;
    font-size: 11px;
  }

  &__value {
    font-weight: 600;
    font-size: 12px;
    font-family: $mono;
  }

  &--ok {
    .pill__dot {
      background: $ok;
    }

    .pill__value {
      color: $ok;
    }
  }

  &--warn {
    .pill__dot {
      background: $warn;
    }

    .pill__value {
      color: $warn;
    }
  }

  &--err {
    .pill__dot {
      background: $err;
    }

    .pill__value {
      color: $err;
    }
  }

  &--dim {
    .pill__dot {
      background: $muted;
    }

    .pill__value {
      color: $text;
    }
  }
}

// ─── Main grid ───────────────────────────────────────────────────────
.diag-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  padding: 16px 24px;

  @media (max-width: 1100px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 700px) {
    grid-template-columns: 1fr;
  }
}

// ─── Card ─────────────────────────────────────────────────────────────
.card {
  background: $bg1;
  border: 1px solid $border;
  border-radius: 8px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;

  &--wide {
    grid-column: span 2;

    @media (max-width: 1100px) {
      grid-column: span 1;
    }
  }

  &--tall {
    max-height: 360px;
  }

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
  }

  &__title {
    font-size: 12px;
    font-weight: 600;
    letter-spacing: .06em;
    color: $muted;
    text-transform: uppercase;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  &__actions {
    display: flex;
    gap: 6px;
    align-items: center;
  }
}

// ─── KV list ──────────────────────────────────────────────────────────
.kv-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.kv {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 8px;
  padding: 4px 0;
  border-bottom: 1px solid $border;

  &:last-child {
    border-bottom: none;
  }

  &__k {
    color: $muted;
    font-size: 12px;
    flex-shrink: 0;

    &--cookie {
      font-family: $mono;
      font-size: 11px;
    }
  }

  &__v {
    font-size: 12px;
    font-family: $mono;
    text-align: right;
    word-break: break-all;

    &--ok {
      color: $ok;
    }

    &--warn {
      color: $warn;
    }

    &--err {
      color: $err;
    }

    &--mono {
      font-family: $mono;
    }

    &--truncate {
      max-width: 160px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
}

// ─── Avatar ───────────────────────────────────────────────────────────
.avatar-block {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 10px;
  background: $bg2;
  border-radius: 6px;
  border: 1px solid $border;

  &__name {
    font-weight: 600;
    font-size: 14px;
  }

  &__role {
    font-size: 11px;
    color: $muted;
    text-transform: capitalize;
  }
}

.avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: $blue;
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

// ─── Ping bar ────────────────────────────────────────────────────────
.ping-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-top: 2px;

  &__label {
    font-size: 11px;
    color: $muted;
    width: 28px;
  }

  &__track {
    flex: 1;
    height: 4px;
    background: $bg3;
    border-radius: 2px;
    overflow: hidden;
  }

  &__fill {
    height: 100%;
    background: $ok;
    border-radius: 2px;
    transition: width .4s ease;
  }

  &__ms {
    font-family: $mono;
    font-size: 11px;
    min-width: 44px;
    text-align: right;
    color: $muted;

    &.kv__v--ok {
      color: $ok;
    }

    &.kv__v--warn {
      color: $warn;
    }

    &.kv__v--err {
      color: $err;
    }
  }
}

// ─── Online list ─────────────────────────────────────────────────────
.online-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
  scrollbar-width: thin;
  scrollbar-color: $bg3 transparent;
}

.online-user {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 5px;
  background: $bg2;
  border: 1px solid $border;

  &__dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    flex-shrink: 0;

    &--online {
      background: $ok;
      box-shadow: 0 0 5px $ok;
    }

    &--afk {
      background: $warn;
    }

    &--offline {
      background: $muted;
    }
  }

  &__info {
    flex: 1;
    min-width: 0;
  }

  &__name {
    font-size: 13px;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__meta {
    font-size: 11px;
    color: $muted;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__status {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: .06em;
    padding: 2px 6px;
    border-radius: 3px;

    &--online {
      background: rgba($ok, .15);
      color: $ok;
    }

    &--afk {
      background: rgba($warn, .15);
      color: $warn;
    }

    &--offline {
      background: $bg3;
      color: $muted;
    }
  }
}

// ─── Log ─────────────────────────────────────────────────────────────
.log {
  flex: 1;
  overflow-y: auto;
  font-family: $mono;
  font-size: 11px;
  line-height: 1.6;
  max-height: 260px;
  scrollbar-width: thin;
  scrollbar-color: $bg3 transparent;

  &__row {
    display: grid;
    grid-template-columns: 68px 130px 1fr;
    gap: 8px;
    padding: 2px 4px;
    border-radius: 3px;

    &:hover {
      background: $bg2;
    }

    &--ok {
      .log__source {
        color: $ok;
      }
    }

    &--warn {
      .log__source {
        color: $warn;
      }
    }

    &--err {
      .log__source {
        color: $err;
      }

      .log__msg {
        color: color.mix($err, $text, 30%);
      }
    }

    &--dim .log__source {
      color: $muted;
    }
  }

  &__ts {
    color: $muted;
    opacity: .7;
  }

  &__source {
    color: $blue;
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__msg {
    color: $text;
    opacity: .8;
    word-break: break-all;
  }

  &__empty {
    padding: 20px 0;
  }
}

// ─── Snapshot ────────────────────────────────────────────────────────
.snapshot-tabs {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.snap-tab {
  background: none;
  border: 1px solid $border;
  border-radius: 4px;
  color: $muted;
  font-size: 11px;
  padding: 3px 10px;
  cursor: pointer;
  transition: all .15s;

  &:hover {
    border-color: $border2;
    color: $text;
  }

  &--active {
    background: $bg3;
    border-color: $blue;
    color: $text;
  }
}

.snapshot-pre {
  background: $bg0;
  border: 1px solid $border;
  border-radius: 5px;
  padding: 10px 12px;
  font-family: $mono;
  font-size: 11px;
  color: $text;
  overflow: auto;
  max-height: 200px;
  margin: 0;
  white-space: pre;
  scrollbar-width: thin;
  scrollbar-color: $bg3 transparent;

  &--sm {
    max-height: 120px;
  }
}

// ─── Board subscriptions ─────────────────────────────────────────────
.sub-input {
  display: flex;
  gap: 6px;
  align-items: center;
}

.board-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.board-tag {
  display: flex;
  align-items: center;
  gap: 6px;
  background: $bg2;
  border: 1px solid $border2;
  border-radius: 5px;
  padding: 4px 8px;
  font-family: $mono;
  font-size: 12px;

  &__icon {
    color: $blue;
    font-size: 10px;
  }

  &__remove {
    background: none;
    border: none;
    color: $muted;
    cursor: pointer;
    padding: 0 2px;
    font-size: 10px;
    line-height: 1;
    transition: color .15s;

    &:hover {
      color: $err;
    }
  }
}

// ─── Event grid ──────────────────────────────────────────────────────
.event-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 6px;
}

.custom-event {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

// ─── API list ────────────────────────────────────────────────────────
.api-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.api-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 8px;
  background: $bg2;
  border-radius: 5px;
  border: 1px solid $border;

  &__method {
    font-family: $mono;
    font-size: 10px;
    font-weight: 700;
    color: $blue;
    min-width: 28px;
  }

  &__path {
    flex: 1;
    font-family: $mono;
    font-size: 11px;
    color: $muted;
  }

  &__status {
    font-family: $mono;
    font-size: 11px;
    color: $muted;

    &--ok {
      color: $ok;
    }

    &--err {
      color: $err;
    }
  }
}

// ─── Inputs ──────────────────────────────────────────────────────────
.input {
  background: $bg0;
  border: 1px solid $border2;
  border-radius: 5px;
  color: $text;
  font-size: 12px;
  font-family: $mono;
  padding: 6px 10px;
  width: 100%;
  outline: none;
  transition: border-color .15s;

  &:focus {
    border-color: $blue;
  }

  &::placeholder {
    color: $muted;
  }
}

.textarea {
  resize: vertical;
  min-height: 52px;
}

// ─── Buttons ─────────────────────────────────────────────────────────
.btn {
  background: $bg3;
  border: 1px solid $border2;
  border-radius: 5px;
  color: $text;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  padding: 6px 12px;
  transition: all .15s;
  white-space: nowrap;

  &:hover:not(:disabled) {
    background: $bg2;
    border-color: rgba(255, 255, 255, .2);
  }

  &:disabled {
    opacity: .4;
    cursor: not-allowed;
  }

  &--sm {
    padding: 4px 8px;
    font-size: 11px;
  }

  &--primary {
    background: rgba($blue, .18);
    border-color: rgba($blue, .4);
    color: $blue;

    &:hover:not(:disabled) {
      background: rgba($blue, .28);
    }
  }

  &--danger {
    background: rgba($err, .15);
    border-color: rgba($err, .35);
    color: $err;

    &:hover:not(:disabled) {
      background: rgba($err, .25);
    }
  }

  &--ok {
    background: rgba($ok, .15);
    border-color: rgba($ok, .3);
    color: $ok;

    &:hover:not(:disabled) {
      background: rgba($ok, .25);
    }
  }

  &--warn {
    background: rgba($warn, .15);
    border-color: rgba($warn, .3);
    color: $warn;

    &:hover:not(:disabled) {
      background: rgba($warn, .25);
    }
  }

  &--dim {
    background: $bg3;
    color: $muted;
  }
}

// ─── Toggle ──────────────────────────────────────────────────────────
.toggle-label {
  display: flex;
  align-items: center;
  gap: 7px;
  cursor: pointer;
  font-size: 11px;
  color: $muted;
  user-select: none;
}

.toggle-cb {
  display: none;
}

.toggle-track {
  position: relative;
  display: inline-block;
  width: 28px;
  height: 16px;
  background: $bg3;
  border: 1px solid $border2;
  border-radius: 8px;
  transition: background .2s;
  flex-shrink: 0;

  &::after {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    width: 10px;
    height: 10px;
    background: $muted;
    border-radius: 50%;
    transition: transform .2s, background .2s;
  }
}

.toggle-cb:checked+.toggle-track {
  background: rgba($warn, .25);
  border-color: rgba($warn, .4);

  &::after {
    transform: translateX(12px);
    background: $warn;
  }
}

// ─── Badge ───────────────────────────────────────────────────────────
.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: $bg3;
  border: 1px solid $border;
  border-radius: 4px;
  padding: 0 5px;
  font-size: 10px;
  font-weight: 600;
  color: $muted;
  min-width: 18px;

  &--dim {
    color: $muted;
  }
}

// ─── Divider ─────────────────────────────────────────────────────────
.divider {
  height: 1px;
  background: $border;
  margin: 2px 0;
}

// ─── Empty state ─────────────────────────────────────────────────────
.empty {
  color: $muted;
  font-size: 12px;
  text-align: center;
  padding: 16px 0;
  opacity: .6;
}
</style>
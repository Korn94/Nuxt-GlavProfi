<!-- app/components/pages/Cabinet/Diagnostics/index.vue -->
<!--
  Страница «Диагностика» (/cabinet/diagnostics): socket & app monitor.

  Разбита на блоки (см. соседние файлы):
  - ConnectionCard  — статус сокета, транспорт, ping, reconnect/drop
  - UserCard        — пользователь auth-store + Recheck
  - SessionCard     — session_id / tabId / socketId / путь + куки
  - OnlineCard      — список онлайна (onlineStore)
  - EventLogCard    — журнал событий (пауза/очистка)
  - ServerLogsCard  — серверные логи: ошибки/события/входы (поиск, уровень, очистка)
  - SnapshotCard    — JSON-снимок сторов
  - EmitCard        — быстрые и произвольные socket-события
  - ApiCard         — ручные API-пробы

  Здесь остаются: каркас (шапка, status strip, сетка), всё состояние и
  оркестрация. Чтобы добавить новый блок — создайте компонент рядом и вставьте
  его в .diag-grid ниже (при необходимости добавьте строку в connectionRows /
  соответствующий computed или новый composable в composables/).
-->
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
      <PagesCabinetDiagnosticsConnectionCard
        :rows="connectionRows"
        :connected="isConnected"
        :connecting="isConnecting"
        :ping-ms="pingMs"
        :ping-bar-width="pingBarWidth"
        :ping-ms-class="pingMsClass"
        @reconnect="doReconnect"
        @disconnect="doDisconnect"
      />

      <PagesCabinetDiagnosticsUserCard
        :user="liveAuthUser"
        :initials="userInitials"
        :rows="authRows"
        @recheck="doForceReauth"
      />

      <PagesCabinetDiagnosticsSessionCard
        :rows="sessionRows"
        :cookies="cookies"
      />

      <PagesCabinetDiagnosticsOnlineCard
        :users="liveOnlineUsers"
        :online-count="onlineCount"
        @refresh="refreshData"
      />

      <PagesCabinetDiagnosticsEventLogCard
        v-model:paused="logPaused"
        :entries="eventLog"
        @clear="clearLog"
      />

      <PagesCabinetDiagnosticsServerLogsCard
        v-model:source="serverLogSource"
        v-model:paused="serverLogsPaused"
        v-model:search="serverLogSearch"
        v-model:level="serverLogLevel"
        :sources="serverLogSources"
        :entries="serverLogFiltered"
        :total="serverLogTotal"
        :exists="serverLogExists"
        :loading="serverLogsLoading"
        :levels="serverLogLevels"
        :fetch-error="serverLogsError"
        :size-label="serverLogsSize"
        :last-updated="serverLogsUpdated"
        :clearing="serverLogsClearing"
        :auto-refresh-sec="serverLogsIntervalSec"
        @refresh="refreshServerLogs(true)"
        @clear="clearServerLogs"
      />

      <PagesCabinetDiagnosticsSnapshotCard
        v-model:active-tab="activeSnapshotTab"
        :tabs="snapshotTabs"
        :content="activeSnapshot"
        @refresh="refreshSnapshot"
      />

      <PagesCabinetDiagnosticsEmitCard
        :events="quickEvents"
        :connected="isConnected"
        @fire="fireEvent"
        @fire-custom="fireCustomEvent"
      />

      <PagesCabinetDiagnosticsApiCard
        :tests="apiTests"
        :last-result="lastApiResult"
        @run="runApi"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from 'stores/auth'
import { useSocketStore } from 'stores/socket'
import { useOnlineStore } from 'stores/online'
import { socketService } from 'services/socket.service'
import { useCookie } from 'nuxt/app'
import type { QuickEvent } from './shared/types'
import { useDiagnosticsLog } from './composables/useDiagnosticsLog'
import { useDiagnosticsSnapshot } from './composables/useDiagnosticsSnapshot'
import { useDiagnosticsConnection } from './composables/useDiagnosticsConnection'
import { useDiagnosticsApi } from './composables/useDiagnosticsApi'
import { useDiagnosticsServerLogs } from './composables/useDiagnosticsServerLogs'

// ── Stores ──────────────────────────────────────────────────────────
const authStore = useAuthStore()
const socketStore = useSocketStore()
const onlineStore = useOnlineStore()

// ── 🛡️ SSR-safe проекции (защита от Hydration mismatch) ──────────────
// Плагин сокета и auth-store наполняют stores на клиенте ДО того, как Vue
// завершит гидратацию, поэтому серверная разметка и первый клиентский рендер
// расходились (Hydration text/class mismatch на строках ниже). Приём тот же,
// что в app/pages/cabinet/objects/index.vue: пока isMounted === false (SSR и
// гидратация) отдаём нейтральные значения, после onMounted — живые.
const isMounted = ref(false)

/** Пользователь из auth-store (до гидратации — null). */
const liveAuthUser = computed(() => (isMounted.value ? authStore.user : null))
/** Флаг авторизации (до гидратации — false). */
const liveIsAuthenticated = computed(() => isMounted.value && authStore.isAuthenticated)
/** Флаг проверки авторизации/прав (до гидратации — false). */
const liveIsChecking = computed(() => isMounted.value && authStore.isChecking)
/** Флаг подключения из socket-store (до гидратации — false). */
const liveSocketConnected = computed(() => isMounted.value && socketStore.isConnected)
/** Ошибка из socket-store (до гидратации — null). */
const liveSocketError = computed(() => (isMounted.value ? socketStore.error : null))
/** ID вкладки: живёт в sessionStorage — на сервере его нет. */
const liveTabId = computed(() => (isMounted.value ? socketStore.tabId : null))
/** userId из socket-store (до гидратации — null). */
const liveSocketUserId = computed(() => (isMounted.value ? socketStore.userId : null))
/** Список онлайна (на сервере не загружается). */
const liveOnlineUsers = computed(() => (isMounted.value ? onlineStore.users : []))
/** Текущий путь: window недоступен на сервере. */
const livePath = computed(() =>
  isMounted.value && typeof window !== 'undefined' ? window.location.pathname : '—'
)

// ── Cookies ─────────────────────────────────────────────────────────
const authCookieRaw = useCookie('auth_token')
const sessionCookieRaw = useCookie('session_id')

// ⚠️ Куки tab_id в приложении нет: ID вкладки живёт в socketStore.tabId
// (sessionStorage 'socket_tab_id', см. stores/socket/index.ts). Раньше страница
// читала несуществующую куку и всегда показывала «—».
const cookies = computed(() => [
  { name: 'auth_token', value: authCookieRaw.value ? authCookieRaw.value.slice(0, 24) + '…' : null },
  // 🛡️ session_id выдаёт сервер при подключении сокета (setSessionId) — кука
  // обновляется ДО гидратации, поэтому до onMounted показываем заглушку.
  { name: 'session_id', value: isMounted.value ? (sessionCookieRaw.value || null) : null },
])

// ── Composable-блоки (единый экземпляр на страницу) ──────────────────
const { eventLog, logPaused, addLog, clearLog } = useDiagnosticsLog()

const { snapshotTabs, activeSnapshotTab, activeSnapshot, refreshSnapshot } = useDiagnosticsSnapshot({
  hasToken: () => !!authCookieRaw.value,
  sessionId: () => sessionCookieRaw.value || null,
})

const {
  isConnected,
  isConnecting,
  socketId,
  transport,
  reconnectAttempts,
  pingMs,
  pingBarWidth,
  pingMsClass,
  currentTime,
  doReconnect,
  doDisconnect,
  doForceReauth,
  start: startConnection,
  stop: stopConnection,
} = useDiagnosticsConnection({ addLog, refreshSnapshot })

const { apiTests, lastApiResult, runApi } = useDiagnosticsApi(addLog)

// 🪵 Серверные логи (GET/DELETE /api/admin/logs): табы источников, поиск,
// фильтр по уровню и очистка. Автообновление стартует в onMounted.
const {
  sources: serverLogSources,
  source: serverLogSource,
  filtered: serverLogFiltered,
  total: serverLogTotal,
  exists: serverLogExists,
  sizeLabel: serverLogsSize,
  loading: serverLogsLoading,
  error: serverLogsError,
  paused: serverLogsPaused,
  search: serverLogSearch,
  levelFilter: serverLogLevel,
  levels: serverLogLevels,
  lastUpdated: serverLogsUpdated,
  clearing: serverLogsClearing,
  autoRefreshSec: serverLogsIntervalSec,
  refresh: refreshServerLogs,
  clear: clearServerLogs,
  start: startServerLogs,
  stop: stopServerLogs,
} = useDiagnosticsServerLogs(addLog)

// ── Online data ──────────────────────────────────────────────────────
// /api/online отдаёт ВСЕХ пользователей (включая offline), поэтому счётчики
// считаем по статусу, а не по длине массива.
const onlineCount = computed(() => liveOnlineUsers.value.filter(u => u.status === 'online').length)

/**
 * Первичная загрузка списка онлайна + подписка на real-time обновления.
 * ✅ Источник подписки на 'online-users:update' — onlineStore (stores/online.ts),
 * как в cabinet/online.vue; страница только логирует событие (см. businessEvents).
 */
async function refreshData() {
  try {
    await onlineStore.fetchOnlineUsers()
    onlineStore.subscribeToUpdates()
  } catch {
    // Ошибка уже сохранена в onlineStore.error и видна в карточке «Онлайн»
  }
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
    value: liveIsAuthenticated.value ? 'ok' : 'none',
    state: liveIsAuthenticated.value ? 'ok' : 'err'
  },
  {
    label: 'Transport',
    value: transport.value,
    state: transport.value === 'websocket' ? 'ok' : transport.value === 'polling' ? 'warn' : 'dim'
  },
  {
    label: 'Online',
    value: `${onlineCount.value}/${liveOnlineUsers.value.length}`,
    state: onlineCount.value > 0 ? 'ok' : 'dim'
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
  // ⚠️ socketStore наполняется клиентским плагином сокета до гидратации —
  // до onMounted показываем нейтральные значения (иначе Hydration mismatch).
  { k: 'Store conn.', v: isMounted.value ? String(liveSocketConnected.value) : '—', cls: isMounted.value ? (liveSocketConnected.value ? 'kv__v--ok' : 'kv__v--err') : '' },
  { k: 'Store err.', v: liveSocketError.value || '—', cls: liveSocketError.value ? 'kv__v--err' : '' },
])

// ── Auth rows ────────────────────────────────────────────────────────
const userInitials = computed(() => {
  const name = liveAuthUser.value?.name || ''
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?'
})

const authRows = computed(() => [
  { k: 'User ID', v: String(liveAuthUser.value?.id ?? '—'), cls: '' },
  { k: 'Role', v: liveAuthUser.value?.role || '—', cls: '' },
  { k: 'Auth', v: isMounted.value ? String(liveIsAuthenticated.value) : '—', cls: isMounted.value ? (liveIsAuthenticated.value ? 'kv__v--ok' : 'kv__v--err') : '' },
  // ✅ Куки одинаковы на сервере (из запроса) и на клиенте (document.cookie)
  { k: 'Token', v: authCookieRaw.value ? 'present' : 'absent', cls: authCookieRaw.value ? 'kv__v--ok' : 'kv__v--err' },
  { k: 'Checking', v: isMounted.value ? String(liveIsChecking.value) : '—', cls: '' },
])

// ── Session rows ─────────────────────────────────────────────────────
const sessionRows = computed(() => [
  // 🛡️ session_id переписывается сокетом на клиенте до гидратации
  { k: 'Session ID', v: isMounted.value ? (sessionCookieRaw.value || '—') : '—', cls: isMounted.value ? (sessionCookieRaw.value ? 'kv__v--ok' : 'kv__v--warn') : '' },
  { k: 'Tab ID', v: liveTabId.value || '—', cls: isMounted.value ? (liveTabId.value ? 'kv__v--mono' : 'kv__v--warn') : '' },
  { k: 'Socket ID', v: socketId.value || '—', cls: socketId.value ? 'kv__v--mono' : '' },
  { k: 'User ID', v: String(liveSocketUserId.value ?? '—'), cls: '' },
  { k: 'Path', v: livePath.value, cls: isMounted.value ? 'kv__v--mono' : '' },
])


// ── Quick events ─────────────────────────────────────────────────────
// ⚠️ Сервер игнорирует клиентские поля sessionId/ipAddress: sessionId берётся
// из самого сокета, IP — из соединения (server/socket/handlers/activity.ts,
// server/socket/utils.ts → getSocketIp), поэтому в payload идёт только status.
const quickEvents = computed<QuickEvent[]>(() => [
  {
    label: '🟢 activity:online',
    color: 'ok',
    event: 'activity',
    payload: () => ({ status: 'online' }),
    disabled: false
  },
  { label: '🟡 activity:afk', color: 'warn', event: 'activity:afk', payload: () => undefined, disabled: false },
  {
    label: '⚫ activity:offline',
    color: 'dim',
    event: 'activity',
    payload: () => ({ status: 'offline' }),
    disabled: false
  },
  {
    label: '🔄 activity:resume',
    color: 'primary',
    event: 'activity:resume',
    payload: () => undefined,
    disabled: false
  },
  { label: '💓 heartbeat', color: 'sm', event: 'heartbeat', payload: () => undefined, disabled: false },
  { label: '🔍 debug:rooms', color: 'sm', event: 'debug:rooms', payload: () => undefined, disabled: false },
  { label: '📊 debug:stats', color: 'sm', event: 'debug:stats', payload: () => undefined, disabled: false },
  {
    label: '📌 tab:register',
    color: 'sm',
    event: 'tab:register',
    payload: () => ({ tabId: socketStore.tabId, currentPath: window.location.pathname }),
    // ✅ tabId появляется после 'session:initialized' (stores/socket/index.ts) —
    // без него сервер логирует «Получена регистрация вкладки без sessionId или tabId».
    // 🛡️ liveTabId — как в rows: до гидратации кнопка disabled, как на SSR.
    disabled: !liveTabId.value
  },
])

async function fireEvent(ev: QuickEvent) {
  try {
    const data = ev.payload()
    // ✅ P2: события без серверного ack — fire-and-forget
    const sent = socketService.emitNoAck(ev.event, data)
    addLog(
      'emit',
      `${ev.event} → ${data ? JSON.stringify(data).slice(0, 60) : 'no data'}`,
      sent ? 'ok' : 'err'
    )
  } catch (e: any) {
    addLog('emit', `${ev.event} FAILED: ${e?.message}`, 'err')
  }
}

/** Произвольный emit из карточки «Тест событий» (EmitCard). */
async function fireCustomEvent(payload: { name: string; data: string }) {
  if (!payload.name) return
  try {
    const data = payload.data ? JSON.parse(payload.data) : undefined
    // ✅ P2: произвольные события без серверного ack — fire-and-forget
    const sent = socketService.emitNoAck(payload.name, data)
    addLog(
      'emit',
      `${payload.name} → ${payload.data || 'no data'}`,
      sent ? 'ok' : 'err'
    )
  } catch (e: any) {
    addLog('emit', `Custom emit failed: ${e?.message}`, 'err')
  }
}

// ── Lifecycle ────────────────────────────────────────────────────────
onMounted(() => {
  // ✅ 🛡️ Гидратация завершена — включаем «живые» значения вместо SSR-safe
  // заглушек (см. блок live-* выше). После этого разметка не сверяется с сервером.
  isMounted.value = true

  // socket-листенеры, часы и ping-интервал (снимаются в stop())
  startConnection()
  refreshSnapshot()
  // ✅ fetchOnlineUsers() + subscribeToUpdates() — как в cabinet/online.vue
  refreshData()

  // хвост серверных логов + автообновление (стоп — в onUnmounted)
  startServerLogs()

  addLog('init', `Page mounted — socket ${socketService.getConnected() ? 'already connected' : 'not connected'}`, 'info')
})

onUnmounted(() => {
  stopConnection()
  stopServerLogs()

  // ⚠️ onlineStore.unsubscribeFromUpdates() здесь СОЗНАТЕЛЬНО не вызываем:
  // подписка на 'online-users:update' — app-level (stores/online.ts), от флага
  // isInitialized зависит resubscribe() после реконнекта сокета, а OnlineWidget
  // на дашборде подписывается только при !isInitialized. Отписка здесь оставила бы
  // стор «инициализированным, но не подписанным» — список онлайна перестал бы
  // обновляться на других страницах.
})
</script>


<style lang="scss" scoped>
@use './diagnostics.shared.scss' as *;

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
</style>


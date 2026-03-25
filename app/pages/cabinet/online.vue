<template>
  <div class="online-page">
    <PagesCabinetUiLayoutPageTitle title="Онлайн" icon="mdi:account-group-outline">
      <template #actions>
        <button class="crm-btn crm-btn--ghost crm-btn--sm" @click="refreshData" :disabled="onlineStore.isLoading">
          <Icon name="mdi:refresh" size="14" :class="{ spin: onlineStore.isLoading }" />
          {{ onlineStore.isLoading ? '···' : 'Обновить' }}
        </button>
      </template>
    </PagesCabinetUiLayoutPageTitle>

    <div class="online-page__content">
      <div class="status-strip">
        <div class="pill pill--ok">
          <span class="pill__dot" />
          <span class="pill__label">В сети</span>
          <span class="pill__value">{{ activeCount }}</span>
        </div>
        <div class="pill pill--warn">
          <span class="pill__dot" />
          <span class="pill__label">АФК</span>
          <span class="pill__value">{{ afkCount }}</span>
        </div>
        <div class="pill pill--off">
          <span class="pill__dot" />
          <span class="pill__label">Вышли</span>
          <span class="pill__value">{{ offlineCount }}</span>
        </div>
      </div>

      <div v-if="onlineStore.isLoading" class="online-state">
        <Icon name="mdi:loading" size="32" class="spin" />
        <span>Загрузка...</span>
      </div>

      <div v-else-if="onlineStore.error" class="online-state online-state--error">
        <Icon name="mdi:alert-circle-outline" size="32" />
        <span>{{ onlineStore.error }}</span>
        <button class="crm-btn crm-btn--ghost crm-btn--sm" @click="refreshData">Повторить</button>
      </div>

      <div v-else-if="!allUsers.length" class="online-state">
        <Icon name="mdi:account-off-outline" size="40" />
        <span>Нет пользователей</span>
        <span class="online-state__hint">Пользователи появятся здесь после входа в систему</span>
      </div>

      <div v-else class="online-card">
        <div class="online-card__header">
          <span class="online-card__title">
            Пользователи
            <span class="badge">{{ allUsers.length }}</span>
          </span>
          <div class="online-card__actions">
            <label class="toggle-label">
              <input type="checkbox" v-model="showDetails" class="toggle-cb" />
              <span class="toggle-track" />
              <span class="toggle-text">Детали</span>
            </label>
          </div>
        </div>

        <div class="online-list">
          <div
            v-for="user in allUsers"
            :key="`${user.userId}-${user.status}-${user.lastActivity}`"
            class="online-user"
            :class="{
              'online-user--current': user.userId === authStore.user?.id,
              'online-user--offline': user.status === 'offline'
            }"
          >
            <div :class="['online-user__dot', `online-user__dot--${user.status}`]" :title="user.status" />

            <div class="online-user__info">
              <div class="online-user__row">
                <span class="online-user__name">
                  {{ user.user?.name || 'Неизвестный' }}
                  <span v-if="user.userId === authStore.user?.id" class="you-badge">Вы</span>
                </span>
                <span v-if="user.user?.role" :class="['role-badge', `role-badge--${user.user.role}`]">
                  {{ roleLabels[user.user.role] || user.user.role }}
                </span>
              </div>

              <div class="online-user__meta" v-if="showDetails && user.status !== 'offline'">
                <span class="kv__k">В сети:</span>
                <span class="kv__v">{{ getDuration(user.startedAt) }}</span>
                <span class="kv__k">Активность:</span>
                <span :class="['kv__v', { 'kv__v--warn': isActivityStale(user.lastActivity) }]">
                  {{ formatTimeAgo(user.lastActivity) }}
                </span>
              </div>

              <div class="online-user__meta" v-if="showDetails && user.status === 'offline'">
                <span class="kv__k">Вышел:</span>
                <span class="kv__v">
                  {{ formatTimeAgo(user.endedAt || user.lastActivity) }}
                  <span class="kv__v--muted">({{ formatFullDateTime(user.endedAt || user.lastActivity) }})</span>
                </span>
                <span class="kv__k">Был на:</span>
                <span class="kv__v kv__v--truncate">{{ formatPath(user.activePath) }}</span>
              </div>

              <div class="online-user__path" v-if="showDetails && user.status !== 'offline'">
                <Icon :name="getPageIcon(user.activePath)" size="12" />
                <span class="kv__v kv__v--truncate">{{ formatPath(user.activePath) }}</span>
              </div>
            </div>

            <div class="online-user__ip kv__v" v-if="showDetails" :title="user.ipAddress || ''">
              {{ formatIp(user.ipAddress) }}
            </div>

            <span :class="['online-user__status', `online-user__status--${user.status}`]">
              {{ statusLabels[user.status] || user.status }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useOnlineStore } from '../../../stores/online'
import { useAuthStore } from '../../../stores/auth'
import { socketService } from 'services/socket.service'
import type { OnlineUser } from '~/types'
import { definePageMeta } from 'node_modules/nuxt/dist/pages/runtime'

definePageMeta({ layout: 'cabinet', middleware: ['require-auth'] })

const onlineStore = useOnlineStore()
const authStore = useAuthStore()

const { users: onlineUsersRaw } = storeToRefs(onlineStore)

const showDetails = ref(true)
const currentTime = ref(Date.now())
let timeInterval: ReturnType<typeof setInterval> | null = null
let fallbackPoller: ReturnType<typeof setInterval> | null = null

const AFK_THRESHOLD = 5 * 60 * 1000

const roleLabels: Record<string, string> = {
  admin: 'Админ', manager: 'Менеджер', foreman: 'Прораб',
  master: 'Мастер', worker: 'Рабочий',
}

const statusLabels: Record<string, string> = {
  online: 'онлайн',
  afk: 'afk',
  offline: 'вышел',
}

// Клиентский пересчёт статусов — реагирует на currentTime каждую секунду
const allUsers = computed<OnlineUser[]>(() => {
  const now = currentTime.value

  const list = (onlineUsersRaw.value || []).map((u: OnlineUser) => {
    const lastMs = new Date(u.lastActivity).getTime()
    const diff = now - lastMs
    
    // ✅ ПРИОРИТЕТ: если активность свежая (<5 мин) → всегда 'online'
    // Даже если сервер прислал 'afk' (рассинхрон)
    if (diff < AFK_THRESHOLD) {
      return { ...u, status: 'online' as const }
    }
    
    // ✅ Если активность старая И статус 'online' → меняем на 'afk'
    if (u.status === 'online' && diff >= AFK_THRESHOLD) {
      return { ...u, status: 'afk' as const }
    }
    
    return u
  })

  return list.sort((a: OnlineUser, b: OnlineUser) => {
    if (a.userId === authStore.user?.id) return -1
    if (b.userId === authStore.user?.id) return 1
    const order: Record<string, number> = { online: 0, afk: 1, offline: 2 }
    const diff = (order[a.status] ?? 2) - (order[b.status] ?? 2)
    if (diff !== 0) return diff
    return new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
  })
})

const activeCount  = computed(() => allUsers.value.filter(u => u.status === 'online').length)
const afkCount     = computed(() => allUsers.value.filter(u => u.status === 'afk').length)
const offlineCount = computed(() => allUsers.value.filter(u => u.status === 'offline').length)

function formatTimeAgo(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  const diff = currentTime.value - new Date(dateStr).getTime()
  const s = Math.floor(diff / 1000)
  const m = Math.floor(s / 60)
  const h = Math.floor(m / 60)
  if (s < 60) return 'только что'
  if (m < 60) return `${m} мин назад`
  if (h < 24) return `${h} ч назад`
  return `${Math.floor(h / 24)} дн назад`
}

function formatFullDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  
  const date = new Date(dateStr)
  
  // Проверяем валидность даты
  if (isNaN(date.getTime())) return '—'
  
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function getDuration(startedAt: string): string {
  if (!startedAt) return '—'
  const diff = currentTime.value - new Date(startedAt).getTime()
  const h = Math.floor(diff / 3_600_000)
  const m = Math.floor((diff % 3_600_000) / 60_000)
  return h > 0 ? `${h}ч ${m}м` : `${m}м`
}

function isActivityStale(lastActivity: string): boolean {
  if (!lastActivity) return true
  return currentTime.value - new Date(lastActivity).getTime() > AFK_THRESHOLD
}

function formatPath(path: string | null | undefined): string {
  if (!path || path === '/' || path === 'null') return '—'
  const clean = path.replace(/^\/+/, '')
  const labels: Record<string, string> = {
    'cabinet': 'Кабинет', 'cabinet/online': 'Онлайн', 'cabinet/boards': 'Доски',
    'cabinet/objects': 'Объекты', 'cabinet/operation': 'Операции',
    'cabinet/materials': 'Материалы', 'login': 'Вход',
  }
  if (labels[clean]) return labels[clean]
  const parts = clean.split('/')
  const page = parts[1]
  if (page) return page.charAt(0).toUpperCase() + page.slice(1)
  return clean.length > 25 ? clean.substring(0, 22) + '…' : clean
}

function getPageIcon(path: string | null | undefined): string {
  if (!path) return 'mdi:web'
  const clean = path.replace(/^\/+/, '')
  const icons: Record<string, string> = {
    'cabinet/online': 'mdi:account-group', 'cabinet/boards': 'mdi:view-dashboard',
    'cabinet/objects': 'mdi:office-building-outline', 'cabinet/operation': 'mdi:swap-horizontal',
    'cabinet/materials': 'mdi:receipt-text-outline', 'login': 'mdi:login',
  }
  return icons[clean] || 'mdi:web'
}

function formatIp(ip: string | null | undefined): string {
  if (!ip) return '—'
  const parts = ip.split('.')
  return parts.length === 4 ? `${parts[0]}.${parts[1]}.*.*` : ip
}

async function refreshData() {
  try { await onlineStore.fetchOnlineUsers() }
  catch (e) { console.error('[Онлайн] Ошибка обновления:', e) }
}

onMounted(() => {
  refreshData()
  onlineStore.subscribeToUpdates()
  timeInterval = setInterval(() => { currentTime.value = Date.now() }, 1000)
  fallbackPoller = setInterval(() => {
    if (!socketService.getConnected()) {
      console.warn('[Онлайн] Socket не активен, форс-обновление')
      refreshData()
    }
  }, 15000)
})

onUnmounted(() => {
  onlineStore.unsubscribeFromUpdates()
  if (timeInterval) clearInterval(timeInterval)
  if (fallbackPoller) clearInterval(fallbackPoller)
})
</script>

<style lang="scss" scoped>
.online-page {
  min-height: 100%;
  background: var(--crm-bg-base);
  &__content {
    padding: 16px 24px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
}

.status-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 8px 0;
}
.pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--crm-bg-elevated);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-sm);
  padding: 4px 10px;
  &__dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
  &__label { color: var(--crm-text-muted); font-size: var(--crm-text-xs); }
  &__value {
    font-weight: 600;
    font-size: var(--crm-text-sm);
    font-family: var(--crm-font-mono);
  }
  &--ok   { .pill__dot { background: var(--crm-success); } .pill__value { color: var(--crm-success); } }
  &--warn { .pill__dot { background: var(--crm-warning); } .pill__value { color: var(--crm-warning); } }
  &--off  { .pill__dot { background: var(--crm-text-disabled); } .pill__value { color: var(--crm-text-muted); } }
}

.online-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 60px 20px;
  color: var(--crm-text-muted);
  font-size: var(--crm-text-sm);
  text-align: center;
  &--error { color: var(--crm-danger); }
  &__hint { font-size: var(--crm-text-xs); color: var(--crm-text-disabled); max-width: 300px; }
}

.online-card {
  background: var(--crm-bg-surface);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-lg);
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  // min-height: 400px;
  // max-height: 600px;
  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
  }
  &__title {
    font-size: var(--crm-text-xs);
    font-weight: 600;
    letter-spacing: 0.06em;
    color: var(--crm-text-muted);
    text-transform: uppercase;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  &__actions { display: flex; gap: 6px; align-items: center; }
}

.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--crm-bg-overlay);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-sm);
  padding: 0 5px;
  font-size: var(--crm-text-xs);
  font-weight: 600;
  color: var(--crm-text-muted);
  min-width: 18px;
}

.online-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
  scrollbar-width: thin;
  scrollbar-color: var(--crm-bg-overlay) transparent;
  padding-right: 4px;
  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb { background: var(--crm-bg-overlay); border-radius: 2px; }
}

.online-user {
  display: grid;
  grid-template-columns: auto 1fr auto auto;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: var(--crm-radius-md);
  background: var(--crm-bg-elevated);
  border: 1px solid var(--crm-border);
  transition: var(--crm-transition);

  &:hover {
    border-color: var(--crm-border-hover);
    background: var(--crm-bg-overlay);
  }
  &--current {
    border-color: var(--crm-accent-border);
    background: var(--crm-accent-dim);
  }
  &--offline {
    opacity: 0.5;
    &:hover { opacity: 0.75; }
  }

  &__dot {
    width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
    &--online {
      background: var(--crm-success);
      box-shadow: 0 0 5px var(--crm-success-dim);
      animation: pulse 2s ease-in-out infinite;
    }
    &--afk    { background: var(--crm-warning); }
    &--offline { background: var(--crm-text-disabled); }
  }
  &__info { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
  &__row  { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  &__name {
    font-size: var(--crm-text-sm);
    font-weight: 500;
    color: var(--crm-text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  &__meta {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: var(--crm-text-xs);
    .kv__k { color: var(--crm-text-muted); margin-right: 4px; }
  }
  &__path {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: var(--crm-text-xs);
    color: var(--crm-text-muted);
    .kv__v--truncate { max-width: 180px; }
  }
  &--muted {
    color: var(--crm-text-muted);
    font-weight: 400;
    margin-left: 4px;
    
    &::before {
      content: '•';
      margin-right: 4px;
      color: var(--crm-text-disabled);
    }
  }
  &__ip {
    font-size: var(--crm-text-xs);
    color: var(--crm-text-muted);
    text-align: right;
    min-width: 90px;
    font-family: var(--crm-font-mono);
  }
  &__status {
    font-size: var(--crm-text-xs);
    font-weight: 700;
    letter-spacing: 0.06em;
    padding: 2px 6px;
    border-radius: var(--crm-radius-sm);
    text-transform: uppercase;
    &--online  { background: var(--crm-success-dim); color: var(--crm-success); }
    &--afk     { background: var(--crm-warning-dim); color: var(--crm-warning); }
    &--offline { background: var(--crm-bg-overlay);  color: var(--crm-text-muted); }
  }
}

@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.45; } }

.role-badge {
  display: inline-flex;
  font-size: var(--crm-text-xs);
  font-weight: 700;
  padding: 1px 6px;
  border-radius: var(--crm-radius-sm);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  &--admin   { background: var(--crm-danger-dim);  color: var(--crm-danger); }
  &--manager { background: var(--crm-info-dim);    color: var(--crm-info); }
  &--foreman { background: var(--crm-warning-dim); color: var(--crm-warning); }
  &--master  { background: var(--crm-success-dim); color: var(--crm-success); }
  &--worker  { background: var(--crm-bg-overlay);  color: var(--crm-text-muted); }
}

.crm-btn {
  align-items: center;
  border-radius: var(--crm-radius-md);
  cursor: pointer;
  display: inline-flex;
  font-weight: 500;
  gap: 5px;
  transition: var(--crm-transition);
  font-size: var(--crm-text-sm);
  padding: 6px 12px;
  background: transparent;
  border: 1px solid var(--crm-border-hover);
  color: var(--crm-text-secondary);
}

.you-badge {
  font-size: var(--crm-text-xs);
  font-weight: 700;
  padding: 1px 5px;
  background: var(--crm-info-dim);
  border: 1px solid var(--crm-accent-border);
  border-radius: var(--crm-radius-sm);
  color: var(--crm-accent);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.toggle-label {
  display: flex; align-items: center; gap: 7px;
  cursor: pointer; font-size: var(--crm-text-xs);
  color: var(--crm-text-muted); user-select: none;
}
.toggle-cb { display: none; }
.toggle-track {
  position: relative; display: inline-block;
  width: 28px; height: 16px;
  background: var(--crm-bg-overlay);
  border: 1px solid var(--crm-border-hover);
  border-radius: 8px; transition: var(--crm-transition); flex-shrink: 0;
  &::after {
    content: ''; position: absolute; top: 2px; left: 2px;
    width: 10px; height: 10px;
    background: var(--crm-text-muted); border-radius: 50%;
    transition: var(--crm-transition);
  }
}
.toggle-cb:checked + .toggle-track {
  background: var(--crm-warning-dim); border-color: var(--crm-warning);
  &::after { transform: translateX(12px); background: var(--crm-warning); }
}
.toggle-text { white-space: nowrap; }

.kv {
  display: flex; justify-content: space-between; align-items: baseline; gap: 8px;
  &__k { color: var(--crm-text-muted); font-size: var(--crm-text-xs); flex-shrink: 0; }
  &__v {
    font-size: var(--crm-text-xs); font-family: var(--crm-font-mono);
    color: var(--crm-text-secondary); word-break: break-all;
    &--truncate { max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    &--warn { color: var(--crm-warning); }
    &--ok   { color: var(--crm-success); }
  }
}

.spin { animation: spin 1s linear infinite; display: inline-block; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

@media (max-width: 700px) {
  .online-user {
    grid-template-columns: auto 1fr auto;
    .online-user__ip { display: none; }
  }
}
@media (max-width: 480px) {
  .online-page__content { padding: 12px 16px; }
  .online-user__path { display: none; }
  .online-card__actions { display: none; }
}
</style>
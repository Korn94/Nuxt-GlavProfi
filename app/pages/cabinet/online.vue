<!-- app/pages/cabinet/online.vue -->
<template>
  <div class="online-page">
    <!-- Заголовок -->
    <PagesCabinetUiLayoutPageTitle title="Онлайн" icon="mdi:account-group-outline">
      <template #actions>
        <button class="crm-btn crm-btn--ghost crm-btn--sm" @click="refreshData" :disabled="onlineStore.isLoading">
          <Icon name="mdi:refresh" size="14" :class="{ spin: onlineStore.isLoading }" />
          Обновить
        </button>
      </template>
    </PagesCabinetUiLayoutPageTitle>

    <div class="online-page__content">
      <!-- Статистика -->
      <div class="stats-row">
        <div class="stat-card" v-for="s in statCards" :key="s.label">
          <div class="stat-card__icon" :style="{ background: s.bgColor, color: s.color }">
            <Icon :name="s.icon" size="18" />
          </div>
          <div class="stat-card__info">
            <span class="stat-card__value">{{ s.value }}</span>
            <span class="stat-card__label">{{ s.label }}</span>
          </div>
        </div>
      </div>

      <!-- Загрузка -->
      <div v-if="onlineStore.isLoading" class="online-state">
        <Icon name="mdi:loading" size="32" class="spin" />
        <span>Загрузка...</span>
      </div>

      <!-- Ошибка -->
      <div v-else-if="onlineStore.error" class="online-state online-state--error">
        <Icon name="mdi:alert-circle-outline" size="32" />
        <span>{{ onlineStore.error }}</span>
        <button class="crm-btn crm-btn--ghost crm-btn--sm" @click="refreshData">
          Повторить
        </button>
      </div>

      <!-- Пусто -->
      <div v-else-if="!onlineUsers.length" class="online-state">
        <Icon name="mdi:account-off-outline" size="40" />
        <span>Нет онлайн-пользователей</span>
        <span class="online-state__hint">Пользователи появятся здесь после входа в систему</span>
      </div>

      <!-- Таблица -->
      <div v-else class="online-card">
        <div class="online-card__header">
          <span class="online-card__title">
            Пользователи
            <span class="badge">{{ onlineUsers.length }}</span>
          </span>
        </div>
        <div class="online-table-wrap">
          <table class="online-table">
            <thead>
              <tr>
                <th>Пользователь</th>
                <th>Статус</th>
                <th>В сети</th>
                <th>Активность</th>
                <th class="col-page">Страница</th>
                <th class="col-ip">IP</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in onlineUsers" :key="user.userId" class="online-row"
                :class="{ 'online-row--current': user.userId === authStore.user?.id }">
                <!-- Пользователь -->
                <td class="online-td">
                  <div class="user-cell">
                    <div class="user-avatar" :style="{ background: getAvatarColor(user.userId) }">
                      {{ getUserInitials(user.user?.name) }}
                    </div>
                    <div class="user-info">
                      <div class="user-name">
                        {{ user.user?.name || 'Неизвестный' }}
                        <span v-if="user.userId === authStore.user?.id" class="you-badge">Вы</span>
                      </div>
                      <span v-if="user.user?.role" :class="['role-badge', `role-badge--${user.user.role}`]">
                        {{ roleLabels[user.user.role] || user.user.role }}
                      </span>
                    </div>
                  </div>
                </td>

                <!-- Статус -->
                <td class="online-td">
                  <UiStatusOnlineStatus :status="user.status" :show-text="true" :show-tooltip="true" />
                </td>

                <!-- В сети -->
                <td class="online-td online-td--muted">
                  <span :title="formatFullDate(user.startedAt)">
                    {{ getDuration(user.startedAt) }}
                  </span>
                </td>

                <!-- Активность -->
                <td class="online-td">
                  <span :class="['activity', { 'activity--stale': isActivityStale(user.lastActivity) }]"
                    :title="formatFullDate(user.lastActivity)">
                    {{ formatTimeAgo(user.lastActivity) }}
                  </span>
                </td>

                <!-- Страница -->
                <td class="online-td col-page">
                  <div class="page-pill" :title="user.activePath ?? ''">
                    <Icon :name="getPageIcon(user.activePath)" size="13" />
                    {{ formatPath(user.activePath) }}
                  </div>
                </td>

                <!-- IP -->
                <td class="online-td col-ip online-td--mono">
                  {{ formatIp(user.ipAddress) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useOnlineStore } from '../../../stores/online'
import { useAuthStore } from '../../../stores/auth'
import { socketService } from 'services/socket.service'
import type { OnlineUser } from '~/types'
import { definePageMeta } from 'node_modules/nuxt/dist/pages/runtime'

// ── Мета ─────────────────────────────────────────────────────────────
definePageMeta({
  layout: 'cabinet',
  middleware: ['require-auth']
})

// ── Stores ───────────────────────────────────────────────────────────
const onlineStore = useOnlineStore()
const authStore = useAuthStore()

// ── Таймер ───────────────────────────────────────────────────────────
const currentTime = ref(Date.now())
let timeInterval: ReturnType<typeof setInterval> | null = null

// ── Справочники ──────────────────────────────────────────────────────
const roleLabels: Record<string, string> = {
  admin: 'Админ',
  manager: 'Менеджер',
  foreman: 'Прораб',
  master: 'Мастер',
  worker: 'Рабочий',
}

const avatarColors = [
  '#00c3f5', '#3dd68c', '#7c3aed', '#f5a623',
  '#e85d9e', '#5b8def', '#f25f5c', '#17a2b8'
]

// ── Computed ─────────────────────────────────────────────────────────
const onlineUsers = computed<OnlineUser[]>(() =>
  [...onlineStore.getOnlineUsers].sort((a: OnlineUser, b: OnlineUser) => {
    // ✅ Сначала текущий пользователь
    if (a.userId === authStore.user?.id) return -1
    if (b.userId === authStore.user?.id) return 1
    
    // ✅ Затем по статусу (online > afk > offline)
    const order: Record<string, number> = { online: 0, afk: 1, offline: 2 }
    const diff = (order[a.status] ?? 2) - (order[b.status] ?? 2)
    if (diff !== 0) return diff
    
    // ✅ Затем по последней активности
    return new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
  })
)

const statCards = computed(() => [
  {
    label: 'Всего онлайн',
    value: onlineStore.getOnlineCount,
    icon: 'mdi:account-group-outline',
    color: 'var(--crm-accent)',
    bgColor: 'var(--crm-accent-dim)',
  },
  {
    label: 'Активны',
    value: onlineStore.getActiveUsers.length,
    icon: 'mdi:check-circle-outline',
    color: 'var(--crm-success)',
    bgColor: 'var(--crm-success-dim)',
  },
  {
    label: 'В АФК',
    value: onlineStore.getAFKUsers.length,
    icon: 'mdi:clock-outline',
    color: 'var(--crm-warning)',
    bgColor: 'var(--crm-warning-dim)',
  },
  // ✅ УДАЛЕНО: Карточка "Всего вкладок"
])

// ── Форматирование ───────────────────────────────────────────────────
function formatTimeAgo(dateStr: string): string {
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

function formatFullDate(dateStr: string): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('ru-RU', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
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
  return currentTime.value - new Date(lastActivity).getTime() > 5 * 60 * 1000
}

function formatPath(path: string | null | undefined): string {
  if (!path || path === '/' || path === 'null') return '—'
  const clean = path.replace(/^\/+/, '')
  const labels: Record<string, string> = {
    'cabinet': 'Кабинет',
    'cabinet/online': 'Онлайн',
    'cabinet/boards': 'Доски',
    'cabinet/objects': 'Объекты',
    'cabinet/operation': 'Операции',
    'cabinet/materials': 'Материалы',
    'login': 'Вход',
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
    'cabinet/online': 'mdi:account-group',
    'cabinet/boards': 'mdi:view-dashboard',
    'cabinet/objects': 'mdi:office-building-outline',
    'cabinet/operation': 'mdi:swap-horizontal',
    'cabinet/materials': 'mdi:receipt-text-outline',
    'login': 'mdi:login',
  }
  return icons[clean] || 'mdi:web'
}

function formatIp(ip: string | null | undefined): string {
  if (!ip) return '—'
  const parts = ip.split('.')
  return parts.length === 4 ? `${parts[0]}.${parts[1]}.*.*` : ip
}

function getUserInitials(name?: string | null): string {
  if (!name?.trim()) return '?'
  const parts = name.trim().split(' ').filter(Boolean)
  if (parts.length >= 2) {
    const first = parts[0]?.charAt(0) ?? ''
    const second = parts[1]?.charAt(0) ?? ''
    return (first + second).toUpperCase()
  }
  return parts[0]?.substring(0, 2).toUpperCase() ?? '?'
}

function getAvatarColor(userId: number): string {
  return avatarColors[userId % avatarColors.length]!
}

// ── Данные ───────────────────────────────────────────────────────────
async function refreshData() {
  try { await onlineStore.fetchOnlineUsers() }
  catch (e) { console.error('[Онлайн] Ошибка обновления:', e) }
}

// ── Сокет ────────────────────────────────────────────────────────────
function setupSocket() {
  socketService.on('online-users:update', (users: OnlineUser[]) => {
    onlineStore.users = users
  })
  socketService.on('user:status', () => {
    onlineStore.fetchOnlineUsers().catch(console.error)
  })
}

function cleanupSocket() {
  socketService.off('online-users:update')
  socketService.off('user:status')
}

// ── Lifecycle ────────────────────────────────────────────────────────
onMounted(() => {
  refreshData()
  setupSocket()
  timeInterval = setInterval(() => { currentTime.value = Date.now() }, 1000)
})

onUnmounted(() => {
  cleanupSocket()
  if (timeInterval) clearInterval(timeInterval)
})
</script>

<style lang="scss" scoped>
.online-page {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  &__content {
    padding: 20px 24px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
}

// ── Статистика ───────────────────────────────────────────────────────
.stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr); // ✅ Было 4, стало 3
  gap: 12px;
  @media (max-width: 800px) {
    grid-template-columns: repeat(2, 1fr);
  }
  @media (max-width: 400px) {
    grid-template-columns: 1fr;
  }
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: var(--crm-bg-surface);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-lg);
  transition: var(--crm-transition);
  &:hover {
    border-color: var(--crm-border-hover);
    transform: translateY(-2px);
  }
  &__icon {
    width: 38px;
    height: 38px;
    border-radius: var(--crm-radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  &__info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }
  &__value {
    font-size: 24px;
    font-weight: 700;
    color: var(--crm-text-primary);
    line-height: 1;
  }
  &__label {
    font-size: var(--crm-text-xs);
    color: var(--crm-text-muted);
    white-space: nowrap;
  }
}

// ── Состояния ────────────────────────────────────────────────────────
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
  &--error {
    color: var(--crm-danger);
  }
  &__hint {
    font-size: var(--crm-text-xs);
    color: var(--crm-text-disabled);
    max-width: 300px;
  }
}

// ── Карточка таблицы ────────────────────────────────────────────────
.online-card {
  background: var(--crm-bg-surface);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-lg);
  overflow: hidden;
  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
    border-bottom: 1px solid var(--crm-border);
  }
  &__title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: var(--crm-text-md);
    font-weight: 600;
    color: var(--crm-text-primary);
  }
}

.badge {
  display: inline-flex;
  align-items: center;
  padding: 1px 8px;
  background: var(--crm-bg-overlay);
  border: 1px solid var(--crm-border-hover);
  border-radius: 10px;
  font-size: var(--crm-text-xs);
  font-weight: 600;
  color: var(--crm-text-muted);
}

// ── Таблица ──────────────────────────────────────────────────────────
.online-table-wrap {
  overflow-x: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--crm-bg-overlay) transparent;
}

.online-table {
  width: 100%;
  border-collapse: collapse;
  th {
    padding: 10px 14px;
    background: var(--crm-bg-elevated);
    font-size: var(--crm-text-xs);
    font-weight: 600;
    color: var(--crm-text-muted);
    text-align: left;
    text-transform: uppercase;
    letter-spacing: .05em;
    white-space: nowrap;
    border-bottom: 1px solid var(--crm-border);
  }
}

.online-row {
  border-bottom: 1px solid var(--crm-border);
  transition: var(--crm-transition);
  &:last-child {
    border-bottom: none;
  }
  &:hover {
    background: var(--crm-bg-elevated);
  }
  &--current {
    background: var(--crm-accent-dim);
    border-left: 3px solid var(--crm-accent);
    &:hover {
      background: rgba(0, 195, 245, 0.12);
    }
  }
}

.online-td {
  padding: 12px 14px;
  font-size: var(--crm-text-sm);
  color: var(--crm-text-secondary);
  white-space: nowrap;
  &--muted {
    color: var(--crm-text-muted);
  }
  &--mono {
    font-family: var(--crm-font-mono);
    font-size: var(--crm-text-xs);
    color: var(--crm-text-disabled);
  }
}

// ── Ячейка пользователя ──────────────────────────────────────────────
.user-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--crm-text-sm);
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
  text-transform: uppercase;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.user-name {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: var(--crm-text-sm);
  font-weight: 500;
  color: var(--crm-text-primary);
}

.you-badge {
  font-size: var(--crm-text-xs);
  font-weight: 600;
  padding: 1px 6px;
  background: var(--crm-accent-dim);
  border: 1px solid var(--crm-accent-border);
  border-radius: var(--crm-radius-sm);
  color: var(--crm-accent);
}

.role-badge {
  display: inline-flex;
  font-size: var(--crm-text-xs);
  font-weight: 600;
  padding: 1px 7px;
  border-radius: var(--crm-radius-sm);
  text-transform: uppercase;
  letter-spacing: .04em;
  &--admin {
    background: var(--crm-danger-dim);
    color: var(--crm-danger);
  }
  &--manager {
    background: var(--crm-accent-dim);
    color: var(--crm-accent);
  }
  &--foreman {
    background: var(--crm-warning-dim);
    color: var(--crm-warning);
  }
  &--master {
    background: var(--crm-success-dim);
    color: var(--crm-success);
  }
  &--worker {
    background: var(--crm-bg-overlay);
    color: var(--crm-text-muted);
  }
}

// ✅ УДАЛЕНО: Стили .tabs-pill (больше не используется)

// ── Активность ───────────────────────────────────────────────────────
.activity {
  color: var(--crm-text-secondary);
  &--stale {
    color: var(--crm-text-disabled);
    font-style: italic;
  }
}

// ── Страница ─────────────────────────────────────────────────────────
.page-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 10px;
  background: var(--crm-bg-elevated);
  border-radius: var(--crm-radius-md);
  font-size: var(--crm-text-xs);
  color: var(--crm-text-muted);
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

// ── Адаптив ──────────────────────────────────────────────────────────
.col-page,
.col-ip {
  @media (max-width: 1000px) {
    display: none;
  }
}

// ── Спиннер ──────────────────────────────────────────────────────────
.spin {
  animation: spin 1s linear infinite;
  display: inline-block;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

// ── Кнопки ───────────────────────────────────────────────────────────
.crm-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border-radius: var(--crm-radius-md);
  font-weight: 500;
  cursor: pointer;
  transition: var(--crm-transition);
  &--sm {
    padding: 6px 12px;
    font-size: var(--crm-text-sm);
  }
  &--ghost {
    background: transparent;
    border: 1px solid var(--crm-border-hover);
    color: var(--crm-text-secondary);
    &:hover:not(:disabled) {
      background: var(--crm-bg-elevated);
      color: var(--crm-text-primary);
    }
    &:disabled {
      opacity: .45;
      cursor: not-allowed;
    }
  }
}

@media (max-width: 767.98px) {
  .online-page__content {
    padding: 16px;
  }
}
</style>
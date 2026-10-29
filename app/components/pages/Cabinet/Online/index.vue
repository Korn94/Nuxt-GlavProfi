<!-- app/components/pages/Cabinet/Online/index.vue -->
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
        <div class="pill pill--info">
          <span class="pill__dot" />
          <span class="pill__label">Посетители сайта</span>
          <span class="pill__value">{{ visitors.length }}</span>
        </div>
      </div>

      <PagesCabinetOnlineUsersList
        :users="allUsers"
        :current-user-id="authStore.user?.id"
        v-model:show-details="showDetails"
        :loading="onlineStore.isLoading"
        :error="onlineStore.error"
        @retry="refreshData"
      />

      <PagesCabinetOnlineVisitorsList
        :visitors="visitors"
        :online-count="visitorsOnlineCount"
        :show-details="showDetails"
        :loading="visitorsStore.isLoading"
        :error="visitorsStore.error"
      />

      <PagesCabinetOnlineAnalytics
        :stats="stats"
        :stats-days="statsDays"
        :loading="visitorsStore.isStatsLoading"
        :error="visitorsStore.statsError"
        @update:stats-days="onStatsDaysChange"
        @refresh="loadStats"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useOnlineStore } from 'stores/online'
import { useVisitorsStore } from 'stores/visitors'
import { useAuthStore } from 'stores/auth'
import { socketService } from 'services/socket.service'
import type { OnlineUser, Visitor } from '~/types'
import { useOnlineFormatters } from './composables/useOnlineFormatters'

const onlineStore = useOnlineStore()
const visitorsStore = useVisitorsStore()
const authStore = useAuthStore()

const { users: onlineUsersRaw } = storeToRefs(onlineStore)
const { visitors: visitorsRaw } = storeToRefs(visitorsStore)

const { startClock, stopClock } = useOnlineFormatters()

const showDetails = ref(true)

let fallbackPoller: ReturnType<typeof setInterval> | null = null

// Сортировка пользователей (статус приходит уже корректный с сервера)
const allUsers = computed<OnlineUser[]>(() => {
  const list = onlineUsersRaw.value || []
  return [...list].sort((a: OnlineUser, b: OnlineUser) => {
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

// 👥 Посетители сайта (анонимные) — данные сервер отдаёт уже отсортированными
const visitors = computed<Visitor[]>(() => visitorsRaw.value || [])
const visitorsOnlineCount = computed(() => visitors.value.filter(v => v.status === 'online').length)

// 📊 Аналитика из БД (таблицы под блоком «Посетители сайта»)
const stats = computed(() => visitorsStore.stats)
const statsDays = ref(visitorsStore.statsDays)

async function loadStats() {
  try { await visitorsStore.fetchStats(statsDays.value) }
  catch (e) { console.error('[Онлайн] Ошибка загрузки аналитики:', e) }
}

function onStatsDaysChange(value: number) {
  statsDays.value = value
  loadStats()
}

async function refreshData() {
  try { await onlineStore.fetchOnlineUsers() }
  catch (e) { console.error('[Онлайн] Ошибка обновления:', e) }

  // 👥 Посетители сайта — живой список (in-memory реестр на сервере)
  try { await visitorsStore.fetchVisitors() }
  catch (e) { console.error('[Онлайн] Ошибка обновления посетителей:', e) }

  // 📊 Аналитика из БД (источники, страницы, обращения, визиты)
  await loadStats()
}

onMounted(() => {
  refreshData()
  onlineStore.subscribeToUpdates()
  // Посетители: подписка на socket-событие 'visitors:update'
  visitorsStore.subscribeToUpdates()
  startClock()
  fallbackPoller = setInterval(() => {
    if (!socketService.getConnected()) {
      console.warn('[Онлайн] Socket не активен, форс-обновление')
      refreshData()
    }
  }, 15000)
})

onUnmounted(() => {
  onlineStore.unsubscribeFromUpdates()
  visitorsStore.unsubscribeFromUpdates()
  stopClock()
  if (fallbackPoller) clearInterval(fallbackPoller)
})
</script>

<style lang="scss" scoped>
@use './online.shared.scss';

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
  &--info { .pill__dot { background: var(--crm-info); } .pill__value { color: var(--crm-info); } }
}

@media (max-width: 480px) {
  .online-page__content { padding: 12px 16px; }
}
</style>

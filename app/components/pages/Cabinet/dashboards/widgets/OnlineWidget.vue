<template>
  <div class="online-widget">
    <div class="online-widget__header">
      <span class="online-widget__title">
        <Icon name="mdi:account-multiple" size="14" />
        Онлайн
      </span>
      <span class="online-widget__count">{{ onlineCount }}</span>
    </div>

    <div class="online-widget__list" v-if="activeUsers.length">
      <div
        v-for="user in activeUsers"
        :key="user.userId"
        class="online-widget__user"
      >
        <span class="online-widget__dot" />
        <span class="online-widget__name">{{ user.user?.name || '—' }}</span>
        <span class="online-widget__device" :title="deviceLabels[user.deviceType]">
          <Icon v-if="user.deviceType === 'mobile'" name="mdi:cellphone" size="12" />
          <Icon v-else-if="user.deviceType === 'desktop'" name="mdi:monitor" size="12" />
        </span>
      </div>
    </div>

    <div v-else-if="isLoading" class="online-widget__empty">
      <span class="online-widget__hint">Загрузка...</span>
    </div>

    <div v-else class="online-widget__empty">
      <span class="online-widget__hint">Нет активных пользователей</span>
    </div>

    <NuxtLink to="/cabinet/online" class="online-widget__link">
      Все пользователи
      <Icon name="mdi:arrow-right" size="12" />
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useOnlineStore } from 'stores/online'
import type { OnlineUser } from '~/types'

const onlineStore = useOnlineStore()
const { users, isLoading } = storeToRefs(onlineStore)

const deviceLabels: Record<string, string> = {
  desktop: 'Компьютер',
  mobile: 'Мобильное устройство',
  unknown: 'Неизвестное устройство',
}

const activeUsers = computed<OnlineUser[]>(() => {
  return (users.value || [])
    .filter(u => u.status === 'online')
    .slice(0, 5)
})

const onlineCount = computed(() => {
  return (users.value || []).filter(u => u.status === 'online').length
})

onMounted(() => {
  if (!onlineStore.isInitialized) {
    onlineStore.init()
  }
})

onUnmounted(() => {
  // Не отписываемся, т.к. виджет может быть на одной странице с другими компонентами
})
</script>

<style lang="scss" scoped>
.online-widget {
  background: var(--crm-bg-surface);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-lg);
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: var(--crm-text-xs);
    font-weight: 600;
    letter-spacing: 0.06em;
    color: var(--crm-text-muted);
    text-transform: uppercase;
  }

  &__count {
    font-size: var(--crm-text-sm);
    font-weight: 700;
    color: var(--crm-success);
    font-family: var(--crm-font-mono);
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  &__user {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 0;
  }

  &__dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--crm-success);
    flex-shrink: 0;
    box-shadow: 0 0 4px var(--crm-success-dim);
    animation: pulse 2s ease-in-out infinite;
  }

  &__name {
    font-size: var(--crm-text-sm);
    color: var(--crm-text-primary);
    font-weight: 500;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__device {
    display: flex;
    align-items: center;
    color: var(--crm-text-muted);
    flex-shrink: 0;
  }

  &__empty {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 12px 0;
  }

  &__hint {
    font-size: var(--crm-text-xs);
    color: var(--crm-text-muted);
  }

  &__link {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    font-size: var(--crm-text-xs);
    color: var(--crm-accent);
    text-decoration: none;
    padding-top: 6px;
    border-top: 1px solid var(--crm-border);
    transition: var(--crm-transition);

    &:hover {
      color: var(--crm-accent-hover);
      gap: 6px;
    }
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.45; }
}
</style>
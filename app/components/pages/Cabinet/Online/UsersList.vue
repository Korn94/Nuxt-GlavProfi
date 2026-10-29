<!-- app/components/pages/Cabinet/Online/UsersList.vue -->
<template>
  <div>
    <div v-if="loading" class="online-state">
      <Icon name="mdi:loading" size="32" class="spin" />
      <span>Загрузка...</span>
    </div>

    <div v-else-if="error" class="online-state online-state--error">
      <Icon name="mdi:alert-circle-outline" size="32" />
      <span>{{ error }}</span>
      <button class="crm-btn crm-btn--ghost crm-btn--sm" @click="emit('retry')">Повторить</button>
    </div>

    <div v-else-if="!users.length" class="online-state">
      <Icon name="mdi:account-off-outline" size="40" />
      <span>Нет пользователей</span>
      <span class="online-state__hint">Пользователи появятся здесь после входа в систему</span>
    </div>

    <div v-else class="online-card">
      <div class="online-card__header">
        <span class="online-card__title">
          Пользователи
          <span class="badge">{{ users.length }}</span>
        </span>
        <div class="online-card__actions">
          <label class="toggle-label">
            <input type="checkbox" v-model="showDetailsModel" class="toggle-cb" />
            <span class="toggle-track" />
            <span class="toggle-text">Детали</span>
          </label>
        </div>
      </div>

      <div class="online-list">
        <div
          v-for="user in users"
          :key="`${user.userId}-${user.status}-${user.lastActivity}`"
          class="online-user"
          :class="{
            'online-user--current': user.userId === currentUserId,
            'online-user--offline': user.status === 'offline'
          }"
        >
          <div :class="['online-user__dot', `online-user__dot--${user.status}`]" :title="user.status" />

          <!-- Иконка устройства -->
          <span class="online-user__device" :title="deviceLabels[user.deviceType]">
            <Icon v-if="user.deviceType === 'mobile'" name="mdi:cellphone" size="14" />
            <Icon v-else-if="user.deviceType === 'desktop'" name="mdi:monitor" size="14" />
            <Icon v-else name="mdi:devices" size="14" />
          </span>

          <div class="online-user__info">
            <div class="online-user__row">
              <span class="online-user__name">
                {{ user.user?.name || 'Неизвестный' }}
                <span v-if="user.userId === currentUserId" class="you-badge">Вы</span>
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
              <template v-if="user.lastActivity">
                <span class="kv__k">Вышел:</span>
                <span class="kv__v">
                  {{ formatTimeAgo(user.endedAt || user.lastActivity) }}
                  <span class="kv__v--muted">({{ formatFullDateTime(user.endedAt || user.lastActivity) }})</span>
                </span>
                <span class="kv__k">Был на:</span>
                <span class="kv__v kv__v--truncate-wide" :title="user.activePath || ''">
                  {{ formatPath(user.activePath, user.activeObjectName) }}
                </span>
              </template>
              <span v-else class="kv__v">не заходил</span>
            </div>

            <div class="online-user__path" v-if="showDetails && user.status !== 'offline'" :title="user.activePath || ''">
              <span class="kv__k">Сейчас:</span>
              <Icon :name="getPageIcon(user.activePath)" size="12" />
              <span class="kv__v kv__v--truncate-wide">{{ formatPath(user.activePath, user.activeObjectName) }}</span>
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
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { OnlineUser } from '~/types'
import { useOnlineFormatters } from './composables/useOnlineFormatters'

const props = defineProps<{
  users: OnlineUser[]
  currentUserId?: number | null
  showDetails: boolean
  loading: boolean
  error?: string | null
}>()

const emit = defineEmits<{
  'update:showDetails': [value: boolean]
  retry: []
}>()

const {
  roleLabels,
  statusLabels,
  deviceLabels,
  formatTimeAgo,
  formatFullDateTime,
  getDuration,
  isActivityStale,
  formatPath,
  getPageIcon,
  formatIp,
} = useOnlineFormatters()

const showDetailsModel = computed({
  get: () => props.showDetails,
  set: (value: boolean) => emit('update:showDetails', value),
})
</script>

<style lang="scss" scoped>
@use './online.shared.scss';
</style>

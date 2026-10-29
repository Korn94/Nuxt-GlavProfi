<!-- app/components/pages/Cabinet/Online/VisitorsList.vue -->
<template>
  <div>
    <div v-if="loading && !visitors.length" class="online-state">
      <Icon name="mdi:loading" size="32" class="spin" />
      <span>Загрузка посетителей...</span>
    </div>

    <div v-else-if="error && !visitors.length" class="online-state online-state--error">
      <Icon name="mdi:alert-circle-outline" size="32" />
      <span>{{ error }}</span>
    </div>

    <div v-else-if="!visitors.length" class="online-state">
      <Icon name="mdi:account-search-outline" size="40" />
      <span>Нет посетителей на сайте</span>
      <span class="online-state__hint">Анонимные посетители публичных страниц появятся здесь</span>
    </div>

    <div v-else class="online-card">
      <div class="online-card__header">
        <span class="online-card__title">
          <Icon name="mdi:web" size="14" />
          Посетители сайта
          <span class="badge">{{ visitors.length }}</span>
        </span>
        <div class="online-card__actions">
          <span class="online-card__hint">на сайте: <b>{{ onlineCount }}</b></span>
        </div>
      </div>

      <div class="online-list">
        <div
          v-for="visitor in visitors"
          :key="`${visitor.id}-${visitor.lastActivity}`"
          class="online-user online-user--visitor"
          :class="{ 'online-user--idle': visitor.status === 'idle' }"
        >
          <div
            :class="['online-user__dot', `online-user__dot--${visitor.status === 'online' ? 'online' : 'afk'}`]"
            :title="visitor.status === 'online' ? 'На сайте' : 'Простой'"
          />

          <!-- Иконка устройства -->
          <span class="online-user__device" :title="deviceLabels[visitor.deviceType]">
            <Icon v-if="visitor.deviceType === 'mobile'" name="mdi:cellphone" size="14" />
            <Icon v-else-if="visitor.deviceType === 'tablet'" name="mdi:tablet" size="14" />
            <Icon v-else-if="visitor.deviceType === 'desktop'" name="mdi:monitor" size="14" />
            <Icon v-else name="mdi:devices" size="14" />
          </span>

          <div class="online-user__info">
            <div class="online-user__row">
              <span class="online-user__name">{{ visitor.isReturning ? 'Вернувшийся гость' : 'Гость' }}</span>
              <span class="role-badge role-badge--visitor">{{ visitor.channelLabel }}</span>
              <span v-if="visitor.converted" class="role-badge role-badge--worker conv-badge">Обращение</span>
            </div>

            <div class="online-user__path" :title="visitor.activePath || ''">
              <span class="kv__k">Страница:</span>
              <Icon :name="getPageIcon(visitor.activePath)" size="12" />
              <span class="kv__v kv__v--truncate-wide">{{ formatPath(visitor.activePath) }}</span>
            </div>

            <div class="online-user__meta" v-if="showDetails">
              <span class="kv__k">На сайте:</span>
              <span class="kv__v">{{ getDuration(visitor.startedAt) }}</span>
              <span class="kv__k">Активность:</span>
              <span :class="['kv__v', { 'kv__v--warn': visitor.status === 'idle' }]">
                {{ formatTimeAgo(visitor.lastActivity) }}
              </span>
              <span class="kv__k">Визит №:</span>
              <span class="kv__v">{{ visitor.visitNumber }}</span>
              <span class="kv__k">Страниц:</span>
              <span class="kv__v">{{ visitor.pagesCount }}</span>
            </div>

            <div class="online-user__meta" v-if="showDetails">
              <span class="kv__k">Устройство:</span>
              <span class="kv__v">{{ visitor.browser }} · {{ visitor.os }}</span>
              <span v-if="visitor.city" class="kv__k">Город:</span>
              <span v-if="visitor.city" class="kv__v">{{ visitor.city }}</span>
              <span v-if="visitor.utmCampaign" class="kv__k">Кампания:</span>
              <span v-if="visitor.utmCampaign" class="kv__v kv__v--truncate">{{ visitor.utmCampaign }}</span>
            </div>

            <div class="online-user__path" v-if="showDetails && visitor.referrer" :title="visitor.referrer">
              <span class="kv__k">Источник:</span>
              <Icon name="mdi:link-variant" size="12" />
              <span class="kv__v kv__v--truncate-wide">{{ visitor.referrer }}</span>
            </div>
          </div>

          <div class="online-user__ip kv__v" v-if="showDetails" :title="visitor.ipAddress || ''">
            {{ formatIp(visitor.ipAddress) }}
          </div>

          <span :class="['online-user__status', `online-user__status--${visitor.status === 'online' ? 'online' : 'afk'}`]">
            {{ visitor.status === 'online' ? 'на сайте' : 'простой' }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Visitor } from '~/types'
import { useOnlineFormatters } from './composables/useOnlineFormatters'

defineProps<{
  visitors: Visitor[]
  onlineCount: number
  showDetails: boolean
  loading: boolean
  error?: string | null
}>()

const {
  deviceLabels,
  getPageIcon,
  formatPath,
  getDuration,
  formatTimeAgo,
  formatIp,
} = useOnlineFormatters()
</script>

<style lang="scss" scoped>
@use './online.shared.scss';
</style>

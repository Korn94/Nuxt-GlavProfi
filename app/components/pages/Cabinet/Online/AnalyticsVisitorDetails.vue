<!-- app/components/pages/Cabinet/Online/AnalyticsVisitorDetails.vue -->
<template>
  <div class="details-view">
    <div v-if="loading && !data" class="online-state">
      <Icon name="mdi:loading" size="24" class="spin" />
      <span>Загрузка посетителя...</span>
    </div>

    <div v-else-if="error && !data" class="online-state online-state--error">
      <Icon name="mdi:alert-circle-outline" size="24" />
      <span>{{ error }}</span>
      <button class="crm-btn crm-btn--ghost crm-btn--sm" @click="load">Повторить</button>
    </div>

    <template v-else-if="data">
      <div class="details-caption">
        <span>ID: {{ data.visitor.id }}</span>
        <span v-if="data.visitor.firstSeenAt">первый визит: {{ formatFullDateTime(data.visitor.firstSeenAt) }}</span>
        <span v-if="data.visitor.lastSeenAt">последняя активность: {{ formatFullDateTime(data.visitor.lastSeenAt) }}</span>
        <span v-if="loading" class="details-sub">обновление…</span>
      </div>

      <div class="details-kpis">
        <div v-for="kpi in kpis" :key="kpi.label" class="details-kpi">
          <span class="details-kpi__label">{{ kpi.label }}</span>
          <span class="details-kpi__value" :class="kpi.tone ? `details-kpi__value--${kpi.tone}` : ''">{{ kpi.value }}</span>
        </div>
      </div>

      <div class="details-section">
        <div class="details-section__title"><Icon name="mdi:account-outline" size="13" /> О посетителе</div>
        <div class="details-meta">
          <div class="details-meta__item">
            <span class="details-sub">Первый источник</span>
            <span>{{ data.visitor.firstChannelLabel }}</span>
          </div>
          <div class="details-meta__item">
            <span class="details-sub">Реферер</span>
            <span>{{ data.visitor.firstReferrerHost || '—' }}</span>
          </div>
          <div class="details-meta__item">
            <span class="details-sub">Первая кампания</span>
            <span class="details-path" :title="data.visitor.firstUtmCampaign || ''">
              {{ data.visitor.firstUtmCampaign || '—' }}
            </span>
          </div>
          <div class="details-meta__item">
            <span class="details-sub">Страница входа</span>
            <span class="details-path" :title="data.visitor.firstLandingPath || ''">
              {{ data.visitor.firstLandingPath || '—' }}
            </span>
          </div>
          <div v-if="data.latest" class="details-meta__item">
            <span class="details-sub">Устройство</span>
            <span>
              {{ deviceName(data.latest.deviceType) }} · {{ data.latest.browser || '—' }}<span v-if="data.latest.os"> · {{ data.latest.os }}</span>
            </span>
          </div>
          <div v-if="data.latest?.city" class="details-meta__item">
            <span class="details-sub">Город</span>
            <span>{{ data.latest.city }}</span>
          </div>
          <div v-if="data.visitor.linkedUserName" class="details-meta__item">
            <span class="details-sub">Сотрудник</span>
            <span class="details-badge details-badge--staff">{{ data.visitor.linkedUserName }}</span>
          </div>
          <div v-if="data.visitor.hasConverted" class="details-meta__item">
            <span class="details-sub">Обращения</span>
            <span class="details-badge details-badge--success">были</span>
          </div>
        </div>
      </div>

      <div class="details-section">
        <div class="details-section__title">
          <Icon name="mdi:history" size="13" /> Все сессии посетителя
          <span class="details-chip">визитов: {{ formatNumber(data.sessionsTotal) }}</span>
          <span v-if="data.sessions.length < data.sessionsTotal" class="details-chip">
            показаны последние {{ data.sessions.length }}
          </span>
        </div>

        <div v-if="!data.sessions.length" class="details-empty">Визитов не найдено</div>
        <div v-else class="details-sessions">
          <div
            v-for="session in data.sessions"
            :key="session.id"
            class="details-session"
            role="button"
            tabindex="0"
            title="Открыть визит"
            @click="emit('open-session', session.id)"
            @keydown.enter="emit('open-session', session.id)"
          >
            <div class="details-session__head">
              <span class="details-session__visit">Визит №{{ session.visitNumber }}</span>
              <span class="details-session__date">{{ formatFullDateTime(session.startedAt) }}</span>
              <span class="details-badge details-badge--muted">{{ session.channelLabel }}</span>
              <span v-if="session.converted" class="details-badge details-badge--success">обращение</span>
              <span v-if="session.isBounce" class="details-badge details-badge--danger">отказ</span>
              <span v-if="session.endedAt" class="details-sub">завершён</span>
              <span v-else class="details-badge details-badge--warning">не завершён</span>
            </div>

            <div class="details-session__route" :title="`${session.landingPath || ''} → ${session.exitPath || ''}`">
              {{ session.landingPath || '—' }} → {{ session.exitPath || '—' }}
            </div>

            <div class="details-session__meta">
              <span>Страниц: <b>{{ session.pagesCount }}</b></span>
              <span>Время: <b>{{ formatSeconds(session.activeSeconds) }}</b></span>
              <span>Событий: <b>{{ session.eventsCount }}</b></span>
              <span v-if="session.city">Город: {{ session.city }}</span>
              <span>{{ deviceName(session.deviceType) }} · {{ session.browser || '—' }}</span>
              <span v-if="session.utmCampaign">Кампания: {{ session.utmCampaign }}</span>
              <span v-if="session.linkedUserName" class="details-badge details-badge--staff">
                сотрудник: {{ session.linkedUserName }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useApi } from '~/composables/useApi'
import type { VisitorProfileResponse } from '~/types'
import { useOnlineFormatters } from './composables/useOnlineFormatters'

const props = defineProps<{
  /** ID посетителя сайта */
  visitorId: string
}>()

const emit = defineEmits<{
  'open-session': [sessionId: string]
}>()

const { deviceLabels, formatFullDateTime, formatNumber, formatSeconds } = useOnlineFormatters()

const api = useApi()

const data = ref<VisitorProfileResponse | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

async function load() {
  if (!props.visitorId) return

  loading.value = true
  error.value = null
  try {
    data.value = await api.get<VisitorProfileResponse>(
      `/api/visitors/profiles/${encodeURIComponent(props.visitorId)}`,
      { query: { limit: 100 } }
    )
  } catch (e: any) {
    console.error('[Аналитика] ❌ Не удалось загрузить посетителя:', e)
    error.value = e?.data?.statusMessage || e?.statusMessage || 'Не удалось загрузить посетителя'
  } finally {
    loading.value = false
  }
}

watch(() => props.visitorId, load, { immediate: true })

const deviceName = (type: string): string => deviceLabels[type] || type

interface KpiItem {
  label: string
  value: string
  tone?: 'warn' | 'danger' | 'success' | 'info'
}

const kpis = computed<KpiItem[]>(() => {
  const totals = data.value?.totals
  if (!totals) return []

  const avgSeconds = totals.sessions ? Math.round(totals.activeSeconds / totals.sessions) : 0
  return [
    { label: 'Визитов', value: formatNumber(totals.sessions) },
    { label: 'Страниц', value: formatNumber(totals.pages) },
    { label: 'Событий', value: formatNumber(totals.events) },
    { label: 'Всего времени', value: formatSeconds(totals.activeSeconds) },
    { label: 'Ср. визит', value: formatSeconds(avgSeconds) },
    { label: 'Обращения', value: formatNumber(totals.conversions), tone: totals.conversions > 0 ? 'success' : undefined },
    { label: 'Отказы', value: formatNumber(totals.bounces), tone: totals.bounces > 0 ? 'warn' : undefined }
  ]
})
</script>

<style lang="scss" scoped>
@use './online.shared.scss';
@use './analytics-details.shared.scss';

.details-meta {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 6px 14px;

  &__item {
    display: flex;
    flex-direction: column;
    gap: 1px;
    min-width: 0;
    font-size: var(--crm-text-xs);
    color: var(--crm-text-secondary);
  }
}

.details-sessions {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
</style>

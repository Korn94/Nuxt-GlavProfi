<!-- app/components/pages/Cabinet/Online/AnalyticsSessionDetails.vue -->
<template>
  <div class="details-view">
    <div v-if="loading && !data" class="online-state">
      <Icon name="mdi:loading" size="24" class="spin" />
      <span>Загрузка визита...</span>
    </div>

    <div v-else-if="error && !data" class="online-state online-state--error">
      <Icon name="mdi:alert-circle-outline" size="24" />
      <span>{{ error }}</span>
      <button class="crm-btn crm-btn--ghost crm-btn--sm" @click="load">Повторить</button>
    </div>

    <template v-else-if="data">
      <div class="details-caption">
        <span>Визит №{{ data.session.visitNumber }} · {{ formatFullDateTime(data.session.startedAt) }}</span>
        <span>
          посетитель:
          <button class="details-link" @click="emit('open-visitor', data.visitor.id)">
            {{ shortVisitorId(data.visitor.id) }}
          </button>
        </span>
        <span v-if="data.visitor.linkedUserName" class="details-badge details-badge--staff">
          сотрудник: {{ data.visitor.linkedUserName }}
        </span>
        <span v-if="loading" class="details-sub">обновление…</span>
      </div>

      <div class="details-kpis">
        <div v-for="kpi in kpis" :key="kpi.label" class="details-kpi">
          <span class="details-kpi__label">{{ kpi.label }}</span>
          <span class="details-kpi__value" :class="kpi.tone ? `details-kpi__value--${kpi.tone}` : ''">{{ kpi.value }}</span>
        </div>
      </div>

      <div class="details-section">
        <div class="details-section__title"><Icon name="mdi:information-outline" size="13" /> Параметры визита</div>
        <div class="details-meta">
          <div class="details-meta__item">
            <span class="details-sub">Начало</span>
            <span>{{ formatFullDateTime(data.session.startedAt) }}</span>
          </div>
          <div class="details-meta__item">
            <span class="details-sub">Последняя активность</span>
            <span>{{ formatFullDateTime(data.session.lastActivityAt) }}</span>
          </div>
          <div class="details-meta__item">
            <span class="details-sub">Завершён</span>
            <span>{{ data.session.endedAt ? formatFullDateTime(data.session.endedAt) : 'ещё идёт' }}</span>
          </div>
          <div class="details-meta__item">
            <span class="details-sub">Источник</span>
            <span>{{ data.session.channelLabel }}</span>
          </div>
          <div class="details-meta__item">
            <span class="details-sub">Кампания</span>
            <span class="details-path" :title="data.session.utmCampaign || ''">{{ data.session.utmCampaign || '—' }}</span>
          </div>
          <div class="details-meta__item">
            <span class="details-sub">Реферер</span>
            <span class="details-path" :title="data.session.referrerHost || ''">{{ data.session.referrerHost || '—' }}</span>
          </div>
          <div class="details-meta__item">
            <span class="details-sub">Вход → выход</span>
            <span class="details-path" :title="`${data.session.landingPath || ''} → ${data.session.exitPath || ''}`">
              {{ data.session.landingPath || '—' }} → {{ data.session.exitPath || '—' }}
            </span>
          </div>
          <div class="details-meta__item">
            <span class="details-sub">Устройство</span>
            <span>{{ deviceName(data.session.deviceType) }} · {{ data.session.browser || '—' }}<span v-if="data.session.os"> · {{ data.session.os }}</span></span>
          </div>
          <div v-if="data.session.city || data.session.region" class="details-meta__item">
            <span class="details-sub">Гео</span>
            <span>{{ [data.session.country, data.session.region, data.session.city].filter(Boolean).join(' · ') || '—' }}</span>
          </div>
          <div v-if="data.session.language" class="details-meta__item">
            <span class="details-sub">Язык</span>
            <span>{{ data.session.language }}</span>
          </div>
        </div>
      </div>

      <div class="details-section">
        <div class="details-section__title">
          <Icon name="mdi:map-marker-path" size="13" /> Хронология страниц
          <span class="details-chip">{{ data.pageviews.length }}</span>
        </div>

        <div v-if="!data.pageviews.length" class="details-empty">
          Просмотры не сохранились (визит мог ещё не попасть в БД)
        </div>
        <ul v-else class="details-timeline">
          <li v-for="(view, index) in data.pageviews" :key="`${view.path}-${view.enteredAt}-${index}`" class="details-timeline__item">
            <span class="details-timeline__time">{{ formatTime(view.enteredAt) }}</span>
            <span class="details-timeline__path" :title="view.path">
              <Icon :name="getPageIcon(view.path)" size="12" />
              {{ view.path }}
            </span>
            <span class="details-table__num">{{ formatSeconds(view.durationSec) }}</span>
            <span class="details-scroll">
              <span class="details-scroll__bar">
                <span
                  class="details-scroll__fill"
                  :class="{ 'details-scroll__fill--low': view.maxScrollPct < 25 }"
                  :style="{ width: `${view.maxScrollPct}%` }"
                />
              </span>
              <span class="details-sub">{{ view.maxScrollPct }}%</span>
            </span>
          </li>
        </ul>
      </div>

      <div class="details-section">
        <div class="details-section__title">
          <Icon name="mdi:cursor-default-click-outline" size="13" /> События
          <span class="details-chip">{{ data.events.length }}</span>
        </div>

        <div v-if="!data.events.length" class="details-empty">Событий в визите не было</div>
        <div v-else class="details-events-list">
          <div v-for="event in data.events" :key="event.id" class="details-event">
            <span class="details-timeline__time">{{ formatTime(event.createdAt) }}</span>
            <span>
              <b>{{ eventLabel(event.type) }}</b>
              <span v-if="event.path" class="details-sub"> · {{ event.path }}</span>
              <span v-if="metaText(event.meta)" class="details-sub"> · {{ metaText(event.meta) }}</span>
            </span>
            <span v-if="isConversion(event.type)" class="details-badge details-badge--success">обращение</span>
            <span v-else class="details-badge details-badge--muted">событие</span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { isConversionEvent } from 'shared/constants/visitorEvents'
import { useApi } from '~/composables/useApi'
import type { VisitorSessionDetailsResponse } from '~/types'
import { useOnlineFormatters } from './composables/useOnlineFormatters'
import { shortVisitorId } from './composables/useAnalyticsRoute'

const props = defineProps<{
  /** ID визита (nanoid) */
  sessionId: string
}>()

const emit = defineEmits<{
  'open-visitor': [visitorId: string]
}>()

const {
  deviceLabels,
  eventLabel,
  formatFullDateTime,
  formatNumber,
  formatSeconds,
  getPageIcon
} = useOnlineFormatters()

const api = useApi()

const data = ref<VisitorSessionDetailsResponse | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

async function load() {
  if (!props.sessionId) return

  loading.value = true
  error.value = null
  try {
    data.value = await api.get<VisitorSessionDetailsResponse>(
      `/api/visitors/sessions/${encodeURIComponent(props.sessionId)}`
    )
  } catch (e: any) {
    console.error('[Аналитика] ❌ Не удалось загрузить визит:', e)
    error.value = e?.data?.statusMessage || e?.statusMessage || 'Не удалось загрузить визит'
  } finally {
    loading.value = false
  }
}

watch(() => props.sessionId, load, { immediate: true })

const deviceName = (type: string): string => deviceLabels[type] || type

/** Время события/просмотра в формате «ЧЧ:ММ:СС» */
function formatTime(value: string | null | undefined): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'

  return date.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

/** Компактная подпись метаданных события */
function metaText(meta: Record<string, string | number | boolean | null> | null): string {
  if (!meta) return ''

  return Object.entries(meta)
    .filter(([, value]) => value !== null && value !== undefined && value !== '')
    .map(([key, value]) => `${key}: ${value}`)
    .join(' · ')
}

/** События, которые считаются обращением (см. shared/constants/visitorEvents.ts) */
const isConversion = (type: string): boolean => isConversionEvent(type)

interface KpiItem {
  label: string
  value: string
  tone?: 'warn' | 'danger' | 'success' | 'info'
}

const kpis = computed<KpiItem[]>(() => {
  const session = data.value?.session
  if (!session) return []

  const outcome = session.converted ? 'обращение' : session.isBounce ? 'отказ' : '—'
  const tone: KpiItem['tone'] = session.converted ? 'success' : session.isBounce ? 'danger' : undefined

  return [
    { label: 'Длительность', value: formatSeconds(session.activeSeconds) },
    { label: 'Страниц', value: formatNumber(session.pagesCount) },
    { label: 'Событий', value: formatNumber(session.eventsCount) },
    { label: 'Просмотров в БД', value: formatNumber(data.value?.pageviews.length || 0) },
    { label: 'Событий в БД', value: formatNumber(data.value?.events.length || 0) },
    { label: 'Итог', value: outcome, tone }
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

.details-events-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
</style>

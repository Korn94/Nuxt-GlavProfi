<!-- app/components/pages/Cabinet/Online/AnalyticsPageDetails.vue -->
<template>
  <div class="details-view">
    <div v-if="loading && !data" class="online-state">
      <Icon name="mdi:loading" size="24" class="spin" />
      <span>Загрузка страницы...</span>
    </div>

    <div v-else-if="error && !data" class="online-state online-state--error">
      <Icon name="mdi:alert-circle-outline" size="24" />
      <span>{{ error }}</span>
      <button class="crm-btn crm-btn--ghost crm-btn--sm" @click="load">Повторить</button>
    </div>

    <template v-else-if="data">
      <div class="details-caption">
        <span>за {{ data.days }} дн.</span>
        <span v-if="data.summary.firstViewAt">первый просмотр: {{ formatFullDateTime(data.summary.firstViewAt) }}</span>
        <span v-if="data.summary.lastViewAt">последний: {{ formatFullDateTime(data.summary.lastViewAt) }}</span>
        <span v-if="loading" class="details-sub">обновление…</span>
      </div>

      <!-- Сводные показатели страницы -->
      <div class="details-kpis">
        <div v-for="kpi in kpis" :key="kpi.label" class="details-kpi">
          <span class="details-kpi__label">{{ kpi.label }}</span>
          <span class="details-kpi__value" :class="kpi.tone ? `details-kpi__value--${kpi.tone}` : ''">{{ kpi.value }}</span>
        </div>
      </div>

      <!-- Динамика по дням -->
      <div class="details-section">
        <div class="details-section__title">
          <Icon name="mdi:chart-line" size="13" /> Просмотры по дням
        </div>
        <div v-if="daily.labels.length" ref="chartRef" class="details-chart" />
        <div v-else class="details-empty">Нет данных за период</div>
      </div>

      <!-- Разрезы -->
      <div class="details-grid">
        <div class="details-section">
          <div class="details-section__title">Источники</div>
          <div v-if="!data.channels.length" class="details-empty">Нет данных</div>
          <div v-else class="details-table-wrap">
            <table class="details-table">
              <thead><tr><th>Источник</th><th>Просмотры</th><th>Посетители</th><th>Время</th></tr></thead>
              <tbody>
                <tr v-for="row in data.channels" :key="row.channel">
                  <td>{{ row.channelLabel }}</td>
                  <td class="details-table__num">{{ formatNumber(row.views) }}</td>
                  <td class="details-table__num">{{ formatNumber(row.visitors) }}</td>
                  <td class="details-table__num">{{ formatSeconds(row.avgSeconds) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="details-section">
          <div class="details-section__title">Устройства</div>
          <div v-if="!data.devices.length" class="details-empty">Нет данных</div>
          <div v-else class="details-table-wrap">
            <table class="details-table">
              <thead><tr><th>Устройство</th><th>Просмотры</th><th>Посетители</th></tr></thead>
              <tbody>
                <tr v-for="row in data.devices" :key="row.deviceType">
                  <td>{{ deviceName(row.deviceType) }}</td>
                  <td class="details-table__num">{{ formatNumber(row.views) }}</td>
                  <td class="details-table__num">{{ formatNumber(row.visitors) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="details-section">
          <div class="details-section__title">Глубина скролла</div>
          <div class="details-empty" v-if="!hasScrollData">Нет данных</div>
          <div v-else class="details-scroll-list">
            <div v-for="row in data.scroll" :key="row.bucket" class="details-scroll-row">
              <span class="details-sub">{{ scrollLabel(row.bucket) }}</span>
              <div class="details-scroll__bar details-scroll__bar--wide">
                <div class="details-scroll__fill" :style="{ width: `${row.share}%` }" />
              </div>
              <span class="details-table__num">{{ row.share }}%</span>
              <span class="details-sub">({{ formatNumber(row.views) }})</span>
            </div>
          </div>
        </div>

        <div class="details-section details-section--wide">
          <div class="details-section__title">
            <Icon name="mdi:pulse" size="13" /> События страницы
            <span class="details-chip">всего: {{ formatNumber(data.eventsTotal) }}</span>
          </div>
          <div class="details-tabs">
            <button
              v-for="tab in eventTabs"
              :key="tab.key"
              type="button"
              class="details-tab"
              :class="{ 'details-tab--active': eventFilter === tab.key }"
              :title="tab.hint"
              @click="eventFilter = tab.key"
            >
              {{ tab.label }}<span class="details-tab__count">{{ formatNumber(tab.total) }}</span>
            </button>
          </div>

          <div v-if="!filteredEvents.length" class="details-empty">Событий на странице за период не было</div>
          <div v-else class="details-table-wrap">
            <table class="details-table">
              <thead>
                <tr>
                  <th>Время</th><th>Событие</th><th>Детали</th><th>Посетитель</th>
                  <th>Визит</th><th>Источник</th><th>Город</th>
                  <th class="details-col-action" aria-label="Подробнее"></th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="row in filteredEvents"
                  :key="row.id"
                  class="details-row"
                  tabindex="0"
                  title="Открыть визит"
                  @click="emit('open-session', row.sessionId, row.visitorId)"
                  @keydown.enter="emit('open-session', row.sessionId, row.visitorId)"
                >
                  <td>{{ formatFullDateTime(row.createdAt) }}</td>
                  <td>
                    <span class="details-badge" :class="`details-badge--${eventBadge(row).tone}`">{{ eventBadge(row).label }}</span>
                    <span class="details-sub"> · {{ eventLabel(row.type) }}</span>
                  </td>
                  <td class="details-path" :title="eventMetaText(row.meta)">{{ eventMetaText(row.meta) || '—' }}</td>
                  <td>
                    <button class="details-link" @click.stop="emit('open-visitor', row.visitorId)" @keydown.stop>
                      {{ shortVisitorId(row.visitorId) }}
                    </button>
                    <span v-if="row.linkedUserId" class="details-badge details-badge--staff">
                      {{ row.linkedUserName || `#${row.linkedUserId}` }}
                    </span>
                  </td>
                  <td>№{{ row.visitNumber }}<span class="details-sub"> · {{ row.pagesCount }} стр.</span></td>
                  <td>
                    {{ row.channelLabel }}
                    <span v-if="row.utmCampaign" class="details-sub"> · {{ row.utmCampaign }}</span>
                    <span v-else-if="row.referrerHost" class="details-sub"> · {{ row.referrerHost }}</span>
                  </td>
                  <td>{{ row.city || '—' }}</td>
                  <td class="details-col-action"><Icon name="mdi:chevron-right" size="14" /></td>
                </tr>
              </tbody>
            </table>
            <div v-if="hiddenEventsCount > 0" class="details-empty">
              Показаны последние {{ formatNumber(filteredEvents.length) }} из {{ formatNumber(eventsInFilterTotal) }} событий
            </div>
          </div>
        </div>
      </div>

      <!-- Обращения на странице -->
      <div v-if="data.conversions.length" class="details-section">
        <div class="details-section__title">
          <Icon name="mdi:phone-outline" size="13" /> Обращения на странице
          <span class="details-chip">всего: {{ formatNumber(data.conversionsTotal) }}</span>
        </div>
        <div class="details-table-wrap">
          <table class="details-table">
            <thead>
              <tr><th>Время</th><th>Событие</th><th>Посетитель</th><th>Источник</th><th>Кампания</th><th>Город</th></tr>
            </thead>
            <tbody>
              <tr
                v-for="row in data.conversions"
                :key="row.id"
                class="details-row"
                tabindex="0"
                @click="emit('open-visitor', row.visitorId)"
                @keydown.enter="emit('open-visitor', row.visitorId)"
              >
                <td>{{ formatFullDateTime(row.createdAt) }}</td>
                <td>{{ eventLabel(row.type) }}</td>
                <td>
                  <button class="details-link" @click.stop="emit('open-visitor', row.visitorId)" @keydown.stop>
                    {{ shortVisitorId(row.visitorId) }}
                  </button>
                  <span v-if="row.linkedUserId" class="details-badge details-badge--staff">
                    {{ row.linkedUserName || `#${row.linkedUserId}` }}
                  </span>
                </td>
                <td>{{ row.channelLabel }}</td>
                <td class="details-path" :title="row.utmCampaign || ''">{{ row.utmCampaign || '—' }}</td>
                <td>{{ row.city || '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Посетители страницы: переход к полной истории визитов -->
      <div class="details-section">
        <div class="details-section__title">
          <Icon name="mdi:account-group-outline" size="13" /> Посетители страницы
          <span class="details-chip">сессий: {{ formatNumber(data.sessionsTotal) }}</span>
          <span v-if="data.sessions.length < data.sessionsTotal" class="details-chip">
            показаны последние {{ data.sessions.length }}
          </span>
        </div>

        <div v-if="!data.sessions.length" class="details-empty">Заходов на страницу за период не было</div>
        <div v-else class="details-table-wrap">
          <table class="details-table">
            <thead>
              <tr>
                <th>Вход на страницу</th><th>Посетитель</th><th>Источник</th><th>Время</th>
                <th>Скролл</th><th>Город</th><th>Устройство</th><th>Итог</th><th></th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in data.sessions"
                :key="`${row.sessionId}-${row.enteredAt}`"
                class="details-row"
                tabindex="0"
                title="Открыть визит"
                @click="emit('open-session', row.sessionId, row.visitorId)"
                @keydown.enter="emit('open-session', row.sessionId, row.visitorId)"
              >
                <td>{{ formatFullDateTime(row.enteredAt) }}</td>
                <td>
                  <button class="details-link" @click.stop="emit('open-visitor', row.visitorId)" @keydown.stop>
                    {{ shortVisitorId(row.visitorId) }}
                  </button>
                  <span class="details-sub"> · визит №{{ row.visitNumber }}</span>
                  <span v-if="row.linkedUserId" class="details-badge details-badge--staff">
                    {{ row.linkedUserName || `#${row.linkedUserId}` }}
                  </span>
                </td>
                <td>
                  {{ row.channelLabel }}
                  <span v-if="row.utmCampaign" class="details-sub"> · {{ row.utmCampaign }}</span>
                  <span v-else-if="row.referrerHost" class="details-sub"> · {{ row.referrerHost }}</span>
                </td>
                <td class="details-table__num">{{ formatSeconds(row.durationSec) }}</td>
                <td>
                  <div class="details-scroll">
                    <div class="details-scroll__bar">
                      <div
                        class="details-scroll__fill"
                        :class="{ 'details-scroll__fill--low': row.maxScrollPct < 25 }"
                        :style="{ width: `${row.maxScrollPct}%` }"
                      />
                    </div>
                    <span class="details-sub">{{ row.maxScrollPct }}%</span>
                  </div>
                </td>
                <td>{{ row.city || '—' }}</td>
                <td>{{ deviceName(row.deviceType) }}<span class="details-sub"> · {{ row.browser || '—' }}</span></td>
                <td>
                  <span v-if="row.converted" class="details-badge details-badge--success">обращение</span>
                  <span v-else-if="row.isBounce" class="details-badge details-badge--danger">отказ</span>
                  <span v-else class="details-badge details-badge--muted">—</span>
                </td>
                <td class="details-col-action">
                  <button
                    class="crm-btn crm-btn--ghost crm-btn--sm"
                    title="Все сессии посетителя"
                    @click.stop="emit('open-visitor', row.visitorId)"
                    @keydown.stop
                  >
                    <Icon name="mdi:account-clock-outline" size="14" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { ECharts, EChartsOption } from 'echarts'
import { echarts } from '~/lib/echarts'
import { useApi } from '~/composables/useApi'
import { isConversionEvent } from 'shared/constants/visitorEvents'
import type { VisitorEventRow, VisitorPageDetailsResponse } from '~/types'
import { useOnlineFormatters } from './composables/useOnlineFormatters'
import { buildDailySeries, chartThemeColors } from './composables/useEchartsTheme'
import { shortVisitorId } from './composables/useAnalyticsRoute'

const props = defineProps<{
  /** Путь страницы (нормализованный, с ведущим слэшем) */
  path: string
  /** Период аналитики, дней */
  days: number
}>()

const emit = defineEmits<{
  'open-visitor': [visitorId: string]
  'open-session': [sessionId: string, visitorId?: string]
}>()

const {
  deviceLabels,
  eventLabel,
  eventMetaText,
  formatFullDateTime,
  formatNumber,
  formatSeconds
} = useOnlineFormatters()

const api = useApi()

const data = ref<VisitorPageDetailsResponse | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

async function load() {
  if (!props.path) return

  loading.value = true
  error.value = null
  try {
    data.value = await api.get<VisitorPageDetailsResponse>('/api/visitors/page', {
      query: { path: props.path, days: props.days }
    })
  } catch (e: any) {
    console.error('[Аналитика] ❌ Не удалось загрузить детали страницы:', e)
    error.value = e?.data?.statusMessage || e?.statusMessage || 'Не удалось загрузить аналитику страницы'
  } finally {
    loading.value = false
  }
}

watch(() => [props.path, props.days], load, { immediate: true })

// ── KPI ────────────────────────────────────────────────────────────────
interface KpiItem {
  label: string
  value: string
  tone?: 'warn' | 'danger' | 'success' | 'info'
}

const kpis = computed<KpiItem[]>(() => {
  const s = data.value?.summary
  if (!s) return []

  return [
    { label: 'Просмотры', value: formatNumber(s.views) },
    { label: 'Посетители', value: formatNumber(s.visitors) },
    { label: 'Сессии', value: formatNumber(s.sessions) },
    { label: 'Ср. время', value: formatSeconds(s.avgSeconds) },
    { label: 'Скролл', value: `${s.avgScroll}%`, tone: s.avgScroll < 25 ? 'warn' : undefined },
    { label: 'Входы', value: formatNumber(s.entries) },
    { label: 'Выходы', value: `${formatNumber(s.exits)} (${s.exitRate}%)`, tone: s.exitRate >= 60 ? 'warn' : undefined },
    { label: 'Обращения', value: formatNumber(s.conversions), tone: s.conversions > 0 ? 'success' : undefined },
    { label: 'Конверсия', value: `${s.conversionRate}%` },
    { label: 'Отказы', value: `${s.bounceRate}%`, tone: s.bounceRate >= 60 ? 'danger' : undefined },
    { label: 'Новые визиты', value: `${s.firstVisitsShare}%` }
  ]
})

const deviceName = (type: string): string => deviceLabels[type] || type

const SCROLL_LABELS: Record<string, string> = {
  '0-25': '0–25 %',
  '25-50': '25–50 %',
  '50-75': '50–75 %',
  '75-100': '75–100 %'
}
const scrollLabel = (bucket: string): string => SCROLL_LABELS[bucket] || bucket

const hasScrollData = computed(() => Boolean(data.value?.scroll.some(row => row.views > 0)))

// ── События страницы: фильтры по смыслу ────────────────────────────────
type EventFilterKey = 'all' | 'conversion' | 'form_open' | 'other'

const EVENT_FILTER_HINTS: Record<EventFilterKey, string> = {
  all: 'Все события посетителей на этой странице за период',
  conversion: 'Обращения: клик по телефону, мессенджеру, email и отправка формы',
  form_open: 'Форма открыта или начата, но заявка не отправлена',
  other: 'Прочие события: клики по CTA'
}

const eventFilter = ref<EventFilterKey>('all')

/** Счётчики по группам (полные за период, не только загруженная сотня) */
const eventTabs = computed(() => {
  const stats = data.value?.eventStats || []
  const conversionTotal = stats.filter(s => s.isConversion).reduce((sum, s) => sum + s.total, 0)
  const formOpenTotal = stats.find(s => s.type === 'form_open')?.total || 0
  const otherTotal = stats
    .filter(s => !s.isConversion && s.type !== 'form_open')
    .reduce((sum, s) => sum + s.total, 0)
  const allTotal = stats.reduce((sum, s) => sum + s.total, 0) || (data.value?.eventsTotal || 0)

  return [
    { key: 'all' as const, label: 'Все', total: allTotal, hint: EVENT_FILTER_HINTS.all },
    { key: 'conversion' as const, label: 'Обращения', total: conversionTotal, hint: EVENT_FILTER_HINTS.conversion },
    { key: 'form_open' as const, label: 'Открытия формы', total: formOpenTotal, hint: EVENT_FILTER_HINTS.form_open },
    { key: 'other' as const, label: 'Прочее', total: otherTotal, hint: EVENT_FILTER_HINTS.other }
  ]
})

const filteredEvents = computed<VisitorEventRow[]>(() => {
  const events = data.value?.events || []
  switch (eventFilter.value) {
    case 'conversion': return events.filter(row => isConversionEvent(row.type))
    case 'form_open': return events.filter(row => row.type === 'form_open')
    case 'other': return events.filter(row => !isConversionEvent(row.type) && row.type !== 'form_open')
    default: return events
  }
})

const eventsInFilterTotal = computed(
  () => eventTabs.value.find(tab => tab.key === eventFilter.value)?.total || 0
)
const hiddenEventsCount = computed(
  () => Math.max(0, eventsInFilterTotal.value - filteredEvents.value.length)
)

/** Бейдж смысла события: заявка / обращение / вовлечение */
function eventBadge(row: VisitorEventRow): { label: string; tone: 'success' | 'info' | 'muted' } {
  if (row.type === 'form_submit') return { label: 'заявка', tone: 'success' }
  if (row.isConversion) return { label: 'обращение', tone: 'info' }
  return { label: 'вовлечение', tone: 'muted' }
}

// ── График ─────────────────────────────────────────────────────────────
const chartRef = ref<HTMLElement | null>(null)
let chart: ECharts | null = null

const daily = computed(() => buildDailySeries(data.value?.daily || [], ['views', 'visitors']))

function chartOption(): EChartsOption {
  const c = chartThemeColors()

  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: c.tooltipBg,
      borderColor: c.border,
      textStyle: { color: c.textPrimary, fontSize: 12 }
    },
    legend: {
      data: ['Просмотры', 'Посетители'],
      textStyle: { color: c.textMuted, fontSize: 11 },
      right: 0,
      top: 0,
      itemWidth: 12,
      itemHeight: 12
    },
    grid: { left: 8, right: 8, top: 30, bottom: 4, containLabel: true },
    xAxis: {
      type: 'category',
      data: daily.value.labels,
      axisLine: { lineStyle: { color: c.border } },
      axisTick: { show: false },
      axisLabel: { color: c.textMuted, fontSize: 11 }
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      splitLine: { lineStyle: { color: c.border } },
      axisLabel: { color: c.textMuted, fontSize: 11 },
      axisLine: { show: false },
      axisTick: { show: false }
    },
    series: [
      {
        name: 'Просмотры',
        type: 'bar',
        data: daily.value.series.views,
        barWidth: '40%',
        itemStyle: { color: c.accent, borderRadius: [3, 3, 0, 0] }
      },
      {
        name: 'Посетители',
        type: 'line',
        data: daily.value.series.visitors,
        smooth: true,
        symbolSize: 6,
        itemStyle: { color: c.success },
        lineStyle: { color: c.success, width: 2 }
      }
    ]
  }
}

function renderChart() {
  nextTick(() => {
    if (!chartRef.value || !daily.value.labels.length) {
      chart?.dispose()
      chart = null
      return
    }
    if (!chart) chart = echarts.init(chartRef.value)
    chart.setOption(chartOption(), true)
    chart.resize()
  })
}

function onResize() {
  chart?.resize()
}

watch([data, loading], () => {
  if (!loading.value) renderChart()
})

onMounted(() => {
  window.addEventListener('resize', onResize)
  renderChart()
})

onBeforeUnmount(() => {
  chart?.dispose()
  chart = null
  window.removeEventListener('resize', onResize)
})
</script>

<style lang="scss" scoped>
@use './online.shared.scss';
@use './analytics-details.shared.scss';

.details-scroll-list {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.details-scroll-row {
  display: grid;
  grid-template-columns: 62px minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 8px;
  font-size: var(--crm-text-xs);
}

.details-scroll-row .details-scroll__bar--wide {
  width: 100%;
  max-width: 160px;
}

.details-section--wide {
  grid-column: 1 / -1;
}

.details-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.details-tab {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-sm);
  background: transparent;
  color: var(--crm-text-secondary);
  font-size: var(--crm-text-xs);
  cursor: pointer;
  transition: var(--crm-transition);

  &:hover { background: var(--crm-bg-overlay); }

  &--active {
    border-color: var(--crm-accent);
    color: var(--crm-accent);
    background: var(--crm-bg-overlay);
  }
}

.details-tab__count {
  font-family: var(--crm-font-mono);
  color: var(--crm-text-muted);
}
</style>

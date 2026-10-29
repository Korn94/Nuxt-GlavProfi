<!-- app/components/pages/Cabinet/Online/Analytics.vue -->
<template>
  <div class="online-card stats-card">
    <div class="online-card__header">
      <span class="online-card__title">
        <Icon name="mdi:chart-box-outline" size="14" />
        Аналитика сайта
      </span>
      <div class="online-card__actions">
        <select :value="statsDays" class="stats-select" @change="onDaysChange">
          <option :value="1">Сегодня</option>
          <option :value="7">7 дней</option>
          <option :value="30">30 дней</option>
          <option :value="90">90 дней</option>
        </select>
        <button class="crm-btn crm-btn--ghost crm-btn--sm" :disabled="loading" @click="emit('refresh')">
          <Icon name="mdi:refresh" size="14" :class="{ spin: loading }" />
        </button>
      </div>
    </div>

    <div v-if="error && !stats" class="online-state online-state--error">
      <span>{{ error }}</span>
    </div>

    <template v-else-if="stats">
      <!-- Сводка по периоду -->
      <div class="stats-kpis">
        <div class="kpi">
          <div class="kpi__icon kpi__icon--accent"><Icon name="mdi:eye-outline" size="16" /></div>
          <div class="kpi__info">
            <span class="kpi__label">Визиты</span>
            <span class="kpi__value">{{ formatNumber(stats.totals?.visits) }}</span>
          </div>
        </div>
        <div class="kpi">
          <div class="kpi__icon kpi__icon--info"><Icon name="mdi:account-outline" size="16" /></div>
          <div class="kpi__info">
            <span class="kpi__label">Посетители</span>
            <span class="kpi__value">{{ formatNumber(stats.totals?.visitors) }}</span>
          </div>
        </div>
        <div class="kpi">
          <div class="kpi__icon kpi__icon--success"><Icon name="mdi:phone-outline" size="16" /></div>
          <div class="kpi__info">
            <span class="kpi__label">Обращения</span>
            <span class="kpi__value">{{ formatNumber(stats.totals?.conversions) }}</span>
          </div>
        </div>
        <div class="kpi">
          <div class="kpi__icon kpi__icon--warning"><Icon name="mdi:percent-outline" size="16" /></div>
          <div class="kpi__info">
            <span class="kpi__label">Конверсия</span>
            <span class="kpi__value">{{ stats.totals?.conversionRate ?? 0 }}%</span>
          </div>
        </div>
        <div class="kpi">
          <div class="kpi__icon kpi__icon--accent"><Icon name="mdi:timer-outline" size="16" /></div>
          <div class="kpi__info">
            <span class="kpi__label">Ср. время</span>
            <span class="kpi__value">{{ formatSeconds(stats.totals?.avgSeconds) }}</span>
          </div>
        </div>
        <div class="kpi">
          <div class="kpi__icon kpi__icon--danger"><Icon name="mdi:logout" size="16" /></div>
          <div class="kpi__info">
            <span class="kpi__label">Отказы</span>
            <span class="kpi__value">{{ stats.totals?.bounceRate ?? 0 }}%</span>
          </div>
        </div>
      </div>

      <!-- Графики -->
      <div class="stats-charts">
        <div class="chart-card chart-card--wide">
          <div class="chart-card__header">
            <span class="chart-card__title"><Icon name="mdi:chart-line" size="13" /> Динамика по дням</span>
          </div>
          <div v-if="dailyData.labels.length" ref="dailyChartRef" class="chart-card__canvas" />
          <div v-else class="stats-empty">Нет данных для графика</div>
        </div>

        <div class="chart-card">
          <div class="chart-card__header">
            <span class="chart-card__title"><Icon name="mdi:chart-donut" size="13" /> Источники</span>
          </div>
          <div v-if="stats.channels.length" ref="channelsChartRef" class="chart-card__canvas chart-card__canvas--sm" />
          <div v-else class="stats-empty">Нет данных для графика</div>
        </div>

        <div class="chart-card">
          <div class="chart-card__header">
            <span class="chart-card__title"><Icon name="mdi:chart-bar" size="13" /> События</span>
          </div>
          <div v-if="stats.eventTypes.length" ref="eventsChartRef" class="chart-card__canvas chart-card__canvas--sm" />
          <div v-else class="stats-empty">Нет данных для графика</div>
        </div>
      </div>

      <div class="stats-block">
        <div class="stats-block__title">Источники трафика</div>
        <div v-if="!stats.channels.length" class="stats-empty">Пока нет данных за период</div>
        <div v-else class="stats-table-wrap">
          <table class="stats-table">
            <thead>
              <tr>
                <th>Источник</th><th>Визиты</th><th>Посетители</th><th>Обращения</th>
                <th>Конверсия</th><th>Отказы</th><th>Время</th><th>Страниц</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in stats.channels" :key="row.channel">
                <td>{{ row.channelLabel }}</td>
                <td>{{ formatNumber(row.visits) }}</td>
                <td>{{ formatNumber(row.visitors) }}</td>
                <td>
                  <span v-if="row.conversions > 0" class="pill pill--success">{{ formatNumber(row.conversions) }}</span>
                  <span v-else>0</span>
                </td>
                <td>{{ row.conversionRate }}%</td>
                <td :class="{ 'stats-warn': row.bounceRate >= 60 }">{{ row.bounceRate }}%</td>
                <td>{{ formatSeconds(row.avgSeconds) }}</td>
                <td>{{ row.avgPages }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="stats-block">
        <div class="stats-block__title">Страницы</div>
        <div v-if="!stats.pages.length" class="stats-empty">Пока нет данных за период</div>
        <div v-else class="stats-table-wrap">
          <table class="stats-table">
            <thead>
              <tr><th>Страница</th><th>Просмотры</th><th>Время</th><th>Скролл</th><th>Выходы</th></tr>
            </thead>
            <tbody>
              <tr v-for="row in stats.pages" :key="row.path">
                <td class="stats-path" :title="row.path">{{ row.path }}</td>
                <td>{{ formatNumber(row.views) }}</td>
                <td>{{ formatSeconds(row.avgSeconds) }}</td>
                <td>
                  <div class="scroll-cell">
                    <div class="scroll-bar">
                      <div class="scroll-bar__fill" :class="{ 'scroll-bar__fill--low': row.avgScroll < 25 }" :style="{ width: `${row.avgScroll}%` }" />
                    </div>
                    <span class="stats-sub" :class="{ 'stats-warn': row.avgScroll < 25 }">{{ row.avgScroll }}%</span>
                  </div>
                </td>
                <td :class="{ 'stats-warn': row.exitRate >= 60 }">{{ formatNumber(row.exits) }} ({{ row.exitRate }}%)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="stats-block">
        <div class="stats-block__title">
          Обращения
          <span v-for="t in stats.eventTypes" :key="t.type" class="stats-chip">{{ eventLabel(t.type) }}: {{ formatNumber(t.total) }}</span>
        </div>
        <div v-if="!stats.conversions.length" class="stats-empty">Обращений за период нет</div>
        <div v-else class="stats-table-wrap">
          <table class="stats-table">
            <thead>
              <tr>
                <th>Когда</th><th>Действие</th><th>Страница</th><th>Источник</th><th>Кампания</th>
                <th>Визит №</th><th>Страниц</th><th>Вход</th><th>Город</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in stats.conversions" :key="row.id">
                <td>{{ formatFullDateTime(row.createdAt) }}</td>
                <td>{{ eventLabel(row.type) }}</td>
                <td class="stats-path" :title="row.path || ''">{{ row.path || '—' }}</td>
                <td>{{ row.channelLabel }}<span v-if="row.referrerHost" class="stats-sub"> · {{ row.referrerHost }}</span></td>
                <td class="stats-path">{{ row.utmCampaign || '—' }}</td>
                <td>{{ row.visitNumber }}</td>
                <td>{{ row.pagesCount }}</td>
                <td class="stats-path" :title="row.landingPath || ''">{{ row.landingPath || '—' }}</td>
                <td>{{ row.city || '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="stats-block">
        <div class="stats-block__title">История визитов</div>
        <div v-if="!stats.visits.length" class="stats-empty">Визитов за период нет</div>
        <div v-else class="stats-table-wrap">
          <table class="stats-table">
            <thead>
              <tr>
                <th>Начало</th><th>Источник</th><th>Кампания</th><th>Вход → выход</th><th>Город</th>
                <th>Страниц</th><th>Время</th><th>Устройство</th><th>Итог</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in stats.visits" :key="row.id">
                <td>{{ formatFullDateTime(row.startedAt) }}</td>
                <td>
                  {{ row.channelLabel }}
                  <span v-if="row.visitNumber > 1" class="stats-sub"> · визит №{{ row.visitNumber }}</span>
                  <span v-if="row.referrerHost" class="stats-sub"> · {{ row.referrerHost }}</span>
                </td>
                <td class="stats-path" :title="row.utmCampaign || ''">{{ row.utmCampaign || '—' }}</td>
                <td class="stats-path" :title="`${row.landingPath || ''} → ${row.exitPath || ''}`">{{ row.landingPath || '—' }} → {{ row.exitPath || '—' }}</td>
                <td>{{ row.city || '—' }}</td>
                <td>{{ row.pagesCount }}</td>
                <td>{{ formatSeconds(row.activeSeconds) }}</td>
                <td>{{ row.browser || '—' }}<span class="stats-sub"> · {{ deviceLabels[row.deviceType] || row.deviceType }}</span></td>
                <td>
                  <span v-if="row.converted" class="pill pill--success">обращение</span>
                  <span v-else-if="row.isBounce" class="pill pill--danger">отказ</span>
                  <span v-else class="pill pill--muted">—</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <div v-else class="online-state">
      <Icon name="mdi:loading" size="24" class="spin" />
      <span>Загрузка аналитики...</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import * as echarts from 'echarts'
import type { VisitorStatsResponse, VisitorDailyStat } from '~/types'
import { useOnlineFormatters } from './composables/useOnlineFormatters'

const props = defineProps<{
  stats: VisitorStatsResponse | null
  statsDays: number
  loading: boolean
  error?: string | null
}>()

const emit = defineEmits<{
  'update:statsDays': [value: number]
  refresh: []
}>()

const { formatSeconds, formatFullDateTime, formatNumber, eventLabel, deviceLabels } = useOnlineFormatters()

function onDaysChange(e: Event) {
  emit('update:statsDays', Number((e.target as HTMLSelectElement).value))
}

// ── Графики ─────────────────────────────────────────────────────────────
const dailyChartRef = ref<HTMLElement | null>(null)
const channelsChartRef = ref<HTMLElement | null>(null)
const eventsChartRef = ref<HTMLElement | null>(null)

let dailyChart: echarts.ECharts | null = null
let channelsChart: echarts.ECharts | null = null
let eventsChart: echarts.ECharts | null = null

const dailyData = computed(() => buildDaily(props.stats?.daily || []))

function toDayKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Дорисовывает пропущенные дни нулями, чтобы линия была непрерывной. */
function buildDaily(daily: VisitorDailyStat[]) {
  const byDay = new Map(daily.map(d => [d.day, d]))
  const keys = [...byDay.keys()].filter(Boolean).sort()
  const labels: string[] = []
  const visits: number[] = []
  const conversions: number[] = []

  if (!keys.length) return { labels, visits, conversions }

  const start = new Date(`${keys[0]}T00:00:00`)
  const end = new Date(`${keys[keys.length - 1]}T00:00:00`)
  const fmt = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' })

  for (const d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const key = toDayKey(d)
    labels.push(fmt.format(d))
    visits.push(byDay.get(key)?.visits || 0)
    conversions.push(byDay.get(key)?.conversions || 0)
  }

  return { labels, visits, conversions }
}

interface ThemeColors {
  accent: string
  success: string
  info: string
  warning: string
  danger: string
  textPrimary: string
  textSecondary: string
  textMuted: string
  border: string
  tooltipBg: string
}

function themeColors(): ThemeColors {
  const fallback: ThemeColors = {
    accent: '#00c3f5', success: '#3dd68c', info: '#5b8def', warning: '#f5a623', danger: '#f25f5c',
    textPrimary: '#e2e4ec', textSecondary: '#9aa0b8', textMuted: '#7a7f96',
    border: 'rgba(255,255,255,0.07)', tooltipBg: '#1a1e28'
  }
  if (typeof window === 'undefined') return fallback

  const s = getComputedStyle(document.documentElement)
  const get = (prop: string, fb: string) => s.getPropertyValue(prop).trim() || fb
  return {
    accent: get('--crm-accent', fallback.accent),
    success: get('--crm-success', fallback.success),
    info: get('--crm-info', fallback.info),
    warning: get('--crm-warning', fallback.warning),
    danger: get('--crm-danger', fallback.danger),
    textPrimary: get('--crm-text-primary', fallback.textPrimary),
    textSecondary: get('--crm-text-secondary', fallback.textSecondary),
    textMuted: get('--crm-text-muted', fallback.textMuted),
    border: get('--crm-border', fallback.border),
    tooltipBg: get('--crm-bg-elevated', fallback.tooltipBg)
  }
}

function dailyOption(): echarts.EChartsOption {
  const c = themeColors()
  const d = dailyData.value
  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: c.tooltipBg,
      borderColor: c.border,
      textStyle: { color: c.textPrimary, fontSize: 12 }
    },
    legend: {
      data: ['Визиты', 'Обращения'],
      textStyle: { color: c.textMuted, fontSize: 11 },
      right: 0,
      top: 0,
      itemWidth: 12,
      itemHeight: 12
    },
    grid: { left: 8, right: 8, top: 30, bottom: 4, containLabel: true },
    xAxis: {
      type: 'category',
      data: d.labels,
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
        name: 'Визиты',
        type: 'bar',
        data: d.visits,
        barWidth: '40%',
        itemStyle: { color: c.accent, borderRadius: [3, 3, 0, 0] }
      },
      {
        name: 'Обращения',
        type: 'line',
        data: d.conversions,
        smooth: true,
        symbolSize: 6,
        itemStyle: { color: c.success },
        lineStyle: { color: c.success, width: 2 }
      }
    ]
  }
}

function channelsOption(): echarts.EChartsOption {
  const c = themeColors()
  const palette = [c.accent, c.info, c.success, c.warning, c.danger, c.textMuted]
  const data = [...(props.stats?.channels || [])]
    .filter(r => r.visits > 0)
    .sort((a, b) => b.visits - a.visits)
    .slice(0, 7)
    .map((r, i) => ({ name: r.channelLabel, value: r.visits, itemStyle: { color: palette[i % palette.length] } }))

  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: c.tooltipBg,
      borderColor: c.border,
      textStyle: { color: c.textPrimary, fontSize: 12 },
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      right: 4,
      top: 'middle',
      textStyle: { color: c.textSecondary, fontSize: 11 },
      itemWidth: 10,
      itemHeight: 10
    },
    series: [{
      type: 'pie',
      radius: ['52%', '76%'],
      center: ['34%', '50%'],
      avoidLabelOverlap: true,
      itemStyle: { borderColor: c.tooltipBg, borderWidth: 1 },
      label: { show: false },
      emphasis: { label: { show: false } },
      data
    }]
  }
}

function eventsOption(): echarts.EChartsOption {
  const c = themeColors()
  const data = [...(props.stats?.eventTypes || [])].sort((a, b) => a.total - b.total)
  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: c.tooltipBg,
      borderColor: c.border,
      textStyle: { color: c.textPrimary, fontSize: 12 }
    },
    grid: { left: 8, right: 18, top: 8, bottom: 4, containLabel: true },
    xAxis: {
      type: 'value',
      minInterval: 1,
      splitLine: { lineStyle: { color: c.border } },
      axisLabel: { color: c.textMuted, fontSize: 11 },
      axisLine: { show: false },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'category',
      data: data.map(d => eventLabel(d.type)),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: c.textSecondary, fontSize: 11 }
    },
    series: [{
      type: 'bar',
      data: data.map(d => d.total),
      barWidth: '60%',
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
          { offset: 0, color: c.info },
          { offset: 1, color: c.accent }
        ]),
        borderRadius: [0, 4, 4, 0]
      }
    }]
  }
}

function disposeCharts() {
  dailyChart?.dispose(); dailyChart = null
  channelsChart?.dispose(); channelsChart = null
  eventsChart?.dispose(); eventsChart = null
}

async function renderCharts() {
  await nextTick()

  if (dailyChartRef.value && dailyData.value.labels.length) {
    if (!dailyChart) dailyChart = echarts.init(dailyChartRef.value)
    dailyChart.setOption(dailyOption(), true)
  }

  if (channelsChartRef.value && props.stats?.channels.length) {
    if (!channelsChart) channelsChart = echarts.init(channelsChartRef.value)
    channelsChart.setOption(channelsOption(), true)
  }

  if (eventsChartRef.value && props.stats?.eventTypes.length) {
    if (!eventsChart) eventsChart = echarts.init(eventsChartRef.value)
    eventsChart.setOption(eventsOption(), true)
  }
}

function onResize() {
  dailyChart?.resize()
  channelsChart?.resize()
  eventsChart?.resize()
}

onMounted(() => {
  if (props.stats) renderCharts()
  window.addEventListener('resize', onResize)
})

onBeforeUnmount(() => {
  disposeCharts()
  window.removeEventListener('resize', onResize)
})

watch(() => props.stats, (s) => {
  disposeCharts()
  if (s) nextTick(renderCharts)
})
</script>

<style lang="scss" scoped>
@use './online.shared.scss';

.stats-card { gap: 14px; }

.stats-select {
  background: var(--crm-bg-overlay);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-sm);
  color: var(--crm-text-secondary);
  font-size: var(--crm-text-xs);
  padding: 3px 6px;
}

.stats-kpis {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 8px;

  @media (max-width: 900px) { grid-template-columns: repeat(3, 1fr); }
  @media (max-width: 480px) { grid-template-columns: repeat(2, 1fr); }
}

.kpi {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: var(--crm-bg-elevated);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-md);

  &__icon {
    width: 32px;
    height: 32px;
    border-radius: var(--crm-radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    &--accent { background: var(--crm-accent-dim); color: var(--crm-accent); }
    &--info { background: var(--crm-info-dim); color: var(--crm-info); }
    &--success { background: var(--crm-success-dim); color: var(--crm-success); }
    &--warning { background: var(--crm-warning-dim); color: var(--crm-warning); }
    &--danger { background: var(--crm-danger-dim); color: var(--crm-danger); }
  }

  &__info {
    display: flex;
    flex-direction: column;
    gap: 1px;
    min-width: 0;
  }

  &__label {
    font-size: var(--crm-text-xs);
    color: var(--crm-text-muted);
    white-space: nowrap;
  }

  &__value {
    font-size: var(--crm-text-md);
    font-weight: 700;
    color: var(--crm-text-primary);
  }
}

.stats-charts {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;

  @media (max-width: 700px) { grid-template-columns: 1fr; }
}

.chart-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 14px;
  background: var(--crm-bg-elevated);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-md);
  min-width: 0;

  &--wide { grid-column: 1 / -1; }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
  }

  &__title {
    font-size: var(--crm-text-xs);
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--crm-text-muted);
    display: flex;
    align-items: center;
    gap: 6px;
  }

  &__canvas {
    width: 100%;
    height: 220px;

    &--sm { height: 180px; }
  }
}

.stats-block {
  display: flex;
  flex-direction: column;
  gap: 6px;

  &__title {
    font-size: var(--crm-text-xs);
    font-weight: 600;
    color: var(--crm-text-muted);
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
  }
}

.stats-chip {
  font-weight: 400;
  background: var(--crm-bg-overlay);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-sm);
  padding: 0 6px;
  color: var(--crm-text-secondary);
}

.stats-empty {
  font-size: var(--crm-text-xs);
  color: var(--crm-text-disabled);
  padding: 4px 0;
}

.stats-table-wrap { overflow-x: auto; }

.stats-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--crm-text-xs);

  th, td {
    padding: 5px 8px;
    text-align: left;
    white-space: nowrap;
    border-bottom: 1px solid var(--crm-border);
  }

  th { color: var(--crm-text-muted); font-weight: 600; }
  td { color: var(--crm-text-secondary); font-family: var(--crm-font-mono); }
  tbody tr:hover { background: var(--crm-bg-overlay); }
}

.stats-path { max-width: 260px; overflow: hidden; text-overflow: ellipsis; }
.stats-sub { color: var(--crm-text-muted); }
.stats-ok { color: var(--crm-success); font-weight: 600; }
.stats-warn { color: var(--crm-warning); }

.pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 1px 7px;
  border-radius: 10px;
  font-size: var(--crm-text-xs);
  font-weight: 600;
  white-space: nowrap;

  &--success { background: var(--crm-success-dim); color: var(--crm-success); }
  &--danger { background: var(--crm-danger-dim); color: var(--crm-danger); }
  &--muted { background: var(--crm-bg-overlay); color: var(--crm-text-muted); }
}

.scroll-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.scroll-bar {
  width: 80px;
  height: 6px;
  border-radius: 3px;
  background: var(--crm-bg-overlay);
  overflow: hidden;
  flex-shrink: 0;

  &__fill {
    height: 100%;
    border-radius: 3px;
    background: var(--crm-info);
    transition: width 0.3s ease;

    &--low { background: var(--crm-warning); }
  }
}
</style>

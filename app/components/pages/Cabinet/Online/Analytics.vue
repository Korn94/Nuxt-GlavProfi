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
            <span class="kpi__label" title="Визиты, в которых было хотя бы одно контактное действие: звонок, мессенджер, email или заявка">Обращения</span>
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

      <!-- Формы за период: заявки и доходимость -->
      <div
        class="stats-forms"
        title="Заявка — отправленная форма (form_submit). Открытие формы — форма открыта или пользователь начал заполнение (form_open)."
      >
        <span class="stats-forms__item stats-forms__item--success">
          <Icon name="mdi:file-send-outline" size="13" />
          Заявки: <b>{{ formatNumber(stats.totals?.leadEvents) }}</b>
        </span>
        <span class="stats-forms__item">
          <Icon name="mdi:form-select" size="13" />
          Открытий формы: <b>{{ formatNumber(stats.totals?.formOpens) }}</b>
        </span>
        <span class="stats-forms__item">
          <Icon name="mdi:send-check-outline" size="13" />
          Визитов с отправкой: <b>{{ formatNumber(stats.totals?.formSubmits) }}</b>
        </span>
        <span class="stats-forms__item" :class="{ 'stats-forms__item--warn': (stats.totals?.formSubmitRate ?? 0) < 30 }">
          <Icon name="mdi:percent-outline" size="13" />
          Доходимость формы: <b>{{ stats.totals?.formSubmitRate ?? 0 }}%</b>
        </span>
        <span class="stats-forms__item">
          <Icon name="mdi:account-arrow-right-outline" size="13" />
          Без заявки: <b>{{ formatNumber(noLeadVisits) }}</b>
        </span>
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
          <div v-if="hasEventData" ref="eventsChartRef" class="chart-card__canvas chart-card__canvas--sm" />
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
              <tr>
                <th>Страница</th><th>Просмотры</th><th>Время</th><th>Скролл</th><th>Выходы</th>
                <th class="stats-col-actions" aria-label="Подробнее"></th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in stats.pages"
                :key="row.path"
                class="stats-row--clickable"
                tabindex="0"
                :title="`Показать детали страницы ${row.path}`"
                @click="openPage(row.path)"
                @keydown.enter="openPage(row.path)"
              >
                <td class="stats-path" :title="row.path">
                  <button
                    class="stats-path-link"
                    @click.stop="openPage(row.path)"
                    @keydown.stop
                  >{{ row.path }}</button>
                </td>
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
                <td class="stats-col-actions">
                  <Icon name="mdi:chevron-right" size="14" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="stats-block">
        <div class="stats-block__title">
          События
          <div class="stats-tabs">
            <button
              v-for="tab in eventTabs"
              :key="tab.key"
              type="button"
              class="stats-tab"
              :class="{ 'stats-tab--active': eventFilter === tab.key }"
              :title="tab.hint"
              @click="eventFilter = tab.key"
            >
              {{ tab.label }}<span class="stats-tab__count">{{ formatNumber(tab.total) }}</span>
            </button>
          </div>
        </div>
        <div v-if="!filteredEvents.length" class="stats-empty">Событий за период нет</div>
        <div v-else class="stats-table-wrap">
          <table class="stats-table">
            <thead>
              <tr>
                <th>Когда</th><th>Событие</th><th>Место</th><th>Детали</th>
                <th>Источник</th><th>Кампания</th><th>Визит</th><th>Город</th>
                <th class="stats-col-actions" aria-label="Подробнее"></th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in filteredEvents"
                :key="row.id"
                class="stats-row--clickable"
                tabindex="0"
                title="Открыть визит"
                @click="openSession(row.sessionId, row.visitorId)"
                @keydown.enter="openSession(row.sessionId, row.visitorId)"
              >
                <td>{{ formatFullDateTime(row.createdAt) }}</td>
                <td>
                  <span class="pill" :class="`pill--${eventBadge(row).tone}`">{{ eventBadge(row).label }}</span>
                  <span class="stats-sub"> · {{ eventLabel(row.type) }}</span>
                </td>
                <td class="stats-path" :title="formatPath(row.path)">
                  <button
                    v-if="row.path"
                    class="stats-path-link"
                    @click.stop="openPage(row.path)"
                    @keydown.stop
                  >{{ eventPlace(row.path) }}</button>
                  <span v-else>—</span>
                </td>
                <td class="stats-path" :title="eventMetaText(row.meta)">{{ eventMetaText(row.meta) || '—' }}</td>
                <td>
                  {{ row.channelLabel }}
                  <span v-if="row.referrerHost" class="stats-sub"> · {{ row.referrerHost }}</span>
                  <span v-if="row.linkedUserId" class="stats-staff">сотрудник: {{ row.linkedUserName || row.linkedUserId }}</span>
                </td>
                <td class="stats-path" :title="row.utmCampaign || ''">{{ row.utmCampaign || '—' }}</td>
                <td>№{{ row.visitNumber }}<span class="stats-sub"> · {{ row.pagesCount }} стр.</span></td>
                <td>{{ row.city || '—' }}</td>
                <td class="stats-col-actions"><Icon name="mdi:chevron-right" size="14" /></td>
              </tr>
            </tbody>
          </table>
          <div v-if="hiddenEventsCount > 0" class="stats-empty">
            Показаны последние {{ formatNumber(filteredEvents.length) }} из {{ formatNumber(eventsInFilterTotal) }} событий
          </div>
        </div>
      </div>

      <!-- Воронка форм: открытие → отправка (уникальные визиты) -->
      <div class="stats-block">
        <div class="stats-block__title">
          Формы: открытие → заявка
          <span class="stats-chip">{{ funnelRows.length }} стр. с формами</span>
        </div>
        <div v-if="!funnelRows.length" class="stats-empty">Формы за период не открывали</div>
        <div v-else class="stats-table-wrap">
          <table class="stats-table">
            <thead>
              <tr><th>Место формы</th><th title="Уникальные визиты с открытой формой">Открытий</th><th title="Уникальные визиты с отправленной формой">Отправок</th><th>Доходимость</th><th>Без заявки</th></tr>
            </thead>
            <tbody>
              <tr v-for="row in funnelRows" :key="row.path || 'unknown'">
                <td class="stats-path" :title="formatPath(row.path)">
                  <button v-if="row.path" class="stats-path-link" @click="openPage(row.path)">{{ eventPlace(row.path) }}</button>
                  <span v-else>—</span>
                </td>
                <td>{{ formatNumber(row.opens) }}</td>
                <td>
                  <span v-if="row.submits > 0" class="pill pill--success">{{ formatNumber(row.submits) }}</span>
                  <span v-else>0</span>
                </td>
                <td :class="{ 'stats-warn': row.opens > 0 && row.submitRate < 30 }">{{ row.submitRate }}%</td>
                <td>
                  <span v-if="row.noLead > 0" class="pill pill--muted">{{ formatNumber(row.noLead) }}</span>
                  <span v-else>0</span>
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td>Всего</td>
                <td>{{ formatNumber(funnelTotals.opens) }}</td>
                <td>{{ formatNumber(funnelTotals.submits) }}</td>
                <td>{{ funnelTotals.submitRate }}%</td>
                <td>{{ formatNumber(funnelNoLead) }}</td>
              </tr>
            </tfoot>
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
                <th v-if="isAdmin" class="stats-col-actions" aria-label="Действия"></th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in stats.visits"
                :key="row.id"
                class="stats-row--clickable"
                tabindex="0"
                title="Открыть визит"
                @click="openSession(row.id, row.visitorId)"
                @keydown.enter="openSession(row.id, row.visitorId)"
              >
                <td>{{ formatFullDateTime(row.startedAt) }}</td>
                <td>
                  {{ row.channelLabel }}
                  <span v-if="row.visitNumber > 1" class="stats-sub"> · визит №{{ row.visitNumber }}</span>
                  <span v-if="row.linkedUserId" class="stats-staff">сотрудник: {{ row.linkedUserName || row.linkedUserId }}</span>
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
                <td v-if="isAdmin" class="stats-col-actions">
                  <button
                    class="crm-btn crm-btn--ghost crm-btn--sm stats-row-delete"
                    title="Удалить визит из истории"
                    :disabled="deletingId === row.id"
                    @click.stop="emit('delete-visit', row)"
                    @keydown.stop
                  >
                    <Icon
                      :name="deletingId === row.id ? 'mdi:loading' : 'mdi:trash-outline'"
                      size="14"
                      :class="{ spin: deletingId === row.id }"
                    />
                  </button>
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

    <!-- Детализация: страница → посетитель → визит (состояние в URL-query) -->
    <PagesCabinetOnlineAnalyticsDetails
      v-if="detailsMounted"
      v-model:visible="detailsVisible"
      :stack="detailsStack"
      :days="statsDays"
      @push="pushStep"
      @pop="popStep"
      @goto="goToStep"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import type { ECharts, EChartsOption } from 'echarts'
import { echarts } from '~/lib/echarts'
import { isConversionEvent } from 'shared/constants/visitorEvents'
import type { VisitorEventRow, VisitorStatsResponse, VisitorVisit } from '~/types'
import { useOnlineFormatters } from './composables/useOnlineFormatters'
import { buildDailySeries, chartThemeColors } from './composables/useEchartsTheme'
import {
  shortSessionId,
  shortVisitorId,
  useAnalyticsRouteSync,
  type AnalyticsStep
} from './composables/useAnalyticsRoute'

const props = defineProps<{
  stats: VisitorStatsResponse | null
  statsDays: number
  loading: boolean
  error?: string | null
  /** Показывать колонку удаления (только для администратора) */
  isAdmin?: boolean
  /** ID визита, который удаляется прямо сейчас */
  deletingId?: string | null
}>()

const emit = defineEmits<{
  'update:statsDays': [value: number]
  refresh: []
  'delete-visit': [visit: VisitorVisit]
}>()

const {
  formatSeconds,
  formatFullDateTime,
  formatNumber,
  eventLabel,
  eventMetaText,
  formatPath,
  deviceLabels
} = useOnlineFormatters()

function onDaysChange(e: Event) {
  emit('update:statsDays', Number((e.target as HTMLSelectElement).value))
}

// ── События: фильтры по группам ─────────────────────────────────────────
type EventFilterKey = 'all' | 'conversion' | 'form_open' | 'other'

const EVENT_FILTER_HINTS: Record<EventFilterKey, string> = {
  all: 'Все события посетителей за период',
  conversion: 'Обращения: клик по телефону, мессенджеру, email и отправка формы',
  form_open: 'Форма открыта или начата, но заявка не отправлена',
  other: 'Прочие события: клики по CTA'
}

const eventFilter = ref<EventFilterKey>('all')

/** Счётчики по группам (полные за период, не только загруженная сотня) */
const eventTabs = computed(() => {
  const stats = props.stats?.eventStats || []
  const conversionTotal = stats.filter(s => s.isConversion).reduce((sum, s) => sum + s.total, 0)
  const formOpenTotal = stats.find(s => s.type === 'form_open')?.total || 0
  const otherTotal = stats
    .filter(s => !s.isConversion && s.type !== 'form_open')
    .reduce((sum, s) => sum + s.total, 0)
  const allTotal = stats.reduce((sum, s) => sum + s.total, 0) || (props.stats?.eventsTotal || 0)

  return [
    { key: 'all' as const, label: 'Все', total: allTotal, hint: EVENT_FILTER_HINTS.all },
    { key: 'conversion' as const, label: 'Обращения', total: conversionTotal, hint: EVENT_FILTER_HINTS.conversion },
    { key: 'form_open' as const, label: 'Открытия формы', total: formOpenTotal, hint: EVENT_FILTER_HINTS.form_open },
    { key: 'other' as const, label: 'Прочее', total: otherTotal, hint: EVENT_FILTER_HINTS.other }
  ]
})

const filteredEvents = computed<VisitorEventRow[]>(() => {
  const events = props.stats?.events || []
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

/** Место события: путь как есть (моно-шрифт), для главной — человекочитаемо */
function eventPlace(path: string | null): string {
  if (!path) return '—'
  return path === '/' ? 'Главная (сайт)' : path
}

// ── Воронка форм: открытие → отправка ───────────────────────────────────
const funnelRows = computed(() => (props.stats?.formFunnel || []).map(row => ({
  ...row,
  noLead: Math.max(0, row.opens - row.submits)
})))

const funnelTotals = computed(() => props.stats?.formFunnelTotals || {
  opens: 0, submits: 0, submitRate: 0, submitEvents: 0
})

const funnelNoLead = computed(() => Math.max(0, funnelTotals.value.opens - funnelTotals.value.submits))

/** Визиты, где форма открыта, но заявки не было (по сводке) */
const noLeadVisits = computed(() => Math.max(
  0,
  (props.stats?.totals?.formOpens ?? 0) - (props.stats?.totals?.formSubmits ?? 0)
))

const hasEventData = computed(() => (props.stats?.eventStats || []).some(item => item.total > 0))

// ── Детализация: стек «страница → посетитель → визит» + URL-query ───────
const detailsStack = ref<AnalyticsStep[]>([])
/** Модалка монтируется на клиенте: ссылка из query открывается после гидрации */
const detailsMounted = ref(false)

const detailsVisible = computed({
  get: () => detailsStack.value.length > 0,
  set: (value: boolean) => {
    if (!value) detailsStack.value = []
  }
})

useAnalyticsRouteSync(detailsStack)

/**
 * Кладёт шаг в стек. Если шаг такого типа уже есть — заменяет его и
 * отбрасывает более глубокие уровни (например, переход к другому посетителю).
 */
function pushStep(step: AnalyticsStep) {
  const index = detailsStack.value.findIndex(item => item.kind === step.kind)
  if (index >= 0) {
    detailsStack.value = [...detailsStack.value.slice(0, index), step]
  } else {
    detailsStack.value = [...detailsStack.value, step]
  }
}

function popStep() {
  detailsStack.value = detailsStack.value.slice(0, -1)
}

function goToStep(index: number) {
  if (index < 0 || index >= detailsStack.value.length) return
  detailsStack.value = detailsStack.value.slice(0, index + 1)
}

/** Клик по строке таблицы «Страницы» */
function openPage(path: string) {
  pushStep({ kind: 'page', id: path, title: path })
}

/** Клик по визиту (история или детали страницы) */
function openSession(sessionId: string, visitorId?: string) {
  if (visitorId && !detailsStack.value.some(step => step.kind === 'visitor')) {
    pushStep({ kind: 'visitor', id: visitorId, title: shortVisitorId(visitorId) })
  }
  pushStep({ kind: 'session', id: sessionId, title: `Визит ${shortSessionId(sessionId)}` })
}

// ── Графики ─────────────────────────────────────────────────────────────
const dailyChartRef = ref<HTMLElement | null>(null)
const channelsChartRef = ref<HTMLElement | null>(null)
const eventsChartRef = ref<HTMLElement | null>(null)

let dailyChart: ECharts | null = null
let channelsChart: ECharts | null = null
let eventsChart: ECharts | null = null

const dailyData = computed(() => {
  const { labels, series } = buildDailySeries(props.stats?.daily || [], ['visits', 'conversions'])
  return {
    labels,
    visits: series.visits || [],
    conversions: series.conversions || []
  }
})

function dailyOption(): EChartsOption {
  const c = chartThemeColors()
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

function channelsOption(): EChartsOption {
  const c = chartThemeColors()
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

function eventsOption(): EChartsOption {
  const c = chartThemeColors()
  const data = [...(props.stats?.eventStats || [])]
    .filter(item => item.total > 0)
    .sort((a, b) => a.total - b.total)

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
      data: data.map(d => ({
        value: d.total,
        itemStyle: {
          // 🟢 обращения · 🔵 вовлечение без заявки
          color: d.isConversion ? c.success : c.info,
          borderRadius: [0, 4, 4, 0]
        }
      })),
      barWidth: '60%'
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

  if (eventsChartRef.value && props.stats?.eventStats?.some(item => item.total > 0)) {
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
  detailsMounted.value = true
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

.stats-staff {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  white-space: nowrap;
  width: max-content;
  margin-left: 5px;
  padding: 1px 6px;
  border-radius: var(--crm-radius-sm);
  background: var(--crm-info-dim);
  color: var(--crm-info);
  font-size: var(--crm-text-xs);
  font-weight: 600;
}

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

/* 📝 Полоса «Формы за период»: заявки, открытия, доходимость */
.stats-forms {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 14px;
  padding: 8px 10px;
  background: var(--crm-bg-elevated);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-md);
  font-size: var(--crm-text-xs);
  color: var(--crm-text-muted);

  &__item {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    white-space: nowrap;

    b {
      color: var(--crm-text-primary);
      font-family: var(--crm-font-mono);
      font-weight: 700;
    }

    &--success b { color: var(--crm-success); }
    &--warn b { color: var(--crm-warning); }
  }

  @media (max-width: 480px) {
    gap: 4px 10px;
  }
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

/* 🗂️ Фильтры событий: Все / Обращения / Открытия формы / Прочее */
.stats-tabs {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  margin-left: auto;
}

.stats-tab {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 2px 8px;
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-sm);
  background: var(--crm-bg-overlay);
  color: var(--crm-text-muted);
  font-family: inherit;
  font-size: var(--crm-text-xs);
  font-weight: 500;
  cursor: pointer;
  transition: var(--crm-transition);

  &:hover {
    border-color: var(--crm-border-hover);
    color: var(--crm-text-secondary);
  }

  &:focus-visible {
    outline: 1px solid var(--crm-accent);
    outline-offset: 1px;
  }

  &--active {
    border-color: var(--crm-accent-border);
    background: var(--crm-accent-dim);
    color: var(--crm-accent);
  }

  &__count {
    font-family: var(--crm-font-mono);
    font-weight: 700;
    opacity: 0.85;
  }
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

  tfoot td {
    font-weight: 600;
    color: var(--crm-text-muted);
    background: var(--crm-bg-overlay);
    border-bottom: none;
  }
}

.stats-path { max-width: 260px; overflow: hidden; text-overflow: ellipsis; }
.stats-sub { color: var(--crm-text-muted); }
.stats-ok { color: var(--crm-success); font-weight: 600; }
.stats-warn { color: var(--crm-warning); }

/* 🖱️ Кликабельные строки таблиц (переход в детализацию) */
.stats-row--clickable {
  cursor: pointer;

  &:focus-visible {
    outline: 1px solid var(--crm-accent);
    outline-offset: -1px;
  }
}

.stats-path-link {
  background: none;
  border: none;
  padding: 0;
  font: inherit;
  color: var(--crm-accent);
  cursor: pointer;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  &:hover { text-decoration: underline; }
  &:focus-visible { outline: 1px solid var(--crm-accent); outline-offset: 2px; }
}

/* 🗑️ Колонка удаления визита (только администратор) */
.stats-table .stats-col-actions {
  width: 1%;
  text-align: right;
  font-family: inherit;
}

.stats-row-delete.crm-btn--ghost:hover {
  color: var(--crm-danger);
  border-color: var(--crm-danger);
  background: var(--crm-danger-dim);
}

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
  &--info { background: var(--crm-info-dim); color: var(--crm-info); }
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

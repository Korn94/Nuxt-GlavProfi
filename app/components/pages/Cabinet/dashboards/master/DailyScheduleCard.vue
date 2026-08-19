<!-- app\components\pages\Cabinet\dashboards\master\DailyScheduleCard.vue -->
<template>
  <div class="daily-schedule-card" @click="closeTooltip">
    <!-- Тултип с деталями объектов (по клику на дату) — как у админов при наведении -->
    <Teleport to="body">
      <div
        v-if="tooltipDate && tooltipAssignments.length"
        ref="tooltipEl"
        class="daily-schedule-card__tooltip"
        :style="tooltipStyle"
      >
        <button class="tooltip-close" @click.stop="closeTooltip" aria-label="Закрыть">×</button>
        <div class="tooltip-date">{{ formatDateLong(tooltipDate) }}</div>
        <div v-for="a in tooltipAssignments" :key="a.objectId" class="tooltip-row">
          <span class="tooltip-dot" :style="{ background: getObjectColor(a.objectId) }"></span>
          <span class="tooltip-name" :title="a.objectName">{{ a.objectName }}</span>
          <span class="tooltip-value">{{ a.percentage }}% ({{ formatCurrency(a.amount) }})</span>
        </div>
        <div v-if="getHasTooltipFooter(tooltipDate)" class="tooltip-footer">
          <span v-if="getWorkerCount(tooltipDate) > 1" class="tooltip-total">
            Всего: ×{{ getWorkerCount(tooltipDate) }} чел.
          </span>
          <span v-if="getIsHalfDay(tooltipDate)" class="tooltip-hint">⏱ пол дня</span>
        </div>
      </div>
    </Teleport>

    <!-- Заголовок -->
    <div class="daily-schedule-card__header">
      <div class="daily-schedule-card__title">
        <Icon name="mdi:calendar-clock" size="20" />
        <span>График подневки</span>
      </div>
      <div class="daily-schedule-card__subtitle">Подневка · {{ datesRange.length }} дней</div>
    </div>

    <!-- Загрузка -->
    <div v-if="loading" class="daily-schedule-card__loading">
      <div class="spinner"></div>
      <span>Загрузка...</span>
    </div>

    <!-- Ошибка -->
    <div v-else-if="error" class="daily-schedule-card__error">
      <Icon name="mdi:alert-circle-outline" size="24" />
      <span>{{ error }}</span>
    </div>

    <!-- Нет данных -->
    <div v-else-if="!hasData" class="daily-schedule-card__empty">
      <Icon name="mdi:calendar-blank" size="32" />
      <span>Нет данных за последние 14 дней</span>
    </div>

    <!-- Таблица -->
    <div v-else class="daily-schedule-card__table-wrapper" ref="tableWrapper"
      @pointerdown="onPointerDown" @pointermove="onPointerMove"
      @pointerup="onPointerUp" @pointercancel="onPointerUp">
      <div class="daily-schedule-table-track"
        :class="{ 'is-settling': isSettling }"
        :style="trackStyle">
        <!-- Поле подгрузки при «потягивании» влево -->
        <div class="pull-loader" v-if="pullX > 0 || isLoadingMore"
          :style="{ width: pullX + 'px' }">
          <div class="pull-loader__spinner"
            :class="{ 'is-active': isLoadingMore }"
            :style="{ opacity: Math.min(1, pullX / PULL_THRESHOLD) }"></div>
        </div>

        <div class="daily-schedule-table">
        <!-- Заголовок таблицы -->
        <div class="daily-schedule-table__header">
          <div class="daily-schedule-table__cell daily-schedule-table__cell--name">
            Сотрудник
          </div>
          <div 
            v-for="date in datesRange" 
            :key="date"
            class="daily-schedule-table__cell daily-schedule-table__cell--date"
            :class="{ 
              'daily-schedule-table__cell--today': date === todayStr,
              'daily-schedule-table__cell--weekend': isWeekend(date)
            }"
          >
            <span 
              class="cell-day"
              :class="{ 'cell-day--weekend': isWeekend(date) }"
            >
              {{ getDayOfWeek(date) }}
            </span>
            <span 
              class="cell-date"
              :class="{ 'cell-date--weekend': isWeekend(date) }"
            >
              {{ getDayNumber(date) }}
            </span>
          </div>
        </div>

        <!-- Строка с данными мастера -->
        <div class="daily-schedule-table__row">
          <div class="daily-schedule-table__cell daily-schedule-table__cell--name">
            <div class="worker-info">
              <div class="worker-info__name">{{ contractor?.name }}</div>
              <div class="worker-info__rate">{{ formatCurrency(contractor?.dailyRate || 0) }}/день</div>
            </div>
          </div>
          
          <div 
            v-for="date in datesRange" 
            :key="date"
            class="daily-schedule-table__cell daily-schedule-table__cell--date"
            :class="{ 
              'daily-schedule-table__cell--today': date === todayStr,
              'daily-schedule-table__cell--weekend': isWeekend(date)
            }"
            @mouseenter="onCellHover($event, date)"
            @mouseleave="onCellLeave(date)"
          >
            <div 
              class="cell-indicator-wrapper"
              :class="{ 'is-active': tooltipDate === date }"
              @click.stop="onCellClick($event, date)"
            >
              <div 
                v-if="getAssignmentsForDate(date).length > 0"
                class="cell-indicator"
                :class="{ 'is-active': tooltipDate === date }"
                :style="getCellStyle(date)"
              />
              <!-- ✅ Бейдж количества людей -->
              <span 
                v-if="getDisplayMultiplier(date)"
                class="cell-indicator__multiplier"
              >
                ×{{ getDisplayMultiplier(date) }}
              </span>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useApi } from '~/composables/useApi'

interface Assignment {
  id: number
  date: string
  objectId: number
  objectName: string
  amount: number
  percentage: number
}

interface Contractor {
  id: number
  name: string
  contractorType: string
  dailyRate: number
  balance: number
}

interface Response {
  hasData: boolean
  contractor: Contractor | null
  assignments: Assignment[]
}

const api = useApi()

const tableWrapper = ref<HTMLElement | null>(null)

const loading = ref(true)
const error = ref<string | null>(null)
const hasData = ref(false)
const contractor = ref<Contractor | null>(null)
const assignments = ref<Assignment[]>([])

// ── Состояние тултипа (детали по клику на дату ─ кажется как у админов) ────
const tooltipDate = ref<string | null>(null)
const tooltipStyle = ref<Record<string, string>>({})
const tooltipEl = ref<HTMLElement | null>(null)
const tooltipAssignments = computed<Assignment[]>(() =>
  tooltipDate.value ? getSortedAssignments(tooltipDate.value) : []
)

// ── Тултип: показ по наведению (ПК) и закрепление по клику (моб/ПК) ────────
const pinned = ref(false)
let closeTimer: ReturnType<typeof setTimeout> | null = null

/** Позиционирует тултип рядом с ячейкой, не давая уйти за край экрана */
function computeTooltipStyle(el: HTMLElement, tipH: number): Record<string, string> {
  const rect = el.getBoundingClientRect()
  const tooltipW = 260
  const margin = 8

  // Горизонтально: держим полностью в пределах вьюпорта
  let left = rect.left + rect.width / 2 - tooltipW / 2
  left = Math.min(Math.max(left, margin), window.innerWidth - tooltipW - margin)

  // Вертикально: сверху, если есть место, иначе снизу.
  // translateY(-100%) ставит низ тултипа точно с отступом 8px над ячейкой,
  // независимо от реальной высоты содержимого.
  const fitsAbove = rect.top - margin - tipH >= margin
  const top = fitsAbove ? rect.top - margin : rect.bottom + margin
  const transform = fitsAbove ? 'translateY(-100%)' : 'translateY(0)'

  return {
    left: `${Math.round(left)}px`,
    top: `${Math.round(top)}px`,
    transform
  }
}

async function openTooltip(date: string, el: HTMLElement) {
  if (getAssignmentsForDate(date).length === 0) return
  tooltipDate.value = date
  await nextTick()
  const tip = tooltipEl.value
  tooltipStyle.value = computeTooltipStyle(el, tip?.offsetHeight ?? 200)
}

function closeTooltip() {
  pinned.value = false
  tooltipDate.value = null
  if (closeTimer) { clearTimeout(closeTimer); closeTimer = null }
}

// Клик — закрепляем/скрываем (нужно для мобильных и «закрепления» тултипа)
function onCellClick(e: MouseEvent, date: string) {
  if (getAssignmentsForDate(date).length === 0) return
  if (wasDragging) { wasDragging = false; return }

  // Клик по уже открытой/закреплённой дате — закрываем
  if (tooltipDate.value === date && pinned.value) { closeTooltip(); return }

  pinned.value = true
  openTooltip(date, e.currentTarget as HTMLElement)
}

// Наведение (ПК) — показываем расшифровку, как у админов
function onCellHover(e: MouseEvent, date: string) {
  if (closeTimer) { clearTimeout(closeTimer); closeTimer = null }
  if (pinned.value) return
  if (tooltipDate.value === date) return
  openTooltip(date, e.currentTarget as HTMLElement)
}

// Уход мыши — скрываем, если тултип не закреплён кликом
function onCellLeave(date: string) {
  if (pinned.value) return
  if (tooltipDate.value !== date) return
  closeTimer = setTimeout(() => closeTooltip(), 200)
}

function formatDateLong(date: string | null): string {
  if (!date) return ''
  return new Date(date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}

const todayStr = computed(() => {
  const today = new Date()
  return today.toISOString().split('T')[0] ?? ''
})

// ── Накопление дней (подгрузка старых дней) ─────────────────────
const INITIAL_DAYS = 14
const LOAD_BATCH_DAYS = 7
const MAX_DAYS = 365
const datesRange = ref<string[]>([])
const isLoadingMore = ref(false)

const canLoadMore = computed(() => datesRange.value.length < MAX_DAYS)

/** Строит `count` дней подряд, заканчиваясь на `endDate` */
function buildDateList(endDate: Date, count: number): string[] {
  const start = new Date(endDate)
  start.setDate(endDate.getDate() - (count - 1))
  const dates: string[] = []
  const current = new Date(start)
  while (current <= endDate) {
    const s = current.toISOString().split('T')[0]
    if (s) dates.push(s)
    current.setDate(current.getDate() + 1)
  }
  return dates
}

// ── Drag-перетаскивание и «потянуть-для-подгрузки» ──────────────
const PULL_MAX = 90
const PULL_THRESHOLD = 60
const pullX = ref(0)
const isSettling = ref(false)
const isDragging = ref(false)
let pointerId: number | null = null
let dragStartX = 0
let dragStartScrollLeft = 0
let wasDragging = false

const trackStyle = computed(() =>
  pullX.value > 0 ? { transform: `translateX(${pullX.value}px)` } : undefined
)

// 🆕 Функция прокрутки к концу (справа)
function scrollToRight() {
  // Двойной nextTick или setTimeout гарантирует, что браузер 
  // завершил layout и правильно посчитал scrollWidth
  nextTick(() => {
    setTimeout(() => {
      if (tableWrapper.value) {
        tableWrapper.value.scrollLeft = tableWrapper.value.scrollWidth
      }
    }, 50)
  })
}

function getDayOfWeek(date: string): string {
  const d = new Date(date)
  const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']
  return days[d.getDay()] ?? '—'
}

function getDayNumber(date: string): string {
  return new Date(date).getDate().toString()
}

// ✅ Проверка выходного дня (Сб = 6, Вс = 0)
function isWeekend(date: string): boolean {
  const d = new Date(date)
  const day = d.getDay()
  return day === 0 || day === 6
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0
  }).format(amount)
}

function getAssignmentsForDate(date: string): Assignment[] {
  return assignments.value.filter(a => a.date === date)
}

// ✅ Расчёт количества людей (как в оригинальном CalendarCell)
function getDisplayMultiplier(date: string): string | null {
  const dayAssignments = getAssignmentsForDate(date)
  if (dayAssignments.length === 0) return null
  
  if (!contractor.value || contractor.value.dailyRate <= 0) return null
  
  const totalAmount = dayAssignments.reduce((sum, a) => sum + a.amount, 0)
  const ratio = totalAmount / contractor.value.dailyRate
  
  // Показываем только если ratio > 1.1 (больше одной ставки за день)
  if (ratio <= 1.1) return null
  
  // Округляем до 0.5: "1.5", "2", "2.5", "3" и т.д.
  const rounded = Math.round(ratio * 2) / 2
  
  // Если дробная часть нулевая — показываем целое
  if (rounded === Math.floor(rounded)) {
    return String(Math.floor(rounded))
  }
  
  return String(rounded)
}

// ── Расширенная палитра: уникальный цвет на каждый объект (как у админов) ──
const HUES = [
  0, 25, 50, 80, 110, 145, 175, 200,
  225, 255, 280, 310, 335, 15, 40, 65
] as const

/** Уникальный цвет объекта — та же логика, что в CalendarCell у админов */
function getObjectColor(objectId: number): string {
  const hue = HUES[objectId % HUES.length] ?? HUES[0]
  const lightness = 55 + (objectId * 7) % 10   // 55% — 64%
  const saturation = 85 + (objectId * 3) % 10  // 85% — 94%
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`
}

// ── Вспомогательные расчёты дня (те же, что в CalendarCell) ───────────────
function getSortedAssignments(date: string): Assignment[] {
  return [...getAssignmentsForDate(date)].sort((a, b) => a.objectId - b.objectId)
}

function getDayTotalAmount(date: string): number {
  return getAssignmentsForDate(date).reduce((sum, a) => sum + a.amount, 0)
}

function getDayRatio(date: string): number {
  if (!contractor.value || contractor.value.dailyRate <= 0) return 0
  return getDayTotalAmount(date) / contractor.value.dailyRate
}

function getWorkerCount(date: string | null): number {
  if (!date) return 1
  if (!contractor.value || contractor.value.dailyRate <= 0) return 1
  return Math.round(getDayRatio(date))
}

function getIsHalfDay(date: string | null): boolean {
  if (!date) return false
  const dayAssignments = getAssignmentsForDate(date)
  if (dayAssignments.length === 0) return false
  if (getDayRatio(date) > 1.1) return false
  const totalPct = dayAssignments.reduce((sum, a) => sum + a.percentage, 0)
  return totalPct > 40 && totalPct < 60
}

function getHasTooltipFooter(date: string | null): boolean {
  if (!date) return false
  return getWorkerCount(date) > 1 || getIsHalfDay(date)
}

function getCellStyle(date: string): Record<string, string> {
  const dayAssignments = getAssignmentsForDate(date)
  if (dayAssignments.length === 0) return {}

  const sorted = getSortedAssignments(date)
  const hasMultiple = sorted.length > 1
  let cumulative = 0

  const segments = (sorted as Assignment[]).map((a, idx) => {
    const color = getObjectColor(a.objectId)
    const from = cumulative
    cumulative += a.percentage

    // Тонкий прозрачный зазор между сегментами (как у админов)
    if (hasMultiple && idx < sorted.length - 1) {
      const innerTo = Math.max(from, cumulative - 0.5)
      return `${color} ${from}% ${innerTo}%, transparent ${innerTo}% ${cumulative}%`
    }
    return `${color} ${from}% ${cumulative}%`
  })

  const gradient = segments.join(', ')

  // Проверяем "пол дня"
  const totalPercentage = dayAssignments.reduce((sum, a) => sum + a.percentage, 0)
  const isHalfDay = totalPercentage > 40 && totalPercentage < 60

  const shadow = 'inset 0 0 0 1px rgba(255,255,255,0.25)'

  if (isHalfDay) {
    return {
      background: `conic-gradient(${gradient}, transparent 50% 100%)`,
      boxShadow: shadow
    }
  }

  return { background: `conic-gradient(${gradient})`, boxShadow: shadow }
}

async function loadData() {
  loading.value = true
  error.value = null
  datesRange.value = buildDateList(new Date(), INITIAL_DAYS)

  try {
    const response = await api.get<Response>('/api/contractors/me/daily-recent')
    
    hasData.value = response.hasData
    contractor.value = response.contractor
    assignments.value = response.assignments
    
    console.log('[DailyScheduleCard] ✅ Данные загружены:', {
      hasData: response.hasData,
      assignments: response.assignments.length
    })
  } catch (err: any) {
    console.error('[DailyScheduleCard] Ошибка загрузки:', err)
    error.value = err?.message || 'Ошибка загрузки данных'
  } finally {
    loading.value = false
  }

  // 🆕 Прокручиваем к последним датам (справа) ПОСЛЕ отрисовки таблицы
  if (hasData.value) {
    scrollToRight()
  }
}

/** Подгрузка назначений для конкретного диапазона (объединение с текущими) */
async function fetchRange(from: string, to: string) {
  try {
    const response = await api.get<Response>('/api/contractors/me/daily-recent', {
      params: { from, to }
    })
    const existing = new Set(assignments.value.map(a => `${a.id}_${a.date}`))
    const merged = [
      ...assignments.value,
      ...response.assignments.filter(a => !existing.has(`${a.id}_${a.date}`))
    ]
    merged.sort((a, b) => a.date.localeCompare(b.date))
    assignments.value = merged
  } catch (e: any) {
    console.error('[DailyScheduleCard] Ошибка подгрузки дней:', e)
  }
}

/** Подгрузка следующего (более старого) блока из LOAD_BATCH_DAYS дней */
async function loadMore() {
  if (!canLoadMore.value || datesRange.value.length === 0) return

  const el = tableWrapper.value
  const prevScrollLeft = el ? el.scrollLeft : 0
  const prevWidth = el ? el.scrollWidth : 0

  const oldest = new Date(datesRange.value[0]!)
  oldest.setDate(oldest.getDate() - 1) // день перед самым старым

  const olderBatch = buildDateList(oldest, LOAD_BATCH_DAYS)
  if (olderBatch.length === 0) return

  // Старые дни ставим в начало списка
  datesRange.value = [...olderBatch, ...datesRange.value]

  // Грузим назначения только для нового блока
  await fetchRange(olderBatch[0]!, olderBatch[olderBatch.length - 1]!)

  // Якорь позиции: добавляем ширину нового блока, чтобы день не «прыгал»
  await nextTick()
  if (el) el.scrollLeft = prevScrollLeft + (el.scrollWidth - prevWidth)
}

// ── Обработчики перетаскивания (мышь + тач) ─────────────────────
function onPointerDown(e: PointerEvent) {
  if (e.pointerType === 'mouse' && e.button !== 0) return
  const el = tableWrapper.value
  if (!el) return

  isDragging.value = true
  wasDragging = false
  isSettling.value = false
  pointerId = e.pointerId
  dragStartX = e.clientX
  dragStartScrollLeft = el.scrollLeft

  el.classList.add('grabbing')
  el.setPointerCapture?.(e.pointerId)
}

function onPointerMove(e: PointerEvent) {
  if (!isDragging.value || pointerId !== e.pointerId) return
  const el = tableWrapper.value
  if (!el) return

  const delta = e.clientX - dragStartX

  if (!wasDragging && Math.abs(delta) > 6) {
    wasDragging = true
    closeTooltip() // при перетаскивании прячем открытый тултип
  }

  const nextLeft = dragStartScrollLeft - delta

  // Дотянули до левого края и тянем вправо → упругое поле подгрузки
  if (nextLeft <= 0) {
    pullX.value = Math.min(Math.abs(nextLeft), PULL_MAX)
    el.scrollLeft = 0
    return
  }

  // Обычное перетаскивание
  pullX.value = 0
  el.scrollLeft = Math.min(nextLeft, el.scrollWidth - el.clientWidth)
}

function onPointerUp(e: PointerEvent) {
  if (!isDragging.value || pointerId !== e.pointerId) return

  isDragging.value = false
  pointerId = null
  const el = tableWrapper.value
  el?.classList.remove('grabbing')
  try { el?.releasePointerCapture?.(e.pointerId) } catch { /* noop */ }

  if (pullX.value > 0) {
    if (pullX.value >= PULL_THRESHOLD && canLoadMore.value && !isLoadingMore.value) {
      startPullLoad()
    } else {
      resetPull()
    }
  }
}

/** Упругий откат поля подгрузки */
function resetPull() {
  isSettling.value = true
  pullX.value = 0
  window.setTimeout(() => { isSettling.value = false }, 350)
}

/** Запуск подгрузки после дотягивания за порог */
async function startPullLoad() {
  if (!canLoadMore.value || isLoadingMore.value) { resetPull(); return }
  isLoadingMore.value = true
  try {
    await loadMore()
  } finally {
    isLoadingMore.value = false
    resetPull()
  }
}

onMounted(loadData)
</script>

<style lang="scss" scoped>
.daily-schedule-card {
  background: var(--crm-bg-surface);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-lg);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow: hidden;
  min-width: 0;

  &__header {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__title {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: var(--crm-text-lg);
    font-weight: 600;
    color: var(--crm-text-primary);
  }

  &__subtitle {
    font-size: var(--crm-text-xs);
    color: var(--crm-text-muted);
    margin-left: 30px;
  }

  &__loading,
  &__error,
  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 40px 20px;
    color: var(--crm-text-muted);
    text-align: center;
  }

  &__error {
    color: var(--crm-danger);
  }

  &__table-wrapper {
    overflow-x: auto;
    margin: 0 -20px;
    padding: 0 20px;
    cursor: grab;
    touch-action: none;

    &.grabbing {
      cursor: grabbing;
      user-select: none;
      -webkit-user-select: none;
    }
  }
}

/* Трек для перетаскивания и упругого поля подгрузки */
.daily-schedule-table-track {
  display: flex;
  align-items: stretch;

  &.is-settling {
    transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }
}

/* Поле подгрузки при «потягивании» влево */
.pull-loader {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--crm-bg-elevated);
  border-right: 1px solid var(--crm-border);
  overflow: hidden;

  &__spinner {
    width: 22px;
    height: 22px;
    border: 3px solid var(--crm-border);
    border-top-color: var(--crm-accent);
    border-radius: 50%;
    transition: opacity 0.15s ease;

    &.is-active {
      animation: spin 0.8s linear infinite;
    }
  }
}

.daily-schedule-table {
  display: flex;
  flex-direction: column;
  min-width: max-content;

  &__header {
    display: flex;
    border-bottom: 2px solid var(--crm-border);
  }

  &__row {
    display: flex;
    border-bottom: 1px solid var(--crm-border);
  }

  &__cell {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 8px;
    border-right: 1px solid var(--crm-border);

    &--name {
      width: 140px;
      justify-content: flex-start;
      padding-left: 12px;
      background: var(--crm-bg-surface);
      
      // Удалено:
      // position: sticky;
      // left: 0;
      // z-index: 10;
    }

    &--date {
      width: 48px;
      flex-direction: column;
      gap: 4px;
      background: var(--crm-bg-elevated);

      &.daily-schedule-table__cell--today {
        background: var(--crm-accent-dim);
        
        .cell-day:not(.cell-day--weekend),
        .cell-date:not(.cell-date--weekend) {
          color: var(--crm-accent);
          font-weight: 700;
        }
      }
    }
  }
}

.cell-day {
  font-size: 9px;
  text-transform: uppercase;
  color: var(--crm-text-muted);
  opacity: 0.7;

  // ✅ Красный цвет для выходных
  &--weekend {
    color: var(--crm-danger);
    opacity: 1;
    font-weight: 600;
  }
}

.cell-date {
  font-size: 14px;
  font-weight: 700;
  color: var(--crm-text-primary);

  // ✅ Красный цвет для выходных
  &--weekend {
    color: var(--crm-danger);
  }
}

.worker-info {
  display: flex;
  flex-direction: column;
  gap: 2px;

  &__name {
    font-size: var(--crm-text-sm);
    font-weight: 600;
    color: var(--crm-text-primary);
  }

  &__rate {
    font-size: var(--crm-text-xs);
    color: var(--crm-text-muted);
    font-family: var(--crm-font-mono);
  }
}

.cell-indicator-wrapper {
  position: relative;
  z-index: 2;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;

  &.is-active {
    z-index: 51;
  }
}

.cell-indicator {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 0 6px rgba(0, 0, 0, 0.3);

  &:hover {
    box-shadow: 0 0 8px currentColor;
    filter: saturate(1.2);
  }

  &.is-active {
    filter: saturate(1.15) brightness(1.05);
    box-shadow: 0 0 8px currentColor;
  }

  // ✅ Бейдж количества людей
  &__multiplier {
    position: absolute;
    top: -4px;
    right: -4px;
    min-width: 16px;
    height: 16px;
    padding: 0 4px;
    background: var(--crm-bg-surface);
    color: var(--crm-text-primary);
    font-size: 10px;
    font-weight: 700;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
    border: 1.5px solid var(--crm-border);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
    pointer-events: none;
    z-index: 3;
    font-family: var(--crm-font-mono);
  }
}

// ── Тултип с деталями объектов (по клику, как у админов при наведении) ─────
.daily-schedule-card__tooltip {
  position: fixed;
  width: 260px;
  max-width: calc(100vw - 16px);
  padding: 10px 12px;
  background: var(--crm-bg-surface);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-md);
  box-shadow: var(--crm-shadow-lg, 0 8px 24px rgba(0, 0, 0, 0.18));
  font-size: var(--crm-text-xs);
  z-index: 1000;
  pointer-events: auto;
}

.tooltip-close {
  position: absolute;
  top: 4px;
  right: 6px;
  width: 20px;
  height: 20px;
  border: none;
  background: transparent;
  color: var(--crm-text-muted);
  font-size: 16px;
  line-height: 1;
  cursor: pointer;

  &:hover {
    color: var(--crm-text-primary);
  }
}

.tooltip-date {
  font-weight: 600;
  color: var(--crm-text-primary);
  margin-bottom: 4px;
  text-transform: capitalize;
}

.tooltip-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 0;

  &:not(:last-child) {
    border-bottom: 1px dashed var(--crm-border);
  }
}

.tooltip-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.08);
}

.tooltip-name {
  flex: 1;
  color: var(--crm-text-primary);
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

.tooltip-value {
  color: var(--crm-text-muted);
  font-family: var(--crm-font-mono);
  font-size: 11px;
  flex-shrink: 0;
}

.tooltip-footer {
  margin-top: 6px;
  padding-top: 6px;
  border-top: 1px solid var(--crm-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.tooltip-total {
  font-weight: 600;
  color: var(--crm-accent);
  font-family: var(--crm-font-mono);
}

.tooltip-hint {
  color: var(--crm-text-secondary);
  font-size: 11px;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid var(--crm-border);
  border-top-color: var(--crm-accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .daily-schedule-table__cell--name {
    width: 120px;
  }

  .worker-info__name {
    font-size: var(--crm-text-xs);
  }
}
</style>
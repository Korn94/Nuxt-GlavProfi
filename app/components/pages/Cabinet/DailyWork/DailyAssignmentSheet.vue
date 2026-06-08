<!-- app\components\pages\cabinet\DailyWork\DailyAssignmentSheet.vue -->
<template>
  <Transition name="sheet">
    <div v-if="modelValue" class="sheet-backdrop" @click.self="$emit('update:modelValue', false)">
      <div class="sheet" @click.stop>

        <!-- Шапка -->
        <div class="sheet__header">
          <div class="sheet__title">
            <div v-if="contractorName" class="sheet__contractor">
              <span class="contractor-badge" :class="`contractor-badge--${contractorType}`">
                {{ contractorType === 'master' ? 'Мастер' : 'Рабочий' }}
              </span>
              <span class="contractor-name" :title="contractorName">{{ contractorName }}</span>
            </div>
            <span class="sheet__date">{{ dateRangeLabel }}</span>
            <span class="sheet__rate">Ставка: {{ formatCurrency(dailyRate) }}</span>

            <!-- Переключатель "Пол дня" — только для одного дня -->
            <label v-if="showHalfDayToggle" class="half-day-toggle">
              <input type="checkbox" v-model="isHalfDay" />
              <span class="half-day-toggle__label">
                <Icon name="mdi:clock-outline" size="16" />
                Пол дня (50%)
              </span>
            </label>
          </div>
          <button type="button" class="sheet__close" @click="$emit('update:modelValue', false)"
            aria-label="Закрыть">✕</button>
        </div>

        <!-- Контент -->
        <div class="sheet__content">

          <!-- Выбор дней для применения -->
          <div v-if="props.dates.length > 1" class="sheet__dates-selector">
            <span class="selector-label">Применить к:</span>
            <div class="dates-grid">
              <label v-for="date in props.dates" :key="date" class="date-chip">
                <input type="checkbox" :checked="localSelectedDates.includes(date)" @change="toggleDate(date)" />
                <span class="chip-text">{{ formatDate(date) }}</span>
              </label>
            </div>
          </div>

          <!-- Список объектов -->
          <div class="sheet__list">
            <ObjectSplitRow v-for="(split, idx) in localSplits" :key="split.objectId" :object-id="split.objectId"
              :object-name="getObjectName(split.objectId)" :value="split.value" :daily-rate="dailyRate"
              :is-removable="localSplits.length > 1" @update:value="updateSplit(idx, $event)"
              :is-single-object="localSplits.length === 1"
              @remove="removeSplit(idx)" />
          </div>

          <!-- Добавление объекта -->
          <div v-if="showObjectSelect" class="sheet__select-area">
            <ObjectSelect :objects="availableObjects" :selected-ids="localSplits.map(s => s.objectId)"
              :max-objects="maxSelectableObjects" @update:selected-ids="handleObjectSelect" />
            <div v-if="!isSingleDayMode && localSplits.length >= 1" class="sheet__hint">
              <i class="material-symbols-light">!</i>
              <span>При выборе нескольких дней можно добавить только один объект</span>
            </div>
          </div>
          <button v-else type="button" class="sheet__add-btn" @click="showObjectSelect = true">
            + Добавить объект
          </button>

          <!-- Итог -->
          <SplitSummary
            v-if="localSplits.length > 1 || props.dates.length > 1 || isHalfDay"
            :total-allocated="totalAllocated"
            :daily-rate="dailyRate"
            :days-count="localSelectedDates.length || props.dates.length || 1"
            :is-half-day="isHalfDay"
            :status-message="validationMessage"
            :status-type="totalPercent > targetPercent ? 'error' : totalPercent < targetPercent ? 'warning' : undefined"
          />
        </div>

        <!-- Футер -->
        <div class="sheet__footer">
          <button type="button" class="sheet__btn sheet__btn--danger" @click="$emit('confirmDelete')"
            :disabled="localSplits.length === 0">
            Удалить
          </button>
          <button type="button" class="sheet__btn sheet__btn--primary" @click="handleSave"
            :disabled="!canSave || isSaving">
            {{ isSaving ? 'Сохранение...' : 'Сохранить' }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { ActiveObject, DailyAssignment } from '~/types/daily-assignments'
import { useDailyAssignment } from '~/composables/daily-work/useDailyAssignment'
import ObjectSplitRow from './ObjectSplitRow.vue'
import ObjectSelect from './ui/ObjectSelect.vue'
import SplitSummary from './ui/SplitSummary.vue'
import { useNotifications } from '~/composables/useNotifications'

const props = defineProps<{
  modelValue: boolean
  dates: string[]
  dailyRate: number
  assignments: DailyAssignment[]
  activeObjects: ActiveObject[]
  isSaving: boolean
  contractorName?: string
  contractorType?: 'worker' | 'master'
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'save': [payload: { assignments: DailyAssignment[], dates: string[] }]
  'confirmDelete': []
}>()

const { formatCurrency } = useDailyAssignment()
const notify = useNotifications()

const showObjectSelect = ref(false)
const localSplits = ref<{ objectId: number; value: number }[]>([])
const localSelectedDates = ref<string[]>([])
const isHalfDay = ref(false)

// ── Вычисляемые ──────────────────────────────────────────────────

const dateRangeLabel = computed(() => {
  if (props.dates.length === 0) return '...'
  const first = props.dates[0]!
  if (props.dates.length === 1) {
    return new Date(first).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
  }
  const last = props.dates[props.dates.length - 1]!
  return `${new Date(first).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })} — ${new Date(last).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })} (${props.dates.length} дн.)`
})

/** Целевой процент: 50 при включённом "Пол дня", иначе 100 */
const targetPercent = computed(() => isHalfDay.value ? 50 : 100)

const totalPercent = computed(() =>
  localSplits.value.reduce((sum, s) => sum + s.value, 0)
)

const totalAllocated = computed(() =>
  localSplits.value.reduce((sum, s) => sum + (props.dailyRate * s.value) / 100, 0)
)

const hasZeroSplits = computed(() => localSplits.value.some(s => s.value <= 0))

const isSingleDayMode = computed(() => props.dates.length === 1)
const maxSelectableObjects = computed(() => isSingleDayMode.value ? 4 : 1)

const availableObjects = computed(() =>
  props.activeObjects.filter(obj => !localSplits.value.some(s => s.objectId === obj.id))
)

const canEdit = computed(() => totalPercent.value <= targetPercent.value + 0.01)
const canSave = computed(() =>
  localSplits.value.length > 0
  && !hasZeroSplits.value
  && Math.abs(totalPercent.value - targetPercent.value) < 0.01
)

const validationMessage = computed(() => {
  if (localSplits.value.length === 0) {
    return 'Добавьте хотя бы один объект для распределения'
  }
  if (hasZeroSplits.value) {
    const zeroNames = localSplits.value
      .filter(s => s.value <= 0)
      .map(s => getObjectName(s.objectId))
      .slice(0, 2)
      .join(', ')
    const more = localSplits.value.filter(s => s.value <= 0).length > 2
      ? ` и ещё ${localSplits.value.filter(s => s.value <= 0).length - 2}`
      : ''
    return `⚠ ${zeroNames}${more}: укажите сумму или удалите`
  }
  if (totalPercent.value > targetPercent.value + 0.01) {
    return `❌ Превышено на ${Math.round(totalPercent.value - targetPercent.value)}% — уменьшите долю`
  }
  if (totalPercent.value < targetPercent.value - 0.01) {
    return `⚡ Осталось распределить: ${Math.round(targetPercent.value - totalPercent.value)}%`
  }
  return ''
})

/** Показывать ли переключатель "Пол дня".
 *  Скрывается для существующих записей полного дня, чтобы нельзя было
 *  случайно превратить отработанную полную смену в половинную. */
const showHalfDayToggle = computed(() => {
  if (!isSingleDayMode.value) return false
  
  // Новый день (без записей) — можно выбрать режим
  if (props.assignments.length === 0) return true
  
  // Записи есть — показываем только если изначально был выбран "пол дня"
  const initialTotalPct = props.assignments.reduce((sum, a) => sum + a.percentage, 0)
  return Math.abs(initialTotalPct - 50) < 0.01
})

// ── Инициализация ──────────────────────────────────────────────────

watch(() => props.modelValue, (open) => {
  if (!open) {
    showObjectSelect.value = false
    return
  }
  localSelectedDates.value = [...props.dates]

  if (props.assignments.length > 0) {
    localSplits.value = props.assignments.map(a => ({
      objectId: a.objectId,
      value: a.percentage
    }))

    // Автоопределение "пол дня" по сумме процентов
    const totalPct = localSplits.value.reduce((sum, s) => sum + s.value, 0)
    isHalfDay.value = props.dates.length === 1 && Math.abs(totalPct - 50) < 0.01
  } else {
    localSplits.value = []
    isHalfDay.value = false
  }
  showObjectSelect.value = false
}, { immediate: true })

// При переключении "Пол дня" — перераспределяем доли
watch(isHalfDay, () => {
  if (localSplits.value.length === 0) return
  redistributeEqually()
})

// ── Хелперы ──────────────────────────────────────────────────

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', weekday: 'short' })
}

function getObjectName(id: number) {
  return props.activeObjects.find(o => o.id === id)?.name || 'Неизвестный объект'
}

function toggleDate(date: string) {
  const idx = localSelectedDates.value.indexOf(date)
  if (idx === -1) localSelectedDates.value.push(date)
  else localSelectedDates.value.splice(idx, 1)
}

// ── Обновление доли ─────────────────────────────────────────

function updateSplit(index: number, newValue: number): void {
  const split = localSplits.value[index]
  if (!split) return

  if (newValue < 0) newValue = 0
  if (newValue > targetPercent.value) newValue = targetPercent.value

  const oldValue = split.value
  split.value = newValue

  const total = localSplits.value.reduce((sum, s) => sum + s.value, 0)

  if (total > targetPercent.value + 0.01) {
    split.value = oldValue
    notify.warning(`Сумма долей не может превышать ${targetPercent.value}%`)
    return
  }
}

// ── Добавление объекта ─────────────────────────────────────────

function handleObjectSelect(selectedIds: number[]): void {
  const newIds = selectedIds.filter(id => !localSplits.value.some(s => s.objectId === id))
  if (newIds.length === 0) {
    showObjectSelect.value = false
    return
  }

  newIds.forEach(id => {
    localSplits.value.push({ objectId: id, value: 0 })
  })

  redistributeEqually()
  showObjectSelect.value = false
}

// ── Удаление объекта ───────────────────────────────────────────

function removeSplit(index: number): void {
  if (localSplits.value.length <= 1) return

  localSplits.value.splice(index, 1)
  redistributeEqually()
}

// ── Равномерное распределение на targetPercent ─────────────

function redistributeEqually(): void {
  const totalCount = localSplits.value.length
  if (totalCount === 0) return

  const target = targetPercent.value
  const equalShare = target / totalCount

  localSplits.value.forEach((split, idx) => {
    if (idx === totalCount - 1) {
      const allocated = localSplits.value.slice(0, idx).reduce((sum, s) => sum + Math.round(equalShare), 0)
      split.value = target - allocated
    } else {
      split.value = Math.round(equalShare)
    }
  })
}

// ── Сохранение ─────────────────────────────────────────────────

function handleSave(): void {
  if (localSelectedDates.value.length === 0) {
    console.warn('[DailyWork] Не выбрано ни одной даты')
    return
  }

  if (!canSave.value) {
    notify.error(`Распределите ровно ${targetPercent.value}% перед сохранением`)
    return
  }

  const payload: DailyAssignment[] = localSplits.value.map((split) => ({
    workerId: 0,
    contractorType: props.contractorType || 'worker',
    date: props.dates[0]!,
    objectId: split.objectId,
    objectName: getObjectName(split.objectId),
    percentage: split.value,
    amount: (props.dailyRate * split.value) / 100,
    workSource: 'daily'
  }))

  emit('save', { assignments: payload, dates: localSelectedDates.value })
}
</script>

<style lang="scss" scoped>
.sheet-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 50;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

.sheet {
  width: 100%;
  max-width: 600px;
  max-height: 85vh;
  background: var(--crm-bg-surface);
  border-top-left-radius: var(--crm-radius-xl);
  border-top-right-radius: var(--crm-radius-xl);
  display: flex;
  flex-direction: column;
  box-shadow: var(--crm-shadow-lg);
  overflow: hidden;
}

.sheet__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 16px 16px 12px;
  border-bottom: 1px solid var(--crm-border);
}

.sheet__contractor {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
  min-width: 0;
}

.contractor-badge {
  flex-shrink: 0;
  padding: 2px 8px;
  border-radius: var(--crm-radius-sm);
  font-size: var(--crm-text-xs);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;

  &--master {
    background: var(--crm-accent-dim);
    color: var(--crm-accent);
  }

  &--worker {
    background: var(--crm-success-dim);
    color: var(--crm-success);
  }
}

.contractor-name {
  font-size: var(--crm-text-sm);
  font-weight: 600;
  color: var(--crm-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sheet__title {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.sheet__date {
  font-size: var(--crm-text-md);
  font-weight: 600;
  color: var(--crm-text-primary);
}

.sheet__rate {
  font-size: var(--crm-text-xs);
  color: var(--crm-text-muted);
  font-family: var(--crm-font-mono);
}

.sheet__close {
  background: transparent;
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-sm);
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--crm-text-secondary);
  cursor: pointer;
  transition: var(--crm-transition);
  flex-shrink: 0;
  margin-left: 8px;

  &:hover {
    background: var(--crm-bg-elevated);
  }
}

/* Переключатель "Пол дня" */
.half-day-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  padding: 6px 10px;
  background: var(--crm-bg-elevated);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-sm);
  cursor: pointer;
  user-select: none;
  transition: var(--crm-transition);

  input[type="checkbox"] {
    accent-color: var(--crm-accent);
    width: 16px;
    height: 16px;
    cursor: pointer;
    margin: 0;
  }

  &:has(input:checked) {
    background: var(--crm-accent-dim);
    border-color: var(--crm-accent-border);

    .half-day-toggle__label {
      color: var(--crm-accent);
    }
  }

  &__label {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: var(--crm-text-sm);
    font-weight: 500;
    color: var(--crm-text-secondary);
    transition: color 0.15s ease;
  }
}

.sheet__content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sheet__hint {
  display: flex;
  align-items: center;
  margin-top: 1em;
  gap: 6px;
  padding: 8px 12px;
  background: var(--crm-info-dim);
  border: 1px solid var(--crm-info-border);
  border-radius: var(--crm-radius-sm);
  color: var(--crm-info);
  font-size: var(--crm-text-xs);
  line-height: 1.3;

  i {
    font-size: 16px;
    flex-shrink: 0;
  }
}

.sheet__dates-selector {
  background: var(--crm-bg-elevated);
  padding: 12px;
  border-radius: var(--crm-radius-md);
  border: 1px solid var(--crm-border);
}

.selector-label {
  display: block;
  font-size: var(--crm-text-xs);
  color: var(--crm-text-secondary);
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.dates-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.date-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--crm-bg-surface);
  padding: 4px 8px 4px 4px;
  border-radius: var(--crm-radius-sm);
  border: 1px solid var(--crm-border);
  cursor: pointer;
  transition: var(--crm-transition);
  user-select: none;

  input[type="checkbox"] {
    accent-color: var(--crm-accent);
    width: 16px;
    height: 16px;
    margin: 0;
    cursor: pointer;
  }

  &:has(input:checked) {
    border-color: var(--crm-accent-border);
    background: var(--crm-accent-dim);

    .chip-text {
      color: var(--crm-accent);
    }
  }

  .chip-text {
    font-size: var(--crm-text-sm);
    color: var(--crm-text-primary);
    white-space: nowrap;
  }
}

.sheet__list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sheet__select-area {
  background: var(--crm-bg-elevated);
  padding: 12px;
  border-radius: var(--crm-radius-md);
  border: 1px solid var(--crm-border);
}

.sheet__add-btn {
  width: 100%;
  padding: 10px;
  border: 1px dashed var(--crm-border-hover);
  border-radius: var(--crm-radius-md);
  background: transparent;
  color: var(--crm-text-secondary);
  font-size: var(--crm-text-sm);
  cursor: pointer;
  transition: var(--crm-transition);

  &:hover {
    background: var(--crm-bg-elevated);
    border-color: var(--crm-accent-border);
    color: var(--crm-accent);
  }
}

.sheet__footer {
  padding: 12px 16px;
  border-top: 1px solid var(--crm-border);
  display: flex;
  gap: 10px;
  background: var(--crm-bg-surface);
}

.sheet__btn {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: var(--crm-radius-md);
  font-size: var(--crm-text-sm);
  font-weight: 600;
  cursor: pointer;
  transition: var(--crm-transition);

  &--primary {
    background: var(--crm-accent);
    color: #fff;

    &:hover:not(:disabled) {
      background: var(--crm-accent-hover);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  &--danger {
    background: transparent;
    color: var(--crm-danger);
    border: 1px solid var(--crm-danger-dim);

    &:hover:not(:disabled) {
      background: var(--crm-danger-dim);
    }

    &:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }
  }
}

.sheet-enter-active,
.sheet-leave-active {
  transition: opacity 0.25s ease;
}

.sheet-enter-active .sheet,
.sheet-leave-active .sheet {
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.sheet-enter-from,
.sheet-leave-to {
  opacity: 0;
}

.sheet-enter-from .sheet,
.sheet-leave-to .sheet {
  transform: translateY(100%);
}
</style>
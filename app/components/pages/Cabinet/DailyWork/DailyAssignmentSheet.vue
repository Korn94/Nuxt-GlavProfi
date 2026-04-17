<template>
  <Transition name="sheet">
    <div v-if="modelValue" class="sheet-backdrop" @click.self="$emit('update:modelValue', false)">
      <div class="sheet" @click.stop>
        <!-- Шапка -->
        <div class="sheet__header">
          <div class="sheet__title">
            <span class="sheet__date">{{ dateRangeLabel }}</span>
            <span class="sheet__rate">Ставка: {{ formatCurrency(dailyRate) }}</span>
          </div>
          <button type="button" class="sheet__close" @click="$emit('update:modelValue', false)"
            aria-label="Закрыть">✕</button>
        </div>

        <!-- Контент -->
        <div class="sheet__content">
          <!-- Переключатель режима -->
          <div class="sheet__mode">
            <button :class="['sheet__mode-btn', { 'sheet__mode-btn--active': mode === 'percent' }]"
              @click="mode = 'percent'">Процент</button>
            <button :class="['sheet__mode-btn', { 'sheet__mode-btn--active': mode === 'amount' }]"
              @click="mode = 'amount'">Сумма</button>
          </div>

          <!-- Список объектов -->
          <div class="sheet__list">
            <ObjectSplitRow v-for="(split, idx) in localSplits" :key="split.objectId" :object-id="split.objectId"
              :object-name="getObjectName(split.objectId)" :value="split.value" :mode="mode" :daily-rate="dailyRate"
              :is-removable="localSplits.length > 1" @update:value="updateSplit(idx, $event)"
              @remove="removeSplit(idx)" />
          </div>

          <!-- Добавление объекта -->
          <div v-if="showObjectSelect" class="sheet__select-area">
            <ObjectSelect :objects="availableObjects" :selected-ids="localSplits.map(s => s.objectId)"
              @update:selected-ids="handleObjectSelect" />
          </div>
          <button v-else type="button" class="sheet__add-btn" @click="showObjectSelect = true">
            + Добавить объект
          </button>

          <!-- Итог -->
          <SplitSummary :total-allocated="totalAllocated" :daily-rate="dailyRate" />
        </div>

        <!-- Футер -->
        <div class="sheet__footer">
          <button type="button" class="sheet__btn sheet__btn--danger" @click="$emit('confirmDelete')"
            :disabled="localSplits.length === 0">
            {{ dates.length > 1 ? 'Удалить записи' : 'Удалить день' }}
          </button>
          <button type="button" class="sheet__btn sheet__btn--primary" @click="handleSave"
            :disabled="!isValid || isSaving">
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

const props = defineProps<{
  modelValue: boolean
  dates: string[]           // ✅ Теперь массив дат
  dailyRate: number
  assignments: DailyAssignment[]
  activeObjects: ActiveObject[]
  isSaving: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'save': [payload: { assignments: DailyAssignment[], dates: string[] }] // ✅ Обновленный эмит
  'confirmDelete': []
}>()

const { formatCurrency, calculateSplit, validateTotal } = useDailyAssignment()

// ── Локальное состояние ───────────────────────────────────────────
const mode = ref<'percent' | 'amount'>('percent')
const showObjectSelect = ref(false)
const localSplits = ref<{ objectId: number; value: number }[]>([])

// ── Вычисляемые свойства ─────────────────────────────────────────
const dateRangeLabel = computed(() => {
  if (props.dates.length === 0) return '...'
  
  const firstDate = props.dates[0]!
  if (props.dates.length === 1) {
    return new Date(firstDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
  }
  
  const lastDate = props.dates[props.dates.length - 1]!
  return `${new Date(firstDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })} — ${new Date(lastDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })} (${props.dates.length} дн.)`
})

const availableObjects = computed(() =>
  props.activeObjects.filter(obj => !localSplits.value.some(s => s.objectId === obj.id))
)

const totalAllocated = computed(() => {
  return localSplits.value.reduce((sum, s) => {
    return sum + (mode.value === 'amount' ? s.value : (props.dailyRate * s.value) / 100)
  }, 0)
})

const isValid = computed(() => {
  const values = localSplits.value.map(s =>
    mode.value === 'amount' ? s.value : (props.dailyRate * s.value) / 100
  )
  return validateTotal(values, props.dailyRate)
})

// ── Логика ───────────────────────────────────────────────────────
function getObjectName(id: number): string {
  return props.activeObjects.find(o => o.id === id)?.name || 'Неизвестный объект'
}

// Инициализация при открытии
watch(() => props.modelValue, (open) => {
  if (!open) {
    showObjectSelect.value = false
    return
  }

  if (props.assignments.length > 0) {
    localSplits.value = props.assignments.map(a => ({
      objectId: a.objectId,
      value: mode.value === 'percent' ? a.percentage : a.amount
    }))
  } else {
    // При открытии пустого дня список объектов остаётся пустым
    localSplits.value = []
  }

  showObjectSelect.value = false
}, { immediate: true })

function handleObjectSelect(selectedIds: number[]): void {
  const newIds = selectedIds.filter(id => !localSplits.value.some(s => s.objectId === id))
  if (newIds.length === 0) {
    showObjectSelect.value = false
    return
  }

  if (mode.value === 'percent') {
    const currentTotal = localSplits.value.reduce((sum, s) => sum + s.value, 0)
    const remaining = 100 - currentTotal
    const share = remaining / (localSplits.value.length + newIds.length)

    newIds.forEach(id => localSplits.value.push({ objectId: id, value: share }))
    localSplits.value.forEach(s => {
      if (!newIds.includes(s.objectId)) s.value = share
    })
  } else {
    newIds.forEach(id => localSplits.value.push({ objectId: id, value: 0 }))
  }
  showObjectSelect.value = false
}

function updateSplit(index: number, newValue: number): void {
  const currentSplit = localSplits.value[index]
  if (!currentSplit) return

  if (mode.value === 'percent') {
    const diff = newValue - currentSplit.value
    const others = localSplits.value.filter((_, i) => i !== index)
    const othersSum = others.reduce((s, o) => s + o.value, 0)

    if (othersSum > 0) {
      others.forEach(o => {
        o.value = Math.max(0, o.value - (o.value / othersSum) * diff)
      })
    }
    currentSplit.value = newValue

    // Нормализация до ровно 100%
    const total = localSplits.value.reduce((s, o) => s + o.value, 0)
    if (Math.abs(total - 100) > 0.01 && localSplits.value.length > 0) {
      localSplits.value[0]!.value += (100 - total)
    }
  } else {
    currentSplit.value = newValue
  }
}

function removeSplit(index: number): void {
  if (localSplits.value.length <= 1) return

  const removedItems = localSplits.value.splice(index, 1)
  const removed = removedItems[0]
  if (!removed || localSplits.value.length === 0) return

  if (mode.value === 'percent') {
    const share = removed.value / localSplits.value.length
    localSplits.value.forEach(s => s.value += share)

    const total = localSplits.value.reduce((s, o) => s + o.value, 0)
    if (Math.abs(total - 100) > 0.01) {
      localSplits.value[0]!.value += (100 - total)
    }
  }
}

function handleSave(): void {
  const percentages = localSplits.value.map(s => ({ 
    percentage: mode.value === 'percent' ? s.value : (s.value / props.dailyRate) * 100 
  }))
  
  const amounts = calculateSplit(props.dailyRate, percentages)

  const payload: DailyAssignment[] = localSplits.value.map((split, i) => {
    const amount = amounts[i] ?? 0
    const percentage = mode.value === 'percent' ? split.value : (amount / props.dailyRate) * 100
    
    return {
      workerId: 0,
      contractorType: 'worker',
      date: props.dates[0]!, // ✅ TS теперь видит, что значение гарантировано
      objectId: split.objectId,
      objectName: getObjectName(split.objectId),
      percentage,
      amount,
      workSource: 'daily'
    }
  })

  emit('save', { assignments: payload, dates: props.dates })
}
</script>

<style lang="scss" scoped>
/* Стили остаются без изменений, кроме, возможно, ширины текста в шапке */
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

.sheet__content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sheet__mode {
  display: flex;
  gap: 4px;
  background: var(--crm-bg-elevated);
  padding: 3px;
  border-radius: var(--crm-radius-md);
  width: fit-content;
}

.sheet__mode-btn {
  padding: 6px 12px;
  font-size: var(--crm-text-xs);
  font-weight: 500;
  border: none;
  background: transparent;
  color: var(--crm-text-secondary);
  border-radius: var(--crm-radius-sm);
  cursor: pointer;
  transition: var(--crm-transition);

  &--active {
    background: var(--crm-bg-surface);
    color: var(--crm-text-primary);
    box-shadow: var(--crm-shadow-sm);
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
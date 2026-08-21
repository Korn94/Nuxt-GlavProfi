<!-- app/components/pages/Cabinet/DailyWork/RateManagementModal.vue -->
<!--
  🛠️ Модальное окно управления ставками контрагентов (masters + workers)
  Только для администраторов.
  Ставка 0 ₽ → контрагент скрывается из таблицы подневки (см. store.workersWithDailyRate)
-->
<template>
  <PagesCabinetUiModal :visible="visible" title="Управление ставками контрагентов" size="lg" :closable="true"
    @update:visible="handleClose">
    <div class="rate-mgmt">
      <!-- Подсказка -->
      <p class="rate-mgmt__hint">
        <Icon name="mdi:information-outline" size="14" />
        Ставка <strong>0 ₽</strong> скрывает контрагента из подневки. Установите ставку,
        чтобы отобразить сотрудника в сетке.
      </p>

      <!-- Состояние загрузки -->
      <div v-if="loading" class="rate-mgmt__loading">
        <div class="spinner"></div>
        <span>Загрузка контрагентов...</span>
      </div>

      <!-- Таблица ставок -->
      <div v-else class="rate-table">
        <div class="rate-table__header">
          <div class="rate-table__cell rate-table__cell--label">Тип</div>
          <div class="rate-table__cell rate-table__cell--label">Сотрудник</div>
          <div class="rate-table__cell rate-table__cell--label">Баланс</div>
          <div class="rate-table__cell rate-table__cell--label">Ставка ₽/день</div>
          <div class="rate-table__cell rate-table__cell--label">Статус</div>
          <div class="rate-table__cell rate-table__cell--label rate-table__cell--actions">Действия</div>
        </div>

        <div v-for="c in sortedContractors" :key="`${c.type}-${c.id}`" class="rate-table__row">
          <!-- Тип -->
          <div class="rate-table__cell">
            <span class="contractor-badge" :class="`contractor-badge--${c.type}`">
              {{ c.type === 'master' ? 'Мастер' : 'Рабочий' }}
            </span>
          </div>

          <!-- Имя -->
          <div class="rate-table__cell rate-table__cell--name" :title="c.name">
            {{ c.name }}
          </div>

          <!-- Баланс -->
          <div class="rate-table__cell" :class="getBalanceClass(c.balance)">
            {{ formatCurrency(Number(c.balance)) }}
          </div>

          <!-- Ставка (редактируемая) -->
          <div class="rate-table__cell rate-table__cell--rate">
            <input type="number" min="0" inputmode="numeric" :value="draftRate(cKey(c))"
              @input="onInput(cKey(c), $event)"
              @blur="onBlur(cKey(c))"
              :class="{ 'is-zero': Number(draftRate(cKey(c))) === 0 }" placeholder="0" />
          </div>

          <!-- Статус -->
          <div class="rate-table__cell">
            <span :class="Number(draftRate(cKey(c))) > 0
              ? 'status-badge status-badge--on'
              : 'status-badge status-badge--off'">
              {{ Number(draftRate(cKey(c))) > 0 ? 'В подневке' : 'Скрыт' }}
            </span>
          </div>

          <!-- Действия -->
          <div class="rate-table__cell rate-table__cell--actions">
            <button type="button" class="crm-btn crm-btn--ghost crm-btn--sm"
              :disabled="!isDirty(c) || savingIds.has(cKey(c))" @click="saveRow(c)" title="Сохранить ставку">
              <Icon v-if="savingIds.has(cKey(c))" name="mdi:loading" size="14" />
              <span v-else>✓</span>
            </button>
          </div>
        </div>

        <!-- Пусто -->
        <div v-if="!loading && contractors.length === 0" class="rate-table__empty">
          <Icon name="mdi:account-group-outline" size="32" />
          <span>Контрагенты не найдены</span>
        </div>
      </div>
    </div>

    <!-- Футер -->
    <template #footer>
      <div class="rate-mgmt__footer">
        <button v-if="hasUnsaved" type="button" class="crm-btn crm-btn--sm" :disabled="savingAll" @click="saveAll">
          <Icon v-if="savingAll" name="mdi:loading" size="14" />
          <span v-else>Сохранить все</span>
        </button>
        <button type="button" class="crm-btn crm-btn--ghost crm-btn--sm" @click="handleClose(false)"
          :disabled="savingAll">
          Отмена
        </button>
      </div>
    </template>
  </PagesCabinetUiModal>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, reactive } from 'vue'
import { useContractors } from '~/composables/useContractors'
import { useDailyAssignment } from '~/composables/daily-work/useDailyAssignment'
import type { ContractorDTO } from '~/types/contractors'

const props = withDefaults(defineProps<{
  visible?: boolean
}>(), {
  visible: false
})

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'close'): void
  (e: 'updated'): void
}>()

const { formatCurrency } = useDailyAssignment()

// Composable для CRUD контрагентов
const contractorsApi = useContractors()

// ── Состояние ────────────────────────────────────────────────────────
const loading = ref(false)
const savingIds = ref<Set<string>>(new Set())
const savingAll = ref(false)

// Список контрагентов (masters + workers) и черновики ставок
const contractors = ref<ContractorDTO[]>([])
const draftRates = reactive(new Map<string, string>())

// Замороженные значения для сортировки (обновляются только при blur/сохранении)
const frozenRates = reactive(new Map<string, string>())

// --- Составной ключ (type-id): id контрагентов не уникальны между masters и workers ---
function cKey(c: { type: string; id: number }): string {
  return c.type + String.fromCharCode(45) + c.id
}

// ── Загрузка данных ──────────────────────────────────────────────────
async function load() {
  loading.value = true
  try {
    // activeOnly=true — только активные сотрудники (в архиве не управляем ставками)
    const [masters, workers] = await Promise.all([
      contractorsApi.fetchAll('master', true),
      contractorsApi.fetchAll('worker', true)
    ])

    contractors.value = [...masters, ...workers]

    draftRates.clear()
    frozenRates.clear()
    for (const c of contractors.value) {
      const rate = String(c.dailyRate ?? 0)
      draftRates.set(cKey(c), rate)
      frozenRates.set(cKey(c), rate)
    }
  } catch (e: any) {
    console.error('[RateManagementModal] Ошибка загрузки:', e)
  } finally {
    loading.value = false
  }
}

// При открытии — (пере)загружаем
watch(() => props.visible, async (v) => {
  if (v) {
    await load()
  }
})

onMounted(() => {
  if (props.visible) {
    load()
  }
})

// ── Редактор ставок ─────────────────────────────────────────────────
function draftRate(key: string): string {
  return draftRates.get(key) ?? '0'
}

function onInput(key: string, e: Event) {
  const target = e.target as HTMLInputElement
  let val = target.value
  // Запрещаем вводить отрицательное
  if (val.startsWith('-')) val = val.slice(1)
  draftRates.set(key, val)
}

// Заморозить значение при потере фокуса — триггерит пересортировку
function onBlur(key: string) {
  const currentDraft = draftRates.get(key) ?? '0'
  frozenRates.set(key, currentDraft)
}

function isDirty(c: ContractorDTO): boolean {
  return String(c.dailyRate ?? 0) !== draftRate(cKey(c))
}

const hasUnsaved = computed(() => contractors.value.some(c => isDirty(c)))

const sortedContractors = computed(() => {
  return [...contractors.value].sort((a, b) => {
    // 1. Сначала активные (ставка > 0), потом скрытые (= 0)
    // Используем frozenRates, чтобы сортировка не дёргалась при вводе
    const aHidden = Number(frozenRates.get(cKey(a)) ?? '0') === 0 ? 1 : 0
    const bHidden = Number(frozenRates.get(cKey(b)) ?? '0') === 0 ? 1 : 0
    if (aHidden !== bHidden) return aHidden - bHidden

    // 2. Внутри группы: сначала мастера, потом рабочие
    const typeOrder: Record<string, number> = { master: 0, worker: 1 }
    const aType = typeOrder[a.type] ?? 2
    const bType = typeOrder[b.type] ?? 2
    if (aType !== bType) return aType - bType

    // 3. Внутри типа: по алфавиту (с учётом русской локали)
    return (a.name || '').localeCompare(b.name || '', 'ru')
  })
})

// Сохранить одну строку
async function saveRow(c: ContractorDTO) {
  const key = cKey(c)
  savingIds.value.add(key)
  try {
    const rate = Number(draftRate(key)) || 0
    const updated = await contractorsApi.update(c.type, c.id, { dailyRate: rate })

    const newRate = String(updated.dailyRate ?? rate)
    draftRates.set(key, newRate)
    frozenRates.set(key, newRate)
    c.dailyRate = newRate

    emit('updated')
  } catch (e: any) {
    console.error('[RateManagementModal] Ошибка сохранения:', e)
  } finally {
    savingIds.value.delete(key)
  }
}

// Сохранить все изменённые строки
async function saveAll() {
  const dirty = contractors.value.filter(c => isDirty(c))
  if (!dirty.length) return

  savingAll.value = true
  try {
    for (const c of dirty) {
      await saveRow(c)
    }
    emit('updated')
  } finally {
    savingAll.value = false
  }
}

// ── Закрытие ─────────────────────────────────────────────────────────
function handleClose(value: boolean) {
  emit('update:visible', value)
  if (!value) emit('close')
}

// Цвет баланса (локальная вспомогательная функция)
function getBalanceClass(balance: string | number): string {
  const num = Number(balance)
  if (num > 0) return 'balance--pos'
  if (num < 0) return 'balance--neg'
  return 'balance--zero'
}
</script>

<style lang="scss" scoped>
.rate-mgmt {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.rate-mgmt__hint {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: var(--crm-text-xs);
  color: var(--crm-text-muted);
  margin: 0;

  strong {
    color: var(--crm-text-primary);
  }
}

.rate-mgmt__loading {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 24px;
  justify-content: center;
  color: var(--crm-text-secondary);
}

.rate-mgmt__footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

// Таблица ставок
.rate-table {
  display: grid;
  grid-template-columns: 110px 1fr 120px 150px 120px 90px;
  gap: 0;
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-md);
  overflow: hidden;
  background: var(--crm-bg-surface);

  @media (max-width: 768px) {
    grid-template-columns: 90px 1fr 100px 130px 90px 70px;
  }
}

.rate-table__header,
.rate-table__row {
  display: contents;
}

.rate-table__header > .rate-table__cell,
.rate-table__row > .rate-table__cell {
  padding: 8px 10px;
  border-bottom: 1px solid var(--crm-border);
  border-right: 1px solid var(--crm-border);
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: var(--crm-text-sm);
  text-transform: none;
  background: var(--crm-bg-elevated);
}

.rate-table__header > .rate-table__cell {
  font-weight: 600;
  color: var(--crm-text-primary);
  font-size: var(--crm-text-xs);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.rate-table__cell {
  padding: 8px 10px;
  border-bottom: 1px solid var(--crm-border);
  border-right: 1px solid var(--crm-border);
}

.rate-table__cell--name {
  font-weight: 600;
  color: var(--crm-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rate-table__cell--rate input {
  width: 100%;
  max-width: 130px;
  padding: 4px 8px;
  font-size: var(--crm-text-sm);
  font-family: var(--crm-font-mono, ui-monospace, monospace);
  color: var(--crm-text-primary);
  background: var(--crm-bg-base);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-sm);
  text-align: right;

  /* Firefox */
  -moz-appearance: textfield;
  appearance: textfield;

  /* Chrome, Safari, Edge */
  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  &:focus {
    outline: none;
    border-color: var(--crm-accent);
    box-shadow: 0 0 0 2px var(--crm-accent-dim);
  }

  &.is-zero {
    color: var(--crm-text-muted);
  }
}

.rate-table__cell--actions {
  justify-content: center;
  background: var(--crm-bg-elevated);
}

.rate-table__empty {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 28px;
  color: var(--crm-text-muted);
  font-size: var(--crm-text-sm);
}

.contractor-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  font-size: var(--crm-text-xs);
  font-weight: 600;
  border-radius: 6px;
  white-space: nowrap;

  &--master {
    background: rgba(91, 141, 239, 0.15);
    color: #5b8def;
    border: 1px solid rgba(91, 141, 239, 0.3);
  }

  &--worker {
    background: rgba(245, 166, 35, 0.15);
    color: #f5a623;
    border: 1px solid rgba(245, 166, 35, 0.3);
  }
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  font-size: var(--crm-text-xs);
  font-weight: 600;
  border-radius: 6px;
  white-space: nowrap;

  &--on {
    background: rgba(40, 167, 75, 0.15);
    color: #28a745;
    border: 1px solid rgba(40, 167, 75, 0.3);
  }

  &--off {
    background: rgba(108, 117, 125, 0.15);
    color: #6c757d;
    border: 1px solid rgba(108, 117, 125, 0.3);
  }
}

.balance--pos { color: #28a745; }
.balance--neg { color: #dc3545; }
.balance--zero { color: var(--crm-text-muted); }

.rate-mgmt__loading .spinner {
  width: 18px;
  height: 18px;
}
</style>

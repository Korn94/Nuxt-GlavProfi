<!-- app/components/pages/Cabinet/DailyWork/DailyWorkLogModal.vue -->
<!--
  📝 Модальное окно «Журнал изменений подневки».
  Показывает, кто и когда создал / изменил / удалил записи подневки.
  Доступ только для администраторов (проверка на сервере и скрытие кнопки на странице).
-->
<template>
  <PagesCabinetUiModal :visible="visible" title="Журнал изменений подневки" size="lg" :closable="true"
    @update:visible="handleClose">
    <div class="dw-log">
      <!-- Панель действий -->
      <div class="dw-log__toolbar">
        <span class="dw-log__count" v-if="!loading && entries.length">
          Всего записей: <strong>{{ entries.length }}</strong>
        </span>
        <button type="button" class="crm-btn crm-btn--ghost crm-btn--sm" :disabled="loading" @click="load">
          <Icon v-if="loading" name="mdi:loading" size="14" class="spin" />
          <Icon v-else name="mdi:refresh" size="14" />
          {{ loading ? 'Загрузка...' : 'Обновить' }}
        </button>
      </div>

      <!-- Состояние загрузки -->
      <div v-if="loading" class="dw-log__loading">
        <div class="spinner"></div>
        <span>Загрузка журнала...</span>
      </div>

      <!-- Ошибка -->
      <div v-else-if="error" class="dw-log__error">
        <Icon name="mdi:alert-circle-outline" size="20" />
        <span>{{ error }}</span>
        <button type="button" class="crm-btn crm-btn--ghost crm-btn--sm" @click="load">Повторить</button>
      </div>

      <!-- Пусто -->
      <div v-else-if="entries.length === 0" class="dw-log__empty">
        <Icon name="mdi:history" size="32" />
        <span>Записей пока нет</span>
      </div>

      <!-- Таблица журнала -->
      <div v-else class="dw-log__table">
        <div class="dw-log__row dw-log__row--head">
          <div class="dw-log__cell">Когда</div>
          <div class="dw-log__cell">Кто</div>
          <div class="dw-log__cell">Действие</div>
          <div class="dw-log__cell">Сотрудник</div>
          <div class="dw-log__cell">Объект</div>
          <div class="dw-log__cell">Сумма</div>
          <div class="dw-log__cell">Детали</div>
        </div>

        <div v-for="entry in entries" :key="entry.id" class="dw-log__row" :class="`dw-log__row--${entry.action}`">
          <div class="dw-log__cell dw-log__cell--time" :title="fullDate(entry.createdAt)">
            {{ shortDate(entry.createdAt) }}
          </div>
          <div class="dw-log__cell">{{ entry.userName || '—' }}</div>
          <div class="dw-log__cell">
            <span class="dw-log__badge" :class="`dw-log__badge--${entry.action}`">
              {{ actionLabel(entry.action) }}
            </span>
          </div>
          <div class="dw-log__cell">{{ contractorName(entry) }}</div>
          <div class="dw-log__cell" :title="entry.objectName || ''">{{ entry.objectName || '—' }}</div>
          <div class="dw-log__cell dw-log__cell--amount">{{ entry.amount != null ? formatCurrency(Number(entry.amount)) : '—' }}</div>
          <div class="dw-log__cell">
            <button v-if="entry.changes" type="button" class="dw-log__details-btn"
              @click="toggleDetails(entry.id)" :title="isOpen(entry.id) ? 'Скрыть' : 'Показать'">
              <Icon :name="isOpen(entry.id) ? 'mdi:chevron-up' : 'mdi:chevron-down'" size="14" />
              {{ isOpen(entry.id) ? 'Скрыть' : 'Показать' }}
            </button>
            <span v-else>—</span>
          </div>

          <!-- Раскрытые изменения -->
          <div v-if="entry.changes && isOpen(entry.id)" class="dw-log__details">
            <div v-for="(change, key) in parsedChanges(entry)" :key="key" class="dw-log__change">
              <span class="dw-log__change-key">{{ fieldLabel(String(key)) }}</span>
              <span class="dw-log__change-val">{{ formatChangeValue(change.to) }}</span>
              <template v-if="String(change.from) !== String(change.to)">
                <span class="dw-log__change-arrow">←</span>
                <span class="dw-log__change-old">{{ formatChangeValue(change.from) }}</span>
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dw-log__footer">
        <button type="button" class="crm-btn crm-btn--ghost crm-btn--sm" @click="handleClose(false)">Закрыть</button>
      </div>
    </template>
  </PagesCabinetUiModal>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useApi } from '~/composables/useApi'
import { useDailyAssignment } from '~/composables/daily-work/useDailyAssignment'

const props = withDefaults(defineProps<{
  visible?: boolean
}>(), {
  visible: false
})

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'close'): void
}>()

const { formatCurrency } = useDailyAssignment()

interface LogChange { from: unknown; to: unknown }

interface LogEntry {
  id: number
  workId: number | null
  action: 'created' | 'updated' | 'deleted'
  contractorType: 'master' | 'worker' | null
  contractorId: number | null
  objectId: number | null
  objectName: string | null
  workDate: string | null
  amount: string | null
  changes: string | null
  createdAt: string
  userId: number | null
  userName: string | null
  workerName: string | null
  masterName: string | null
}

const loading = ref(false)
const error = ref<string | null>(null)
const entries = ref<LogEntry[]>([])

// ID записей с раскрытыми «Деталями»
const openDetails = ref<Set<number>>(new Set())

function isOpen(id: number): boolean {
  return openDetails.value.has(id)
}
function toggleDetails(id: number): void {
  const next = new Set(openDetails.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  openDetails.value = next
}

const ACTION_LABELS: Record<LogEntry['action'], string> = {
  created: 'Создано',
  updated: 'Изменено',
  deleted: 'Удалено'
}
function actionLabel(action: LogEntry['action']): string {
  return ACTION_LABELS[action] || action
}

function contractorName(entry: LogEntry): string {
  return entry.masterName || entry.workerName || '—'
}

function shortDate(value: string): string {
  const d = new Date(value)
  if (isNaN(d.getTime())) return value
  return d.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}
function fullDate(value: string): string {
  const d = new Date(value)
  if (isNaN(d.getTime())) return value
  return d.toLocaleString('ru-RU', { dateStyle: 'full', timeStyle: 'medium' })
}

function parsedChanges(entry: LogEntry): Record<string, LogChange> {
  if (!entry.changes) return {}
  try {
    const raw = JSON.parse(entry.changes)
    return raw && typeof raw === 'object' ? raw as Record<string, LogChange> : {}
  } catch {
    return {}
  }
}

const FIELD_LABELS: Record<string, string> = {
  workerAmount: 'Сумма',
  comment: 'Комментарий',
  contractorId: 'Контрагент',
  contractorType: 'Тип',
  objectId: 'Объект',
  operationDate: 'Дата',
  paymentDate: 'Дата оплаты',
  workTypes: 'Вид работы',
  paid: 'Оплачено',
  accepted: 'Принято',
  foremanId: 'Прораб'
}
function fieldLabel(key: string): string {
  return FIELD_LABELS[key] || key
}
function formatChangeValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return 'пусто'
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  return String(value)
}

async function load(): Promise<void> {
  if (loading.value) return
  loading.value = true
  error.value = null
  try {
    const api = useApi()
    const data = await api.get<LogEntry[]>('/api/works/daily-work/log', { params: { limit: 300 } })
    entries.value = data || []
    openDetails.value = new Set()
  } catch (e: any) {
    console.error('[DailyWorkLogModal] Ошибка загрузки журнала:', e)
    error.value = e?.data?.message || e?.message || 'Не удалось загрузить журнал'
  } finally {
    loading.value = false
  }
}

watch(() => props.visible, (v) => {
  if (v) load()
})

onMounted(() => {
  if (props.visible) load()
})

function handleClose(value = false): void {
  emit('update:visible', value)
  emit('close')
}
</script>

<style lang="scss" scoped>
.dw-log {
  display: flex;
  flex-direction: column;
  gap: 12px;

  &__toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  &__count {
    font-size: var(--crm-text-sm);
    color: var(--crm-text-muted);
  }

  &__loading,
  &__empty,
  &__error {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 32px 12px;
    color: var(--crm-text-muted);
    font-size: var(--crm-text-sm);
    flex-direction: column;
    text-align: center;
  }

  &__error {
    color: var(--crm-danger);
  }

  &__table {
    border: 1px solid var(--crm-border);
    border-radius: var(--crm-radius-lg);
    overflow: hidden;
  }

  &__row {
    display: grid;
    grid-template-columns: 130px 140px 100px 160px 1fr 110px 110px;
    gap: 8px;
    align-items: center;
    padding: 8px 12px;
    border-bottom: 1px solid var(--crm-border);
    font-size: var(--crm-text-sm);

    &:last-child {
      border-bottom: none;
    }

    &--head {
      background: var(--crm-bg-elevated);
      font-weight: 600;
      color: var(--crm-text-muted);
      font-size: var(--crm-text-xs);
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    &--created:hover { background: color-mix(in srgb, #2fbf71, transparent 92%); }
    &--updated:hover { background: color-mix(in srgb, #4a7be8, transparent 92%); }
    &--deleted:hover { background: color-mix(in srgb, #f25f5c, transparent 92%); }
  }

  &__cell {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    &--time {
      color: var(--crm-text-muted);
      font-family: var(--crm-font-mono);
      font-size: var(--crm-text-xs);
    }

    &--amount {
      font-family: var(--crm-font-mono);
    }
  }

  &__badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 10px;
    border-radius: 999px;
    font-size: var(--crm-text-xs);
    font-weight: 600;

    &--created { background: #2fbf7122; color: #2fbf71; }
    &--updated { background: #4a7be822; color: #4a7be8; }
    &--deleted { background: #f25f5c22; color: #f25f5c; }
  }

  &__details-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    background: transparent;
    border: 1px solid var(--crm-border);
    border-radius: var(--crm-radius-md);
    color: var(--crm-accent);
    cursor: pointer;
    padding: 3px 8px;
    font-size: var(--crm-text-xs);

    &:hover {
      background: var(--crm-bg-elevated);
    }
  }

  &__details {
    grid-column: 1 / -1;
    display: flex;
    flex-direction: column;
    gap: 4px;
    background: var(--crm-bg-elevated);
    border-radius: var(--crm-radius-md);
    padding: 8px 12px;
  }

  &__change {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: var(--crm-text-xs);
    flex-wrap: wrap;

    &-key {
      font-weight: 600;
      color: var(--crm-text-primary);
      min-width: 120px;
    }

    &-val {
      color: var(--crm-text-primary);
    }

    &-arrow {
      color: var(--crm-text-muted);
    }

    &-old {
      color: var(--crm-danger);
      text-decoration: line-through;
    }
  }

  &__footer {
    display: flex;
    justify-content: flex-end;
  }
}
</style>
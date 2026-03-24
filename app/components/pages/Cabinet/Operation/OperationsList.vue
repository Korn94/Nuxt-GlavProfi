<!-- app/components/pages/cabinet/Operation/OperationsList.vue -->
<template>
  <div class="ops-list">

    <!-- Фильтр по категории -->
    <div class="ops-list__filter">
      <div class="cat-filter">
        <button class="cat-btn" :class="{ 'cat-btn--active': selectedExpenseType === '' }" @click="setFilter('')">
          Все
        </button>
        <button v-for="type in expenseTypes" :key="type.value" class="cat-btn"
          :class="{ 'cat-btn--active': selectedExpenseType === type.value }" @click="setFilter(type.value)">
          <Icon :name="type.icon" size="13" />
          {{ type.label }}
        </button>
      </div>
    </div>

    <!-- Сетка колонок -->
    <div class="ops-list__grid">

      <!-- Расходы -->
      <div class="ops-col">
        <div class="ops-col__header">
          <div class="ops-col__title">
            <div class="ops-col__dot ops-col__dot--expense" />
            Расходы
          </div>
          <span class="ops-col__count">{{ filteredExpenses.length }}</span>
        </div>

        <!-- Загрузка -->
        <div v-if="loading" class="ops-skeleton">
          <div v-for="i in 4" :key="i" class="skel" />
        </div>

        <!-- Ошибка -->
        <div v-else-if="error" class="ops-state ops-state--error">
          <Icon name="mdi:alert-circle-outline" size="24" />
          <span>{{ error }}</span>
        </div>

        <!-- Пусто -->
        <div v-else-if="!filteredExpenses.length" class="ops-state">
          <Icon name="mdi:receipt-text-outline" size="28" />
          <span>Нет расходов за выбранный период</span>
        </div>

        <!-- Список -->
        <div v-else class="ops-items">
          <div v-for="expense in filteredExpenses" :key="expense.id" class="op-item op-item--expense">
            <div class="op-item__head">
              <span :class="['op-tag', `op-tag--${expense.expenseType}`]">
                <Icon :name="getTypeIcon(expense.expenseType)" size="11" />
                {{ expense.expenseType }}
              </span>
              <span class="op-item__date">{{ formatDate(expense.operationDate) }}</span>
              <span class="op-item__amount op-item__amount--expense">
                −{{ formatCurrency(expense.amount) }}
              </span>
            </div>

            <div class="op-item__body">
              <NuxtLink v-if="expense.contractorType && expense.contractorId"
                :to="`/cabinet/admin/contractors/${expense.contractorType}/${expense.contractorId}`"
                class="op-item__link">
                <Icon name="mdi:account-outline" size="13" />
                {{ expense.contractorName }}
                <span class="op-item__link-sub">{{ getContractorLabel(expense.contractorType) }}</span>
              </NuxtLink>
              <span v-else class="op-item__empty">Контрагент не указан</span>

              <NuxtLink v-if="expense.objectId" :to="`/cabinet/objects/${expense.objectId}`" class="op-item__link">
                <Icon name="mdi:map-marker-outline" size="13" />
                {{ expense.objectName }}
              </NuxtLink>

              <span v-if="expense.comment" class="op-item__comment">
                <Icon name="mdi:comment-outline" size="13" />
                {{ expense.comment }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Приходы -->
      <div class="ops-col">
        <div class="ops-col__header">
          <div class="ops-col__title">
            <div class="ops-col__dot ops-col__dot--income" />
            Приходы
          </div>
          <span class="ops-col__count">{{ comings.length }}</span>
        </div>

        <div v-if="loading" class="ops-skeleton">
          <div v-for="i in 4" :key="i" class="skel" />
        </div>

        <div v-else-if="error" class="ops-state ops-state--error">
          <Icon name="mdi:alert-circle-outline" size="24" />
          <span>{{ error }}</span>
        </div>

        <div v-else-if="!comings.length" class="ops-state">
          <Icon name="mdi:cash-plus" size="28" />
          <span>Нет приходов за выбранный период</span>
        </div>

        <div v-else class="ops-items">
          <div v-for="coming in comings" :key="coming.id" class="op-item op-item--income">
            <div class="op-item__head">
              <span class="op-tag op-tag--income">
                <Icon name="mdi:trending-up" size="11" />
                Приход
              </span>
              <span class="op-item__date">{{ formatDate(coming.operationDate) }}</span>
              <span class="op-item__amount op-item__amount--income">
                +{{ formatCurrency(coming.amount) }}
              </span>
            </div>

            <div class="op-item__body">
              <NuxtLink v-if="coming.objectId" :to="`/cabinet/objects/${coming.objectId}`" class="op-item__link">
                <Icon name="mdi:map-marker-outline" size="13" />
                {{ getObjectLabel(coming.objectId) }}
              </NuxtLink>
              <span v-else class="op-item__empty">Объект не указан</span>

              <span v-if="coming.comment" class="op-item__comment">
                <Icon name="mdi:comment-outline" size="13" />
                {{ coming.comment }}
              </span>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps < {
  expenses: any[]
  comings: any[]
  loading: boolean
  error?: string | null
  objectLabels: Record < number, string>
}> ()

const emit = defineEmits < { 'filter-type': [type: string] } > ()

// ── Фильтр ──────────────────────────────────────────────────────────
const selectedExpenseType = ref('')

function setFilter(type: string) {
  selectedExpenseType.value = type
  emit('filter-type', type)
}

// ── Справочники ─────────────────────────────────────────────────────
const expenseTypes = [
  { value: 'Работа', label: 'Работа', icon: 'mdi:hammer' },
  { value: 'Налог', label: 'Налог', icon: 'mdi:currency-usd' },
  { value: 'Зарплата', label: 'Зарплата', icon: 'mdi:cash' },
  { value: 'Реклама', label: 'Реклама', icon: 'mdi:bullhorn' },
  { value: 'Кредит', label: 'Кредит', icon: 'mdi:bank' },
  { value: 'Топливо', label: 'Топливо', icon: 'mdi:gas-station' },
  { value: 'ГлавПрофи', label: 'ГлавПрофи', icon: 'mdi:star' },
]

const typeIconMap: Record<string, string> = Object.fromEntries(
  expenseTypes.map(t => [t.value, t.icon])
)

function getTypeIcon(type: string) {
  return typeIconMap[type] ?? 'mdi:file-document-outline'
}

function getContractorLabel(type: string) {
  const map: Record<string, string> = {
    master: 'Мастер', worker: 'Рабочий', foreman: 'Прораб', office: 'Офис'
  }
  return map[type] ?? 'Неизвестно'
}

function getObjectLabel(id: number) {
  return props.objectLabels[id] || 'Объект не найден'
}

// ── Форматирование ───────────────────────────────────────────────────
const formatCurrency = (amount: any) =>
  (parseFloat(amount) || 0).toLocaleString('ru-RU', {
    style: 'currency', currency: 'RUB', minimumFractionDigits: 0
  })

const formatDate = (dateStr: string) => {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('ru-RU', {
    day: '2-digit', month: '2-digit', year: '2-digit'
  })
}

// ── Фильтрация ───────────────────────────────────────────────────────
const filteredExpenses = computed(() => {
  if (!Array.isArray(props.expenses)) return []
  if (!selectedExpenseType.value) return props.expenses
  return props.expenses.filter(e => e.expenseType === selectedExpenseType.value)
})
</script>

<style lang="scss" scoped>
.ops-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

// ── Фильтр категорий ────────────────────────────────────────────────
.ops-list__filter {
  background: var(--crm-bg-surface);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-lg);
  padding: 12px 14px;
}

.cat-filter {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.cat-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  background: var(--crm-bg-elevated);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-md);
  color: var(--crm-text-secondary);
  font-size: var(--crm-text-sm);
  cursor: pointer;
  transition: var(--crm-transition);
  white-space: nowrap;

  &:hover {
    border-color: var(--crm-border-hover);
    color: var(--crm-text-primary);
  }

  &--active {
    background: var(--crm-accent-dim);
    border-color: var(--crm-accent-border);
    color: var(--crm-accent);

    &:hover {
      background: var(--crm-accent-dim);
    }
  }
}

// ── Сетка ───────────────────────────────────────────────────────────
.ops-list__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;

  @media (max-width: 800px) {
    grid-template-columns: 1fr;
  }
}

// ── Колонка ─────────────────────────────────────────────────────────
.ops-col {
  background: var(--crm-bg-surface);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-lg);
  overflow: hidden;
  display: flex;
  flex-direction: column;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    border-bottom: 1px solid var(--crm-border);
    flex-shrink: 0;
  }

  &__title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: var(--crm-text-md);
    font-weight: 600;
    color: var(--crm-text-primary);
  }

  &__dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;

    &--expense {
      background: var(--crm-danger);
    }

    &--income {
      background: var(--crm-success);
    }
  }

  &__count {
    font-size: var(--crm-text-xs);
    font-weight: 600;
    padding: 2px 8px;
    background: var(--crm-bg-overlay);
    border: 1px solid var(--crm-border-hover);
    border-radius: 10px;
    color: var(--crm-text-muted);
  }
}

// ── Список операций ─────────────────────────────────────────────────
.ops-items {
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  max-height: 80vh;
  scrollbar-width: thin;
  scrollbar-color: var(--crm-bg-overlay) transparent;
}

// ── Элемент операции ────────────────────────────────────────────────
.op-item {
  padding: 12px 16px;
  border-bottom: 1px solid var(--crm-border);
  transition: var(--crm-transition);

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: var(--crm-bg-elevated);
  }

  // Левая цветная полоска
  &--expense {
    border-left: 3px solid var(--crm-danger);
  }

  &--income {
    border-left: 3px solid var(--crm-success);
  }

  &__head {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
    flex-wrap: wrap;
  }

  &__date {
    font-size: var(--crm-text-xs);
    color: var(--crm-text-muted);
    flex-shrink: 0;
  }

  &__amount {
    font-size: var(--crm-text-md);
    font-weight: 700;
    margin-left: auto;
    flex-shrink: 0;

    &--expense {
      color: var(--crm-danger);
    }

    &--income {
      color: var(--crm-success);
    }
  }

  &__body {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__link {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: var(--crm-text-sm);
    color: var(--crm-text-secondary);
    text-decoration: none;
    transition: var(--crm-transition);

    &:hover {
      color: var(--crm-accent);
    }

    &-sub {
      font-size: var(--crm-text-xs);
      color: var(--crm-text-muted);
    }
  }

  &__empty {
    font-size: var(--crm-text-sm);
    color: var(--crm-text-disabled);
  }

  &__comment {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: var(--crm-text-xs);
    color: var(--crm-text-muted);
    font-style: italic;
  }
}

// ── Теги типов расходов ─────────────────────────────────────────────
.op-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: var(--crm-radius-sm);
  font-size: var(--crm-text-xs);
  font-weight: 600;
  flex-shrink: 0;

  // Цвета по типу
  &--Работа {
    background: rgba(154, 160, 184, .2);
    color: #9aa0b8;
  }

  &--Налог {
    background: var(--crm-danger-dim);
    color: var(--crm-danger);
  }

  &--Зарплата {
    background: var(--crm-success-dim);
    color: var(--crm-success);
  }

  &--Реклама {
    background: var(--crm-warning-dim);
    color: var(--crm-warning);
  }

  &--Кредит {
    background: rgba(232, 93, 158, .15);
    color: #e85d9e;
  }

  &--Топливо {
    background: var(--crm-info-dim);
    color: var(--crm-info);
  }

  &--ГлавПрофи {
    background: var(--crm-accent-dim);
    color: var(--crm-accent);
  }

  &--income {
    background: var(--crm-success-dim);
    color: var(--crm-success);
  }
}

// ── Скелетон ────────────────────────────────────────────────────────
.ops-skeleton {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 16px;
}

.skel {
  height: 64px;
  border-radius: var(--crm-radius-md);
  background: linear-gradient(90deg,
      var(--crm-bg-elevated) 25%,
      var(--crm-bg-overlay) 50%,
      var(--crm-bg-elevated) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.6s infinite;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }

  100% {
    background-position: -200% 0;
  }
}

// ── Пустые состояния ────────────────────────────────────────────────
.ops-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 40px 20px;
  color: var(--crm-text-muted);
  font-size: var(--crm-text-sm);
  text-align: center;

  &--error {
    color: var(--crm-danger);
  }
}
</style>
<template>
  <div>
  <!-- Фильтр по категории -->
    <div class="filter-controls">
      <label for="expense-type-filter">Фильтр по категории:</label>
      <select
        id="expense-type-filter"
        v-model="selectedExpenseType"
        class="type-filter"
        @change="$emit('filter-type', selectedExpenseType)"
      >
      <option value="">Все категории</option>
      <option
        v-for="type in expenseTypes"
        :key="type"
        :value="type"
      >
        {{ type }}
      </option>
      </select>
    </div>
    
    <div class="operations-grid">
      <!-- Расходы -->
      <section class="operations-column expenses">
        <header class="column-header">
          <h3>Расходы</h3>
          <span class="count">{{ filteredExpenses.length }}</span>
        </header>
        <div v-if="loading" class="loading">Загрузка...</div>
        <div v-else-if="error" class="error">{{ error }}</div>
        <div v-else-if="filteredExpenses.length === 0" class="empty">
          Нет расходов за выбранный период
        </div>
        <ul v-else class="operations-list">
          <li
            v-for="expense in filteredExpenses"
            :key="expense.id"
            class="operation-item expense"
          >
            <div class="operation-top">
              <p class="operation-date">{{ formatDate(expense.operationDate) }}</p>
              <p class="tag" :class="`tag-${expense.expenseType}`">
                {{ expense.expenseType }}
              </p>
              <p class="operation-amount">- {{ formatCurrency(expense.amount) }}</p>
            </div>
            <div class="operation-details">
              <NuxtLink
                v-if="expense.contractorType && expense.contractorId"
                :to="`/cabinet/admin/contractors/${expense.contractorType}/${expense.contractorId}`"
                class="contractor-link"
              >
                {{ expense.contractorName }} <small>- {{ getContractorLabel(expense.contractorType) }}</small>
              </NuxtLink>
              <p v-else class="contractor-link">Контрагент не указан</p>
              <NuxtLink
                v-if="expense.objectId"
                :to="`/cabinet/objects/${expense.objectId}`"
                class="object-link"
              >
                {{ expense.objectName }}
              </NuxtLink>
              <span v-else class="object-link">{{ expense.objectName }}</span>
              <p class="comment">{{ expense.comment }}</p>
            </div>
          </li>
        </ul>
      </section>
    
      <!-- Приходы (без фильтрации по типу) -->
      <section class="operations-column comings">
        <header class="column-header">
          <h3>Приходы</h3>
          <span class="count">{{ comings.length }}</span>
        </header>
        <div v-if="loading" class="loading">Загрузка...</div>
        <div v-else-if="error" class="error">{{ error }}</div>
        <div v-else-if="comings.length === 0" class="empty">
          Нет приходов за выбранный период
        </div>
        <ul v-else class="operations-list">
          <li
            v-for="coming in comings"
            :key="coming.id"
            class="operation-item coming"
          >
            <div class="operation-top">
              <p class="operation-date">{{ formatDate(coming.operationDate) }}</p>
              <p class="operation-amount">+ {{ formatCurrency(coming.amount) }}</p>
            </div>
            <div class="operation-details">
              <NuxtLink
                :to="`/cabinet/objects/${coming.objectId}`"
                class="object-link"
              >
                {{ getObjectLabel(coming.objectId) }}
              </NuxtLink>
              <p class="comment">{{ coming.comment }}</p>
            </div>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>

<script setup>
// Определение пропсов
const props = defineProps({
  expenses: {
    type: Array,
    required: true,
  },
  comings: {
    type: Array,
    required: true,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  error: {
    type: String,
    default: null,
  },
  objectLabels: {
    type: Object,
    default: () => ({}),
  },
})

// События
const emit = defineEmits(['filter-type'])

// Фильтр по типу расхода
const selectedExpenseType = ref('')

// Список типов расходов (должен совпадать с enum в БД)
const expenseTypes = [
  'Работа', 'Налог', 'Зарплата', 'Реклама', 'Кредит', 'Топливо', 'ГлавПрофи'
]

// Отфильтрованные расходы
const filteredExpenses = computed(() => {
  let list = props.expenses
  if (!Array.isArray(list)) return []

  // Фильтр по дате уже должен быть применён выше, но можно добавить доп. фильтры
  if (selectedExpenseType.value) {
    list = list.filter(expense => expense.expenseType === selectedExpenseType.value)
  }
  return list
})

// Вспомогательные функции
const formatDate = (dateString) => {
  if (!dateString) return '—'
  const date = new Date(dateString)
  return isNaN(date.getTime()) ? '—' : date.toLocaleDateString('ru-RU')
}

const formatCurrency = (amount) => {
  const num = parseFloat(amount) || 0
  return num.toLocaleString('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 2,
  })
}

const getObjectLabel = (id) => props.objectLabels[id] || 'Объект не найден'

const getContractorLabel = (type) => {
  switch (type) {
    case 'master': return 'Мастер'
    case 'worker': return 'Рабочий'
    case 'foreman': return 'Прораб'
    case 'office': return 'Офис'
    default: return 'Неизвестно'
  }
}
</script>

<style lang="scss" scoped>
.filter-controls {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;

  label {
    font-size: 0.95rem;
    font-weight: 500;
    color: #333;
    white-space: nowrap;
  }

  .type-filter {
    flex: 1;
    min-width: 200px;
    padding: 0.6rem 0.8rem;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-size: 0.95rem;
    background-color: #fafafa;
    color: #333;
    cursor: pointer;
    transition: all 0.2s ease;

    &:focus {
      outline: none;
      border-color: $color-primary;
      box-shadow: 0 0 0 3px rgba($color-primary, 0.1);
    }

    option {
      background: #fff;
      color: #333;
      padding: 0.4rem 0.8rem;
    }
  }
}

.operations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 1.5rem;
  .operations-column {
    background: #fff;
    border-radius: 12px;
    padding: 1rem 1.25rem;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
    .column-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1rem;
      h3 {
        margin: 0;
        font-size: 1.1rem;
        font-weight: 600;
      }
      .count {
        background: #f0f2f5;
        border-radius: 6px;
        padding: 2px 5px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.9rem;
        font-weight: 600;
        color: #555;
      }
    }
    .operations-list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: .5rem;
    }
    .operation-item {
      border-left: 4px solid transparent;
      padding: 0.75rem 1rem;
      border-radius: 4px;
      background: #fafafa;
      transition: all 0.2s ease;
      &:hover {
        background: #f3f3f3;
      }
      &.expense {
        border-color: #ff5a5a;
      }
      &.coming {
        border-color: #4caf50;
      }
      .operation-top {
        display: flex;
        justify-content: space-between;
        font-weight: 600;
        margin-bottom: 0.5rem;
        .operation-date {
          font-size: 0.85rem;
          color: #777;
          flex: 2;
        }
        .tag {
          flex: 1;
        }
        .operation-amount {
          font-size: 1rem;
          text-align: right;
          flex: 2;
        }
      }
      .tag {
        display: inline-block;
        padding: 0.2rem 0.6rem;
        margin-bottom: 1em;
        border-radius: 6px;
        text-align: center;
        font-size: 0.8rem;
        font-weight: 500;
        background: #eef0f3;
        color: #333;
        &-Работа { background: $color-muted; color: white; }
        &-Налог { background: $color-danger; color: white; }
        &-Зарплата { background: $color-success; color: white; }
        &-Реклама { background: $color-warning; color: $color-dark; }
        &-Кредит { background: $color-info; color: white; }
        &-Топливо { background: $color-primary; color: white; }
        &-ГлавПрофи { background: $color-pink; color: white; }
      }
      .operation-details {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        .contractor-link,
        .object-link {
          font-size: 0.85rem;
          &:hover {
            text-decoration: underline;
          }
        }
        .comment {
          font-size: 0.85rem;
          color: #555;
        }
      }
    }
  }
}
</style>
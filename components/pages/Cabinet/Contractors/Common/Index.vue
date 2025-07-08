<template>
  <div class="contractor-layout">
    <!-- Шапка с данными контрагента -->
    <Header
      :contractor-type="contractorType"
      :contractor="contractor"
      :pending-total="pendingTotal"
      @update:contractor="$emit('update:contractor')"
    />

    <!-- Основные разделы -->
    <div class="contractor-grid">
      <!-- Левая колонка -->
      <div class="contractor-column">
        <!-- Зарплатные удержания -->
        <PaymentsHistory
          :payments="financialPayments"
          :objects="objects"
          :contractorType="contractorType"
          @update:payment="$emit('update:payment')"
          @delete:payment="$emit('delete:payment')"
        />

        <!-- Специфичный контент -->
        <slot name="left-column" />
      </div>

      <!-- Правая колонка -->
      <div class="contractor-column">
        <!-- Форма добавления оплаты -->
        <PaymentForm
          v-if="contractor.id"
          :objects="objects"
          :contractor-type="contractorType"
          :contractor-id="contractor.id"
          @add-payment="$emit('add-payment')"
        />

        <!-- Специфичный контент -->
        <slot name="right-column" />
      </div>
    </div>

    <!-- Дополнительный контент -->
    <div class="contractor-bottom">
      <slot name="bottom-content" />
    </div>

    <!-- Уведомления -->
    <Notification
      :visible="!!successMessage"
      :message="successMessage"
      color="green"
      @update:visible="successMessage = ''"
    />
    
    <Notification
      :visible="!!errorMessage"
      :message="errorMessage"
      color="red"
      @update:visible="errorMessage = ''"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import Header from '@/components/pages/Cabinet/Contractors/Common/Header.vue'
import PaymentsHistory from '@/components/pages/Cabinet/Contractors/Common/PaymentsHistory.vue'
import PaymentForm from '@/components/pages/Cabinet/Contractors/Common/PaymentForm.vue'
import Notification from '@/components/UI/popups/Notification.vue'

const props = defineProps({
  salaryDeductions: {
    type: Array,
    required: true
  },
  pendingTotal: {
    type: Number,
    required: true
  },
  objects: {
    type: Array,
    required: true
  },
  contractorType: {
    type: String,
    required: true,
    validator: value => ['master', 'worker', 'foreman', 'office'].includes(value)
  },
  contractor: {
    type: Object,
    required: true
  },
  works: {
    type: Array,
    default: () => []
  },
  expenses: {
    type: Array,
    required: true
  }
})

const emit = defineEmits([
  'update:contractor',
  'add-payment',
  'update:salary-deduction',
  'delete:salary-deduction'
])

// Локальное состояние для уведомлений
const successMessage = ref('')
const errorMessage = ref('')

// Преобразование разных типов выплат в единый формат
const financialPayments = computed(() => {
  const formatted = []

  // Зарплатные удержания (salary)
  formatted.push(...props.salaryDeductions.map(item => ({
    ...item,
    type: 'salary' // Зарплата
  })))

  // Прочие расходы (используем expenseType)
  formatted.push(...props.expenses.map(item => ({
    ...item,
    type: item.expenseType || 'Прочее' // Используем expenseType из API
  })))

  // Сортировка по дате
  return formatted.sort((a, b) => 
    new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt)
  )
})
</script>

<style lang="scss" scoped>
.contractor-layout {
  padding: 1rem;
}

.contractor-grid {
  // display: flex;
  // flex-wrap: wrap;
  // gap: 1.5rem;
  margin-top: 1.5rem;
}

.contractor-column {
  flex: 1 1 45%;
  min-width: 300px;
}

.contractor-bottom {
  margin-top: 2rem;
}

/* Блоки с контентом */
.block {
  background: #fff;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  margin-bottom: 1.5rem;
}

/* Таблицы */
.work-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
}

.work-table th,
.work-table td {
  padding: 0.8rem 1rem;
  border-bottom: 1px solid #eee;
}

.work-table thead {
  background: #f8f9fa;
}

/* Статусы */
.status-paid {
  color: #28a745;
  font-weight: 500;
}

.status-pending {
  color: #6c757d;
  font-weight: 500;
}

/* Кнопки */
.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.4rem;
  margin-right: 0.4rem;
}

.btn-delete {
  color: #dc3545;
}

/* Формы */
.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 0.6rem 0.8rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.95rem;
}

.form-group input.error,
.form-group select.error {
  border-color: #dc3545;
}

.error-message {
  color: #dc3545;
  font-size: 0.85rem;
  margin-top: 0.25rem;
  display: block;
}
</style>
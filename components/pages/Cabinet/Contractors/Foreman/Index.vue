<template>
  <CommonIndex
    :contractor="contractor"
    :salary-deductions="salaryDeductions"
    :pending-total="pendingTotal"
    :expenses="expenses"
    :contractor-type="contractorType"
    :objects="objects"
    @update:contractor="$emit('update:contractor')"
    @add-payment="$emit('add-payment')"
    @update:salary-deduction="$emit('update:salary-deduction')"
    @delete:salary-deduction="$emit('delete:salary-deduction')"
  >
    <!-- Левая колонка -->
    <template #left-column>
      <ProfitHistory
        :history="profitHistory"
        :objects="objects"
        @update:item="$emit('update:profit-item')"
        @delete:item="$emit('delete:profit-item')"
      />
    </template>

    <!-- Правая колонка -->
    <template #right-column>
      <!-- Здесь можно добавить специфичные для прораба элементы -->
    </template>
  </CommonIndex>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'
import CommonIndex from '@/components/pages/Cabinet/Contractors/Common/Index.vue'
import ProfitHistory from '@/components/pages/Cabinet/Contractors/Foreman/ProfitHistory.vue'

const contractorType = 'foreman';

// Пропсы, которые мы ожидаем получить от родительского компонента
const props = defineProps({
  contractor: {
    type: Object,
    required: true
  },
  profitHistory: {
    type: Array,
    required: true
  },
  salaryDeductions: {
    type: Array,
    required: true
  },
  expenses: {
    type: Array,
    required: true
  },
  pendingTotal: {
    type: Number,
    default: 0
  },
  objects: {
    type: Array,
    required: true
  },
  contractorType: {
    type: String,
    required: true,
    validator: value => ['foreman'].includes(value)
  }
})

// Эмиттеры событий, которые мы можем вызывать
const emit = defineEmits([
  'update:contractor',
  'add-payment',
  'update:salary-deduction',
  'delete:salary-deduction',
  'update:profit-item',
  'delete:profit-item'
])
</script>

<style lang="scss" scoped>
.contractor-layout {
  padding: 1rem;
}

.contractor-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
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
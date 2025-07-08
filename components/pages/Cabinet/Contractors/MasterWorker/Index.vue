<template>
  <CommonIndex
    :contractor="contractor"
    :works="works"
    :salary-deductions="salaryDeductions"
    :expenses="expenses"
    :pending-total="pendingTotal"
    :objects="objects"
    :contractor-type="contractorType"
    @update:contractor="$emit('update:contractor')"
    @add-payment="$emit('add-payment')"
    @update:salary-deduction="$emit('update:salary-deduction')"
    @delete:salary-deduction="$emit('delete:salary-deduction')"
  >
    <!-- Левая колонка -->
    <template #left-column>
      <WorksTable
        :works="works"
        :objects="objects"
        @update:work="$emit('update:work')"
        @delete:work="$emit('delete:work')"
      />
    </template>

    <!-- Правая колонка -->
    <template #right-column>
      <WorkForm
        :objects="objects"
        :work-types="workTypes"
        @add-work="$emit('add-work')"
      />
    </template>
  </CommonIndex>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'
import CommonIndex from '@/components/pages/Cabinet/Contractors/Common/Index.vue'
import WorksTable from '@/components/pages/Cabinet/Contractors/MasterWorker/WorksTable.vue'
import WorkForm from '@/components/pages/Cabinet/Contractors/MasterWorker/WorkForm.vue'

// Определяем типы работ, которые используются в системе
const workTypes = [
  'Отделка', 'Электрика', 'Плитка', 'Сантехника', 'Перегородки ГКЛ',
  'Сварка', 'Бетонные работы', 'Кровля', 'Перегородки Камень',
  'Демонтаж', 'Мусор', 'Прочее'
]

// Пропсы, которые мы ожидаем получить от родительского компонента
const props = defineProps({
  contractor: {
    type: Object,
    required: true
  },
  works: {
    type: Array,
    required: true
  },
  expenses: {
    type: Array,
    required: true
  },
  salaryDeductions: {
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
    validator: value => ['master', 'worker'].includes(value)
  }
})

// Эмиттеры событий, которые мы можем вызывать
const emit = defineEmits([
  'update:contractor',
  'add-payment',
  'update:work',
  'delete:work',
  'add-work',
  'update:salary-deduction',
  'delete:salary-deduction'
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
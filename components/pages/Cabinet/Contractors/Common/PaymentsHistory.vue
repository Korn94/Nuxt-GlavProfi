<template>
  <div class="block">
    <h3>Финансовые выплаты</h3>
    <table class="work-table">
      <thead>
        <tr>
          <th>Дата</th>
          <th>Сумма</th>
          <th>Тип</th>
          <th>Объект</th>
          <th>Комментарий</th>
          <th>Действия</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="payment in sortedPayments" :key="payment.id">
          <td>{{ formatDate(payment.date || payment.operationDate) }}</td>
          <td :class="{
            'text-green': payment.type === 'salary',
            'text-red': payment.type === 'expense',
            'text-expense': payment.expenseType && payment.type === 'expense'
          }">
            {{ formatAmount(payment.amount) }} ₽
          </td>
          <td>
            <span :class="`tag tag-${payment.type === 'salary' ? 'salary' : (payment.expenseType || 'expense')}`">
              {{ paymentTypeLabels[payment.type === 'salary' ? 'salary' : (payment.expenseType || 'expense')] }}
            </span>
          </td>
          <td>{{ getObjectName(payment.objectId) }}</td>
          <td>{{ payment.description || payment.comment }}</td>
          <td>
            <button 
              @click="openEditModal(payment)" 
              class="btn-icon"
              title="Редактировать"
            >
              <Icon name="mdi:pencil" size="16px" />
            </button>
            <button 
              @click="deletePayment(payment)" 
              class="btn-icon btn-delete"
              title="Удалить"
            >
              <Icon name="mdi:delete" size="16px" />
            </button>
          </td>
        </tr>
      </tbody>
    </table>
    <!-- Модальное окно редактирования -->
    <div v-if="editingPayment" class="modal-overlay">
      <div class="modal">
        <h4>Редактировать выплату</h4>
        <div class="form-group">
          <label>Сумма</label>
          <input 
            v-model.number="editingPayment.amount" 
            type="number" 
            step="0.01"
            :class="{ error: formErrors.amount }"
          />
          <div v-if="formErrors.amount" class="error-message">{{ formErrors.amount }}</div>
        </div>
        <div class="form-group">
          <label>Объект</label>
          <select 
            v-model="editingPayment.objectId"
            :class="{ error: formErrors.object }"
          >
            <option value="">Выберите объект</option>
            <option v-for="obj in objects" :key="obj.id" :value="obj.id">
              {{ obj.name }}
            </option>
          </select>
          <div v-if="formErrors.object" class="error-message">{{ formErrors.object }}</div>
        </div>
        <div class="form-group">
          <label>Комментарий</label>
          <textarea v-model="editingPayment.description"></textarea>
        </div>
        <div class="form-group">
          <label>Дата</label>
          <input 
            v-model="editingPayment.date" 
            type="date"
          />
        </div>
        <div class="form-group" v-if="editingPayment.type === 'expense'">
          <label>Тип расхода</label>
          <select v-model="editingPayment.expenseType">
            <option v-for="type in expenseTypes" :key="type" :value="type">
              {{ type }}
            </option>
          </select>
        </div>
        <div class="modal-actions">
          <button @click="savePayment" class="btn primary">Сохранить</button>
          <button @click="closeModal" class="btn secondary">Отмена</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useNuxtApp } from '#app'

const props = defineProps({
  payments: {
    type: Array,
    required: true
  },
  objects: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['update:payment', 'delete:payment'])

const { $fetch } = useNuxtApp()

const editingPayment = ref(null)
const formErrors = ref({})

const paymentTypeLabels = {
  salary: 'Зарплата',
  'Работа': 'Работа',
  'Налог': 'Налог',
  'Зарплата': 'Зарплата',
  'Реклама': 'Реклама',
  'Кредит': 'Кредит',
  'Топливо': 'Топливо',
  'ГлавПрофи': 'ГлавПрофи',
  expense: 'Прочее'
}

const expenseTypes = ['Работа', 'Налог', 'Зарплата', 'Реклама', 'Кредит', 'Топливо', 'ГлавПрофи']

function formatDate(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

function formatAmount(amount) {
  return parseFloat(amount).toFixed(2)
}

function getObjectName(objectId) {
  const obj = props.objects.find(o => o.id === objectId)
  return obj ? obj.name : 'Объект не найден'
}

function validateForm() {
  formErrors.value = {}
  if (editingPayment.value.amount === null || isNaN(editingPayment.value.amount)) {
    formErrors.value.amount = 'Сумма обязательна'
  }
  if (!editingPayment.value.objectId) {
    formErrors.value.object = 'Объект обязателен'
  }
  return Object.keys(formErrors.value).length === 0
}

function openEditModal(payment) {
  editingPayment.value = { ...payment }
}

function closeModal() {
  editingPayment.value = null
  formErrors.value = {}
}

async function savePayment() {
  if (!validateForm()) return
  try {
    const endpoint = editingPayment.value.type === 'salary' 
      ? `/api/salary-deductions/${editingPayment.value.id}` 
      : `/api/expenses/${editingPayment.value.id}`
    const response = await $fetch(endpoint, {
      method: 'PUT',
      body: {
        amount: editingPayment.value.amount,
        objectId: editingPayment.value.objectId,
        description: editingPayment.value.description || editingPayment.value.comment,
        paymentDate: editingPayment.value.date,
        ...(editingPayment.value.type === 'salary' && { contractorType: props.contractorType }),
        ...(editingPayment.value.type === 'expense' && { expenseType: editingPayment.value.expenseType })
      },
      credentials: 'include'
    })
    const formattedPayment = {
      ...response,
      amount: parseFloat(response.amount),
      date: response.paymentDate || response.createdAt
    }
    emit('update:payment', formattedPayment)
    closeModal()
  } catch (error) {
    console.error('Ошибка сохранения выплаты:', error)
    alert('Не удалось сохранить изменения')
  }
}

// Сортируем выплаты по operationDate или date (от новых к старым)
const sortedPayments = computed(() => {
  return [...props.payments].sort((a, b) => {
    const dateA = new Date(a.operationDate || a.date || a.createdAt).getTime()
    const dateB = new Date(b.operationDate || b.date || b.createdAt).getTime()
    return dateB - dateA // по убыванию (новые — вверху)
  })
})

async function deletePayment(payment) {
  if (!confirm('Вы уверены, что хотите удалить эту выплату?')) return
  try {
    const endpoint = payment.type === 'salary' 
      ? `/api/salary-deductions/${payment.id}` 
      : `/api/expenses/${payment.id}`
    await $fetch(endpoint, {
      method: 'DELETE',
      credentials: 'include'
    })
    emit('delete:payment', payment.id)
  } catch (error) {
    console.error('Ошибка удаления выплаты:', error)
    alert('Не удалось удалить выплату')
  }
}
</script>

<style lang="scss" scoped>
$border-radius-sm: 4px;
$font-size-sm: 0.8rem;
$spacing-xs: 0.25rem;
$spacing-sm: 0.5rem;
$spacing-md: 1rem;
$spacing-lg: 1.5rem;

$shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.1);
$shadow-md: 0 4px 12px rgba(0, 0, 0, 0.15);

// Миксины
@mixin button-reset() {
  border: none;
  background: none;
  padding: 0;
  cursor: pointer;
  outline: none;
}

@mixin tag($bg-color, $text-color: $text-light) {
  background: $bg-color;
  color: $text-color;
  padding: $spacing-xs $spacing-sm;
  border-radius: $border-radius-sm;
  font-size: $font-size-sm;
  font-weight: 500;
  white-space: nowrap;
}

// Основной блок
.block {
  margin-bottom: $spacing-lg;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

h3 {
  margin-bottom: $spacing-md;
  color: #333;
  font-size: 1.25rem;
}

// Таблица
.work-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: $spacing-lg;
  font-size: 0.95rem;
  background: #fff;
  box-shadow: $shadow-sm;
  border-radius: 6px;
  overflow: hidden;

  th,
  td {
    padding: $spacing-sm $spacing-md;
    text-align: left;
    border-bottom: 1px solid #e9ecef;
  }

  th {
    background-color: #f8f9fa;
    color: #495057;
    font-weight: 600;
    text-transform: uppercase;
    font-size: 0.85rem;
  }

  tbody tr {
    transition: background-color 0.15s ease-in-out;

    &:hover {
      background-color: #f1f3f5;
    }
  }

  .text-green {
    color: $color-success;
    font-weight: 500;
  }

  .text-red {
    color: $color-danger;
    font-weight: 500;
  }

  .text-expense {
    color: $color-muted;
    font-weight: 500;
  }
}

// Теги типов
.tag {
  display: inline-block;
  @include tag($color-muted);

  &-salary {
    @include tag($color-success);
  }

  &-Работа {
    @include tag($color-muted);
  }

  &-Налог {
    @include tag($color-danger);
  }

  &-Зарплата {
    @include tag($color-success);
  }

  &-Реклама {
    @include tag($color-warning, $color-dark);
  }

  &-Кредит {
    @include tag($color-info);
  }

  &-Топливо {
    @include tag($color-primary);
  }

  &-ГлавПрофи {
    @include tag($color-pink);
  }

  &-expense {
    @include tag($color-muted);
  }
}

// Кнопки
.btn-icon {
  @include button-reset();
  padding: $spacing-xs;
  border-radius: $border-radius-sm;
  color: #6c757d;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    color: #495057;
    background-color: #f1f3f5;
  }

  &.btn-delete:hover {
    color: #fff;
    background-color: $color-danger;
  }
}

// Модальное окно
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease-out;
}

.modal {
  background: #fff;
  padding: $spacing-lg;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  box-shadow: $shadow-md;
  animation: scaleIn 0.2s ease-out;
  max-height: 90vh;
  overflow-y: auto;

  h4 {
    margin-top: 0;
    margin-bottom: $spacing-md;
    color: #333;
    font-size: 1.2rem;
  }
}

.form-group {
  margin-bottom: $spacing-md;

  label {
    display: block;
    margin-bottom: $spacing-xs;
    font-weight: 500;
    color: #495057;
  }

  input[type="number"],
  input[type="date"],
  select,
  textarea {
    width: 100%;
    padding: $spacing-sm;
    border: 1px solid #ced4da;
    border-radius: $border-radius-sm;
    font-size: 1rem;
    transition: border-color 0.2s ease;

    &:focus {
      outline: none;
      border-color: $color-success;
      box-shadow: 0 0 0 2px rgba($color-success, 0.2);
    }

    &.error {
      border-color: $color-danger;
      box-shadow: 0 0 0 2px rgba($color-danger, 0.2);
    }
  }

  textarea {
    resize: vertical;
    min-height: 80px;
  }
}

.error-message {
  font-size: 0.8rem;
  color: $color-danger;
  margin-top: $spacing-xs;
}

.modal-actions {
  display: flex;
  gap: $spacing-md;
  justify-content: flex-end;
  margin-top: $spacing-lg;
  flex-wrap: wrap;

  .btn {
    padding: $spacing-sm $spacing-md;
    border: none;
    border-radius: $border-radius-sm;
    font-size: 0.95rem;
    cursor: pointer;
    transition: background-color 0.2s ease;

    &.primary {
      background: $color-success;
      color: $text-light;

      &:hover {
        background: #333;
      }
    }

    &.secondary {
      background: #e9ecef;
      color: #495057;

      &:hover {
        background: #ced4da;
      }
    }
  }
}

// Анимации
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

// Адаптивность
@media (max-width: 576px) {
  .work-table {
    font-size: 0.85rem;

    th,
    td {
      padding: $spacing-xs $spacing-sm;
    }
  }

  .modal {
    width: 95%;
    padding: $spacing-md;
  }

  .modal-actions {
    flex-direction: column;
    align-items: stretch;

    .btn {
      width: 100%;
    }
  }
}
</style>
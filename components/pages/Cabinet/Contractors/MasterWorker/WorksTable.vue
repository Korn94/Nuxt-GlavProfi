<template>
  <div class="block">
    <h3>Работы</h3>
    
    <table class="work-table">
      <thead>
        <tr>
          <th>Дата</th>
          <th>Сумма мастеру</th>
          <th>Сумма сметы</th>
          <th>Объект</th>
          <th>Вид работы</th>
          <th>Комментарий</th>
          <th>Статус</th>
          <th>Действия</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="work in works" :key="work.id">
          <td>{{ formatDate(work.createdAt) }}</td>
          <td>{{ work.amount }} ₽</td>
          <td>{{ work.clientAmount }} ₽</td>
          <td>{{ getObjectName(work.objectId) }}</td>
          <td>{{ work.workType }}</td>
          <td>{{ work.comment }}</td>
          <td :class="{
            'status-paid': work.paid,
            'status-pending': !work.paid
          }">
            {{ work.paid ? 'Оплачено' : 'Ожидает' }}
          </td>
          <td>
            <button 
              @click="openEditModal(work)" 
              class="btn-icon"
              title="Редактировать"
            >
              <Icon name="mdi:pencil" size="16px" />
            </button>
            <button 
              @click="deleteWork(work)" 
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
    <div v-if="editingWork" class="modal-overlay">
      <div class="modal">
        <h4>Редактировать работу</h4>
        
        <div class="form-group">
          <label>Сумма мастеру</label>
          <input v-model.number="editingWork.amount" type="number" />
        </div>

        <div class="form-group">
          <label>Сумма сметы</label>
          <input v-model.number="editingWork.clientAmount" type="number" />
        </div>

        <div class="form-group">
          <label>Объект</label>
          <select v-model="editingWork.objectId">
            <option v-for="obj in objects" :key="obj.id" :value="obj.id">
              {{ obj.name }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label>Вид работы</label>
          <select v-model="editingWork.workType">
            <option v-for="type in workTypes" :key="type" :value="type">
              {{ type }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label>Комментарий</label>
          <textarea v-model="editingWork.comment"></textarea>
        </div>

        <div class="modal-actions">
          <button @click="saveWork" class="btn primary">Сохранить</button>
          <button @click="closeModal" class="btn secondary">Отмена</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useNuxtApp } from '#app'
import { useRoute } from 'vue-router'

const props = defineProps({
  works: {
    type: Array,
    required: true
  },
  objects: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['update:work', 'delete:work'])

const { $fetch } = useNuxtApp()
const route = useRoute()

const workTypes = [
  'Отделка', 'Электрика', 'Плитка', 'Сантехника', 'Перегородки ГКЛ',
  'Сварка', 'Бетонные работы', 'Кровля', 'Перегородки Камень',
  'Демонтаж', 'Мусор', 'Прочее'
]

const editingWork = ref(null)

function formatDate(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

function getObjectName(objectId) {
  const obj = props.objects.find(o => o.id === objectId)
  return obj ? obj.name : 'Объект не найден'
}

function openEditModal(work) {
  editingWork.value = { ...work }
}

function closeModal() {
  editingWork.value = null
}

async function saveWork() {
  try {
    const response = await $fetch(`/api/works/${editingWork.value.id}`, {
      method: 'PUT',
      body: {
        workerAmount: editingWork.value.amount,
        customerAmount: editingWork.value.clientAmount,
        objectId: editingWork.value.objectId,
        workTypes: editingWork.value.workType,
        comment: editingWork.value.comment
      },
      credentials: 'include'
    })

    // Обновляем данные в списке
    emit('update:work', {
      ...response,
      amount: parseFloat(response.workerAmount),
      clientAmount: parseFloat(response.customerAmount),
      paid: response.accepted,
      paymentDate: response.accepted ? response.acceptedDate : response.paymentDate
    })

    closeModal()
  } catch (error) {
    console.error('Ошибка сохранения работы:', error)
  }
}

async function deleteWork(work) {
  if (!confirm('Вы уверены, что хотите удалить эту работу?')) return

  try {
    await $fetch(`/api/works/${work.id}`, {
      method: 'DELETE',
      credentials: 'include'
    })

    emit('delete:work', work.id)
  } catch (error) {
    console.error('Ошибка удаления работы:', error)
  }
}
</script>

<style lang="scss" scoped>
// ========================================
// Переменные
// ========================================
$color-primary: #007bff;
$color-success: #28a745;
$color-muted: #6c757d;
$color-danger: #dc3545;
$color-bg: #f8f9fa;
$color-border: #dee2e6;
$color-text: #2c3e50;

$shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.05);
$shadow-md: 0 4px 16px rgba(0, 0, 0, 0.1);
$shadow-modal: 0 8px 32px rgba(0, 0, 0, 0.15);

$border-radius: 8px;
$border-radius-sm: 6px;

$spacing-xs: 0.25rem;
$spacing-sm: 0.5rem;
$spacing-md: 1rem;
$spacing-lg: 1.5rem;

$font-size-sm: 0.85rem;
$font-size-base: 0.95rem;
$font-size-lg: 1.25rem;

// ========================================
// Миксины
// ========================================
@mixin transition($props...) {
  transition: $props;
}

@mixin button-reset() {
  border: none;
  background: none;
  padding: 0;
  cursor: pointer;
  outline: none;
}

@mixin input-style() {
  width: 100%;
  padding: $spacing-sm;
  border: 1px solid $color-border;
  border-radius: $border-radius-sm;
  font-size: $font-size-base;
  @include transition(border-color, box-shadow);

  &:focus {
    outline: none;
    border-color: $color-primary;
    box-shadow: 0 0 0 3px rgba($color-primary, 0.15);
  }
}

@mixin btn($bg, $color: white) {
  background: $bg;
  color: $color;
  border: none;
  padding: $spacing-sm $spacing-md;
  border-radius: $border-radius-sm;
  font-weight: 500;
  cursor: pointer;
  @include transition(all 0.2s ease);

  &:hover:not(:disabled) {
    background: #333;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

// ========================================
// Основной блок
// ========================================
.block {
  margin-bottom: $spacing-lg;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

h3 {
  margin-bottom: $spacing-md;
  color: $color-text;
  font-size: $font-size-lg;
  font-weight: 600;
}

// ========================================
// Таблица работ
// ========================================
.work-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: $spacing-md;
  background: #fff;
  border-radius: $border-radius;
  overflow: hidden;
  box-shadow: $shadow-sm;

  thead {
    background: $color-bg;
    text-align: left;
  }

  th,
  td {
    padding: $spacing-sm $spacing-md;
    border-bottom: 1px solid $color-border;
    text-align: center;
    vertical-align: middle;
    font-size: $font-size-base;
  }

  th {
    font-weight: 600;
    color: #34495e;
    text-transform: uppercase;
    font-size: $font-size-sm;
    letter-spacing: 0.5px;
  }

  tbody tr {
    @include transition(background-color 0.2s ease);

    &:hover {
      background-color: #f9f9f9;
    }

    &:nth-child(even) {
      background-color: #fafafa;
    }
  }
}

// Статусы
.status-paid {
  color: $color-success;
  font-weight: 500;
}

.status-pending {
  color: $color-muted;
  font-weight: 500;
}

// ========================================
// Кнопки действий
// ========================================
.btn-icon {
  @include button-reset();
  padding: $spacing-xs;
  border-radius: $border-radius-sm;
  color: $color-muted;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  @include transition(color, background-color);

  &:hover {
    color: #495057;
    background-color: #f1f3f5;
  }

  &.btn-delete {
    color: $color-danger;

    &:hover {
      color: #fff;
      background-color: $color-danger;
    }
  }
}

// ========================================
// Модальное окно
// ========================================
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}

.modal {
  background: #fff;
  padding: $spacing-lg;
  border-radius: $border-radius;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: $shadow-modal;
  animation: scaleIn 0.3s ease-out;
}

@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

h4 {
  margin-top: 0;
  margin-bottom: $spacing-lg;
  color: $color-text;
  font-size: $font-size-lg;
  font-weight: 600;
}

// ========================================
// Форма внутри модального окна
// ========================================
.form-group {
  margin-bottom: $spacing-lg;

  label {
    display: block;
    margin-bottom: $spacing-xs;
    font-weight: 500;
    color: #495057;
    font-size: $font-size-base;
  }

  input,
  select,
  textarea {
    @include input-style();
  }

  textarea {
    resize: vertical;
    min-height: 80px;
    line-height: 1.5;
  }
}

// ========================================
// Кнопки в модалке
// ========================================
.modal-actions {
  display: flex;
  gap: $spacing-md;
  justify-content: flex-end;
  margin-top: $spacing-lg;
  flex-wrap: wrap;

  .btn {
    &.primary {
      @include btn($color-primary);
    }

    &.secondary {
      @include btn($color-muted);
    }
  }
}

// ========================================
// Адаптивность
// ========================================
@media (max-width: 768px) {
  .work-table th,
  .work-table td {
    padding: $spacing-xs $spacing-sm;
    font-size: $font-size-sm;
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

  .btn-icon {
    padding: $spacing-xs;
    margin-right: $spacing-xs;
  }
}
</style>
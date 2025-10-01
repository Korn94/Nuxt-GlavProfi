<!-- app/components/pages/cabinet/objects/documents/ContractStatus.vue -->
<template>
  <Card title="Договор" bordered elevated>
    <!-- Отображение договора -->
    <div v-if="contract" class="contract-info">
      <p><strong>Тип:</strong> {{ typeText }} <span :class="`badge status-${contract.status}`">{{ statusText }}</span></p>
      <p><strong>Договор от:</strong> {{ formatDate(contract.statusDate) }}</p>
      <p v-if="contract.comment"><strong>Комментарий:</strong> {{ contract.comment }}</p>
    </div>

    <div v-else class="empty-state">
      Договор не создан
    </div>

    <!-- Админ: действия -->
    <template v-if="isAdmin" #actions>
      <button
        v-if="!contract"
        @click="openCreateModal"
        class="btn btn-sm primary"
      >
        Создать договор
      </button>

      <div v-else class="contract-actions">
        <button @click="openEditModal" class="btn btn-sm">Редактировать</button>
        <!-- <button @click="confirmDelete" class="btn btn-danger btn-sm">✕ Удалить</button> -->
      </div>
    </template>

    <!-- Модальное окно: создание -->
    <PagesCabinetUiModal
      :visible="isCreateModalOpen"
      @update:visible="isCreateModalOpen = false"
      title="Создать договор"
      size="md"
    >
      <form @submit.prevent="createContract" class="modal-form">
        <div class="form-group">
          <label>Тип договора *</label>
          <select v-model="form.type" class="form-select" required>
            <option value="">— Выберите тип —</option>
            <option value="none">Не нужен</option>
            <option value="edo">ЭДО</option>
            <option value="paper">Бумажный</option>
            <option value="invoice">Счёт-договор</option>
          </select>
        </div>
        <div class="form-group">
          <label>Статус *</label>
          <select v-model="form.status" class="form-select" required>
            <option value="prepared">Подготовлен</option>
            <option value="sent">Отправлен</option>
            <option value="awaiting">Ожидает подписи</option>
            <option value="signed">Подписан</option>
            <option value="cancelled">Отменён</option>
          </select>
        </div>
        <div class="form-row">
          <div class="form-group flex-1">
            <label>Дата статуса</label>
            <input v-model="form.statusDate" type="date" class="form-input" />
          </div>
        </div>
        <div class="form-group">
          <label>Комментарий</label>
          <textarea v-model="form.comment" class="form-input" rows="3"></textarea>
        </div>
      </form>

      <template #footer>
        <div class="modal-footer-controls">
          <button type="button" @click="isCreateModalOpen = false" class="btn btn-secondary">Отмена</button>
          <button type="submit" @click="createContract" class="btn btn-primary">Создать</button>
        </div>
      </template>
    </PagesCabinetUiModal>

    <!-- Модальное окно: редактирование -->
    <PagesCabinetUiModal
      :visible="isEditModalOpen"
      @update:visible="isEditModalOpen = false"
      title="Редактировать договор"
      size="md"
    >
      <form @submit.prevent="updateContract" class="modal-form">
        <div class="form-group">
          <label>Тип договора *</label>
          <select v-model="form.type" class="form-select" required>
            <option value="unassigned">— Не выбрано —</option>
            <option value="none">Не нужен</option>
            <option value="edo">ЭДО</option>
            <option value="paper">Бумажный</option>
            <option value="invoice">Счёт-договор</option>
          </select>
        </div>
        <div class="form-group">
          <label>Статус *</label>
          <select v-model="form.status" class="form-select" required>
            <option value="prepared">Подготовлен</option>
            <option value="sent">Отправлен</option>
            <option value="awaiting">Ожидает подписи</option>
            <option value="signed">Подписан</option>
            <option value="cancelled">Отменён</option>
          </select>
        </div>
        <div class="form-row">
          <div class="form-group flex-1">
            <label>Дата статуса</label>
            <input v-model="form.statusDate" type="date" class="form-input" />
          </div>
        </div>
        <div class="form-group">
          <label>Комментарий</label>
          <textarea v-model="form.comment" class="form-input" rows="3"></textarea>
        </div>
      </form>

      <template #footer>
        <div class="modal-footer-controls">
          <button type="button" @click="isEditModalOpen = false" class="btn btn-secondary">Отмена</button>
          <button type="submit" @click="updateContract" class="btn btn-primary">Сохранить</button>
        </div>
      </template>
    </PagesCabinetUiModal>
  </Card>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import PagesCabinetUiModal from '@/components/pages/cabinet/ui/Modal.vue'
import Card from '@/components/pages/cabinet/ui/cards/card.vue'

const props = defineProps({
  object: Object,
  isAdmin: Boolean
})
const emit = defineEmits(['refresh'])

const contract = ref(props.object.contract || null)

// Форма
const form = ref({
  type: '',
  status: '',
  statusDate: '',
  comment: ''
})

const isCreateModalOpen = ref(false)
const isEditModalOpen = ref(false)

// Синхронизация при изменении пропса
watch(() => props.object.contract, (newVal) => {
  contract.value = newVal || null
}, { deep: true })

function formatDate(dateStr) {
  if (!dateStr) return '—'
  const date = new Date(dateStr)
  return date.toLocaleDateString('ru-RU')
}

const typeText = computed(() => {
  const map = {
    unassigned: 'Не выбрано',
    none: 'Не нужен',
    edo: 'ЭДО',
    paper: 'Бумажный',
    invoice: 'Счёт-договор'
  }
  return map[contract.value?.type] || '—'
})

const statusText = computed(() => {
  const map = {
    prepared: 'Подготовлен',
    sent: 'Отправлен',
    awaiting: 'Ожидает подписи',
    signed: 'Подписан',
    cancelled: 'Отменён'
  }
  return map[contract.value?.status] || '—'
})

// --- Создание ---
function openCreateModal() {
  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
  form.value = {
    type: '',
    status: 'prepared',
    statusDate: today, // ← сегодняшняя дата по умолчанию
    comment: ''
  }
  isCreateModalOpen.value = true
}

async function createContract() {
  if (!form.value.type || !form.value.status) {
    alert('Заполните тип и статус')
    return
  }
  try {
    await $fetch(`/api/objects/${props.object.id}/contract`, {
      method: 'POST',
      body: {
        type: form.value.type,
        status: form.value.status,
        statusDate: form.value.statusDate || null,
        comment: form.value.comment || null
      }
    })
    isCreateModalOpen.value = false
    emit('refresh')
  } catch (error) {
    alert(error.message || 'Не удалось создать договор')
  }
}

// --- Редактирование ---
function openEditModal() {
  if (!contract.value) return

  // Копируем данные договора
  form.value = { ...contract.value }

  // Обрабатываем statusDate: извлекаем YYYY-MM-DD из строки вида "YYYY-MM-DD HH:MM:SS"
  if (contract.value.statusDate) {
    const datePart = contract.value.statusDate.split(' ')[0] // ← разделяем по пробелу
    if (datePart && /^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
      form.value.statusDate = datePart
    } else {
      form.value.statusDate = '' // на всякий случай
    }
  } else {
    form.value.statusDate = ''
  }

  isEditModalOpen.value = true
}

async function updateContract() {
  if (!form.value.type || !form.value.status) {
    alert('Заполните тип и статус')
    return
  }
  try {
    await $fetch(`/api/objects/contract/${contract.value.id}`, {
      method: 'PUT',
      body: {
        type: form.value.type,
        status: form.value.status,
        statusDate: form.value.statusDate || null,
        comment: form.value.comment || null
      }
    })
    isEditModalOpen.value = false
    emit('refresh')
  } catch (error) {
    alert('Не удалось обновить договор')
  }
}

// --- Удаление ---
function confirmDelete() {
  if (window.confirm('Удалить этот договор?')) {
    deleteContract()
  }
}

async function deleteContract() {
  try {
    await $fetch(`/api/objects/contract/${contract.value.id}`, {
      method: 'DELETE',
      credentials: 'include'
    })
    emit('refresh')
  } catch (error) {
    alert('Не удалось удалить договор')
  }
}
</script>

<style lang="scss" scoped>
// --- Общее ---
.empty-state {
  padding: 1rem;
  text-align: center;
  color: $color-muted;
  font-style: italic;
}

.contract-info {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  font-size: 0.95rem;

  p {
    margin: 0;
  }
}

// --- Бейджи статусов ---
.badge {
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 500;
  display: inline-block;

  &.status-prepared { background: #fff3e0; color: #ef6c00; }
  &.status-sent { background: #e3f2fd; color: #1565c0; }
  &.status-awaiting { background: #ffecb3; color: #ff8f00; }
  &.status-signed { background: #c8e6c9; color: #1b5e20; }
  &.status-cancelled { background: #ffebee; color: #c62828; }
}

// --- Действия (в футере Card) ---
.contract-actions {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  flex-wrap: wrap;

  .btn {
    white-space: nowrap;
  }
}

// --- Модальные формы ---
.modal-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-row {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;

  .flex-1 {
    flex: 1 1 200px;
  }
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;

  label {
    font-weight: 500;
    color: $text-dark;
    font-size: 0.95rem;
  }

  .form-select,
  .form-input {
    padding: 0.6rem 0.8rem;
    border: 1px solid $border-color;
    border-radius: $border-radius;
    background: white;
    font-size: 0.95rem;
    transition: $transition;

    &:focus {
      outline: none;
      border-color: $blue;
      box-shadow: 0 0 0 2px rgba($blue, 0.1);
    }
  }

  .form-select {
    appearance: none;
    background-image: url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23{$text-gray}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 0.8rem center;
    background-size: 1rem;
    padding-right: 2.2rem;
  }

  textarea.form-input {
    resize: vertical;
    min-height: 80px;
  }
}

// --- Футер модального окна ---
.modal-footer-controls {
  width: 100%;
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 0.5rem;

  .btn {
    padding: 0.45rem 0.9rem;
    font-size: 0.95rem;
    font-weight: 500;
    border-radius: $border-radius;

    &.btn-secondary {
      background: $sub-item-bg;
      color: $text-dark;

      &:hover {
        background: $color-muted;
      }
    }

    &.btn-primary {
      background: $blue;
      color: white;

      &:hover {
        background: $color-muted;
      }
    }
  }
}

// --- Адаптивность ---
@media (max-width: 600px) {
  .form-row {
    flex-direction: column;
    gap: 1rem;
  }

  .contract-actions {
    justify-content: flex-start;
  }

  .modal-footer-controls {
    flex-direction: row;
    justify-content: flex-end;
  }
}

// --- Плавное появление ---
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.card :deep(.card-body),
.card :deep(.card-header) {
  animation: fadeIn 0.3s ease forwards;
}
</style>
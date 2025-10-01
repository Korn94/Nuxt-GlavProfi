<!-- app/components/pages/cabinet/objects/EditModal.vue -->
<template>
  <PagesCabinetUiModal
    :visible="modelValue"
    @update:visible="$emit('update:modelValue', false)"
    title="Редактирование объекта"
    size="lg"
    closable
  >
    <!-- Форма редактирования -->
    <form @submit.prevent="handleSubmit" class="edit-object-form">
      <div class="form-group">
        <label>Название</label>
        <input v-model="form.name" type="text" class="form-input" required />
      </div>

      <div class="form-group">
        <label>Адрес</label>
        <textarea v-model="form.address" class="form-input" rows="2"></textarea>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Дата начала</label>
          <input v-model="form.startDate" type="date" class="form-input" />
        </div>
        <div class="form-group">
          <label>Плановая дата завершения</label>
          <input v-model="form.plannedEndDate" type="date" class="form-input" />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Фактическая дата завершения</label>
          <input v-model="form.completedDate" type="date" class="form-input" />
        </div>
        <div class="form-group">
          <label>Источник</label>
          <select v-model="form.source" class="form-select">
            <option value="">— Не указан —</option>
            <option value="Avito">Avito</option>
            <option value="Сарафанка">Сарафанка</option>
            <option value="Сайт">Сайт</option>
            <option value="Сайт + Директ">Сайт + Директ</option>
            <option value="Вновь обратившийся">Вновь обратившийся</option>
            <option value="Прочее">Прочее</option>
          </select>
        </div>
      </div>

      <!-- Тип договора (вместо documentType) -->
      <div class="form-group">
        <label>Тип договора</label>
        <select v-model="form.contractType" class="form-select">
          <option value="unassigned">— Не выбрано —</option>
          <option value="none">Не нужен</option>
          <option value="edo">ЭДО</option>
          <option value="paper">Бумажный</option>
          <option value="invoice">Счёт-договор</option>
        </select>
      </div>

      <div class="form-group">
        <label>Комментарий</label>
        <textarea v-model="form.comment" class="form-input" rows="3"></textarea>
      </div>

      <!-- Назначение прораба -->
      <div class="form-group">
        <label>Прораб</label>
        <select v-model="form.foremanId" class="form-select">
          <option :value="null">— Не выбран —</option>
          <option v-for="foreman in foremans" :key="foreman.id" :value="foreman.id">
            {{ foreman.name }}
          </option>
        </select>
      </div>
    </form>

    <!-- Кнопки управления -->
    <template #footer>
      <div class="modal-footer-controls">
        <!-- Статус и действия -->
        <div class="status-actions">
          <button
            v-if="object.status === 'active'"
            type="button"
            @click="confirmComplete"
            class="btn btn-warning btn-sm"
          >
            Завершить
          </button>
          <button
            v-else
            type="button"
            @click="toggleStatus"
            class="btn btn-success btn-sm"
          >
            Возобновить
          </button>

          <button
            type="button"
            @click="confirmDelete"
            class="btn btn-danger btn-sm"
          >
            Удалить
          </button>
        </div>

        <!-- Сохранить / Отмена -->
        <div class="form-actions">
          <button type="button" @click="$emit('update:modelValue', false)" class="btn btn-secondary">
            Отмена
          </button>
          <button type="submit" @click="handleSubmit" class="btn btn-primary">
            Сохранить изменения
          </button>
        </div>
      </div>
    </template>
  </PagesCabinetUiModal>
</template>

<script setup>
import { ref, watch, defineProps, defineEmits } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({
  modelValue: Boolean,
  object: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update:modelValue', 'updated', 'completed', 'deleted'])

const router = useRouter()

// Локальная форма
const form = ref({ ...props.object })

// Все прорабы
const foremans = ref([])

// Загружаем прорабов при открытии модалки
watch(
  () => props.modelValue,
  async (visible) => {
    if (visible) {
      try {
        const data = await $fetch('/api/contractors/foremans')
        foremans.value = data
      } catch (error) {
        console.error('Ошибка загрузки прорабов:', error)
        foremans.value = []
      }
    }
  },
  { immediate: false }
)

// При изменении объекта — обновляем форму
watch(
  () => props.object,
  (newObj) => {
    Object.assign(form.value, { ...newObj })
  },
  { deep: true }
)

// --- Методы ---

async function handleSubmit() {
  try {
    const updated = await $fetch(`/api/objects/${props.object.id}`, {
      method: 'PUT',
      body: form.value,
      credentials: 'include'
    })

    emit('updated', updated)
    emit('update:modelValue', false)
  } catch (error) {
    console.error('Ошибка сохранения:', error)
    alert('Не удалось сохранить изменения')
  }
}

async function toggleStatus() {
  const newStatus = props.object.status === 'active' ? 'completed' : 'active'
  try {
    const updated = await $fetch(`/api/objects/${props.object.id}`, {
      method: 'PUT',
      body: { status: newStatus },
      credentials: 'include'
    })

    emit('updated', updated)
    emit('completed', updated)
  } catch (error) {
    console.error('Ошибка изменения статуса:', error)
    alert('Не удалось изменить статус')
  }
}

function confirmComplete() {
  const confirmed = window.confirm('Вы уверены, что хотите завершить этот объект?')
  if (confirmed) toggleStatus()
}

function confirmDelete() {
  const confirmed = window.confirm(
    'Вы уверены, что хотите удалить этот объект?\n\n' +
    'Это действие нельзя отменить. Все данные будут потеряны.'
  )
  if (confirmed) deleteObject()
}

async function deleteObject() {
  try {
    await $fetch(`/api/objects/${props.object.id}`, {
      method: 'DELETE',
      credentials: 'include'
    })

    emit('deleted', props.object.id)
    emit('update:modelValue', false)
    router.push('/cabinet/objects')
  } catch (error) {
    console.error('Ошибка удаления:', error)
    alert('Не удалось удалить объект')
  }
}
</script>

<style lang="scss" scoped>
.edit-object-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding: 0.5rem 0;
}

.form-row {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;

  .form-group {
    flex: 1 1 200px;
    min-width: 200px;
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

  .form-input,
  .form-select {
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

    &::placeholder {
      color: $color-muted;
      opacity: 0.7;
    }
  }

  .form-select {
    appearance: none;
    background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23{$text-gray}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
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

// --- Футер модалки ---
.modal-footer-controls {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.status-actions {
  display: flex;
  gap: 0.75rem;
  align-items: center;

  @media (max-width: 500px) {
    width: 100%;
    justify-content: center;
  }
}

.form-actions {
  display: flex;
  gap: 0.75rem;

  @media (max-width: 500px) {
    width: 100%;
    justify-content: center;
  }
}

.btn {
  padding: 0.45rem 0.9rem;
  border: none;
  border-radius: $border-radius;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: $transition;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &.btn-secondary {
    background: $sub-item-bg;
    color: $text-dark;

    &:hover:not(:disabled) {
      background: $color-muted;
    }
  }

  &.btn-primary {
    background: $blue;
    color: white;

    &:hover:not(:disabled) {
      background: $color-muted;
    }
  }

  &.btn-warning {
    background: $yellow;
    color: white;

    &:hover:not(:disabled) {
      background: $color-muted;
    }
  }

  &.btn-success {
    background: $green;
    color: white;

    &:hover:not(:disabled) {
      background: $color-muted;
    }
  }

  &.btn-danger {
    background: $red;
    color: white;

    &:hover:not(:disabled) {
      background: $color-muted;
    }
  }

  // Размеры
  &.btn-sm {
    padding: 0.35rem 0.7rem;
    font-size: 0.85rem;
  }
}

// --- Адаптивность ---
@media (max-width: 768px) {
  .edit-object-form {
    gap: 1rem;
    padding: 0 0.5rem;
  }

  .form-row {
    flex-direction: column;
    gap: 1rem;
  }

  .form-group {
    min-width: auto;
  }

  .modal-footer-controls {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }

  .status-actions,
  .form-actions {
    justify-content: center;
  }
}

// --- Плавная анимация появления формы ---
.edit-object-form {
  opacity: 0;
  transform: translateY(10px);
  animation: fadeInUp 0.3s ease forwards;
}

@keyframes fadeInUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
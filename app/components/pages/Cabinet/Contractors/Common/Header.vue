<template>
  <div class="contractor-header block">
    <h3>Данные контрагента</h3>

    <!-- Режим просмотра -->
    <div class="view-mode">
      <p><strong>Имя:</strong> {{ contractor.name }}</p>
      <p><strong>Телефон:</strong> {{ contractor.phone }}</p>
      <p><strong>Баланс:</strong> {{ contractor.balance }} ₽</p>
      <p><strong>Ожидает оплаты:</strong> {{ pendingTotal }} ₽</p>
      <p><strong>На зарплате:</strong> {{ contractor.isOnSalary ? 'Да' : 'Нет' }}</p>
      <p><strong>Зарплата:</strong> {{ contractor.salaryAmount }} ₽</p>
      <p><strong>День выплаты:</strong> {{ contractor.salaryDay }}</p>
      <p v-if="contractor.comment"><strong>Комментарий:</strong> {{ contractor.comment }}</p>
      <p v-else><strong>Комментарий:</strong> —</p>

      <button @click="openEditModal" class="btn secondary">Редактировать</button>
    </div>

    <!-- Уведомления -->
    <div v-if="successMessage" class="notification success">{{ successMessage }}</div>
    <div v-if="errorMessage" class="notification error">{{ errorMessage }}</div>

    <!-- Модальное окно редактирования -->
    <div v-if="showModal" class="modal-overlay" @click="closeModal">
      <div class="modal" @click.stop>
        <h4>Редактировать контрагента</h4>

        <div class="form-fields">
          <!-- Имя -->
          <div class="form-group">
            <label>Имя <span class="required">*</span></label>
            <input v-model="editedContractor.name" :class="{ error: formErrors.name }" />
            <div v-if="formErrors.name" class="error-message">{{ formErrors.name }}</div>
          </div>

          <!-- Телефон -->
          <div class="form-group">
            <label>Телефон</label>
            <input v-model="editedContractor.phone" :class="{ error: formErrors.phone }" />
            <div v-if="formErrors.phone" class="error-message">{{ formErrors.phone }}</div>
          </div>

          <!-- Зарплата -->
          <div class="form-group">
            <label>Зарплата</label>
            <input v-model.number="editedContractor.salaryAmount" type="number" step="0.01" />
          </div>

          <!-- На зарплате -->
          <div class="form-group">
            <label>На зарплате</label>
            <select v-model="editedContractor.isOnSalary">
              <option :value="true">Да</option>
              <option :value="false">Нет</option>
            </select>
          </div>

          <!-- День выплаты -->
          <div class="form-group">
            <label>День выплаты</label>
            <select v-model.number="editedContractor.salaryDay">
              <option v-for="day in 31" :key="day" :value="day">{{ day }}</option>
            </select>
          </div>

          <!-- Комментарий -->
          <div class="form-group">
            <label>Комментарий</label>
            <textarea v-model="editedContractor.comment"></textarea>
          </div>

          <!-- Пароль (только если есть привязанный пользователь) -->
          <div v-if="contractor.userId" class="form-group">
            <label>Новый пароль (оставьте пустым, чтобы не менять)</label>
            <input v-model="editedContractor.password" type="password" placeholder="Новый пароль" />
            <div v-if="formErrors.password" class="error-message">{{ formErrors.password }}</div>
          </div>
        </div>

        <!-- Кнопки -->
        <div class="modal-actions">
          <button @click="saveChanges" class="btn primary">Сохранить</button>
          <button @click="closeModal" class="btn secondary">Отмена</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useNuxtApp } from '#app'

const props = defineProps({
  contractor: {
    type: Object,
    required: true
  },
  contractorType: {
    type: String,
    required: true,
    validator: value => ['master', 'worker', 'foreman', 'office'].includes(value)
  },
  pendingTotal: {
    type: Number,
    required: true
  }
})

const emit = defineEmits(['update:contractor', 'error', 'success'])

const $fetch = globalThis.$fetch

// Состояние модального окна
const showModal = ref(false)
const editedContractor = ref({})
const formErrors = ref({})
const errorMessage = ref(null)
const successMessage = ref(null)

// При изменении контрактора — синхронизируем данные
watch(
  () => props.contractor,
  () => {
    resetForm()
  },
  { immediate: true, deep: true }
)

function resetForm() {
  editedContractor.value = {
    ...props.contractor,
    password: '' // Не сохраняем пароль
  }
  formErrors.value = {}
  errorMessage.value = null
  successMessage.value = null
}

function validateForm() {
  formErrors.value = {}

  if (!editedContractor.value.name?.trim()) {
    formErrors.value.name = 'Имя обязательно'
  }

  return Object.keys(formErrors.value).length === 0
}

async function saveChanges() {
  if (!validateForm()) return

  try {
    // У нас есть contractor.userId — это и есть ID в таблице users
    const userId = props.contractor.userId
    if (!userId) {
      throw new Error('У контрагента нет привязанного пользователя')
    }

    const body = {
      // Поля для обновления в таблице `users`
      name: editedContractor.value.name,
      phone: editedContractor.value.phone, // ← если phone есть в users (иначе уберите)
      ...(editedContractor.value.password && { password: editedContractor.value.password }),

      // Поля для обновления в связанном контрагенте (offices)
      contractorUpdates: {
        comment: editedContractor.value.comment,
        isOnSalary: editedContractor.value.isOnSalary,
        salaryAmount: editedContractor.value.salaryAmount,
        salaryDay: editedContractor.value.salaryDay,
        // Не отправляем name и phone сюда — они в users
      }
    }

    // Отправляем на /api/users/:id — он обновит и users, и offices
    const response = await $fetch(`/api/users/${userId}`, {
      method: 'PUT',
      body,
      credentials: 'include'
    })

    // Форматируем обновлённые данные
    const updatedContractor = {
      ...props.contractor,
      name: response.name,
      phone: response.phone,
      comment: response.contractorUpdates?.comment ?? response.comment,
      isOnSalary: response.contractorUpdates?.isOnSalary ?? response.isOnSalary,
      salaryAmount: parseFloat(response.contractorUpdates?.salaryAmount) || 0,
      salaryDay: response.contractorUpdates?.salaryDay ?? response.salaryDay
      // balance остаётся без изменений
    }

    emit('update:contractor', updatedContractor)
    showModal.value = false
    successMessage.value = 'Данные успешно обновлены'
    setTimeout(() => (successMessage.value = null), 3000)
  } catch (error) {
    console.error('Ошибка при сохранении:', error)
    errorMessage.value = error.message || 'Не удалось сохранить изменения'
    setTimeout(() => (errorMessage.value = null), 5000)
    emit('error', 'Не удалось сохранить данные')
  }
}

function openEditModal() {
  resetForm()
  showModal.value = true
}

function closeModal() {
  showModal.value = false
}
</script>

<style lang="scss" scoped>
.contractor-header {
  margin-bottom: 2rem;

  .view-mode {
    p {
      margin: 0.5rem 0;
      line-height: 1.5;
    }

    .btn {
      margin-top: 1rem;
      padding: 0.6rem 1.2rem;
      border-radius: 4px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;

      &.secondary {
        background: #6c757d;
        color: white;
        border: none;
      }
    }
  }

  .notification {
    margin-top: 1rem;
    padding: 0.8rem 1rem;
    border-radius: 4px;
    font-size: 0.95rem;

    &.success {
      background: #d4edda;
      color: #155724;
      border-left: 4px solid #c3e6cb;
    }

    &.error {
      background: #f8d7da;
      color: #721c24;
      border-left: 4px solid #f5c6cb;
    }
  }
}

// Модальное окно
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;

  .modal {
    background: white;
    padding: 2rem;
    border-radius: 8px;
    max-width: 500px;
    width: 100%;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);

    h4 {
      margin-top: 0;
      margin-bottom: 1.5rem;
      color: #333;
      font-size: 1.25rem;
    }

    .form-fields {
      .form-group {
        margin-bottom: 1.5rem;

        label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
          font-size: 0.95rem;

          .required {
            color: #dc3545;
          }
        }

        input,
        select,
        textarea {
          width: 100%;
          padding: 0.6rem 0.8rem;
          border: 1px solid #ced4da;
          border-radius: 4px;
          font-size: 0.95rem;
          transition: border-color 0.2s ease;

          &.error {
            border-color: #dc3545;
          }
        }

        textarea {
          resize: vertical;
          min-height: 80px;
        }

        .error-message {
          color: #dc3545;
          font-size: 0.85rem;
          margin-top: 0.25rem;
        }
      }
    }

    .modal-actions {
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
      margin-top: 1.5rem;

      .btn {
        padding: 0.6rem 1.2rem;
        border-radius: 4px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;

        &.primary {
          background: #007bff;
          color: white;
          border: none;

          &:hover {
            background: #0069d9;
          }
        }

        &.secondary {
          background: #6c757d;
          color: white;
          border: none;

          &:hover {
            background: #5a6268;
          }
        }
      }
    }
  }
}
</style>
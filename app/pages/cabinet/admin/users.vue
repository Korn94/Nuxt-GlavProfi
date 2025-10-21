<!-- app\components\pages\cabinet\UserManagement.vue -->
<template>
  <PagesCabinetUiLayoutPageTitle title="Управление пользователями">
    <template #actions>
      <button class="btn btn-primary" @click="openAddModal">
        <Icon name="mdi:plus" size="16" />
        Новый
      </button>
    </template>
  </PagesCabinetUiLayoutPageTitle>

  <div class="container">
    <!-- Таблица пользователей -->
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Имя</th>
          <th>Роль</th>
          <th>Контрагент</th>
          <th>Баланс</th>
          <th>Действия</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="user in users" :key="user.id">
          <td>{{ user.id }}</td>
          <td>{{ user.name }}</td>
          <td>{{ user.role }}</td>
          <td>
            <div v-if="user.contractorType && user.contractorId">
              <NuxtLink :to="`/cabinet/admin/contractors/${user.contractorType}/${user.contractorId}`">
                {{ formatContractorName(user) }}
              </NuxtLink>
            </div>
            <div v-else>—</div>
          </td>
          <td>{{ getContractorBalanceText(user) }}</td>
          <td>
            <button @click="editUser(user)">Редактировать</button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Универсальное модальное окно -->
    <PagesCabinetUiModal
      :visible="isModalOpen"
      @close="closeModal"
      :title="isEditing ? 'Редактировать пользователя' : 'Добавить нового пользователя'"
      size="md"
      :closable="true"
    >
      <!-- Контент формы -->
      <div class="modal-content">
        <!-- Имя -->
        <div class="form-group">
          <label>Имя <span class="required">*</span></label>
          <input
            v-model="currentForm.name"
            placeholder="Введите имя"
            :class="{ error: formErrors.name }"
          />
          <span v-if="formErrors.name" class="error-message">{{ formErrors.name }}</span>
        </div>

        <!-- Логин -->
        <div class="form-group">
          <label>Логин <span class="required">*</span></label>
          <input
            v-model="currentForm.login"
            placeholder="Введите логин"
            :class="{ error: formErrors.login }"
          />
          <span v-if="formErrors.login" class="error-message">{{ formErrors.login }}</span>
        </div>

        <!-- Пароль (только при добавлении или если editPassword) -->
        <div v-if="!isEditing || editPassword" class="form-group">
          <label>Пароль</label>
          <input
            v-model="currentForm.password"
            type="password"
            :placeholder="isEditing ? 'Оставьте пустым, чтобы не менять' : 'Введите пароль'"
          />
          <span v-if="formErrors.password" class="error-message">{{ formErrors.password }}</span>
        </div>

        <!-- Роль -->
        <div class="form-group">
          <label>Роль</label>
          <select v-model="currentForm.role">
            <option value="admin">Админ</option>
            <option value="manager">Менеджер</option>
            <option value="foreman">Прораб</option>
            <option value="worker">Рабочий</option>
            <option value="master">Мастер</option>
          </select>
        </div>

        <!-- Привязка к контрагенту (только при редактировании) -->
        <div v-if="isEditing">
          <div class="form-group">
            <label>Тип контрагента</label>
            <select v-model="currentForm.contractorType">
              <option value="">Без привязки</option>
              <option value="master">Мастер</option>
              <option value="worker">Рабочий</option>
              <option value="foreman">Прораб</option>
              <option value="office">Офис</option>
            </select>
          </div>

          <div v-if="currentForm.contractorType" class="form-group">
            <label>Контрагент</label>
            <select v-model="currentForm.contractorId">
              <option value="">— Выберите —</option>
              <option v-for="c in contractorsByType" :key="c.id" :value="c.id">
                {{ c.name }}
              </option>
            </select>
          </div>
        </div>

        <!-- Ошибка формы -->
        <div v-if="formErrors.general" class="error-message form-error">
          {{ formErrors.general }}
        </div>
      </div>

      <!-- Футер -->
      <template #footer>
        <button type="button" @click="closeModal" class="btn btn-secondary">Отмена</button>
        <button type="button" @click="submitForm" class="btn btn-primary">
          {{ isEditing ? 'Сохранить' : 'Добавить' }}
        </button>
      </template>
    </PagesCabinetUiModal>

    <!-- Сообщения -->
    <div v-if="successMessage" class="notification success">{{ successMessage }}</div>
    <div v-if="errorMessage" class="notification error">{{ errorMessage }}</div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

// Данные
const users = ref([])
const contractors = ref([])

// Форма
const currentForm = ref({
  id: null,
  name: '',
  login: '',
  password: '',
  role: 'worker',
  contractorType: '',
  contractorId: '',
})

const isModalOpen = ref(false)
const isEditing = ref(false)
const editPassword = ref(false)

// Сообщения
const formErrors = ref({})
const successMessage = ref('')
const errorMessage = ref('')

// Вычисляем контрагентов по типу
const contractorsByType = computed(() => {
  if (!currentForm.value.contractorType) return []
  return contractors.value.filter(c => c.type === currentForm.value.contractorType)
})

definePageMeta({
  layout: 'cabinet',
  middleware: 'role',
  allowedRoles: ['admin'],
})

onMounted(async () => {
  await fetchUsers()
  await fetchContractors()
})

// Загрузка данных
async function fetchUsers() {
  try {
    const data = await $fetch('/api/users', { credentials: 'include' })
    users.value = Array.isArray(data.users) ? data.users : []
    clearMessages()
  } catch (e) {
    errorMessage.value = 'Ошибка загрузки пользователей'
  }
}

async function fetchContractors() {
  try {
    const data = await $fetch('/api/contractors', { credentials: 'include' })
    contractors.value = Array.isArray(data) ? data : []
  } catch (e) {
    console.error('Ошибка загрузки контрагентов:', e)
  }
}

// Открытие модального окна
function openAddModal() {
  currentForm.value = {
    id: null,
    name: '',
    login: '',
    password: '',
    role: 'worker',
    contractorType: '',
    contractorId: '',
  }
  isEditing.value = false
  editPassword.value = false
  formErrors.value = {}
  isModalOpen.value = true
}

// Редактирование
function editUser(user) {
  currentForm.value = { ...user }
  isEditing.value = true
  editPassword.value = false
  formErrors.value = {}
  isModalOpen.value = true
}

// Закрытие
function closeModal() {
  isModalOpen.value = false
  formErrors.value = {}
}

// Валидация
function validateForm() {
  formErrors.value = {}
  let valid = true

  if (!currentForm.value.name?.trim()) {
    formErrors.value.name = 'Имя обязательно'
    valid = false
  }
  if (!currentForm.value.login?.trim()) {
    formErrors.value.login = 'Логин обязателен'
    valid = false
  }
  if (!isEditing.value && !currentForm.value.password?.trim()) {
    formErrors.value.password = 'Пароль обязателен'
    valid = false
  }

  return valid
}

// Отправка формы
async function submitForm() {
  if (!validateForm()) return

  const payload = {
    name: currentForm.value.name,
    login: currentForm.value.login,
    role: currentForm.value.role,
    ...(currentForm.value.password && { password: currentForm.value.password }),
    ...(currentForm.value.contractorType && { contractorType: currentForm.value.contractorType }),
    ...(currentForm.value.contractorId && { contractorId: currentForm.value.contractorId }),
  }

  try {
    if (isEditing.value) {
      // Редактирование
      await $fetch(`/api/users/${currentForm.value.id}`, {
        method: 'PUT',
        body: payload,
        credentials: 'include',
      })
      successMessage.value = 'Пользователь обновлён'
    } else {
      // Создание
      await $fetch('/api/users', {
        method: 'POST',
        body: payload,
        credentials: 'include',
      })
      successMessage.value = 'Пользователь добавлен'
    }

    await fetchUsers()
    closeModal()
  } catch (e) {
    if (e.data?.message?.includes('логин')) {
      formErrors.value.login = 'Этот логин уже занят'
    } else {
      formErrors.value.general = 'Не удалось сохранить'
    }
  }
}

// Форматирование имени контрагента
function formatContractorName(user) {
  const map = { master: 'Мастер', worker: 'Рабочий', foreman: 'Прораб', office: 'Офис' }
  return map[user.contractorType] || user.contractorType || ''
}

// Баланс контрагента
function getContractorBalanceText(user) {
  if (!user.contractorType || !user.contractorId) return '—'
  const c = contractors.value.find(
    item => item.type === user.contractorType && item.id === user.contractorId
  )
  return c ? `${Number(c.balance).toFixed(2)} ₽` : 'Не найден'
}

// Очистка сообщений
function clearMessages() {
  successMessage.value = ''
  errorMessage.value = ''
}

useHead({
  meta: [
    { name: 'robots', content: 'noindex, nofollow' },
  ],
  title: 'CRM — Пользователи CRM-системой'
})
</script>

<style lang="scss" scoped>
@use 'sass:map';

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem;

  table {
    width: 100%;
    border-collapse: collapse;
    background: #fff;
    border-radius: $border-radius;
    overflow: hidden;
    box-shadow: $box-shadow;
    margin-bottom: 1.5rem;

    thead {
      background: $blue20;
      color: $text-dark;

      th {
        padding: 1rem;
        text-align: left;
        font-weight: 600;
        font-size: 0.9rem;
        text-transform: uppercase;
        color: $text-dark;
      }
    }

    tbody tr {
      border-bottom: 1px solid $border-color;

      &:nth-child(even) {
        background: $sub-item-bg;
      }

      &:hover {
        background: $blue20;
      }

      td {
        padding: 1rem;
        vertical-align: middle;

        .nuxt-link {
          color: $blue;
          text-decoration: none;
          font-weight: 500;

          &:hover {
            text-decoration: underline;
          }
        }
      }
    }
  }

  button {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: $border-radius;
    cursor: pointer;
    font-weight: 500;
    transition: $transition;

    &:focus {
      outline: 2px solid $blue;
      outline-offset: 2px;
    }
  }

  .btn-primary {
    background: $blue;
    color: $text-light;

    &:hover:not(:disabled) {
      background: $blue;
    }
  }

  .btn-secondary {
    background: $color-muted;
    color: $text-light;

    &:hover {
      background: $blue;
    }
  }
}

// Стили внутри модального окна
.modal-content {
  .form-group {
    margin-bottom: 1rem;
  }

  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: $text-dark;
  }

  input,
  select {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid $border-color;
    border-radius: $border-radius;
    background: $background-light;
    transition: $transition;

    &:focus {
      outline: none;
      border-color: $blue;
      box-shadow: 0 0 0 2px $blue20;
    }

    &.error {
      border-color: $red;
      background: rgba($red, 0.05);
    }
  }

  select {
    cursor: pointer;
  }

  .required {
    color: $red;
  }

  .error-message {
    color: $color-danger;
    font-size: 0.875rem;
    margin-top: 0.25rem;

    &.form-error {
      padding: 0.75rem;
      background: rgba($color-danger, 0.1);
      border: 1px solid rgba($color-danger, 0.2);
      border-radius: $border-radius;
      margin-top: 1rem;
    }
  }
}

.notification {
  padding: 0.75rem 1rem;
  border-radius: $border-radius;
  font-size: 0.9rem;
  font-weight: 500;
  margin: 1rem 0;

  &.success {
    background: rgba($green, 0.15);
    color: $green;
    border: 1px solid rgba($green, 0.3);
  }

  &.error {
    background: rgba($red, 0.15);
    color: $red;
    border: 1px solid rgba($red, 0.3);
  }
}
</style>
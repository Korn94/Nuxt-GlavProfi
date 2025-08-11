<template>
  <div class="container">
    <h1>Управление пользователями</h1>

    <!-- Таблица пользователей -->
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Имя</th>
          <!-- <th>Логин</th> -->
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
          <td>
            <div v-if="user.contractorType && user.contractorId">
              <NuxtLink :to="`/cabinet/admin/contractors/${user.contractorType}/${user.contractorId}`">
                {{ formatContractorName(user) }}
              </NuxtLink>
            </div>
            <div v-else>
              —
            </div>
          </td>
          <td>{{ user.role }}</td>
          <td>
            {{ getContractorBalanceText(user) }}
          </td>
          <td>
            <button @click="editUser(user)">Редактировать</button>
            <!-- <button @click="deleteUser(user.id)">Удалить</button> -->
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Единое модальное окно для добавления/редактирования -->
    <div v-if="isModalOpen" class="modal">
      <div class="modal-content">
        <h2>{{ isEditing ? 'Редактировать пользователя' : 'Добавить нового пользователя' }}</h2>

        <input v-model="currentForm.name" placeholder="Имя" :class="{ error: formErrors.name }" />
        <span v-if="formErrors.name" class="error-message">{{ formErrors.name }}</span>

        <input v-model="currentForm.login" placeholder="Логин" :class="{ error: formErrors.login }" />
        <span v-if="formErrors.login" class="error-message">{{ formErrors.login }}</span>

        <input v-if="!isEditing || editPassword"
               v-model="currentForm.password"
               type="password"
               placeholder="Пароль (оставьте пустым, чтобы не менять)"
               :class="{ error: formErrors.password }" />
        <span v-if="formErrors.password" class="error-message">{{ formErrors.password }}</span>

        <select v-model="currentForm.role">
          <option value="admin">Админ</option>
          <option value="manager">Менеджер</option>
          <option value="foreman">Прораб</option>
          <option value="worker">Рабочий</option>
          <option value="master">Мастер</option>
        </select>

        <!-- Поля для контрагента только при редактировании -->
        <div v-if="isEditing">
          <label for="contractorType">Тип контрагента:</label>
          <select v-model="currentForm.contractorType" id="contractorType">
            <option value="">Без привязки</option>
            <option value="master">Мастер</option>
            <option value="worker">Рабочий</option>
            <option value="foreman">Прораб</option>
            <option value="office">Офис</option>
          </select>

          <div v-if="currentForm.contractorType">
            <label :for="`contractorId-${currentForm.contractorType}`">Выберите {{ currentForm.contractorType }}:</label>
            <select v-model="currentForm.contractorId" :id="`contractorId-${currentForm.contractorType}`">
              <option value="">— Выберите имя —</option>
              <option v-for="contractor in contractorsByType" :key="contractor.id" :value="contractor.id">
                {{ contractor.name }}
              </option>
            </select>
          </div>
        </div>

        <button @click="submitForm">{{ isEditing ? 'Сохранить' : 'Добавить' }}</button>
        <button @click="closeModal" class="btn-cancel">Отмена</button>

        <div v-if="formErrors.general" class="error-message">{{ formErrors.general }}</div>
      </div>
    </div>

    <!-- Кнопка открытия модала добавления -->
    <button @click="openAddModal" class="btn-add">Добавить пользователя</button>

    <!-- Сообщения -->
    <div v-if="successMessage" class="success-message">{{ successMessage }}</div>
    <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

// Список пользователей и контрагентов
const users = ref([])
const contractors = ref([])

// Форма пользователя (для добавления/редактирования)
const currentForm = ref({
  id: null,
  name: '',
  login: '',
  password: '',
  role: 'worker',
  contractorType: '',
  contractorId: ''
})

const isModalOpen = ref(false)
const isEditing = ref(false)
const editPassword = ref(false) // Показать/скрыть поле пароля при редактировании

// Сообщения
const formErrors = ref({})
const successMessage = ref('')
const errorMessage = ref('')

// Фильтр контрагентов по выбранному типу
const contractorsByType = computed(() => {
  if (!currentForm.value.contractorType) return []
  return contractors.value.filter(c => c.type === currentForm.value.contractorType)
})

definePageMeta({
  layout: "cabinet",
  middleware: 'role',
  allowedRoles: ['admin']
})

onMounted(async () => {
  await fetchUsers()
  await fetchContractors()
})

// Получить список пользователей
async function fetchUsers() {
  try {
    const response = await fetch('/api/users', {
      method: 'GET',
      credentials: 'include'
    })
    if (!response.ok) throw new Error('Ошибка загрузки пользователей')
    const data = await response.json()
    users.value = data.users || []
    clearMessages()
  } catch (error) {
    errorMessage.value = 'Ошибка при загрузке пользователей.'
    console.error(error)
  }
}

// Получить список контрагентов
async function fetchContractors() {
  try {
    const data = await $fetch('/api/contractors', {
      method: 'GET',
      credentials: 'include'
    })
    contractors.value = data
  } catch (error) {
    console.error('Ошибка загрузки контрагентов:', error)
  }
}

// Открытие формы добавления
function openAddModal() {
  currentForm.value = {
    id: null,
    name: '',
    login: '',
    password: '',
    role: 'worker',
    contractorType: '',
    contractorId: ''
  }
  isEditing.value = false
  editPassword.value = false
  formErrors.value = {}
  isModalOpen.value = true
}

// Редактирование пользователя
function editUser(user) {
  currentForm.value = { ...user }
  isEditing.value = true
  editPassword.value = false
  formErrors.value = {}
  isModalOpen.value = true
}

// Закрытие модала
function closeModal() {
  isModalOpen.value = false
  formErrors.value = {}
}

// Валидация формы
function validateForm() {
  formErrors.value = {}
  if (!currentForm.value.name) formErrors.value.name = 'Имя обязательно'
  if (!currentForm.value.login) formErrors.value.login = 'Логин обязателен'
  if (!isEditing.value && !currentForm.value.password) formErrors.value.password = 'Пароль обязателен'
  return Object.keys(formErrors.value).length === 0
}

// Сохранение пользователя
async function submitForm() {
  if (!validateForm()) return

  const body = { ...currentForm.value }

  // Подготовка данных для отправки
  const payload = {
    name: body.name,
    login: body.login,
    role: body.role,
    ...(body.password && { password: body.password }),
    ...(body.contractorType && { contractorType: body.contractorType }),
    ...(body.contractorId && { contractorId: body.contractorId })
  }

  if (!isEditing.value) {
    // Добавление нового пользователя
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        credentials: 'include'
      })

      if (!res.ok) {
        const errData = await res.json()
        if (errData.message.includes('логин')) {
          formErrors.value.login = 'Этот логин уже занят'
        } else {
          throw new Error(errData.message || 'Ошибка добавления')
        }
      } else {
        successMessage.value = 'Пользователь добавлен!'
        await fetchUsers()
        closeModal()
      }
    } catch (e) {
      errorMessage.value = e.message || 'Ошибка при добавлении'
    }
  } else {
    // Редактирование существующего пользователя
    try {
      const res = await $fetch(`/api/users/${body.id}`, {
        method: 'PUT',
        body: payload,
        credentials: 'include'
      })

      if (res?.id) {
        successMessage.value = 'Пользователь обновлён'

        await fetchUsers()
        closeModal()
      }
    } catch (e) {
      console.error(e)
      formErrors.value.general = 'Не удалось сохранить изменения'
    }
  }
}

// Удаление пользователя
function deleteUser(id) {
  if (!confirm('Вы уверены, что хотите удалить этого пользователя?')) return
  fetch(`/api/users/${id}`, {
    method: 'DELETE',
    credentials: 'include'
  }).then(() => {
    successMessage.value = 'Пользователь удалён'
    fetchUsers()
  }).catch(() => {
    errorMessage.value = 'Ошибка удаления'
  })
}

// Для отображения типа и ID контрагента
function formatContractorName(user) {
  if (!user.contractorType || !user.contractorId) return '—'

  const typeMap = {
    master: 'Мастер',
    worker: 'Рабочий',
    foreman: 'Прораб',
    office: 'Офис'
  }

  const typeName = typeMap[user.contractorType] || user.contractorType

  return `${typeName}`
}

// Форматирование баланса
function getContractorBalanceText(user) {
  if (!user.contractorType || !user.contractorId) return '—'
  const contractor = contractors.value.find(c => c.type === user.contractorType && c.id === user.contractorId)
  if (!contractor) return 'Не найден'
  return `${Number(contractor.balance).toFixed(2)} ₽`
}

// Очистка сообщений
function clearMessages() {
  successMessage.value = ''
  errorMessage.value = ''
}
</script>

<style lang="scss" scoped>
// Переменные
$primary-color: #4361ee;
$danger-color: #f72585;
$success-color: #4cc9f0;
$warning-color: #ff9e00;
$gray-light: #f8f9fa;
$gray: #adb5bd;
$gray-dark: #343a40;
$text-color: #212529;
$border-color: #dee2e6;
$box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
$border-radius: 8px;
$transition: all 0.3s ease;

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  color: $text-color;

  h1 {
    text-align: center;
    margin-bottom: 2rem;
    color: $text-color;
    font-size: 1.8rem;
    font-weight: 600;
  }

  // Таблица пользователей
  table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 2rem;
    background-color: #fff;
    border-radius: $border-radius;
    overflow: hidden;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);

    thead {
      background-color: $gray;
      color: white;

      th {
        padding: 1rem;
        text-align: left;
        font-weight: 600;
        font-size: 0.95rem;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
    }

    tbody {
      tr {
        border-bottom: 1px solid $border-color;
        transition: background-color 0.2s;

        &:nth-child(even) {
          background-color: $gray-light;
        }

        &:hover {
          background-color: $border-color;
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
  }

  // Кнопки
  button {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: $border-radius;
    cursor: pointer;
    font-size: 0.9rem;
    font-weight: 500;
    transition: $transition;

    &:focus {
      outline: 2px solid $blue;
      outline-offset: 2px;
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }

  .btn-add {
    background-color: $blue;
    color: white;

    &:hover:not(:disabled) {
      background-color: #333;
      transform: translateY(-1px);
    }
  }

  .btn-cancel {
    background-color: $gray;
    color: white;
    margin-left: 0.5rem;

    &:hover {
      background-color: $gray-light;
    }
  }

  // Модальное окно
  .modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    animation: fadeIn 0.3s ease;

    .modal-content {
      background: white;
      padding: 2rem;
      border-radius: $border-radius;
      width: 100%;
      max-width: 500px;
      box-shadow: $box-shadow;
      animation: slideUp 0.3s ease;
      max-height: 90vh;
      overflow-y: auto;

      h2 {
        margin-top: 0;
        margin-bottom: 1.5rem;
        color: $blue;
        font-size: 1.4rem;
        font-weight: 600;
      }

      input,
      select {
        width: 100%;
        padding: 0.75rem;
        margin: 0.5rem 0 0.25rem;
        border: 1px solid $border-color;
        border-radius: $border-radius;
        font-size: 1rem;
        transition: border-color $transition;

        &:focus {
          outline: none;
          border-color: $blue;
          box-shadow: 0 0 0 3px rgba($blue, 0.2);
        }

        &.error {
          border-color: $danger-color;
          background-color: rgba($danger-color, 0.05);
        }
      }

      select {
        cursor: pointer;
      }

      label {
        display: block;
        margin-top: 1rem;
        margin-bottom: 0.5rem;
        font-weight: 500;
        color: $gray-dark;
      }

      button {
        margin-top: 1.5rem;
        padding: 0.75rem 1.5rem;
        font-size: 1rem;

        &:first-of-type {
          background-color: $blue;
          color: white;

          &:hover:not(:disabled) {
            background-color: #333;
          }
        }
      }
    }
  }

  // Сообщения
  .success-message {
    padding: 1rem;
    margin: 1rem 0;
    background-color: rgba($success-color, 0.15);
    color: $success-color;
    border: 1px solid rgba($success-color, 0.3);
    border-radius: $border-radius;
    text-align: center;
    font-weight: 500;
  }

  .error-message {
    color: $danger-color;
    font-size: 0.85rem;
    margin-top: 0.25rem;
    font-weight: 500;

    // Для общей ошибки формы
    &.form-error {
      background-color: rgba($danger-color, 0.1);
      padding: 0.75rem;
      border-radius: $border-radius;
      margin-top: 1rem;
      border: 1px solid rgba($danger-color, 0.2);
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

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
}

// Адаптивность
@media (max-width: 768px) {
  .container {
    padding: 1rem;

    table {
      font-size: 0.9rem;

      th,
      td {
        padding: 0.75rem;
      }

      th:nth-child(5),
      td:nth-child(5) {
        display: none; // Скрыть баланс на малых экранах
      }
    }

    .modal .modal-content {
      margin: 1rem;
      max-height: calc(100vh - 2rem);
    }
  }
}
</style>
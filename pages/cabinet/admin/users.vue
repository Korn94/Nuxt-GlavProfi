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
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  font-family: Arial, sans-serif;
  
  h1 {
    text-align: center;
    color: #333;
    margin-bottom: 2rem;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    background-color: white;
    border-radius: 10px;
    box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
    
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #ddd;
      
      &:first-child {
        width: 70px;
      }
    }
    
    thead {
      background-color: #fafafa;
      font-weight: bold;
    }
    
    tbody tr:nth-child(even) {
      background-color: #f9f9f9;
    }
    
    button {
      display: inline-block;
      padding: 0.5em 1em;
      margin-right: 0.5em;
      cursor: pointer;
      transition: all 0.3s ease-in-out;
      border-radius: 4px;
      background-color: #2c7be5;
      color: white;
      border: none;
      
      &:hover {
        background-color: #1e5aa8;
      }
    }
  }

  /* Модальное окно */
  .modal {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 1000;
    overflow-x: hidden;
    overflow-y: auto;
    outline: 0;
    backdrop-filter: blur(5px); /* Эффект размытия фона */
    background-color: rgba(0, 0, 0, 0.5);
    
    .modal-content {
      position: relative;
      background-color: #fff;
      margin: 15% auto;
      padding: 2rem;
      border-radius: 8px;
      max-width: 600px;
      animation-name: modal-open;
      animation-duration: 0.3s;
      
      input[type=text], select {
        width: 100%;
        height: 40px;
        padding: 0.5em;
        margin-top: 0.5em;
        border: 1px solid #ccc;
        border-radius: 4px;
        
        &.error {
          border-color: red;
        }
      }
      
      label {
        display: block;
        margin-top: 1em;
        font-size: 1.1em;
        color: #333;
      }
      
      span.error-message {
        color: red;
        font-size: 0.9em;
        margin-top: 0.5em;
      }
      
      button.btn-cancel {
        background-color: #e63757;
        color: white;
        float: right;
        margin-left: 1em;
        
        &:hover {
          background-color: #a12e2e;
        }
      }
      
      div.success-message, div.error-message {
        padding: 1em;
        border-radius: 4px;
        color: white;
        margin-top: 1em;
        
        &.success-message {
          background-color: green;
        }
        
        &.error-message {
          background-color: red;
        }
      }
    }
  }

  /* Анимация появления модального окна */
  @keyframes modal-open {
    from {
      opacity: 0;
      transform: translateY(-50px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Кнопка добавления */
  .btn-add {
    display: block;
    margin: 2rem auto;
    padding: 1em 2em;
    background-color: #2c7be5;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.3s ease-in-out;
    
    &:hover {
      background-color: #1e5aa8;
    }
  }
}
</style>
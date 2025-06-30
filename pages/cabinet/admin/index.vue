<template>
  <div class="admin-layout">
    <!-- Основное содержимое -->
    <main class="main-content">
      <h1>Сотрудники</h1>

      <!-- Форма добавления -->
      <form @submit.prevent="addEmployee" class="employee-form">
        <input v-model="newEmployee.name" placeholder="Имя" required />
        <input v-model="newEmployee.login" placeholder="Логин" required />
        <input v-model="newEmployee.password" type="password" placeholder="Пароль" required />
        <select v-model="newEmployee.role" required>
          <option value="">Выберите роль</option>
          <option value="admin">Администратор</option>
          <option value="manager">Менеджер</option>
          <option value="foreman">Прораб</option>
          <option value="master">Мастер</option>
          <option value="worker">Рабочий</option>
        </select>
        <button type="submit">Добавить</button>
      </form>

      <!-- Таблица сотрудников -->
      <table class="employee-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Имя</th>
            <th>Логин</th>
            <th>Роль</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="employee in employees" :key="employee.id">
            <td>{{ employee.id }}</td>
            <td>{{ employee.name }}</td>
            <td>{{ employee.login }}</td>
            <td>{{ employee.role }}</td>
            <td>
              <button @click="editEmployee(employee)">Редактировать</button>
              <button @click="deleteEmployee(employee.id)">Удалить</button>
            </td>
          </tr>
        </tbody>
      </table>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const user = ref(null)
const employees = ref([])
const newEmployee = ref({
  name: '',
  login: '',
  password: '',
  role: ''
})

definePageMeta({
  layout: "cabinet",
});

// Получение списка сотрудников
async function fetchEmployees() {
  try {
    const response = await fetch('/api/users', {
      method: 'GET',
      credentials: 'include'
    })
    if (!response.ok) throw new Error('Ошибка загрузки сотрудников')
    employees.value = await response.json()
  } catch (error) {
    console.error(error)
  }
}

// Добавление сотрудника
async function addEmployee() {
  try {
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newEmployee.value),
      credentials: 'include'
    })

    if (!response.ok) throw new Error('Ошибка добавления сотрудника')

    await fetchEmployees()
    newEmployee.value = { name: '', login: '', password: '', role: '' }
  } catch (error) {
    console.error(error)
  }
}

// Редактирование сотрудника
function editEmployee(employee) {
  router.push({ path: `/cabinet/admin/edit/${employee.id}` })
}

// Удаление сотрудника
async function deleteEmployee(id) {
  if (!confirm('Вы уверены, что хотите удалить этого сотрудника?')) return

  try {
    const response = await fetch(`/api/users/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    })

    if (!response.ok) throw new Error('Ошибка удаления сотрудника')

    await fetchEmployees()
  } catch (error) {
    console.error(error)
  }
}

// Получение данных пользователя
async function fetchUserData() {
  try {
    const response = await fetch('/api/me', {
      method: 'GET',
      credentials: 'include'
    })

    if (!response.ok) {
      throw new Error('Не удалось загрузить данные пользователя')
    }

    const data = await response.json()
    user.value = data.user
  } catch (err) {
    console.error(err)
    router.push('/login')
  }
}

// Обработка выхода
function handleLogout() {
  // Удаление токена из cookie
  document.cookie = 'token=; path=/; max-age=0'
  // Очистка данных пользователя
  user.value = null
  // Перенаправление на главную
  router.push('/')
}

onMounted(async () => {
  await fetchUserData()
  await fetchEmployees()
})
</script>

<style lang="scss" scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
  background-color: #bdc3c7;
}

.sidebar {
  width: 250px;
  position: fixed;
  padding: 20px;
  background-color: #ecf0f1;
  box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
  height: 100%;
}

.main-content {
  margin-left: 270px;
  padding: 40px;
  width: 100%;

  h1 {
    margin-bottom: 20px;
  }

  .employee-form {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr 1fr auto;
    gap: 10px;
    margin-bottom: 30px;

    input,
    select,
    button {
      padding: 10px;
      border-radius: 5px;
      border: 1px solid #ccc;
      color: #000;
    }

    button {
      background-color: #00c3f5;
      color: white;
      cursor: pointer;
      transition: background-color 0.3s ease;

      &:hover {
        background-color: #2980b9;
      }
    }
  }

  .employee-table {
    width: 100%;
    border-collapse: collapse;
    background-color: white;
    border-radius: 10px;
    overflow: hidden;

    thead {
      background-color: #00c3f5;
      color: white;
    }

    th,
    td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }

    tr:hover {
      background-color: #ecf0f1;
    }

    button {
      margin-right: 10px;
      padding: 6px 12px;
      font-size: 0.9rem;
    }
  }
}
</style>
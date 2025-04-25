<template>
  <div class="container">
    <h1>Управление пользователями</h1>
    <!-- Форма добавления -->
    <div class="form">
      <input v-model="newUser.name" placeholder="Имя" :class="{ error: formErrors.name }" />
      <span v-if="formErrors.name" class="error-message">{{ formErrors.name }}</span>
      <input
        v-model="newUser.login"
        placeholder="Логин"
        :class="{ error: formErrors.login }"
      />
      <span v-if="formErrors.login" class="error-message">{{ formErrors.login }}</span>
      <input
        v-model="newUser.password"
        type="password"
        placeholder="Пароль"
        :class="{ error: formErrors.password }"
      />
      <span v-if="formErrors.password" class="error-message">{{ formErrors.password }}</span>
      <select v-model="newUser.role">
        <option value="admin">Админ</option>
        <option value="manager">Менеджер</option>
        <option value="foreman">Прораб</option>
        <option value="worker">Рабочий</option>
      </select>
      <button @click="addUser">Добавить</button>
    </div>
    <!-- Таблица пользователей -->
    <table>
      <thead>
        <tr>
          <th>Имя</th>
          <th>Логин</th>
          <th>Роль</th>
          <th>Действия</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="user in users" :key="user.id">
          <td>{{ user.name }}</td>
          <td>{{ user.login }}</td>
          <td>{{ user.role }}</td>
          <td>
            <button @click="editUser(user)">Редактировать</button>
            <button @click="deleteUser(user.id)">Удалить</button>
          </td>
        </tr>
      </tbody>
    </table>
    <!-- Модальное окно редактирования -->
    <div v-if="editingUser" class="modal">
      <div class="modal-content">
        <input v-model="editingUser.name" placeholder="Имя" :class="{ error: editFormErrors.name }" />
        <input
          v-model="editingUser.login"
          placeholder="Логин"
          :class="{ error: editFormErrors.login }"
        />
        <input
          v-model="editingUser.password"
          type="password"
          placeholder="Новый пароль (оставьте пустым, чтобы не изменять)"
          :class="{ error: editFormErrors.password }"
        />
        <select v-model="editingUser.role">
          <option value="admin">Админ</option>
          <option value="manager">Менеджер</option>
          <option value="foreman">Прораб</option>
          <option value="worker">Рабочий</option>
        </select>
        <button @click="saveUser">Сохранить</button>
        <button @click="cancelEdit">Отмена</button>
        <div v-if="editFormErrors.general" class="error-message">
          {{ editFormErrors.general }}
        </div>
      </div>
    </div>
    <!-- Системные сообщения -->
    <div v-if="successMessage" class="success-message">
      {{ successMessage }}
    </div>
    <div v-if="errorMessage" class="error-message">
      {{ errorMessage }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useNuxtApp } from '#app';

definePageMeta({
  layout: 'cabinet',
  middleware: 'auth',
  allowedRoles: ['admin'],
});

const users = ref([]);
const newUser = ref({ name: '', login: '', password: '', role: 'worker' });
const editingUser = ref(null);
const formErrors = ref({});
const editFormErrors = ref({});
const successMessage = ref('');
const errorMessage = ref('');

onMounted(async () => {
  await fetchUsers();
});

// Получение списка пользователей
async function fetchUsers() {
  try {
    const response = await useNuxtApp().$axios.get('/api/users');
    users.value = response.data;
    clearMessages();
  } catch (error) {
    errorMessage.value = 'Ошибка при загрузке пользователей. Попробуйте позже.';
    console.error('Ошибка загрузки пользователей:', error);
  }
}

// Добавление нового пользователя
async function addUser() {
  formErrors.value = {};
  if (!newUser.value.name) {
    formErrors.value.name = 'Имя обязательно';
  }
  if (!newUser.value.login) {
    formErrors.value.login = 'Логин обязателен';
  }
  if (!newUser.value.password) {
    formErrors.value.password = 'Пароль обязателен';
  }
  if (Object.keys(formErrors.value).length > 0) return;

  try {
    const response = await useNuxtApp().$axios.post('/api/users', {
      name: newUser.value.name,
      login: newUser.value.login,
      password: newUser.value.password,
      role: newUser.value.role,
    });
    if (response.status === 201) {
      successMessage.value = 'Пользователь успешно добавлен!';
      await fetchUsers();
      newUser.value = { name: '', login: '', password: '', role: 'worker' };
    }
  } catch (error) {
    if (error.response?.status === 400 && error.response.data.error.includes('логин')) {
      formErrors.value.login = 'Логин уже занят';
    } else {
      errorMessage.value = 'Ошибка добавления пользователя. Попробуйте позже.';
    }
    console.error('Ошибка добавления пользователя:', error);
  }
}

// Удаление пользователя
async function deleteUser(id) {
  try {
    await useNuxtApp().$axios.delete(`/api/users/${id}`);
    successMessage.value = 'Пользователь удален!';
    await fetchUsers();
  } catch (error) {
    errorMessage.value = 'Ошибка удаления пользователя. Попробуйте позже.';
    console.error('Ошибка удаления пользователя:', error);
  }
}

// Редактирование пользователя
function editUser(user) {
  editingUser.value = { ...user };
  editFormErrors.value = {};
}

// Сохранение изменений
async function saveUser() {
  editFormErrors.value = {};
  if (!editingUser.value.name) {
    editFormErrors.value.name = 'Имя обязательно';
  }
  if (!editingUser.value.login) {
    editFormErrors.value.login = 'Логин обязателен';
  }
  if (Object.keys(editFormErrors.value).length > 0) return;

  try {
    const updates = {
      name: editingUser.value.name,
      login: editingUser.value.login,
      role: editingUser.value.role,
    };
    if (editingUser.value.password) {
      updates.password = editingUser.value.password;
    }
    await useNuxtApp().$axios.put(`/api/users/${editingUser.value.id}`, updates);
    successMessage.value = 'Данные обновлены!';
    await fetchUsers();
    editingUser.value = null;
  } catch (error) {
    if (error.response?.status === 400 && error.response.data.error.includes('логин')) {
      editFormErrors.value.login = 'Логин уже занят';
    } else {
      editFormErrors.value.general = 'Ошибка обновления данных. Попробуйте позже.';
    }
    console.error('Ошибка обновления пользователя:', error);
  }
}

// Отмена редактирования
function cancelEdit() {
  editingUser.value = null;
  clearMessages();
}

// Очистка сообщений
function clearMessages() {
  successMessage.value = '';
  errorMessage.value = '';
  formErrors.value = {};
  editFormErrors.value = {};
}
</script>

<style scoped>
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.form {
  margin-bottom: 20px;
}

input.error {
  border: 1px solid red;
}

.error-message {
  color: red;
  margin-top: 5px;
}

.success-message {
  color: green;
  margin-top: 10px;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-content {
  background: white;
  padding: 20px;
  border-radius: 8px;
  width: 400px;
  text-align: left;
}

button {
  margin: 5px;
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background-color: #f0f0f0;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}

th,
td {
  border: 1px solid #ddd;
  padding: 12px;
  text-align: left;
}

th {
  background-color: #f5f5f5;
}

tr:hover {
  background-color: #f5f5f5;
}
</style>
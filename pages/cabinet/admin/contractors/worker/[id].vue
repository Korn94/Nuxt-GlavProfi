<template>
  <div class="container">
    <h1>Рабочий: {{ worker.name }}</h1>

    <!-- Вкладки -->
    <div class="tabs">
      <button :class="{ active: currentTab === 'info' }" @click="currentTab = 'info'">Информация</button>
      <button :class="{ active: currentTab === 'operations' }" @click="currentTab = 'operations'">Операции</button>
      <button :class="{ active: currentTab === 'agreements' }" @click="currentTab = 'agreements'">Договоренности</button>
    </div>

    <!-- Вкладка "Информация" -->
    <div v-if="currentTab === 'info'">
      <div class="block">
        <h3>Основная информация</h3>
        <p><strong>Роль:</strong> {{ worker.role }}</p>
        <p><strong>Телефон:</strong> {{ worker.phone }}</p>
        <p><strong>Связанный аккаунт:</strong> {{ worker.User?.name || 'Не привязан' }}</p>
        <p><strong>Комментарий:</strong> {{ worker.comment }}</p>
      </div>

      <!-- Форма редактирования -->
      <div v-if="editing">
        <input v-model="worker.name" placeholder="Имя" class="form-control" :class="{ error: formErrors.name }" />
        <input v-model="worker.phone" placeholder="Телефон" class="form-control" />
        <textarea v-model="worker.comment" placeholder="Комментарий" class="form-control"></textarea>
        <button @click="saveWorker" class="button">Сохранить</button>
        <button @click="cancelEdit" class="button secondary">Отмена</button>
      </div>
      <div v-else>
        <button @click="toggleEdit" class="button">Редактировать</button>
      </div>
    </div>

    <!-- Вкладка "Операции" -->
    <div v-if="currentTab === 'operations'">
      <h2>История операций</h2>
      <table v-if="operations.length > 0">
        <thead>
          <tr>
            <th>Дата</th>
            <th>Тип</th>
            <th>Сумма</th>
            <th>Описание</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="operation in operations" :key="operation.id">
            <td>{{ operation.date }}</td>
            <td>{{ operation.type }}</td>
            <td>{{ operation.amount }} ₽</td>
            <td>{{ operation.description }}</td>
          </tr>
        </tbody>
      </table>
      <p v-else>Нет операций.</p>
    </div>

    <!-- Вкладка "Договоренности" -->
    <div v-if="currentTab === 'agreements'">
      <h2>Договоренности</h2>
      <div v-if="agreements.length > 0">
        <div v-for="agreement in agreements" :key="agreement.id" class="agreement-item">
          <p><strong>Дата:</strong> {{ agreement.date }}</p>
          <p><strong>Статус:</strong> {{ agreement.status }}</p>
          <p>{{ agreement.text }}</p>
        </div>
      </div>
      <p v-else>Нет договоренностей.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useNuxtApp } from '#app';

const route = useRoute();
const worker = ref({});
const operations = ref([]);
const agreements = ref([]);
const currentTab = ref('info');
const editing = ref(false);
const formErrors = ref({});

definePageMeta({
  middleware: 'auth',
  allowedRoles: ['admin'],
  layout: 'cabinet',
});

// Метод для загрузки данных рабочего
async function fetchWorker() {
  try {
    const response = await useNuxtApp().$axios.get(`/contractors/workers/${route.params.id}`);
    worker.value = response.data;
  } catch (error) {
    console.error('Ошибка при загрузке рабочего:', error);
  }
}

// Метод для загрузки операций
async function fetchOperations() {
  try {
    const response = await useNuxtApp().$axios.get(`/operations/worker/${route.params.id}`);
    operations.value = response.data;
  } catch (error) {
    console.error('Ошибка при загрузке операций:', error);
  }
}

// Метод для загрузки договоренностей
async function fetchAgreements() {
  try {
    const response = await useNuxtApp().$axios.get(`/agreements/worker/${route.params.id}`);
    agreements.value = response.data;
  } catch (error) {
    console.error('Ошибка при загрузке договоренностей:', error);
  }
}

// Метод для переключения режима редактирования
function toggleEdit() {
  editing.value = true;
  // Сохраняем оригинальные данные для отмены
  originalWorker.value = { ...worker.value };
}

// Метод для сохранения изменений
async function saveWorker() {
  try {
    await useNuxtApp().$axios.put(`/contractors/workers/${route.params.id}`, worker.value);
    await fetchWorker();
    editing.value = false;
    formErrors.value = {};
  } catch (error) {
    if (error.response) {
      formErrors.value = error.response.data.errors || { general: 'Ошибка сохранения' };
    }
  }
}

// Метод для отмены редактирования
function cancelEdit() {
  worker.value = { ...originalWorker.value };
  editing.value = false;
}

// Переменная для хранения оригинальных данных
const originalWorker = ref({});

// Вызываем методы при монтировании компонента
onMounted(async () => {
  await fetchWorker();
  await fetchOperations();
  await fetchAgreements();
});
</script>

<style scoped>
.container {
  max-width: 800px;
  margin: 2rem auto;
  padding: 20px;
}

.tabs {
  margin-bottom: 20px;
}

.tabs button {
  margin-right: 10px;
  padding: 8px 12px;
  border: 1px solid #ccc;
  background: #f0f0f0;
  cursor: pointer;
}

.tabs button.active {
  background: #007bff;
  color: white;
}

.block {
  border: 1px solid #e0e0e0;
  padding: 15px;
  margin-bottom: 20px;
  border-radius: 4px;
}

.form-control {
  width: 100%;
  padding: 8px;
  margin: 5px 0;
  border: 1px solid #ccc;
}

.form-control.error {
  border-color: red;
}

.agreement-item {
  border: 1px solid #e0e0e0;
  padding: 15px;
  margin: 10px 0;
  border-radius: 4px;
}

button {
  padding: 8px 12px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button.secondary {
  background-color: #6c757d;
}

button:hover {
  background-color: #0056b3;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}

th,
td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}

th {
  background-color: #f0f0f0;
}
</style>
<template>
  <div class="container">
    <h1>Список задач</h1>
    
    <!-- Форма добавления задачи -->
    <div v-if="['admin', 'foreman'].includes(user?.role)" class="task-form">
      <h2>Добавить задачу</h2>
      <div class="form-group">
        <label>Объект:</label>
        <select v-model="newTask.objectId" required>
          <option v-for="object in objects" :key="object.id" :value="object.id">
            {{ object.name }} ({{ object.status }})
          </option>
        </select>
      </div>

      <div class="form-group">
        <label>Тип работы:</label>
        <select v-model="newTask.type" required>
          <option value="painting">Малярка</option>
          <option value="plumbing">Сантехника</option>
          <option value="electricity">Электрика</option>
          <option value="other">Другое</option>
        </select>
      </div>

      <!-- Выбор исполнителя -->
      <div class="form-group">
        <label>Исполнитель:</label>
        <div class="radio-group">
          <input type="radio" id="master" v-model="selectedRole" value="master" @change="clearWorker" />
          <label for="master">Мастер</label>
          
          <input type="radio" id="worker" v-model="selectedRole" value="worker" @change="clearMaster" />
          <label for="worker">Рабочий</label>
        </div>

        <!-- Выбор мастера -->
        <div v-if="selectedRole === 'master'" class="form-group">
          <label>Выберите мастера:</label>
          <select v-model="newTask.masterId" required>
            <option v-for="master in masters" :key="master.id" :value="master.id">
              {{ master.User.name }}
            </option>
          </select>
        </div>

        <!-- Выбор рабочего -->
        <div v-if="selectedRole === 'worker'" class="form-group">
          <label>Выберите рабочего:</label>
          <select v-model="newTask.workerId" required>
            <option v-for="worker in workers" :key="worker.id" :value="worker.id">
              {{ worker.User.name }}
            </option>
          </select>
        </div>
      </div>

      <div class="form-group">
        <label>Сумма:</label>
        <input v-model.number="newTask.amount" type="number" step="0.01" required />
      </div>

      <div class="form-group">
        <label>Договоренности:</label>
        <textarea v-model="newTask.agreement" required></textarea>
      </div>

      <button @click="addTask" :disabled="!isValidForm">Добавить задачу</button>
    </div>

    <!-- Список задач -->
    <div class="task-list">
      <table>
        <thead>
          <tr>
            <th>Объект</th>
            <th>Тип</th>
            <th>Сумма</th>
            <th>Исполнитель</th>
            <th>Статус</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="task in tasks" :key="task.id">
            <td>{{ task.Object?.name }}</td>
            <td>{{ task.type }}</td>
            <td>{{ task.amount }} ₽</td>
            <td>
              <span v-if="task.Master">
                Мастер: {{ task.Master.User.name }}
              </span>
              <span v-else-if="task.Worker">
                Рабочий: {{ task.Worker.User.name }}
              </span>
            </td>
            <td :class="task.status">
              {{ task.status }}
            </td>
            <td>
              <button v-if="user?.role === 'admin'" @click="updateTaskStatus(task.id, 'completed')">
                Завершить
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useNuxtApp } from '#app';

const tasks = ref([]);
const objects = ref([]);
const masters = ref([]);
const workers = ref([]);
const user = ref(null);

// Новая задача
const newTask = ref({
  objectId: null,
  type: '',
  amount: 0,
  agreement: '',
  masterId: null,
  workerId: null
});

// Текущий выбор роли исполнителя
const selectedRole = ref('master');

// Валидация формы
const isValidForm = computed(() => {
  return (
    newTask.value.objectId &&
    newTask.value.type &&
    newTask.value.amount > 0 &&
    newTask.value.agreement &&
    (newTask.value.masterId || newTask.value.workerId)
  );
});

definePageMeta({
  middleware: 'auth',
  allowedRoles: ['admin'],
  layout: 'cabinet',
});

// Методы загрузки данных
onMounted(async () => {
  if (process.client) {
    const userData = localStorage.getItem('user');
    if (userData) user.value = JSON.parse(userData);
  }

  await Promise.all([
    fetchTasks(),
    fetchObjects(),
    fetchMasters(),
    fetchWorkers()
  ]);
});

async function fetchTasks() {
  try {
    const response = await useNuxtApp().$axios.get('/tasks', {
      params: { include: 'Object, Master, Worker' }
    });
    tasks.value = response.data;
  } catch (error) {
    console.error('Ошибка загрузки задач:', error);
  }
}

async function fetchObjects() {
  try {
    const response = await useNuxtApp().$axios.get('/objects', {
      params: { status: 'active' }
    });
    objects.value = response.data;
  } catch (error) {
    console.error('Ошибка загрузки объектов:', error);
  }
}

async function fetchMasters() {
  try {
    const response = await useNuxtApp().$axios.get('/contractors/master');
    masters.value = response.data;
  } catch (error) {
    console.error('Ошибка загрузки мастеров:', error);
  }
}

async function fetchWorkers() {
  try {
    const response = await useNuxtApp().$axios.get('/contractors/worker');
    workers.value = response.data;
  } catch (error) {
    console.error('Ошибка загрузки рабочих:', error);
  }
}

// Методы управления задачами
async function addTask() {
  if (!isValidForm.value) return;

  try {
    await useNuxtApp().$axios.post('/tasks', newTask.value);
    await fetchTasks();
    resetForm();
    alert('Задача добавлена!');
  } catch (error) {
    console.error('Ошибка:', error);
    alert('Ошибка при создании задачи. Проверьте данные.');
  }
}

async function updateTaskStatus(id, status) {
  try {
    await useNuxtApp().$axios.put(`/tasks/${id}`, { status });
    const taskIndex = tasks.value.findIndex(t => t.id === id);
    if (taskIndex !== -1) {
      tasks.value[taskIndex].status = status;
    }
    alert('Статус обновлен!');
  } catch (error) {
    console.error('Ошибка:', error);
    alert('Не удалось обновить статус');
  }
}

// Утилиты для очистки полей
function clearMaster() {
  newTask.value.masterId = null;
}

function clearWorker() {
  newTask.value.workerId = null;
}

function resetForm() {
  newTask.value = {
    objectId: null,
    type: '',
    amount: 0,
    agreement: '',
    masterId: null,
    workerId: null
  };
  selectedRole.value = 'master';
}
</script>

<style scoped>
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.task-form {
  margin-bottom: 40px;
  border: 1px solid #ddd;
  padding: 20px;
  border-radius: 8px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
}

.form-group select,
.form-group input,
.form-group textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.radio-group {
  display: flex;
  gap: 20px;
  margin-bottom: 15px;
}

.task-list table {
  width: 100%;
  border-collapse: collapse;
}

.task-list th,
.task-list td {
  border: 1px solid #ddd;
  padding: 12px;
  text-align: left;
}

.task-list th {
  background-color: #f8f9fa;
}

.task-list tr:hover {
  background-color: #f1f5f9;
}

.task-list .completed {
  color: #28a745;
}

.task-list .pending {
  color: #00c3f5;
}

button {
  padding: 8px 16px;
  background-color: #00c3f5;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

button:hover {
  background-color: #00c3f5;
}

button:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}
</style>
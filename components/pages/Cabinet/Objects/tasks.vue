<template>
  <div class="block">
    <h3>Задачи ({{ tasks.length }})</h3>

    <!-- Форма добавления/редактирования -->
    <div class="task-form">
      <select 
        v-model="currentTask.type" 
        class="form-control"
        required
      >
        <option value="painting">Малярка</option>
        <option value="plumbing">Сантехника</option>
        <option value="electricity">Электрика</option>
      </select>
      <input 
        v-model.number="currentTask.amount" 
        type="number" 
        step="0.01"
        placeholder="Стоимость" 
        class="form-control" 
        :class="{ error: !currentTask.amount }"
        required
      />
      <textarea 
        v-model="currentTask.agreement" 
        placeholder="Описание задачи" 
        class="form-control"
        required
      ></textarea>
      <div class="select-group">
        <div class="form-check">
          <input 
            type="radio" 
            id="master" 
            v-model="selectedRole" 
            value="master"
            class="form-check-input"
          >
          <label for="master" class="form-check-label">Мастер</label>
        </div>
        <div class="form-check">
          <input 
            type="radio" 
            id="worker" 
            v-model="selectedRole" 
            value="worker"
            class="form-check-input"
          >
          <label for="worker" class="form-check-label">Рабочий</label>
        </div>
      </div>
      <select 
        v-if="selectedRole === 'master'"
        v-model="currentTask.masterId"
        class="form-control"
        required
      >
        <option value="">Выберите мастера</option>
        <option 
          v-for="master in masters" 
          :key="master.id" 
          :value="master.id"
        >
          {{ master.name }}
        </option>
      </select>
      <select 
        v-if="selectedRole === 'worker'"
        v-model="currentTask.workerId"
        class="form-control"
        required
      >
        <option value="">Выберите рабочего</option>
        <option 
          v-for="worker in workers" 
          :key="worker.id" 
          :value="worker.id"
        >
          {{ worker.name }}
        </option>
      </select>
      <button 
        @click="saveTask" 
        :disabled="!isFormValid"
        class="btn btn-primary"
      >
        {{ isEditing ? 'Сохранить' : 'Добавить' }}
      </button>
      <button 
        v-if="isEditing" 
        @click="cancelEdit" 
        class="btn btn-secondary"
      >
        Отмена
      </button>
    </div>

    <!-- Таблица задач -->
    <table>
      <thead>
        <tr>
          <th>Тип</th>
          <th>Стоимость</th>
          <th>Статус</th>
          <th>Исполнитель</th>
          <th>Действия</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="task in tasks" :key="task.id">
          <td>{{ task.type }}</td>
          <td>{{ task.amount }} ₽</td>
          <td>{{ task.status }}</td>
          <td>
            {{ task.master?.name || task.worker?.name }}
          </td>
          <td>
            <button @click="editTask(task)">Редактировать</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useNuxtApp } from '#app'

const route = useRoute()
const tasks = ref([])
const masters = ref([])
const workers = ref([])
const currentTask = ref({
  type: 'painting',
  amount: 0,
  agreement: '',
  masterId: null,
  workerId: null,
  objectId: route.params.id
})
const selectedRole = ref('master')
const isEditing = ref(false)

// Валидация формы
const isFormValid = computed(() => {
  return (
    currentTask.value.type &&
    currentTask.value.amount > 0 &&
    currentTask.value.agreement &&
    (currentTask.value.masterId || currentTask.value.workerId)
  )
})

// Обновление objectId при изменении route
watch(
  () => route.params.id,
  (newId) => {
    currentTask.value.objectId = newId
    fetchTasks()
    fetchMasters()
    fetchWorkers()
  }
)

// Загрузка данных
onMounted(async () => {
  await Promise.all([fetchTasks(), fetchMasters(), fetchWorkers()])
})

// Загрузка задач
async function fetchTasks() {
  try {
    const response = await useNuxtApp().$axios.get(
      `/tasks?objectId=${route.params.id}`
    )
    tasks.value = response.data.map(task => ({
      ...task,
      amount: Number(task.amount)
    }))
  } catch (error) {
    console.error('Ошибка загрузки задач:', error)
  }
}

// Загрузка мастеров и рабочих
async function fetchMasters() {
  try {
    const response = await useNuxtApp().$axios.get('/contractors/master')
    masters.value = response.data
  } catch (error) {
    console.error('Ошибка загрузки мастеров:', error)
  }
}

async function fetchWorkers() {
  try {
    const response = await useNuxtApp().$axios.get('/contractors/worker')
    workers.value = response.data
  } catch (error) {
    console.error('Ошибка загрузки рабочих:', error)
  }
}

// Методы для задач
async function saveTask() {
  if (isEditing.value) {
    await updateTask()
  } else {
    await addTask()
  }
  resetForm()
}

async function addTask() {
  try {
    const response = await useNuxtApp().$axios.post('/tasks', {
      ...currentTask.value,
      objectId: route.params.id, // <--- Добавить объект
      userId: user.value.id
    });
    tasks.value.push(response.data);
  } catch (error) {
    console.error('Ошибка добавления задачи:', error);
  }
}

async function updateTask() {
  try {
    const response = await useNuxtApp().$axios.put(
      `/tasks/${currentTask.value.id}`,
      currentTask.value
    )
    const index = tasks.value.findIndex(
      (t) => t.id === currentTask.value.id
    )
    if (index !== -1) {
      tasks.value.splice(index, 1, response.data)
    }
  } catch (error) {
    console.error('Ошибка обновления задачи:', error)
  }
}

function editTask(task) {
  currentTask.value = { ...task }
  isEditing.value = true
}

function cancelEdit() {
  resetForm()
  isEditing.value = false
}

function resetForm() {
  currentTask.value = {
    type: 'painting',
    amount: 0,
    agreement: '',
    masterId: null,
    workerId: null,
    objectId: route.params.id
  }
  selectedRole.value = 'master'
}

// Сброс форм при смене роли
watch(selectedRole, () => {
  if (selectedRole.value === 'master') {
    currentTask.value.workerId = null
  } else {
    currentTask.value.masterId = null
  }
})
</script>

<style scoped>
.task-form {
  margin-bottom: 20px;
}

.form-control {
  width: 100%;
  padding: 8px;
  margin: 5px 0;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.form-control.error {
  border-color: red;
}

.select-group {
  margin-bottom: 15px;
}

.form-check {
  margin-right: 20px;
}

.btn {
  padding: 8px 16px;
  border: none;
  cursor: pointer;
  border-radius: 4px;
}

.btn-primary {
  background-color: #007bff;
  color: white;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
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
  background-color: #f8f9fa;
}

.status-checkbox {
  transform: scale(1.2);
  cursor: pointer;
}

.status-checkbox:disabled {
  opacity: 0.5;
}

.block {
  margin-bottom: 40px;
}
</style>
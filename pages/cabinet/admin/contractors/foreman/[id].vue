<template>
  <div class="container">
    <h1>Прораб: {{ foreman.User?.name }}</h1>

    <!-- Вкладки -->
    <div class="tabs">
      <button
        v-for="tab in tabs"
        :key="tab"
        :class="{ active: currentTab === tab }"
        @click="currentTab = tab"
      >
        {{ tab }}
      </button>
    </div>

    <!-- Информация -->
    <div v-if="currentTab === 'info'">
      <div class="block">
        <h3>Данные прораба:</h3>
        <p><strong>Имя:</strong> {{ foreman.name }}</p>
        <p><strong>Телефон:</strong> {{ foreman.phone }}</p>
        <p><strong>Баланс:</strong> {{ foreman.balance }} ₽</p>
        <p><strong>Комментарий:</strong> {{ foreman.comment }}</p>
      </div>

      <!-- Форма обновления данных -->
      <div v-if="editing">
        <input
          v-model="foreman.name"
          placeholder="Имя"
          class="form-control"
        />
        <input
          v-model="foreman.phone"
          placeholder="Телефон"
          class="form-control"
        />
        <textarea
          v-model="foreman.comment"
          placeholder="Комментарий"
          class="form-control"
        ></textarea>
        <button @click="saveForeman">Сохранить</button>
        <button @click="cancelEdit">Отмена</button>
      </div>
      <button v-else @click="toggleEdit">Редактировать</button>
    </div>

    <!-- Операции -->
    <div v-if="currentTab === 'operations'">
      <div class="block">
        <h3>История операций:</h3>
        <table>
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

        <!-- Форма добавления операции -->
        <div v-if="user?.role === 'admin'">
          <select v-model="newOperation.type">
            <option value="deposit">Пополнение</option>
            <option value="withdrawal">Списание</option>
          </select>
          <input
            v-model="newOperation.amount"
            type="number"
            step="0.01"
            placeholder="Сумма"
            class="form-control"
          />
          <input
            v-model="newOperation.description"
            placeholder="Описание"
            class="form-control"
          />
          <button @click="addOperation">Добавить операцию</button>
        </div>
      </div>
    </div>

    <!-- Договоренности -->
    <div v-if="currentTab === 'agreements'">
      <div class="block">
        <h3>Договоренности:</h3>
        <ul>
          <li v-for="agreement in agreements" :key="agreement.id">
            <strong>{{ agreement.date }}</strong>:
            {{ agreement.text }}
            <span v-if="agreement.status === 'completed'">(Завершено)</span>
          </li>
        </ul>

        <!-- Форма добавления договоренности -->
        <div v-if="user?.role === 'admin'">
          <textarea
            v-model="newAgreement.text"
            placeholder="Текст договоренности"
            class="form-control"
          ></textarea>
          <select v-model="newAgreement.status">
            <option value="active">Активная</option>
            <option value="completed">Завершенная</option>
          </select>
          <button @click="addAgreement">Сохранить</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useNuxtApp } from '#app';

const route = useRoute();
const router = useRouter();

const tabs = ['info', 'operations', 'agreements'];
const currentTab = ref('info');

// Данные прораба
const foreman = ref({});
const editing = ref(false);

// Операции
const operations = ref([]);
const newOperation = ref({
  type: 'deposit',
  amount: 0,
  description: '',
});

// Договоренности
const agreements = ref([]);
const newAgreement = ref({
  text: '',
  status: 'active',
});

// Пользователь
const user = ref(null);

definePageMeta({
  middleware: 'auth',
  allowedRoles: ['admin'],
  layout: 'cabinet',
});


onMounted(async () => {
  if (process.client) {
    const userData = localStorage.getItem('user');
    if (userData) user.value = JSON.parse(userData);
  }
  await fetchForeman();
  await fetchOperations();
  await fetchAgreements();
});

// Загрузка данных прораба
async function fetchForeman() {
  try {
    const response = await useNuxtApp().$axios.get(
      `/contractors/foremen/${route.params.id}`
    );
    foreman.value = response.data;
  } catch (error) {
    console.error('Ошибка при загрузке прораба:', error);
  }
}

// Редактирование
function toggleEdit() {
  editing.value = !editing.value;
}

async function saveForeman() {
  try {
    await useNuxtApp().$axios.put(
      `/contractors/foremen/${route.params.id}`,
      foreman.value
    );
    editing.value = false;
  } catch (error) {
    console.error('Ошибка обновления прораба:', error);
  }
}

function cancelEdit() {
  editing.value = false;
  fetchForeman();
}

// Операции
async function fetchOperations() {
  try {
    const response = await useNuxtApp().$axios.get(
      `/operations/foremen/${route.params.id}`
    );
    operations.value = response.data;
  } catch (error) {
    console.error('Ошибка при загрузке операций:', error);
  }
}

async function addOperation() {
  if (!newOperation.value.amount || !newOperation.value.type) return;
  try {
    const payload = {
      contractorType: 'foreman',
      contractorId: route.params.id,
      ...newOperation.value,
    };
    await useNuxtApp().$axios.post('/operations', payload);
    await fetchOperations();
    newOperation.value = {
      type: 'deposit',
      amount: 0,
      description: '',
    };
  } catch (error) {
    console.error('Ошибка добавления операции:', error);
  }
}

// Договоренности
async function fetchAgreements() {
  try {
    const response = await useNuxtApp().$axios.get(
      `/agreements/foremen/${route.params.id}`
    );
    agreements.value = response.data;
  } catch (error) {
    console.error('Ошибка при загрузке договоренностей:', error);
  }
}

async function addAgreement() {
  if (!newAgreement.value.text) return;
  try {
    const payload = {
      contractorType: 'foreman',
      contractorId: route.params.id,
      ...newAgreement.value,
    };
    await useNuxtApp().$axios.post('/agreements', payload);
    await fetchAgreements();
    newAgreement.value = { text: '', status: 'active' };
  } catch (error) {
    console.error('Ошибка добавления договоренности:', error);
  }
}
</script>

<style scoped>
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.tabs button {
  margin: 5px;
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

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 15px;
}
th,
td {
  border: 1px solid #ddd;
  padding: 8px;
}
th {
  background-color: #f0f0f0;
}
</style>
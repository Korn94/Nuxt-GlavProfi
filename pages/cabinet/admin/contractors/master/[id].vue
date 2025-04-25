<template>
  <div class="container">
    <h1>{{ master.name }} (Мастер)</h1>

    <!-- Блок информации о мастере -->
    <div class="master-info" v-if="!editingMaster">
      <p><strong>Баланс:</strong> {{ master.balance }} ₽</p>
      <p><strong>Телефон:</strong> {{ master.phone }}</p>
      <p><strong>Комментарий:</strong> {{ master.comment }}</p>
      <button @click="toggleEdit">Редактировать</button>
    </div>

    <!-- Форма редактирования -->
    <div v-else class="form">
      <input
        v-model="master.name"
        placeholder="Имя"
        :class="{ error: formErrors.name }"
      />
      <span v-if="formErrors.name" class="error-message">{{ formErrors.name }}</span>
      <input
        v-model="master.phone"
        placeholder="Телефон"
        type="tel"
      />
      <textarea
        v-model="master.comment"
        placeholder="Комментарий"
      />
      <button @click="saveMaster">Сохранить</button>
      <button @click="cancelEdit">Отмена</button>
    </div>

    <!-- Блок операций -->
    <div class="block">
      <h2>Операции</h2>
      <div class="form">
        <select v-model="newOperation.type" :class="{ error: formErrors.type }">
          <option value="deposit">Оплата</option>
          <option value="withdrawal">Выполнил</option>
        </select>
        <input
          v-model.number="newOperation.amount"
          placeholder="Сумма"
          type="number"
          step="0.01"
          :class="{ error: formErrors.amount }"
        />
        <textarea
          v-model="newOperation.description"
          placeholder="Описание"
        />
        <button @click="addOperation" :disabled="isFormInvalid">Добавить операцию</button>
      </div>
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
    </div>

    <!-- Блок договоренностей -->
    <div class="block">
      <h2>Договоренности</h2>
      <div class="form">
        <textarea
          v-model="newAgreement.text"
          placeholder="Текст договоренности"
          :class="{ error: formAgreementErrors.text }"
        />
        <select v-model="newAgreement.status">
          <option value="active">Активная</option>
          <option value="completed">Завершенная</option>
        </select>
        <button @click="addAgreement">Добавить договоренность</button>
      </div>
      <ul>
        <li v-for="agreement in agreements" :key="agreement.id">
          <strong>{{ agreement.date }}</strong>:
          {{ agreement.text }} 
          <span v-if="agreement.status === 'completed'">(Завершено)</span>
        </li>
      </ul>
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
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useNuxtApp } from '#app';

const route = useRoute();
const master = ref({});
const operations = ref([]);
const agreements = ref([]);
const newOperation = ref({ type: 'deposit', amount: 0, description: '' });
const newAgreement = ref({ text: '', status: 'active' });
const formErrors = ref({});
const formAgreementErrors = ref({});
const editingMaster = ref(false);
const successMessage = ref('');
const errorMessage = ref('');

definePageMeta({
  middleware: 'auth',
  allowedRoles: ['admin'],
  layout: 'cabinet',
});

onMounted(async () => {
  await fetchMaster();
  await fetchOperations();
  await fetchAgreements();
});

// Методы загрузки данных
async function fetchMaster() {
  try {
    // Получаем основную информацию о мастере
    const masterResponse = await useNuxtApp().$axios.get(`/contractors/masters/${route.params.id}`);
    master.value = masterResponse.data;

    // Получаем операции для этого мастера
    const operationsResponse = await useNuxtApp().$axios.get(`/operations/master/${route.params.id}`);
    const operations = operationsResponse.data;

    // Вычисляем текущий баланс
    let currentBalance = 0;
    operations.forEach(operation => {
      if (operation.type === 'deposit') {
        currentBalance += parseFloat(operation.amount || 0);
      } else if (operation.type === 'withdrawal') {
        currentBalance -= parseFloat(operation.amount || 0);
      }
    });

    // Обновляем баланс в мастере
    master.value.balance = currentBalance;
    console.log('Текущий баланс:', master.value.balance);
  } catch (error) {
    console.error('Ошибка при получении данных мастера:', error);
  }
}

async function fetchOperations() {
  try {
    const response = await useNuxtApp().$axios.get(`/operations/master/${route.params.id}`);
    operations.value = response.data;
  } catch (error) {
    console.error('Ошибка при получении операций:', error);
  }
}

async function fetchAgreements() {
  try {
    const response = await useNuxtApp().$axios.get(`/agreements/master/${route.params.id}`);
    agreements.value = response.data;
  } catch (error) {
    console.error('Ошибка при получении договоренностей:', error);
  }
}

// Редактирование мастера
function toggleEdit() {
  editingMaster.value = true;
}

async function saveMaster() {
  formErrors.value = {};

  // Валидация
  if (!master.value.name) {
    formErrors.value.name = 'Имя обязательно';
  }
  if (master.value.phone) {
    if (!master.value.phone.match(/^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s\.\/0-9]*$/)) {
      formErrors.value.phone = 'Введите корректный номер телефона';
    }
  }

  if (Object.keys(formErrors.value).length > 0) return;

  try {
    // Игнорируем обновление баланса при сохранении мастера
    const updatedMaster = { ...master.value };
    delete updatedMaster.balance;

    await useNuxtApp().$axios.put(`/contractors/masters/${route.params.id}`, updatedMaster);
    editingMaster.value = false;
    await fetchMaster(); // Обновляем данные
    successMessage.value = 'Данные мастера обновлены';
  } catch (error) {
    console.error('Ошибка обновления мастера:', error);
    errorMessage.value = 'Не удалось обновить данные';
  }
}

function cancelEdit() {
  editingMaster.value = false;
  fetchMaster(); // Восстанавливаем исходные данные
}

// Добавление операции
async function addOperation() {
  formErrors.value = {};

  if (!newOperation.value.amount) {
    formErrors.value.amount = 'Укажите сумму';
  }
  if (!newOperation.value.type) {
    formErrors.value.type = 'Выберите тип операции';
  }
  if (!newOperation.value.description) {
    formErrors.value.description = 'Введите описание';
  }

  if (Object.keys(formErrors.value).length > 0) return;

  console.log('Sending data to server:', newOperation.value); 

  try {
    const payload = {
      contractorType: 'master',
      contractorId: route.params.id,
      ...newOperation.value,
    };
    await useNuxtApp().$axios.post('/operations', payload);
    await fetchOperations(); // Обновляем список операций
    await fetchMaster(); // Обновляем баланс
    newOperation.value = { type: 'deposit', amount: 0, description: '' };
    successMessage.value = 'Операция добавлена';
  } catch (error) {
    console.error('Ошибка:', error);
    errorMessage.value = 'Не удалось добавить операцию';
  }
}

// Добавление договоренности
async function addAgreement() {
  formAgreementErrors.value = {};

  if (!newAgreement.value.text) {
    formAgreementErrors.value.text = 'Укажите текст договоренности';
  }

  if (Object.keys(formAgreementErrors.value).length > 0) return;

  try {
    const payload = {
      contractorType: 'master',
      contractorId: route.params.id,
      ...newAgreement.value,
    };
    await useNuxtApp().$axios.post('/agreements', payload);
    await fetchAgreements();
    newAgreement.value = { text: '', status: 'active' };
    successMessage.value = 'Договоренность добавлена';
  } catch (error) {
    console.error('Ошибка:', error);
    errorMessage.value = 'Не удалось добавить договоренность';
  }
}

// Вычисляемые свойства
const isFormInvalid = computed(() => {
  return !newOperation.value.amount || !newOperation.value.type;
});

const isAgreementInvalid = computed(() => {
  return !newAgreement.value.text;
});
</script>

<style scoped>
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.master-info {
  margin-bottom: 20px;
  padding: 15px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
}

.form {
  margin-bottom: 20px;
  border: 1px solid #e0e0e0;
  padding: 15px;
  border-radius: 4px;
}

.form-group {
  margin-bottom: 10px;
}

input.error, select.error, textarea.error {
  border-color: red;
}

.error-message {
  color: red;
  margin-top: 5px;
}

.success-message {
  color: green;
  margin-top: 10px;
}

.block {
  margin-bottom: 30px;
  border: 1px solid #e0e0e0;
  padding: 15px;
  border-radius: 4px;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}

th, td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}

th {
  background-color: #f0f0f0;
}

button {
  margin: 5px;
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  background-color: #007bff;
  color: white;
}

button:hover {
  background-color: #0056b3;
}

.delete-button {
  background-color: #f44336;
}

.delete-button:hover {
  background-color: #d32f1a;
}
</style>
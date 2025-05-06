<template>
  <div class="block">
    <h2>Операции объекта</h2>
    
    <!-- Баланс объекта -->
    <div class="balance-summary">
      <p>Баланс объекта: <strong>{{ objectBalance }} ₽</strong></p>
    </div>

    <!-- Форма добавления прихода -->
    <div class="form">
      <h4>Добавить приход</h4>
      <input
        type="number"
        step="100.00"
        v-model="newComing.amount"
        placeholder="Сумма"
        required
      />
      <textarea v-model="newComing.comment" placeholder="Комментарий"></textarea>
      <button @click="addComing" :disabled="!isComingValid">Добавить приход</button>
    </div>

    <!-- Форма добавления расхода -->
    <div class="form">
      <h4>Добавить расход</h4>
      <input
        type="number"
        step="100.00"
        v-model="newExpense.amount"
        placeholder="Сумма"
        required
      />
      
      <!-- Выбор категории (мастер/работник) -->
      <select v-model="selectedCategory">
        <option value="">Выберите категорию</option>
        <option value="master">Мастера</option>
        <option value="worker">Рабочие</option>
      </select>

      <!-- Список контрагентов из выбранной категории -->
      <select v-model="newExpense.contractorId">
        <option value="">Выберите контрагента</option>
        <option
          v-for="contractor in filteredContractors"
          :key="contractor.id"
          :value="contractor.id"
        >
          {{ contractor.name }} (Баланс: {{ contractor.balance }} ₽)
        </option>
      </select>

      <textarea v-model="newExpense.comment" placeholder="Комментарий"></textarea>
      <button @click="addExpense" :disabled="!isExpenseValid">Добавить расход</button>
    </div>

    <!-- Список операций -->
    <table>
      <thead>
        <tr>
          <th>Дата</th>
          <th>Тип</th>
          <th>Сумма</th>
          <th>Контрагент</th>
          <th>Комментарий</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="operation in operations" :key="operation.id">
          <td>{{ operation.createdAt }}</td>
          <td>{{ operation.type }}</td>
          <td>{{ operation.amount }} ₽</td>
          <td>
            {{
              operation.contractorId
                ? contractors.find(c => c.id === operation.contractorId)?.name
                : '-'
            }}
          </td>
          <td>{{ operation.comment }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useNuxtApp } from '#app';

const route = useRoute();
const objectId = route.params.id;

const operations = ref([]);
const contractors = ref([]); // Все контрагенты (мастера + работники)
const selectedCategory = ref(''); // Выбранная категория (master/worker)
const newComing = ref({
  amount: 0,
  comment: '',
  objectId: objectId,
});
const newExpense = ref({
  amount: 0,
  comment: '',
  contractorId: '',
  objectId: objectId,
});

// Вычисляемые свойства
const objectBalance = computed(() => {
  const totalComings = operations.value
    .filter(op => op.type === 'coming')
    .reduce((sum, op) => sum + (Number(op.amount) || 0), 0);
  const totalExpenses = operations.value
    .filter(op => op.type === 'expense')
    .reduce((sum, op) => sum + (Number(op.amount) || 0), 0);
  return (totalComings - totalExpenses).toFixed(2);
});

const isComingValid = computed(() => {
  return newComing.value.amount > 0;
});

const isExpenseValid = computed(() => {
  return (
    newExpense.value.amount > 0 &&
    newExpense.value.contractorId !== ''
  );
});

const filteredContractors = computed(() => {
  if (!selectedCategory.value) return [];
  return contractors.value.filter(
    c => c.type === selectedCategory.value // Проверка типа контрагента
  );
});

// Загрузка данных
onMounted(async () => {
  await fetchOperations();
  await fetchContractors();
});

async function fetchOperations() {
  try {
    const response = await useNuxtApp().$axios.get(`/objects/${objectId}/operations`);
    // Преобразование amount в число при маппинге
    operations.value = [
      ...response.data.comings.map(op => ({
        ...op,
        type: 'coming',
        amount: Number(op.amount) || 0 // !Важно!
      })),
      ...response.data.expenses.map(op => ({
        ...op,
        type: 'expense',
        amount: Number(op.amount) || 0 // !Важно!
      })),
    ];
  } catch (error) {
    console.error('Ошибка при получении операций:', error);
  }
}

async function fetchContractors() {
  try {
    // Загрузка мастеров и работников (нужен общий эндпоинт или два)
    const masterResponse = await useNuxtApp().$axios.get('/contractors/masters');
    const workerResponse = await useNuxtApp().$axios.get('/contractors/workers');
    contractors.value = [
      ...masterResponse.data.map(m => ({ ...m, type: 'master' })),
      ...workerResponse.data.map(w => ({ ...w, type: 'worker' })),
    ];
  } catch (error) {
    console.error('Ошибка при получении контрагентов:', error);
  }
}

// Добавление прихода
async function addComing() {
  if (!isComingValid.value) return;
  try {
    await useNuxtApp().$axios.post('/comings', {
      ...newComing.value,
      type: 'coming',
    });
    operations.value.push({
      ...newComing.value,
      type: 'coming',
      createdAt: new Date(),
    });
    newComing.value = {
      amount: 0,
      comment: '',
      objectId: objectId,
    };
  } catch (error) {
    console.error('Ошибка при добавлении прихода:', error);
  }
}

// Добавление расхода
async function addExpense() {
  if (!isExpenseValid.value) return;
  try {
    const expense = {
      ...newExpense.value,
      type: 'expense',
    };
    await useNuxtApp().$axios.post('/expenses', expense);
    operations.value.push({
      ...expense,
      createdAt: new Date(),
    });
    newExpense.value = {
      amount: 0,
      comment: '',
      contractorId: '',
      objectId: objectId,
    };
    selectedCategory.value = ''; // Сброс категории после добавления
  } catch (error) {
    console.error('Ошибка при добавлении расхода:', error);
  }
}
</script>

<style scoped>
.block {
  margin-bottom: 2rem;
}

.balance-summary {
  padding: 1rem;
  background-color: #f0f8ff;
  border-radius: 5px;
  margin-bottom: 1rem;
}

.form {
  margin-bottom: 1rem;
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 5px;
}

form button {
  margin-top: 0.5rem;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  padding: 0.5rem;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

tr:hover {
  background-color: #f5f5f5;
}
</style>
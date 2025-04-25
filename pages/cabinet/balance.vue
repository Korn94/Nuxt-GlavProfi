<template>
  <div class="container">
    <h1>Баланс предприятия</h1>
    <!-- Общий баланс -->
    <div class="balance-summary">
      <h2>Общий баланс</h2>
      <div class="balance-item">
        <strong>Доходы:</strong> {{ totalIncome }} ₽
      </div>
      <div class="balance-item">
        <strong>Расходы:</strong> {{ totalExpenses }} ₽
      </div>
      <div class="balance-item">
        <strong>Прибыль:</strong> {{ totalBalance }} ₽
      </div>
    </div>
    <!-- Баланс по объектам -->
    <div v-if="balanceByObjects.length > 0">
      <h2>Баланс по объектам</h2>
      <table>
        <thead>
          <tr>
            <th>Объект</th>
            <th>Доходы</th>
            <th>Расходы</th>
            <th>Баланс</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="obj in balanceByObjects" :key="obj.id">
            <td>{{ obj.name }}</td>
            <td>{{ obj.totalIncome }} ₽</td>
            <td>{{ obj.totalExpenses }} ₽</td>
            <td>{{ obj.balance }} ₽</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useNuxtApp } from '#app';

const totalIncome = ref(0);
const totalExpenses = ref(0);
const totalBalance = ref(0);
const balanceByObjects = ref([]);

definePageMeta({
  layout: 'cabinet',
  middleware: 'auth',
});

onMounted(async () => {
  await fetchBalance();
  await fetchBalanceByObjects();
});

async function fetchBalance() {
  try {
    const response = await useNuxtApp().$axios.get('/balance');
    totalIncome.value = response.data.totalIncome || 0;
    totalExpenses.value = response.data.totalExpenses || 0;
    totalBalance.value = response.data.totalBalance || 0;
  } catch (error) {
    console.error('Ошибка при получении общего баланса:', error);
  }
}

async function fetchBalanceByObjects() {
  try {
    const response = await useNuxtApp().$axios.get('/balance/objects');
    balanceByObjects.value = response.data;
  } catch (error) {
    console.error('Ошибка при получении баланса по объектам:', error);
  }
}
</script>

<style scoped>
.balance-summary {
  border: 1px solid #ccc;
  padding: 20px;
  margin-bottom: 20px;
}
.balance-item {
  margin-bottom: 10px;
}
table {
  width: 100%;
  border-collapse: collapse;
}
th, td {
  border: 1px solid #ddd;
  padding: 8px;
}
th {
  background-color: #f0f0f0;
}
</style>
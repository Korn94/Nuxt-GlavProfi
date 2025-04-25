<template>
  <div class="container">
    <h1>Аналитика</h1>
    <!-- График доходов/расходов по объектам -->
    <div class="chart">
      <h2>Баланс по объектам</h2>
      <Bar :chart-data="objectBalanceData" />
    </div>
    <!-- Диаграмма распределения задач по типам -->
    <div class="chart">
      <h2>Распределение задач</h2>
      <Pie :chart-data="taskTypeData" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useNuxtApp } from '#app';
import { Bar, Pie } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, ArcElement } from 'chart.js';

// Инициализация компонентов Chart.js
ChartJS.register(
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  ArcElement
);

const objectBalanceData = ref({
  labels: [],
  datasets: [
    {
      label: 'Доходы',
      backgroundColor: '#4CAF50',
      data: [],
    },
    {
      label: 'Расходы',
      backgroundColor: '#f44336',
      data: [],
    },
  ],
});

const taskTypeData = ref({
  labels: [],
  datasets: [
    {
      label: 'Количество задач',
      data: [],
      backgroundColor: ['#2196F3', '#4CAF50', '#FF9800', '#9C27B0'],
    },
  ],
});

onMounted(async () => {
  await fetchObjectStats();
  await fetchTaskStats();
});

async function fetchObjectStats() {
  try {
    const response = await useNuxtApp().$axios.get('/analytics/objects');
    const data = response.data;
    objectBalanceData.value.labels = data.map((obj) => obj.name);
    objectBalanceData.value.datasets[0].data = data.map((obj) => obj.totalIncome);
    objectBalanceData.value.datasets[1].data = data.map((obj) => obj.totalExpenses);
  } catch (error) {
    console.error('Ошибка загрузки статистики объектов:', error);
  }
}

async function fetchTaskStats() {
  try {
    const response = await useNuxtApp().$axios.get('/analytics/tasks');
    const data = response.data;
    taskTypeData.value.labels = data.map((item) => item.type);
    taskTypeData.value.datasets[0].data = data.map((item) => item.count);
  } catch (error) {
    console.error('Ошибка загрузки статистики задач:', error);
  }
}
</script>

<style scoped>
.chart {
  margin-bottom: 40px;
  width: 100%;
  max-width: 800px;
}
</style>
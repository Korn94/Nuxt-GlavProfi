<template>
  <div class="analytics-page">
    <h1>Аналитика</h1>

    <!-- Фильтры -->
    <div class="filters">
      <label for="start">Дата начала:</label>
      <input type="date" id="start" v-model="startDate" />

      <label for="end">Дата окончания:</label>
      <input type="date" id="end" v-model="endDate" />

      <select v-model="selectedObject" @change="loadAnalyticsData">
        <option value="">Все объекты</option>
        <option v-for="object in objects" :key="object.id" :value="object.id">{{ object.name }}</option>
      </select>

      <select v-model="selectedContractor" @change="loadAnalyticsData">
        <option value="">Все контрагенты</option>
        <option v-for="contractor in contractors" :key="contractor.id" :value="contractor.id">{{ contractor.name }}</option>
      </select>

      <select v-model="analysisType" @change="loadAnalyticsData">
        <option value="Финансы">Финансы</option>
        <option value="Материалы">Материалы</option>
        <option value="Работы">Работы</option>
      </select>
    </div>

    <!-- Карточки KPI -->
    <div class="kpi-cards">
      <div class="card">
        <h3>Общий приход</h3>
        <p>₽{{ totalIncome }}</p>
      </div>
      <div class="card">
        <h3>Общий расход</h3>
        <p>₽{{ totalExpenses }}</p>
      </div>
      <div class="card">
        <h3>Чистая прибыль</h3>
        <p>₽{{ netProfit }}</p>
      </div>
      <div class="card">
        <h3>Баланс</h3>
        <p>₽{{ balance }}</p>
      </div>
    </div>

    <!-- Диаграмма -->
    <div class="chart-container">
      <div ref="lineChartRef" style="width: 100%; height: 300px;"></div>
    </div>

    <!-- Таблица работ по сотрудникам -->
    <div class="table-container">
      <h2>Работы по сотрудникам</h2>
      <table>
        <thead>
          <tr>
            <th>Сотрудник</th>
            <th>Объем</th>
            <th>Оплачено</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(work, index) in workStats" :key="index">
            <td>{{ work.contractorName }}</td>
            <td>₽{{ work.totalAmount }}</td>
            <td>{{ work.paid ? 'Да' : 'Нет' }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Топ-список работ -->
    <div class="top-list">
      <h2>Топ 5 работ</h2>
      <ul>
        <li v-for="(item, index) in topWorks" :key="index">
          {{ item.workName }} — ₽{{ item.amount }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useFetch } from '#app'
import * as echarts from 'echarts'

// Модели UI
const startDate = ref('')
const endDate = ref('')
const selectedObject = ref(null)
const selectedContractor = ref(null)
const analysisType = ref('Финансы')

// Данные
const objects = ref([])
const contractors = ref([])
const totalIncome = ref(0)
const totalExpenses = ref(0)
const netProfit = ref(0)
const balance = ref(0)
const lineChartRef = ref(null)
const workStats = ref([])
const topWorks = ref([])

definePageMeta({
  layout: 'cabinet',
});

// Загрузка данных
onMounted(async () => {
  await fetchObjects()
  await fetchContractors()
  await loadAnalyticsData()
})

// Получить список объектов
async function fetchObjects() {
  const { data } = await useFetch('/api/objects')
  if (data.value) {
    objects.value = data.value
  }
}

// Получить список контрагентов (мастеров и рабочих)
async function fetchContractors() {
  // Пример: получить мастеров
  const { data } = await useFetch('/api/contractors/masters')
  if (data.value) {
    contractors.value = data.value
  }
}

// Загрузить данные аналитики
async function loadAnalyticsData() {
  try {
    const params = new URLSearchParams()

    if (startDate.value) params.append('start', startDate.value)
    if (endDate.value) params.append('end', endDate.value)
    if (selectedObject.value) params.append('objectId', selectedObject.value)
    if (selectedContractor.value) params.append('contractorId', selectedContractor.value)
    if (analysisType.value) params.append('type', analysisType.value)

    const { data } = await useFetch(`/api/analytics?${params.toString()}`)

    if (data.value) {
      const analytics = data.value

      totalIncome.value = analytics.totalIncome.toFixed(2)
      totalExpenses.value = analytics.totalExpenses.toFixed(2)
      netProfit.value = analytics.netProfit.toFixed(2)
      balance.value = analytics.balance.toFixed(2)
      workStats.value = analytics.workStats || []
      topWorks.value = analytics.topWorks || []

      if (lineChartRef.value) {
        drawLineChart(analytics.incomeData || [])
      }
    }
  } catch (error) {
    console.error('Ошибка загрузки аналитики:', error)
  }
}

// Отрисовать линейную диаграмму
function drawLineChart(data) {
  const chartDom = lineChartRef.value
  const myChart = echarts.init(chartDom)

  const option = {
    title: {
      text: 'Динамика доходов',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: data.map(item => item.date)
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: 'Доход',
        type: 'line',
        data: data.map(item => item.amount),
        smooth: true,
        itemStyle: {
          color: '#3b82f6'
        }
      }
    ]
  }

  myChart.setOption(option)
}
</script>

<style scoped>
.analytics-page {
  padding: 2rem;
  font-family: 'Roboto', sans-serif;
  background-color: #f8fafd;
}

.filters {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 2rem;
  align-items: center;
  justify-content: center;
}

.filters label {
  font-weight: bold;
  margin-right: 0.5rem;
}

.kpi-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.card {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  text-align: center;
}

.chart-container {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  margin-bottom: 2rem;
}

.table-container {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  overflow-x: auto;
  margin-bottom: 2rem;
}

table {
  width: 100%;
  border-collapse: collapse;
}

table th,
table td {
  padding: 0.75rem;
  border-bottom: 1px solid #e5e7eb;
  text-align: left;
}

.top-list {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

.top-list ul {
  list-style-type: none;
  padding-left: 0;
}

.top-list li {
  margin-bottom: 0.5rem;
}
</style>
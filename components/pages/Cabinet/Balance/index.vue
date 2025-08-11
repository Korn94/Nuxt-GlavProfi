<template>
  <div class="cabinet-balance">
    <h1>Баланс предприятия</h1>

    <!-- Общий баланс -->
    <div class="balance-card large highlight">
      <h2><span class="icon">💰</span>Общий баланс</h2>
      <p>{{ totalBalance }}</p>
    </div>

    <!-- Диаграмма: Приход / Расход -->
    <div class="chart-container">
      <div ref="chart" style="width: 100%; height: 300px;"></div>
    </div>

    <!-- Приход и расход -->
    <div class="grid-section">
      <div class="balance-card">
        <h2><span class="icon">➕</span>Приход</h2>
        <p>{{ totalComings }}</p>
      </div>

      <div class="balance-card">
        <h2><span class="icon">➖</span>Расход</h2>
        <p>{{ totalExpenses }}</p>
      </div>
    </div>

    <!-- Материалы -->
    <div class="materials-section">
      <div class="balance-card large">
        <h2><span class="icon">📦</span>Материалы (баланс)</h2>
        <p>{{ materialsBalance }}</p>
      </div>

      <!-- <div class="grid-subsection"> -->
        <div class="balance-card">
          <h3><span class="icon">📥</span>Приход по материалам</h3>
          <p>{{ materialsIncoming }}</p>
        </div>

        <div class="balance-card">
          <h3><span class="icon">📤</span>Расходы по материалам</h3>
          <p>{{ materialsOutgoing }}</p>
        </div>
      <!-- </div> -->
    </div>

    <!-- Работы -->
    <div class="balance-card large">
      <h2><span class="icon">🛠️</span>Работы, ожидающие оплаты</h2>
      <p>{{ pendingWorks }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useFetch } from '#app'
import * as echarts from 'echarts'

const totalComings = ref(0)
const totalExpenses = ref(0)
const totalBalance = ref(0)
const materialsIncoming = ref(0)
const materialsOutgoing = ref(0)
const materialsBalance = ref(0)
const pendingWorks = ref(0)

const chart = ref(null)

onMounted(async () => {
  try {
    const { data } = await useFetch('/api/balance')

    if (data.value) {
      totalComings.value = data.value.totalComings.toFixed(2)
      totalExpenses.value = data.value.totalExpenses.toFixed(2)
      totalBalance.value = (
        parseFloat(data.value.totalComings) -
        parseFloat(data.value.totalExpenses) +
        parseFloat(data.value.materials.balance)
      ).toFixed(2)

      materialsIncoming.value = data.value.materials.incoming.toFixed(2)
      materialsOutgoing.value = data.value.materials.outgoing.toFixed(2)
      materialsBalance.value = data.value.materials.balance.toFixed(2)
      pendingWorks.value = data.value.pendingWorks.toFixed(2)

      initChart()
    }
  } catch (error) {
    console.error('Ошибка загрузки данных о балансе:', error)
  }
})

function initChart() {
  const chartDom = chart.value
  const myChart = echarts.init(chartDom)

  const option = {
    title: {
      text: 'Финансовый баланс',
      left: 'center',
      top: 20,
      textStyle: {
        color: '#3b82f6',
        fontSize: 16
      }
    },
    tooltip: {
      trigger: 'item',
      formatter: '{a}<br/>{b}: {d}% ({c} руб.)'
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      top: 'middle',
      data: ['Приход', 'Расход']
    },
    series: [
      {
        name: 'Баланс',
        type: 'pie',
        radius: '50%',
        data: [
          { value: parseFloat(totalComings.value), name: 'Приход' },
          { value: parseFloat(totalExpenses.value), name: 'Расход' }
        ],
        itemStyle: {
          borderRadius: 4
        },
        label: {
          show: true,
          formatter: '{b}: {c} руб.'
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  }

  myChart.setOption(option)
}
</script>

<style lang="scss" scoped>
.cabinet-balance {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 2rem;
  background-color: #f8fafd;
  font-family: 'Roboto', sans-serif;

  h1 {
    color: #374151;
    text-align: center;
    margin-bottom: 1.5rem;
    font-size: 2.5rem;
    letter-spacing: .02em;
  }

  .balance-card {
    border-radius: 12px;
    box-shadow: rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px;
    background-color: white;
    padding: 1.5rem;
    transition: transform 0.2s ease-in-out;

    &:hover {
      transform: scale(1.03);
    }

    &.large {
      grid-column: span 2 / auto;
    }

    &.highlight {
      background-color: #e0f7fa;
      border-left: 4px solid #3b82f6;
    }

    h2, h3 {
      color: #3b82f6;
      font-weight: bold;
      font-size: 1rem;
      margin-bottom: 0.5rem;
      display: flex;
      align-items: center;
    }

    p {
      color: #6B7280;
      font-size: 1.25rem;
      line-height: 1.5;
    }

    .icon {
      font-size: 1rem;
      color: #3b82f6;
      margin-right: 0.5rem;
    }
  }

  .grid-section {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 1rem;
  }

  .materials-section {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    margin-top: 2rem;

    .grid-subsection {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 1rem;
    }
  }

  .chart-container {
    width: 100%;
    max-width: 900px;
    margin: auto;
    background-color: white;
    border-radius: 12px;
    box-shadow: rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px;
    padding: 1rem;
  }
}
</style>
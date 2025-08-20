<template>
  <section class="balance-section">
    <!-- <header class="balance-header">
      <h2>Общий баланс</h2>
    </header> -->
    <div v-if="loading" class="loading">Загрузка баланса...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else class="balance-grid">
      <!-- Приходы -->
      <div class="balance-item incoming">
        <span class="label">Приходы</span>
        <span class="value">+ {{ formatCurrency(props.balance.totalComings) }}</span>
      </div>
      <!-- Расходы -->
      <div class="balance-item expense">
        <span class="label">Расходы</span>
        <span class="value">- {{ formatCurrency(props.balance.totalExpenses) }}</span>
      </div>
      <!-- Материалы -->
      <div class="balance-item material">
        <span class="label">Материалы</span>
        <span class="value">{{ formatCurrency(props.balance.materials.balance) }}</span>
        <small class="details">
          (+{{ formatCurrency(props.balance.materials.incoming) }} / -{{ formatCurrency(props.balance.materials.outgoing) }})
        </small>
      </div>
      <div></div>
      <!-- Итого -->
      <div class="balance-item total">
        <span class="label">Итого</span>
        <span class="value">{{ formatCurrency(totalBalance) }}</span>
      </div>
      <div></div>

      <!-- Можно добавить пустое место, если нужно -->
      <!-- <div></div> -->

      <!-- График и список расходов -->
      <div class="balance-item chart" v-show="props.expenseStats.length > 0">
        <span class="label">Расходы по категориям</span>

        <div style="display: flex; margin-top: 10px; align-items: stretch;">

          <!-- График -->
          <div ref="chartRef" style="flex: 1; height: 200px;"></div>

          <!-- Цифры справа -->
          <!-- <div class="stats-list" style="flex: 0 0 140px; display: flex; flex-direction: column; justify-content: center; font-size: 0.95rem;">
            <div
              v-for="stat in props.expenseStats"
              :key="stat.expenseType"
              class="stat-item"
              style="display: flex; justify-content: space-between;"
            >
              <span style="color: #6c757d; margin-right: 10px;">{{ stat.expenseType }}</span>
              <span style="font-weight: 600; color: #dc3545;">-{{ formatCurrency(stat.total) }}</span>
            </div>
          </div> -->

        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  balance: { type: Object, default: null },
  loading: { type: Boolean, required: true },
  error: { type: String, default: null },
  expenseStats: { type: Array, default: () => [] }
})

// Вычисления и форматирование...
const totalBalance = computed(() => {
  return (
    (props.balance?.totalComings || 0) -
    (props.balance?.totalExpenses || 0) +
    (props.balance?.materials?.balance || 0)
  )
})

const formatCurrency = (amount) => {
  const num = parseFloat(amount) || 0
  return num.toLocaleString('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 2
  })
}

// Ссылка на DOM
const chartRef = ref(null)
let chartInstance = null

// Инициализация графика (с защитой от SSR)
const initChart = async () => {
  await nextTick() // Ждём монтирования
  if (!chartRef.value) return

  // Уничтожаем старый экземпляр, если есть
  if (chartInstance) {
    chartInstance.dispose()
  }

  // Инициализируем только на клиенте
  chartInstance = echarts.init(chartRef.value)

  // Обновляем график с текущими данными
  updateChart()
}

// Обновление графика
const updateChart = () => {
  if (!chartInstance) return
  if (!props.expenseStats?.length) {
    chartInstance.clear()
    return
  }

  // Сортируем по убыванию
  const sortedStats = props.expenseStats
    .slice()
    .sort((a, b) => b.total - a.total)

  // Добавляем сумму к названию категории
  const categories = sortedStats.map(stat => {
    const formattedAmount = stat.total.toLocaleString('ru-RU')
    return `${stat.expenseType}: ${formattedAmount} ₽`
  })

  const values = sortedStats.map(stat => stat.total)

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      formatter: (params) => {
        const data = params[0].data
        return `${params[0].name}: <b>${data.toLocaleString('ru-RU')} ₽</b>`
      }
    },
    grid: {
      left: '5%',
      right: '10%',
      top: '10%',
      bottom: '5%',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      axisLabel: {
        formatter: (value) => {
          return value.toLocaleString('ru-RU')
        }
      },
      splitLine: {
        show: true,
        lineStyle: { color: '#eee' }
      }
    },
    yAxis: {
      type: 'category',
      data: categories,  // <-- теперь с суммами
      axisLabel: {
        color: '#444',
        fontWeight: 500,
        // Опционально: если текст не влезает — уменьшаем размер шрифта
        fontSize: 12
      },
      axisTick: { show: false }
    },
    series: [
      {
        name: 'Расходы',
        type: 'bar',
        data: values,
        barWidth: '16px',
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: '#dc3545' },
            { offset: 1, color: '#ff8080' }
          ])
        },
        emphasis: {
          itemStyle: {
            color: '#c00'
          }
        }
      }
    ],
    animationDuration: 800
  }

  chartInstance.setOption(option, true)
}

// Только на клиенте и после монтирования
onMounted(() => {
  // Попробуем инициализировать график
  initChart()

  // Если данные придут позже — обновим
  if (props.expenseStats.length > 0) {
    updateChart()
  }
})

onBeforeUnmount(() => {
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
})

// Следим за изменениями данных
watch(
  () => props.expenseStats,
  (newStats) => {
    if (newStats?.length > 0) {
      // Если график ещё не инициализирован — инициализируем
      if (!chartInstance && chartRef.value) {
        initChart()
      } else {
        updateChart()
      }
    } else if (chartInstance) {
      chartInstance.clear()
    }
  },
  { deep: true, immediate: true }
)

// Следим за появлением DOM-элемента
watch(chartRef, (newVal) => {
  if (newVal && props.expenseStats.length > 0) {
    initChart()
  }
})
</script>

<style lang="scss" scoped>
// Переиспользуемый миксин для теней
@mixin hover-shadow {
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
}

.balance-header {
  text-align: center;
  margin-bottom: 1.5rem;

  h2 {
    font-size: 1.75rem;
    font-weight: 700;
    color: $color-dark;
    margin: 0;
  }
}

.loading,
.error {
  text-align: center;
  padding: 3rem 1rem;
  font-style: italic;
  color: $text-gray;
  font-size: 1.1rem;
}

.error {
  color: $color-danger;
}

.balance-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.2rem;
  margin-top: 1rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}

.balance-item {
  padding: 1.2rem;
  background: white;
  border-radius: $border-radius;
  box-shadow: $box-shadow;
  transition: $transition;
  text-align: center;

  &.chart {
    grid-column: span 3;
    background: $color-light;
    text-align: left;
    padding: 1.2rem 1.2rem 1rem;

    .label {
      color: $color-dark;
      font-size: 1rem;
      font-weight: 600;
    }

    @media (max-width: 768px) {
      grid-column: span 1;
      padding: 1rem;
    }
  }


  &:hover {
    transform: translateY(-2px);
    @include hover-shadow;
  }

  .label {
    display: block;
    font-size: 0.95rem;
    color: $text-gray;
    margin-bottom: 0.5rem;
    font-weight: 500;
  }

  .value {
    font-size: 1.4rem;
    font-weight: 700;
    line-height: 1.4;
  }

  small.details {
    display: block;
    font-size: 0.8rem;
    color: $text-gray;
    margin-top: 0.3rem;
    opacity: 0.9;
  }

  &.incoming .value { color: $color-success; }
  &.expense .value { color: $color-danger; }
  &.material .value { color: $color-primary; }
  &.total .value { color: $color-info; }

  &.total {
    // grid-column: span 3;
    background: $color-dark;
    color: white;
    text-align: center;
    padding: 1.5rem;

    .label {
      color: rgba(255, 255, 255, 0.9);
      font-size: 1rem;
    }

    .value {
      font-size: 1.8rem;
      font-weight: 800;
      color: white;
    }

    @media (max-width: 768px) {
      grid-column: span 1;
    }
  }

  &.stats {
    // grid-column: span 2;
    text-align: left;
    background: $color-light;
    font-size: 0.95rem;

    .label {
      color: $color-dark;
      font-size: 1rem;
      font-weight: 600;
    }

    .stats-list {
      margin-top: 0.6rem;
    }

    .stat-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.3rem 0;
      font-size: 0.95rem;

      &:last-child {
        border-bottom: none;
      }

      .stat-label {
        color: $text-gray;
        flex: 1;
      }

      .stat-amount {
        font-weight: 600;
        color: $color-danger;
        white-space: nowrap;
        margin-left: 1rem;
      }
    }

    @media (max-width: 768px) {
      grid-column: span 1;
    }
  }
}
</style>
<!-- app/components/pages/cabinet/Operation/BalanceSummary.vue -->
<template>
  <div class="balance">

    <!-- Загрузка -->
    <div v-if="loading" class="balance__skeleton">
      <div class="skel skel--wide" />
      <div class="balance__metrics-skeleton">
        <div class="skel" />
        <div class="skel" />
        <div class="skel" />
        <div class="skel" />
      </div>
    </div>

    <!-- Ошибка -->
    <div v-else-if="error" class="balance__state">
      <Icon name="mdi:alert-circle-outline" size="28" />
      <span>{{ error }}</span>
    </div>

    <!-- Данные -->
    <template v-else-if="balance">

      <!-- Итоговый баланс -->
      <div class="balance__total">
        <div class="balance__total-left">
          <span class="balance__total-label">Итого за период</span>
          <span class="balance__total-value"
            :class="totalBalance >= 0 ? 'balance__total-value--pos' : 'balance__total-value--neg'">
            {{ formatCurrency(totalBalance) }}
          </span>
        </div>
        <div class="balance__total-right">
          <div class="balance__period">
            <Icon name="mdi:calendar-range" size="14" />
            <span>Текущий период</span>
          </div>
        </div>
      </div>

      <!-- Метрики -->
      <div class="balance__metrics">
        <div class="bm bm--income">
          <div class="bm__icon">
            <Icon name="mdi:trending-up" size="16" />
          </div>
          <div class="bm__info">
            <span class="bm__label">Приходы</span>
            <span class="bm__value">+{{ formatCurrency(balance.totalComings) }}</span>
          </div>
        </div>

        <div class="bm bm--expense">
          <div class="bm__icon">
            <Icon name="mdi:trending-down" size="16" />
          </div>
          <div class="bm__info">
            <span class="bm__label">Расходы</span>
            <span class="bm__value">-{{ formatCurrency(balance.totalExpenses) }}</span>
          </div>
        </div>

        <div class="bm bm--materials">
          <div class="bm__icon">
            <Icon name="mdi:package-variant" size="16" />
          </div>
          <div class="bm__info">
            <span class="bm__label">Материалы</span>
            <span class="bm__value">{{ formatCurrency(balance.materials?.balance) }}</span>
            <span class="bm__sub">
              +{{ formatCurrency(balance.materials?.incoming) }} /
              -{{ formatCurrency(balance.materials?.outgoing) }}
            </span>
          </div>
        </div>

        <div class="bm bm--pending">
          <div class="bm__icon">
            <Icon name="mdi:clock-outline" size="16" />
          </div>
          <div class="bm__info">
            <span class="bm__label">В работе</span>
            <span class="bm__value">{{ formatCurrency(balance.pendingWorks) }}</span>
          </div>
        </div>
      </div>

      <!-- График -->
      <div v-if="expenseStats?.length" class="balance__chart">
        <div class="balance__chart-header">
          <span class="balance__chart-title">Расходы по категориям</span>
          <span class="balance__chart-count">{{ expenseStats.length }}</span>
        </div>
        <div ref="chartRef" class="balance__chart-canvas" />
      </div>

    </template>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import * as echarts from 'echarts'

const props = defineProps < {
  balance?: any
  loading: boolean
  error?: string | null
  expenseStats?: any[]
} > ()

// ── График ───────────────────────────────────────────────────────────
const chartRef = ref < HTMLElement | null > (null)
let chartInstance: echarts.ECharts | null = null

const totalBalance = computed(() =>
  (props.balance?.totalComings || 0) -
  (props.balance?.totalExpenses || 0) +
  (props.balance?.materials?.balance || 0)
)

const formatCurrency = (amount: any) =>
  (parseFloat(amount) || 0).toLocaleString('ru-RU', {
    style: 'currency', currency: 'RUB', minimumFractionDigits: 0
  })

// ── Инициализация графика ─────────────────────────────────────────────
async function initChart() {
  await nextTick()
  if (!chartRef.value) return

  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }

  chartInstance = echarts.init(chartRef.value)
  updateChart()
}

function updateChart() {
  if (!chartInstance || !props.expenseStats?.length) {
    chartInstance?.clear()
    return
  }

  const sorted = [...props.expenseStats].sort((a, b) => b.total - a.total)
  const total = sorted.reduce((sum, s) => sum + s.total, 0)

  const categories = sorted.map(s => {
    const pct = total > 0 ? ((s.total / total) * 100).toFixed(1) : '0'
    return `${s.expenseType}  ${s.total.toLocaleString('ru-RU')} ₽ (${pct}%)`
  })

  const values = sorted.map(s => s.total)

  chartInstance.setOption({
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: '#1a1e28',
      borderColor: 'rgba(255,255,255,0.07)',
      textStyle: { color: '#e2e4ec', fontSize: 12 },
      formatter: (params: any) => {
        const cat = params[0].name.split('  ')[0]
        const val = params[0].data.toLocaleString('ru-RU')
        return `<b>${cat}</b><br/>${val} ₽`
      }
    },
    grid: {
      left: '2%', right: '4%', top: '4%', bottom: '2%',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      axisLabel: {
        color: '#7a7f96',
        fontSize: 11,
        formatter: (v: number) => v.toLocaleString('ru-RU')
      },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'category',
      data: categories,
      axisLabel: {
        color: '#9aa0b8',
        fontSize: 12,
        fontWeight: 400,
        width: 280,
        overflow: 'truncate',
      },
      axisTick: { show: false },
      axisLine: { show: false },
    },
    series: [{
      type: 'bar',
      data: values,
      barWidth: '14px',
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
          { offset: 0, color: 'rgba(242,95,92,0.4)' },
          { offset: 1, color: '#f25f5c' },
        ]),
        borderRadius: [0, 4, 4, 0],
      },
      emphasis: {
        itemStyle: { color: '#f25f5c' }
      },
    }],
    animationDuration: 600,
  }, true)
}

// ── Resize ────────────────────────────────────────────────────────────
function onResize() {
  chartInstance?.resize()
}

// ── Lifecycle ────────────────────────────────────────────────────────
onMounted(() => {
  if (props.expenseStats?.length) initChart()
  window.addEventListener('resize', onResize)
})

onBeforeUnmount(() => {
  chartInstance?.dispose()
  chartInstance = null
  window.removeEventListener('resize', onResize)
})

watch(() => props.expenseStats, (stats) => {
  if (!stats?.length) { chartInstance?.clear(); return }
  if (!chartInstance && chartRef.value) initChart()
  else updateChart()
}, { deep: true })

watch(chartRef, (el) => {
  if (el && props.expenseStats?.length) initChart()
})
</script>

<style lang="scss" scoped>
.balance {
  display: flex;
  flex-direction: column;
  background: var(--crm-bg-surface);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-lg);
  overflow: hidden;
}

// ── Итог ────────────────────────────────────────────────────────────
.balance__total {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--crm-border);

  &-left {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  &-label {
    font-size: var(--crm-text-sm);
    color: var(--crm-text-muted);
  }

  &-value {
    font-size: 28px;
    font-weight: 700;
    line-height: 1;

    &--pos {
      color: var(--crm-success);
    }

    &--neg {
      color: var(--crm-danger);
    }
  }

  &-right {
    flex-shrink: 0;
  }
}

.balance__period {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: var(--crm-text-xs);
  color: var(--crm-text-muted);
  background: var(--crm-bg-elevated);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-md);
  padding: 5px 10px;
}

// ── Метрики ─────────────────────────────────────────────────────────
.balance__metrics {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  border-bottom: 1px solid var(--crm-border);

  @media (max-width: 700px) {
    grid-template-columns: repeat(2, 1fr);
  }
}

.bm {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  border-right: 1px solid var(--crm-border);

  &:last-child {
    border-right: none;
  }

  &__icon {
    width: 32px;
    height: 32px;
    border-radius: var(--crm-radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  &__info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  &__label {
    font-size: var(--crm-text-xs);
    color: var(--crm-text-muted);
    white-space: nowrap;
  }

  &__value {
    font-size: var(--crm-text-md);
    font-weight: 700;
    color: var(--crm-text-primary);
    white-space: nowrap;
  }

  &__sub {
    font-size: var(--crm-text-xs);
    color: var(--crm-text-disabled);
    white-space: nowrap;
  }

  &--income .bm__icon {
    background: var(--crm-success-dim);
    color: var(--crm-success);
  }

  &--expense .bm__icon {
    background: var(--crm-danger-dim);
    color: var(--crm-danger);
  }

  &--materials .bm__icon {
    background: var(--crm-info-dim);
    color: var(--crm-info);
  }

  &--pending .bm__icon {
    background: var(--crm-warning-dim);
    color: var(--crm-warning);
  }
}

// ── График ──────────────────────────────────────────────────────────
.balance__chart {
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;

  &-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &-title {
    font-size: var(--crm-text-sm);
    font-weight: 600;
    color: var(--crm-text-secondary);
  }

  &-count {
    font-size: var(--crm-text-xs);
    font-weight: 600;
    padding: 1px 7px;
    background: var(--crm-bg-overlay);
    border: 1px solid var(--crm-border-hover);
    border-radius: 10px;
    color: var(--crm-text-muted);
  }

  &-canvas {
    height: 220px;
    width: 100%;
  }
}

// ── Скелетон ────────────────────────────────────────────────────────
.balance__skeleton {
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.balance__metrics-skeleton {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;

  @media (max-width: 700px) {
    grid-template-columns: repeat(2, 1fr);
  }
}

.skel {
  height: 52px;
  border-radius: var(--crm-radius-md);
  background: linear-gradient(90deg,
      var(--crm-bg-elevated) 25%,
      var(--crm-bg-overlay) 50%,
      var(--crm-bg-elevated) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.6s infinite;

  &--wide {
    height: 36px;
  }
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }

  100% {
    background-position: -200% 0;
  }
}

// ── Состояние ошибки ────────────────────────────────────────────────
.balance__state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 30px 20px;
  color: var(--crm-danger);
  font-size: var(--crm-text-sm);
}
</style>
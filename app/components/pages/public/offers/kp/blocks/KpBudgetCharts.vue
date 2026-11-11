<!-- app/components/pages/public/offers/kp/blocks/KpBudgetCharts.vue -->
<template>
  <section v-if="charts.length" class="kp-section kp-section--charts">
    <div class="kp-container">
      <h2 v-if="title" class="kp-h2">{{ title }}</h2>
      <p v-if="lead" class="kp-lead">{{ lead }}</p>

      <div class="kp-charts">
        <div
          v-for="chart in charts"
          :key="chart.key"
          class="kp-chart-card"
          :class="{ 'kp-chart-card--wide': charts.length === 1 }"
        >
          <div class="kp-chart-card__head">
            <h3>{{ chart.title }}</h3>
            <span>{{ chart.hint }}</span>
          </div>
          <UiEChart :option="chart.option" height="300px" />
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { EChartsOption } from 'echarts'
import UiEChart from '../ui/EChart.client.vue'
import type { KpResolvedGroup } from '../composables/useKpDocument'
import { formatPrice } from '../composables/useKpDocument'

const props = withDefaults(defineProps<{
  /** Группы сметы из useKpDocument() */
  groups: KpResolvedGroup[]
  title?: string
  lead?: string
  /** both — «группы + разделы», split — только группы, structure — только разделы */
  mode?: 'both' | 'split' | 'structure'
}>(), {
  title: 'Структура бюджета',
  lead: '',
  mode: 'both',
})

/** Палитра сегментов (циклически повторяется) */
const PALETTE = ['#00c3f5', '#02feff', '#00A12A', '#FAB702', '#6610f2', '#fd7e14', '#e83e8c', '#6c757d']

const tooltip: EChartsOption['tooltip'] = {
  trigger: 'item',
  backgroundColor: 'rgba(24,25,27,.95)',
  borderColor: 'transparent',
  textStyle: { color: '#fff' },
  formatter: (params: any) => `<b>${params.name}</b><br/>${formatPrice(params.value)} ₽ · ${params.percent}%`,
}

/** Доли групп: «Работы / Материалы» */
const splitData = computed(() =>
  props.groups
    .filter(group => group.total > 0)
    .map(group => ({ label: group.label, value: group.total })),
)

/**
 * Разделы сметы: разделы разных групп с одинаковым chartKey объединяются
 * (например «Потолки» = работы по потолкам + материалы для потолков).
 */
const structureData = computed(() => {
  const map = new Map<string, { label: string, value: number }>()

  for (const group of props.groups) {
    for (const section of group.sections) {
      const key = section.chartKey || section.key
      const label = section.chartLabel || section.title
      const slice = map.get(key)

      if (slice) slice.value += section.total
      else map.set(key, { label, value: section.total })
    }
  }

  return [...map.values()].filter(slice => slice.value > 0)
})

const splitOption = computed<EChartsOption>(() => ({
  tooltip,
  legend: {
    bottom: 0,
    icon: 'circle',
    itemGap: 20,
    textStyle: { color: '#333', fontSize: 13, fontFamily: 'Rubik' },
  },
  series: [
    {
      type: 'pie',
      radius: ['58%', '82%'],
      center: ['50%', '45%'],
      avoidLabelOverlap: false,
      label: { show: false },
      labelLine: { show: false },
      itemStyle: { borderColor: '#fff', borderWidth: 4, borderRadius: 10 },
      data: splitData.value.map((slice, index) => ({
        value: slice.value,
        name: slice.label,
        itemStyle: { color: PALETTE[index % PALETTE.length] },
      })),
    },
  ],
}))

const structureOption = computed<EChartsOption>(() => ({
  tooltip,
  legend: {
    bottom: 0,
    icon: 'circle',
    itemGap: 14,
    textStyle: { color: '#333', fontSize: 12, fontFamily: 'Rubik' },
  },
  series: [
    {
      type: 'pie',
      radius: ['0%', '68%'],
      center: ['50%', '42%'],
      label: { show: false },
      itemStyle: { borderColor: '#fff', borderWidth: 3, borderRadius: 6 },
      data: structureData.value.map((slice, index) => ({
        value: slice.value,
        name: slice.label,
        itemStyle: { color: PALETTE[index % PALETTE.length] },
      })),
    },
  ],
}))

const charts = computed<{ key: string, title: string, hint: string, option: EChartsOption }[]>(() => {
  const result: { key: string, title: string, hint: string, option: EChartsOption }[] = []

  if (props.mode !== 'structure' && splitData.value.length > 1) {
    result.push({
      key: 'groups',
      title: props.groups.map(group => group.label).join(' / '),
      hint: 'Доля от общей суммы',
      option: splitOption.value,
    })
  }

  if (props.mode !== 'split' && structureData.value.length > 0) {
    result.push({
      key: 'sections',
      title: 'Разделы сметы',
      hint: 'Итоговая стоимость по блокам',
      option: structureOption.value,
    })
  }

  return result
})
</script>

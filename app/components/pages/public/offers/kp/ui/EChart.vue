<!-- app/components/pages/public/offers/kp/ui/EChart.vue -->
<template>
  <div ref="el" class="echart" :style="{ height }" />
</template>

<script setup lang="ts">
// Только типы: сам echarts грузится лениво в onMounted, поэтому в SSR он не нужен.
import type * as echarts from 'echarts'

const props = withDefaults(defineProps<{
  option: echarts.EChartsOption
  height?: string
}>(), {
  height: '300px',
})

const el = ref<HTMLDivElement | null>(null)
let instance: echarts.ECharts | null = null
let ro: ResizeObserver | null = null

/**
 * ⚠️ Компонент сознательно НЕ client-only (никакого EChart.client.vue):
 * для client-only компонентов Nuxt рендерит на сервере заглушку <div> и переносит
 * на неё только fall-through атрибуты — class/style из этого шаблона после
 * hydration в DOM не попадают (Vue такие расхождения только предупреждает,
 * но не исправляет). Контейнер остаётся высотой 0px, и ECharts рисует пустой
 * график: «[ECharts] Can't get DOM width or height».
 *
 * При SSR сервер отдаёт настоящий <div class="echart" style="height:300px">,
 * hydration совпадает, и к моменту onMounted у контейнера уже есть размеры.
 *
 * echarts подключается динамически: на сервере библиотека не нужна вообще,
 * на клиенте её chunk подгружается один раз.
 */
onMounted(async () => {
  if (!el.value) return

  let echartsLib: typeof import('echarts')
  try {
    echartsLib = await import('echarts')
  } catch (error) {
    console.error('[EChart] Не удалось загрузить echarts', error)
    return
  }

  // Компонент мог размонтироваться, пока грузился chunk
  if (!el.value) return

  instance = echartsLib.init(el.value, undefined, { renderer: 'svg' })
  // Опция читается после await — применится актуальное значение
  instance.setOption(props.option)

  ro = new ResizeObserver(() => instance?.resize())
  ro.observe(el.value)
})

onBeforeUnmount(() => {
  ro?.disconnect()
  ro = null
  instance?.dispose()
  instance = null
})

watch(() => props.option, (opt) => {
  instance?.setOption(opt, true)
}, { deep: true })
</script>

<style scoped lang="scss">
.echart {
  width: 100%;
}
</style>

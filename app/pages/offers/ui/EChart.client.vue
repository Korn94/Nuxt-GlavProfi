<!-- app\pages\offers\ui\EChart.client.vue -->
 <template>
  <div ref="el" class="echart" :style="{ height }" />
</template>

<script setup lang="ts">
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'

const props = withDefaults(defineProps<{
  option: EChartsOption
  height?: string
}>(), {
  height: '340px',
})

const el = ref<HTMLDivElement | null>(null)
let instance: echarts.ECharts | null = null
let ro: ResizeObserver | null = null

onMounted(() => {
  if (!el.value) return
  instance = echarts.init(el.value, undefined, { renderer: 'svg' })
  instance.setOption(props.option)

  ro = new ResizeObserver(() => instance?.resize())
  ro.observe(el.value)
})

onBeforeUnmount(() => {
  ro?.disconnect()
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
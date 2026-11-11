<!-- app/components/pages/public/offers/kp/KpPage.vue -->
<template>
  <KpDocument>
    <KpHero :meta="activeData.meta" :total="doc.grandTotal" />

    <KpVariantSwitch
      v-if="variantOptions.length > 1"
      :model-value="variantKey"
      :variants="variantOptions"
      @update:model-value="setVariant"
    />

    <KpSummary :cards="doc.summaryCards" />

    <KpEstimate
      :groups="doc.groups"
      :grand-total="doc.grandTotal"
      v-bind="activeData.estimate ?? {}"
    />

    <KpBudgetCharts :groups="doc.groups" v-bind="activeData.charts ?? {}" />

    <KpCallout
      v-for="(callout, index) in activeData.callouts ?? []"
      :key="index"
      v-bind="callout"
    />

    <KpNotes :items="activeData.notes ?? []" :title="activeData.notesTitle" />

    <KpFooterCta v-bind="activeData.footer ?? {}" />
  </KpDocument>
</template>

<script setup lang="ts">
import KpDocument from './KpDocument.vue'
import KpHero from './blocks/KpHero.vue'
import KpSummary from './blocks/KpSummary.vue'
import KpEstimate from './blocks/KpEstimate.vue'
import KpBudgetCharts from './blocks/KpBudgetCharts.vue'
import KpCallout from './blocks/KpCallout.vue'
import KpNotes from './blocks/KpNotes.vue'
import KpFooterCta from './blocks/KpFooterCta.vue'
import KpVariantSwitch from './blocks/KpVariantSwitch.vue'
import { useKpDocument } from './composables/useKpDocument'
import {
  getDefaultVariantKey,
  getVariantSummary,
  resolveKpData,
} from './composables/useKpVariants'
import type { KpData } from './types'

const props = defineProps<{
  /** Данные КП: база + варианты */
  offer: KpData
  /** Вариант для старых ссылок (например /offers/<slug>-1) */
  initialVariant?: string
}>()

const route = useRoute()
const router = useRouter()

const variantOptions = computed(() => getVariantSummary(props.offer))
const defaultKey = computed(() => getDefaultVariantKey(props.offer))
const variantKeys = computed(() => new Set((props.offer.variants ?? []).map(variant => variant.key)))

const readQueryVariant = (): string => {
  const value = route.query.variant
  return typeof value === 'string' ? value : ''
}

/** Приоритет: query → initialVariant → default → первый */
const resolveInitialKey = (): string => {
  const fromQuery = readQueryVariant()
  if (fromQuery && variantKeys.value.has(fromQuery)) return fromQuery
  if (props.initialVariant && variantKeys.value.has(props.initialVariant)) return props.initialVariant
  return defaultKey.value ?? ''
}

const variantKey = ref(resolveInitialKey())

const activeData = computed(() => resolveKpData(props.offer, variantKey.value))
const doc = useKpDocument(activeData)

/** Записываем выбранный вариант в query (без засорения истории) */
const syncQuery = () => {
  const query = { ...route.query }

  if (!variantKey.value || variantKey.value === defaultKey.value) delete query.variant
  else query.variant = variantKey.value

  router.replace({ query })
}

const setVariant = (key: string) => {
  variantKey.value = key
  syncQuery()
}

/** Back/forward и переходы по прямым ссылкам с ?variant= */
watch(() => route.query.variant, (value) => {
  const key = typeof value === 'string' ? value : ''
  const next = key && variantKeys.value.has(key) ? key : (defaultKey.value ?? '')

  if (next !== variantKey.value) variantKey.value = next
})

/** Если данные документа заменят на лету — сбрасываем выбор */
watch(() => props.offer, () => {
  variantKey.value = resolveInitialKey()
})
</script>

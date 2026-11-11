<!-- app/components/pages/public/offers/kp/blocks/KpVariantSwitch.vue -->
<template>
  <section v-if="variants.length > 1" class="kp-section kp-section--variants">
    <div class="kp-container">
      <div
        class="kp-variant-switch"
        role="tablist"
        aria-label="Варианты коммерческого предложения"
      >
        <button
          v-for="variant in variants"
          :key="variant.key"
          type="button"
          role="tab"
          class="kp-variant-switch__btn"
          :class="{ 'is-active': variant.key === modelValue }"
          :aria-selected="variant.key === modelValue"
          @click="select(variant.key)"
        >
          <Icon v-if="variant.icon" :name="variant.icon" />

          <span class="kp-variant-switch__label kp-variant-switch__label--full">
            {{ variant.label }}
          </span>
          <span class="kp-variant-switch__label kp-variant-switch__label--short">
            {{ variant.shortLabel || variant.label }}
          </span>

          <span class="kp-variant-switch__sum">{{ formatPrice(variant.total) }} ₽</span>

          <span
            v-if="variant.deltaPercent"
            class="kp-variant-switch__delta"
            :class="{ 'is-up': variant.deltaPercent > 0 }"
          >
            {{ variant.deltaPercent > 0 ? '+' : '' }}{{ variant.deltaPercent }}%
          </span>

          <span v-if="variant.badge" class="kp-variant-switch__tag">{{ variant.badge }}</span>
        </button>
      </div>

      <p v-if="activeHint" class="kp-variant-switch__hint">{{ activeHint }}</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { KpVariantSummary } from '../composables/useKpVariants'
import { formatPrice } from '../composables/useKpDocument'

const props = defineProps<{
  /** Варианты с уже посчитанными итогами */
  variants: KpVariantSummary[]
  /** Активный вариант */
  modelValue: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

/** Пояснение активного варианта (если задано в данных) */
const activeHint = computed(() =>
  props.variants.find(variant => variant.key === props.modelValue)?.hint ?? '',
)

const select = (key: string) => {
  if (key !== props.modelValue) emit('update:modelValue', key)
}
</script>

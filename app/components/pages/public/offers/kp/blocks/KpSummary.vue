<!-- app/components/pages/public/offers/kp/blocks/KpSummary.vue -->
<template>
  <section v-if="cards.length" class="kp-section">
    <div class="kp-container">
      <div class="kp-summary">
        <article
          v-for="card in cards"
          :key="card.label"
          class="kp-card"
          :class="{
            'kp-card--materials': card.tone === 'materials',
            'kp-card--total': card.tone === 'total',
          }"
        >
          <div class="kp-card__icon">
            <Icon :name="card.icon || defaultIcon(card.tone)" />
          </div>
          <div class="kp-card__label">{{ card.label }}</div>
          <div class="kp-card__value">{{ formatPrice(card.value) }} ₽</div>
          <div v-if="card.hint" class="kp-card__hint">{{ card.hint }}</div>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { KpResolvedCard } from '../composables/useKpDocument'
import { formatPrice } from '../composables/useKpDocument'

defineProps<{
  /** Готовые карточки из useKpDocument().summaryCards */
  cards: KpResolvedCard[]
}>()

const defaultIcon = (tone: KpResolvedCard['tone']): string => {
  if (tone === 'total') return 'material-symbols:payments-outline'
  if (tone === 'materials') return 'material-symbols:inventory-2-outline'
  return 'material-symbols:construction'
}
</script>

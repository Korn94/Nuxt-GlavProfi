<!-- app/components/pages/public/offers/kp/blocks/KpHero.vue -->
<template>
  <header class="kp-hero">
    <div class="kp-hero__bg" aria-hidden="true" />

    <div class="kp-container kp-hero__inner">
      <div class="kp-hero__brand">
        <span class="kp-hero__brand-word"><span>Г</span>лав<span>П</span>рофи</span>
        <span class="kp-hero__brand-note">коммерческое предложение</span>
      </div>

      <div v-if="meta.badge !== null" class="kp-hero__badge">
        <Icon :name="meta.badgeIcon || 'material-symbols:description-outline'" />
        {{ meta.badge || 'Предварительный рассчет' }}
      </div>

      <!-- Пробелы-разделители формируются в рантайме: статичные пробелы
           Vue «схлопывает» при компиляции шаблона -->
      <h1 class="kp-hero__title">{{ meta.title }}<span v-if="meta.titleAccent">{{ ' ' + meta.titleAccent }}</span>{{ meta.titleSuffix ? ' · ' + meta.titleSuffix : '' }}</h1>

      <p v-if="meta.object" class="kp-hero__subtitle">{{ meta.object }}</p>

      <ul class="kp-hero__meta">
        <li v-if="meta.number">
          <span>№ документа</span>
          <b>{{ meta.number }}</b>
        </li>
        <li v-if="meta.date">
          <span>Дата</span>
          <b>{{ meta.date }}</b>
        </li>
        <li v-if="meta.validUntil">
          <span>Действует до</span>
          <b>{{ meta.validUntil }}</b>
        </li>
        <li v-if="meta.customer">
          <span>Заказчик</span>
          <b>{{ meta.customer }}</b>
        </li>
      </ul>

      <div class="kp-hero__total">
        <div class="kp-hero__total-label">{{ meta.totalLabel || 'Итого по смете' }}</div>
        <div class="kp-hero__total-value">
          {{ formatPrice(total) }}<small>₽</small>
        </div>
        <div v-if="meta.totalNote" class="kp-hero__total-note">{{ meta.totalNote }}</div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import type { KpMeta } from '../types'
import { formatPrice } from '../composables/useKpDocument'

defineProps<{
  /** Шапка: заголовок, объект, номер, даты */
  meta: KpMeta
  /** Итоговая сумма документа */
  total: number
}>()
</script>

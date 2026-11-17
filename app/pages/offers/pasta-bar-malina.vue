<!-- app/pages/offers/pasta-bar-malina.vue -->
<template>
  <KpPage :offer="offer" />
</template>

<script setup lang="ts">
import KpPage from '~/components/pages/public/offers/kp/KpPage.vue'
import offer from '~/components/pages/public/offers/data/pasta-bar-malina'

definePageMeta({
  layout: 'empy',
})

useSeoMeta({
  title: 'Коммерческое предложение — отделка паста-бара «Хорошие руки»',
  description: 'Смета на демонтаж, каркас и обшивку фанерой, шпаклёвку и покраску стен, LED-подсветку с барельефами, реставрацию ширм и плинтус — ТЦ Малина, Соборная ул., 15А, г. Рязань.',
  robots: 'noindex, nofollow',
})
</script>

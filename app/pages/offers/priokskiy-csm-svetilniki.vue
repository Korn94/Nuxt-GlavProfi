<!-- app/pages/offers/priokskiy-csm-svetilniki.vue -->
<template>
  <KpPage :offer="offer" />
</template>

<script setup lang="ts">
import KpPage from '~/components/pages/public/offers/kp/KpPage.vue'
import offer from '~/components/pages/public/offers/data/priokskiy-csm-svetilniki'

definePageMeta({
  layout: 'empy',
})

useSeoMeta({
  title: 'Коммерческое предложение — замена светильников ФБУ «Приокский ЦСМ»',
  description: 'Смета на замену светильников в административном и метрологическом корпусах (г. Рязань, проезд Старообрядческий, 5).',
  robots: 'noindex, nofollow',
})
</script>

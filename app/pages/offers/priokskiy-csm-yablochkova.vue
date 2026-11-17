<!-- app/pages/offers/priokskiy-csm-yablochkova.vue -->
<template>
  <KpPage :offer="offer" />
</template>

<script setup lang="ts">
import KpPage from '~/components/pages/public/offers/kp/KpPage.vue'
import offer from '~/components/pages/public/offers/data/priokskiy-csm-yablochkova'

definePageMeta({
  layout: 'empy',
})

useSeoMeta({
  title: 'Коммерческое предложение — потолочные работы ФБУ «Приокский ЦСМ»',
  description: 'Смета на монтаж подвесного потолка «Армстронг», свет, материалы и логистику для помещения 363 м² (г. Рязань, ул. Яблочкова, 5к27).',
  robots: 'noindex, nofollow',
})
</script>

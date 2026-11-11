<!-- app/pages/offers/priokskiy-csm.vue -->
<template>
  <KpPage :offer="offer" />
</template>

<script setup lang="ts">
import KpPage from '~/components/pages/public/offers/kp/KpPage.vue'
import offer from '~/components/pages/public/offers/data/priokskiy-csm'

definePageMeta({
  layout: 'empy',
})

useSeoMeta({
  title: 'Коммерческое предложение — отделка офисов ФБУ «Приокский ЦСМ»',
  description: 'Смета на демонтажные и отделочные работы, логистику и материалы для четырёх офисных помещений (110,91 м²).',
  robots: 'noindex, nofollow',
})
</script>

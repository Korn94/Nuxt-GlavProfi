<!-- app/pages/offers/priokskiy-csm-sosedniy-kabinet.vue -->
<template>
  <KpPage :offer="offer" />
</template>

<script setup lang="ts">
import KpPage from '~/components/pages/public/offers/kp/KpPage.vue'
import offer from '~/components/pages/public/offers/data/priokskiy-csm-sosedniy-kabinet'

definePageMeta({
  layout: 'empy',
})

useSeoMeta({
  title: 'Коммерческое предложение — отделка кабинета на 2-м этаже ФБУ «Приокский ЦСМ»',
  description: 'Смета на демонтажные и отделочные работы, логистику и материалы для соседнего кабинета на 2-м этаже (28,90 м²).',
  robots: 'noindex, nofollow',
})
</script>

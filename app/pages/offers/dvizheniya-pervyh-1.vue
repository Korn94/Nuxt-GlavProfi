<!-- app/pages/offers/dvizheniya-pervyh-1.vue -->
<!-- Старая ссылка на второй вариант: открывает тот же документ сразу на «Армстронге». -->
<template>
  <KpPage :offer="offer" initial-variant="armstrong" />
</template>

<script setup lang="ts">
import KpPage from '~/components/pages/public/offers/kp/KpPage.vue'
import offer from '~/components/pages/public/offers/data/dvizheniya-pervyh'

definePageMeta({
  layout: 'empy',
})

useSeoMeta({
  title: 'Коммерческое предложение — отделка офисного пространства',
  description: 'Смета на отделочные и электромонтажные работы, а также материалы.',
  robots: 'noindex, nofollow',
})
</script>

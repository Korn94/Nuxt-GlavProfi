<!-- app/pages/offers/dvizheniya-pervyh.vue -->
<template>
  <KpPage :offer="offer" />
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

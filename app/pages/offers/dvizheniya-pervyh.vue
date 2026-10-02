<!-- app/pages/offers/dvizheniya-pervyh.vue -->
<template>
  <OffersIndex />
</template>

<script setup lang="ts">
import OffersIndex from '~/components/pages/public/offers/index.vue'

definePageMeta({
  layout: 'empy',
})

useSeoMeta({
  title: 'Коммерческое предложение — отделка офисного пространства',
  description: 'Смета на отделочные и электромонтажные работы, а также материалы.',
  robots: 'noindex, nofollow',
})
</script>
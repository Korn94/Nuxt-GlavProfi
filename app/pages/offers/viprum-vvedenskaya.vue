<!-- app/pages/offers/viprum-vvedenskaya.vue -->
<template>
  <KpPage :offer="offer" />
</template>

<script setup lang="ts">
import KpPage from '~/components/pages/public/offers/kp/KpPage.vue'
import offer from '~/components/pages/public/offers/data/viprum-vvedenskaya'

definePageMeta({
  layout: 'empy',
})

useSeoMeta({
  title: 'Коммерческое предложение — отделка входной группы Випрум',
  description: 'Смета на демонтажные, плиточные и общие работы с учетом материалов.',
  robots: 'noindex, nofollow',
})
</script>

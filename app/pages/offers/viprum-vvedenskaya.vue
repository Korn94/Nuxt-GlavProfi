<!-- app/pages/offers/viprum-vvedenskaya.vue -->
<template>
  <ViprumOffer />
</template>

<script setup lang="ts">
import ViprumOffer from '~/components/pages/public/offers/viprum.vue'

definePageMeta({
  layout: 'empy',
})

useSeoMeta({
  title: 'Коммерческое предложение — отделка входной группы Випрум',
  description: 'Смета на демонтажные, плиточные и общие работы с учетом материалов.',
  robots: 'noindex, nofollow',
})
</script>
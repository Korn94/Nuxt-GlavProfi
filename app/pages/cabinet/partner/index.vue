<!-- app/pages/cabinet/partner/index.vue -->
<template>
  <PartnerCabinet />
</template>

<script setup lang="ts">
import PartnerCabinet from '~/components/pages/Cabinet/partner/partner/index.vue'

definePageMeta({
  layout: 'cabinet',
  middleware: ['auth'],
})

useHead({
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
  title: 'ГлавПрофи — кабинет партнёра',
})
</script>

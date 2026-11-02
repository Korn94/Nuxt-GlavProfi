<!-- app/pages/cabinet/partner/check-phone.vue -->
<template>
  <PartnerCheckPhone />
</template>

<script setup lang="ts">
import PartnerCheckPhone from '~/components/pages/Cabinet/partner/checkPhone/index.vue'

definePageMeta({
  layout: 'partner',
  middleware: ['auth'],
})

useHead({
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
  title: 'ГлавПрофи — проверка клиента',
})
</script>

<!-- app/pages/partner.vue -->
<template>
  <PartnerLanding />
</template>

<script setup lang="ts">
import PartnerLanding from '~/components/pages/public/partnerLanding/index.vue'

definePageMeta({
  layout: 'empy',
})

useHead({
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
  title: 'ГлавПрофи — зарабатывайте на ремонте клиентов',
})
</script>
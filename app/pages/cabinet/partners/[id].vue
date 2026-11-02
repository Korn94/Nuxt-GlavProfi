<!-- app/pages/cabinet/partners/[id].vue -->
<template>
  <PartnerDetail />
</template>

<script setup lang="ts">
import PartnerDetail from '~/components/pages/Cabinet/partner/admin/index.vue'

definePageMeta({
  layout: 'cabinet',
  middleware: ['auth', 'role'],
  allowedRoles: ['admin'],
})

useHead({
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
  title: 'CRM — Партнёр',
})
</script>

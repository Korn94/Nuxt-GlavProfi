<!-- app/pages/cabinet/online.vue -->
<template>
  <PagesCabinetOnline />
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'cabinet',
  middleware: ['auth']
})

useHead({
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
  title: 'CRM — Онлайн',
})
</script>

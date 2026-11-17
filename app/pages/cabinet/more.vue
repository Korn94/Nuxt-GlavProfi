<!-- app/pages/cabinet/more.vue -->
<!-- «Дополнительно»: служебные разделы и документы, вынесенные из бокового меню -->
<template>
  <PagesCabinetMore />
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'cabinet',
  middleware: ['auth'],
})

useHead({
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
  title: 'CRM — Дополнительно',
})
</script>

<template>
  <PagesCabinetOperation />
</template>

<script setup>
definePageMeta({
  layout: 'cabinet',
  middleware: ['auth', 'role'],
  allowedRoles: ['admin'] 
})

useHead({
  meta: [
    { name: 'robots', content: 'noindex, nofollow' },
  ],
  title: 'CRM — Операции'
})
</script>
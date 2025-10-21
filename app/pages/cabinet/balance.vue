<template>
  <PagesCabinetBalance />
</template>

<script setup>
definePageMeta({
  layout: 'cabinet',
  middleware: 'role',
  allowedRoles: ['admin']
});

useHead({
  meta: [
    { name: 'robots', content: 'noindex, nofollow' },
  ],
  title: 'CRM — Баланс'
})
</script>
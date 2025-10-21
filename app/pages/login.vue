<template>
  <PagesCabinetLogin />
</template>

<script setup>
definePageMeta({
  layout: 'login',
  middleware: 'auth'
});

useHead({
  title: 'Вход в CRM-систему',
  meta: [
    { name: 'description', content: 'Вход в CRM-систему компании ГлавПрофи' },
    { property: 'og:title', content: 'Вход в CRM-систему' },
    { property: 'og:description', content: 'Вход в CRM-систему компании ГлавПрофи' },
  ]
})
</script>
<template>
  <PagesPublicAccessDenied />
</template>

<script setup>
definePageMeta({
  layout: "login",
})

useHead({
  title: 'Ошибка авторизации',
  meta: [
    { name: 'description', content: 'Страница ошибки авторизации в CRM-системе' },
    { property: 'og:title', content: 'Ошибка авторизации' },
    { property: 'og:description', content: 'Страница ошибки авторизации в CRM-системе' },
  ]
})
</script>
<template>
  <PagesPublicProjectsCreate />
</template>

<script setup>
definePageMeta({
  middleware: 'role',
  allowedRoles: ['admin', 'manager']
})

useHead({
  meta: [
    { name: 'robots', content: 'noindex, nofollow' },
  ],
  title: 'Новый кейс',
    meta: [
    { name: 'description', content: 'Добавить новый кейс в портфолио' },
    { property: 'og:title', content: 'Новый кейс' },
    { property: 'og:description', content: 'Добавить новый кейс в портфолио' },
  ]
})
</script>
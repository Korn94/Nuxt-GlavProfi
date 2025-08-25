<template>
  <PagesProjectsCreate />
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
  title: 'Добавить проект' // Можно оставить, но необязательно
})
</script>
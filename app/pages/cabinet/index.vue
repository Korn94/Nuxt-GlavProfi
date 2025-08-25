<template>
  <PagesCabinet />
</template>

<script setup>
definePageMeta({
  layout: 'cabinet'
})

useHead({
  meta: [
    { name: 'robots', content: 'noindex, nofollow' },
  ],
  title: 'CRM' // Можно оставить, но необязательно
})
</script>
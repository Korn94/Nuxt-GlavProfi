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
  title: 'CRM — Главная'
})
</script>

<style lang="scss">
.cabinet-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 1.5rem;
  margin-top: 5rem;
}
</style>
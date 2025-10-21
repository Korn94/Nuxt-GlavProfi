<template>
  <div>
    <h1>Панель прораба</h1>
    <p>Добро пожаловать, прораб!</p>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'cabinet',
});

useHead({
  meta: [
    { name: 'robots', content: 'noindex, nofollow' },
  ],
  title: 'CRM — Главная'
})
</script>
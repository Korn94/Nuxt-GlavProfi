<script setup>
definePageMeta({
  middleware: 'auth',
  allowedRoles: ['foreman'], // Только прорабы могут получить доступ
  layout: 'cabinet',
});
</script>

<template>
  <div>
    <h1>Панель прораба</h1>
    <p>Добро пожаловать, прораб!</p>
  </div>
</template>
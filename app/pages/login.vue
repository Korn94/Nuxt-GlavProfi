<template>
  <PagesCabinetLogin />
</template>

<script setup>
definePageMeta({
  layout: 'login',
  middleware: 'auth'
});
</script>
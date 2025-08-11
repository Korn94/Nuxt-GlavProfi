<template>
  <PagesCabinetBalance />
</template>

<script setup>
definePageMeta({
  layout: 'cabinet',
  middleware: 'role',
  allowedRoles: ['admin']
});
</script>
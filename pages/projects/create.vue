<template>
  <PagesProjectsCreate />
</template>

<script setup>
definePageMeta({
  middleware: 'role',
  allowedRoles: ['admin', 'manager']
})
</script>
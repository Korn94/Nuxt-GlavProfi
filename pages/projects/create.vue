<template>
  <PagesProjectsCreate />
</template>

<script setup>
definePageMeta({
  middleware: 'role',
  allowedRoles: ['admin', 'master']
})
</script>
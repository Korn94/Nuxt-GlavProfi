<!-- app/pages/cabinet/settings/permissions.vue -->
<template>
  <PagesCabinetSettingsPermissions />
</template>

<script setup lang="ts">
import { definePageMeta } from 'node_modules/nuxt/dist/pages/runtime';
import { useHead } from 'nuxt/app'

// ============================================
// МЕТАДАННЫЕ СТРАНИЦЫ
// ============================================
definePageMeta({
  layout: 'cabinet',
  middleware: ['auth'],
})

// ============================================
// SEO
// ============================================
useHead({
  title: 'Настройки прав доступа',
})
</script>
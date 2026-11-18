<!-- app/pages/cabinet/diagnostics.vue -->
<!--
  🔬 Диагностика (socket & app monitor). Только для admin.
  Вся разметка/логика — в app/components/pages/Cabinet/Diagnostics/.
  Раньше — app/pages/cabinet/testpage.vue (маршрут /cabinet/testpage,
  301-редирект на новый путь настроен в nuxt.config.ts).
-->
<template>
  <PagesCabinetDiagnostics />
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'cabinet',
  middleware: ['auth', 'role'],
  allowedRoles: ['admin']
})

useHead({
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
  title: 'CRM — Диагностика',
})
</script>

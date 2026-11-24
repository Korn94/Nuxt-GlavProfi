<!-- app/pages/remont-pomescheniy/sklady.vue -->
<template>
  <div class="page-sklady-routing">
    <!-- Сборщик страницы -->
    <SkladyPage />
  </div>
</template>

<script setup lang="ts">
import SkladyPage from '~/components/pages/public/remontPomescheniy/pageTypes/sklady/index.vue'
import { usePageSeo } from '~/components/pages/public/remontPomescheniy/composables/usePageSeo'
// SEO-данные страницы (title/description/FAQ) — в едином data-модуле:
// из него же сервер собирает markdown-версию (/remont-pomescheniy/sklady.md).
import { premisesSeo } from '~/components/pages/public/remontPomescheniy/pageTypes/data/premisesSeo'

usePageSeo(premisesSeo.sklady)
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;

.page-sklady-routing {
  background: $background-dark;
}
</style>

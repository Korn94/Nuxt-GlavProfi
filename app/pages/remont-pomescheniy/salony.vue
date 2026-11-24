<!-- app/pages/remont-pomescheniy/salony.vue -->
<template>
  <div class="page-salony-routing">
    <!-- Сборщик страницы -->
    <SalonyPage />
  </div>
</template>

<script setup lang="ts">
import SalonyPage from '~/components/pages/public/remontPomescheniy/pageTypes/salony/index.vue'
import { usePageSeo } from '~/components/pages/public/remontPomescheniy/composables/usePageSeo'
// SEO-данные страницы (title/description/FAQ) — в едином data-модуле:
// из него же сервер собирает markdown-версию (/remont-pomescheniy/salony.md).
import { premisesSeo } from '~/components/pages/public/remontPomescheniy/pageTypes/data/premisesSeo'

usePageSeo(premisesSeo.salony)
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;

.page-salony-routing {
  background: $background-dark;
}
</style>

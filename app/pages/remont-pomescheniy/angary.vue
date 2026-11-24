<!-- app/pages/remont-pomescheniy/angary.vue -->
<template>
  <div class="page-angary-routing">
    <!-- Сборщик страницы -->
    <AngaryPage />
  </div>
</template>

<script setup lang="ts">
import AngaryPage from '~/components/pages/public/remontPomescheniy/pageTypes/angary/index.vue'
import { usePageSeo } from '~/components/pages/public/remontPomescheniy/composables/usePageSeo'
// SEO-данные страницы (title/description/FAQ) — в едином data-модуле:
// из него же сервер собирает markdown-версию (/remont-pomescheniy/angary.md).
import { premisesSeo } from '~/components/pages/public/remontPomescheniy/pageTypes/data/premisesSeo'

usePageSeo(premisesSeo.angary)
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;

.page-angary-routing {
  background: $background-dark;
}
</style>

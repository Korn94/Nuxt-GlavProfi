<!-- app/pages/remont-pomescheniy/magaziny.vue -->
<template>
  <div class="page-magaziny-routing">
    <!-- Сборщик страницы -->
    <MagazinyPage />
  </div>
</template>

<script setup lang="ts">
import MagazinyPage from '~/components/pages/public/remontPomescheniy/pageTypes/magaziny/index.vue'
import { usePageSeo } from '~/components/pages/public/remontPomescheniy/composables/usePageSeo'
// SEO-данные страницы (title/description/FAQ) — в едином data-модуле:
// из него же сервер собирает markdown-версию (/remont-pomescheniy/magaziny.md).
import { premisesSeo } from '~/components/pages/public/remontPomescheniy/pageTypes/data/premisesSeo'

usePageSeo(premisesSeo.magaziny)
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;

.page-magaziny-routing {
  background: $background-dark;
}
</style>

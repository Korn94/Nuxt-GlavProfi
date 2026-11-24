<!-- app/pages/remont-pomescheniy/proizvodstvo.vue -->
<template>
  <div class="page-proizvodstvo-routing">
    <!-- Сборщик страницы -->
    <ProizvodstvoPage />
  </div>
</template>

<script setup lang="ts">
import ProizvodstvoPage from '~/components/pages/public/remontPomescheniy/pageTypes/proizvodstvo/index.vue'
import { usePageSeo } from '~/components/pages/public/remontPomescheniy/composables/usePageSeo'
// SEO-данные страницы (title/description/FAQ) — в едином data-модуле:
// из него же сервер собирает markdown-версию (/remont-pomescheniy/proizvodstvo.md).
import { premisesSeo } from '~/components/pages/public/remontPomescheniy/pageTypes/data/premisesSeo'

usePageSeo(premisesSeo.proizvodstvo)
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;

.page-proizvodstvo-routing {
  background: $background-dark;
}
</style>

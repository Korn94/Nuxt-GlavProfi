<!-- app/pages/remont-pomescheniy/mopy.vue -->
<template>
  <div class="page-mopy-routing">
    <!-- Сборщик страницы -->
    <MopyPage />
  </div>
</template>

<script setup lang="ts">
import MopyPage from '~/components/pages/public/remontPomescheniy/pageTypes/mopy/index.vue'
import { usePageSeo } from '~/components/pages/public/remontPomescheniy/composables/usePageSeo'
// SEO-данные страницы (title/description/FAQ) — в едином data-модуле:
// из него же сервер собирает markdown-версию (/remont-pomescheniy/mopy.md).
import { premisesSeo } from '~/components/pages/public/remontPomescheniy/pageTypes/data/premisesSeo'

usePageSeo(premisesSeo.mopy)
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;

.page-mopy-routing {
  background: $background-dark;
}
</style>

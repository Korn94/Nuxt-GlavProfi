<!-- app/pages/remont-pomescheniy/fitness.vue -->
<template>
  <div class="page-fitness-routing">
    <!-- Сборщик страницы -->
    <FitnessPage />
  </div>
</template>

<script setup lang="ts">
import FitnessPage from '~/components/pages/public/remontPomescheniy/pageTypes/fitness/index.vue'
import { usePageSeo } from '~/components/pages/public/remontPomescheniy/composables/usePageSeo'
// SEO-данные страницы (title/description/FAQ) — в едином data-модуле:
// из него же сервер собирает markdown-версию (/remont-pomescheniy/fitness.md).
import { premisesSeo } from '~/components/pages/public/remontPomescheniy/pageTypes/data/premisesSeo'

usePageSeo(premisesSeo.fitness)
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;

.page-fitness-routing {
  background: $background-dark;
}
</style>

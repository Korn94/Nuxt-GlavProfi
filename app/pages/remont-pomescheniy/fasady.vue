<!-- app/pages/remont-pomescheniy/fasady.vue -->
<template>
  <div class="page-fasady-routing">
    <!-- Сборщик страницы -->
    <FasadyPage />
  </div>
</template>

<script setup lang="ts">
import FasadyPage from '~/components/pages/public/remontPomescheniy/pageTypes/fasady/index.vue'
import { usePageSeo } from '~/components/pages/public/remontPomescheniy/composables/usePageSeo'
// SEO-данные страницы (title/description/FAQ) — в едином data-модуле:
// из него же сервер собирает markdown-версию (/remont-pomescheniy/fasady.md).
import { premisesSeo } from '~/components/pages/public/remontPomescheniy/pageTypes/data/premisesSeo'

usePageSeo(premisesSeo.fasady)
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;

.page-fasady-routing {
  background: $background-dark;
}
</style>

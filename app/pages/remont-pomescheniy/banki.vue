<!-- app/pages/remont-pomescheniy/banki.vue -->
<template>
  <div class="page-banki-routing">
    <!-- Сборщик страницы -->
    <BankiPage />
  </div>
</template>

<script setup lang="ts">
import BankiPage from '~/components/pages/public/remontPomescheniy/pageTypes/banki/index.vue'
import { usePageSeo } from '~/components/pages/public/remontPomescheniy/composables/usePageSeo'
// SEO-данные страницы (title/description/FAQ) — в едином data-модуле:
// из него же сервер собирает markdown-версию (/remont-pomescheniy/banki.md).
import { premisesSeo } from '~/components/pages/public/remontPomescheniy/pageTypes/data/premisesSeo'

usePageSeo(premisesSeo.banki)
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;

.page-banki-routing {
  background: $background-dark;
}
</style>

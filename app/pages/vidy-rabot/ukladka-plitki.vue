<!-- app/pages/vidy-rabot/ukladka-plitki.vue -->
<template>
  <div class="page-ukladka-plitki-routing">
    <!-- Сборщик страницы (вся вёрстка и контент) -->
    <UkladkaPlitkiPage />
  </div>
</template>

<script setup lang="ts">
import UkladkaPlitkiPage from '~/components/pages/public/remontPomescheniy/workTypes/plitka/ukladka.vue'
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;

.page-ukladka-plitki-routing {
  background: $background-dark;
}
</style>
<!-- app/pages/vidy-rabot/peregorodki-gkl.vue -->
<template>
  <div class="page-gkl-peregorodki-routing">
    <!-- Сборщик страницы (вся вёрстка и контент) -->
    <GklPeregorodkiPage />
  </div>
</template>

<script setup lang="ts">
import GklPeregorodkiPage from '~/components/pages/public/remontPomescheniy/workTypes/peregorodki/gkl.vue'
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;

.page-gkl-peregorodki-routing {
  background: $background-dark;
}
</style>
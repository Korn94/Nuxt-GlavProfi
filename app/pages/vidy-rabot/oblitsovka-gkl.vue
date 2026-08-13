<!-- app/pages/vidy-rabot/oblitsovka-gkl.vue -->
<template>
  <div class="page-gkl-steny-routing">
    <!-- Сборщик страницы (вся вёрстка и контент) -->
    <GklStenyPage />
  </div>
</template>

<script setup lang="ts">
import GklStenyPage from '~/components/pages/public/remontPomescheniy/workTypes/gkl/steny.vue'
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;

.page-gkl-steny-routing {
  background: $background-dark;
}
</style>
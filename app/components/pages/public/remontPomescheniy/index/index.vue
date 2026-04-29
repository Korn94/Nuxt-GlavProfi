<!-- app\components\pages\public\remontPomescheniy\index\index.vue -->
<template>
  <div class="commercial-repair">
    <!-- Hero и сетка помещений -->
    <div class="wrap">
      <PagesPublicRemontPomescheniyIndexBlocksHero />
      <PagesPublicRemontPomescheniyIndexBlocksPremisesGrid />
    </div>

    <!-- Основной контент страницы -->
    <PagesPublicRemontPomescheniyIndexBlocksServicesList />
    <PagesPublicRemontPomescheniyIndexBlocksProcessTimeline />
    <PagesPublicRemontPomescheniyIndexBlocksCases />
    <PagesPublicRemontPomescheniyIndexBlocksFaqAccordion />
    <!-- <PagesPublicRemontPomescheniyIndexBlocksCTASection /> -->

  </div>
</template>

<script setup lang="ts">
// Nuxt 4 авто-импортирует компоненты из `components/`
</script>

<style lang="scss" scoped>
@use "@/assets/styles/variables" as *;

.commercial-repair {
  position: relative;
  overflow: hidden;

  .wrap {
    background: $background-dark;
    padding-top: 8em;
    position: relative;
    &::before {
      content: '';
      position: absolute;
      top: 0; left: 0; width: 100%; height: 100%;
      background: radial-gradient(circle at 5% 0%, $blue20 0%, transparent 10%);
      pointer-events: none;
    }
  }

  .calculator-section {
    padding: $spacing-xl 0;
    background: $background-light;
    min-height: 650px; /* Фиксирует место */
  }
}

/* ✅ Плейсхолдер: одинаковый на сервере и клиенте */
.calculator-placeholder {
  position: relative;
  min-height: 400px;
}

.calculator-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  color: $text-secondary;
  font-size: 1rem;
  .spinner {
    width: 32px; height: 32px;
    border: 3px solid $border-color;
    border-top-color: $primary;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 12px;
  }
}

@keyframes spin { to { transform: rotate(360deg); } }
</style>
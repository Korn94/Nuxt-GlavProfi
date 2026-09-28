<!-- app/components/pages/public/remontPomescheniy/index/index.vue -->
<template>
  <div class="commercial-repair">
    <!-- 1. Компактное интро (светлый) -->
    <PagesPublicRemontPomescheniyIndexBlocksPageIntro />

    <!-- 2. Каталог помещений (темный) -->
    <div id="premises-grid" class="wrap">
      <PagesPublicRemontPomescheniyIndexBlocksPremisesGrid />
    </div>

    <!-- 3. Виды работ (светлый) -->
    <div id="works-grid">
      <PagesPublicRemontPomescheniyIndexBlocksWorksGrid />
    </div>

    <!-- 4. Блок доверия (темный) -->
    <PagesPublicRemontPomescheniyIndexBlocksWhyUsBlock />

    <!-- 5. CTA секция (светлый) -->
    <div id="cta-section">
      <PagesPublicRemontPomescheniyIndexBlocksCTASection />
    </div>

    <!-- 6. Процесс работы (темный) -->
    <PagesPublicRemontPomescheniyIndexBlocksProcessTimeline />

    <!-- 7. Кейсы -->
    <PagesPublicRemontPomescheniyIndexBlocksCases />

    <!-- 8. FAQ -->
    <PagesPublicRemontPomescheniyIndexBlocksFaqAccordion />
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
  margin-top: 5em;

  .wrap {
    background: $background-dark;
    // padding-top: 3em;
    position: relative;
    
    &::before {
      content: '';
      position: absolute;
      top: 0; 
      left: 0; 
      width: 100%; 
      height: 100%;
      background: radial-gradient(circle at 5% 0%, $blue20 0%, transparent 10%);
      pointer-events: none;
    }
  }

  .calculator-section {
    padding: $spacing-xl 0;
    background: $background-light;
    min-height: 650px;
  }
}

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
    width: 32px; 
    height: 32px;
    border: 3px solid $border-color;
    border-top-color: $primary;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 12px;
  }
}

@keyframes spin { 
  to { transform: rotate(360deg); } 
}

@media (max-width: 640px) {
  .commercial-repair {
    margin-top: unset;
  }
}
</style>
<!-- app/components/pages/public/remontPomescheniy/workTypes/ui/HeaderType.vue -->
<template>
  <section class="work-type-header">
    <div class="container">
      <!-- Главный заголовок -->
      <h1 class="header-title" v-html="title" />

      <!-- Краткая выгода (подзаголовок) -->
      <p v-if="subtitle" class="header-subtitle">{{ subtitle }}</p>
    </div>
  </section>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string
    subtitle?: string
  }>(),
  {}
)
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;
@use '@/assets/styles/mixins' as *;

.work-type-header {
  @include section-padding;
  background: $background-light;
  color: $text-dark;
  position: relative;

  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);

  .container {
    @include section-container; // Стандартная ширина (1200px)
  }
}

.header-title {
  @include page-title;
  color: $text-dark;

  :deep(span),
  :deep(.blue) {
    color: $blue;
  }
}

.header-subtitle {
  font-size: 1.15rem;
  line-height: 1.6;
  color: $text-gray;
  max-width: 700px;
  margin: 0 0 1.5rem;
}

@media (max-width: 768px) {
  .work-type-header {
    padding-top: 3rem;
    padding-bottom: 2.5rem;
  }
  .header-subtitle {
    font-size: 1rem;
  }
}
</style>
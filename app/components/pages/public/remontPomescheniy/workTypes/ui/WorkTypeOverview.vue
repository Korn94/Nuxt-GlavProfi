<!-- app\components\pages\public\remontPomescheniy\workTypes\ui\WorkTypeOverview.vue -->
<template>
  <section class="work-type-overview">
    <div class="container">
      <header class="overview-header">
        <h2 class="overview-title" v-html="title" />

        <p v-if="description" class="overview-description">{{ description }}</p>
        
        <!-- Расширенное описание с перелинковкой -->
        <div v-if="$slots.details" class="overview-details">
          <slot name="details" />
        </div>

        <div v-if="advantages?.length" class="overview-advantages">
          <div
            v-for="(item, index) in advantages"
            :key="index"
            class="advantage-item"
          >
            <div class="advantage-item__icon">
              <Icon :name="item.icon || 'mdi:check-circle'" size="22" />
            </div>
            <div class="advantage-item__content">
              <span class="advantage-item__title">{{ item.title }}</span>
              <span class="advantage-item__desc">{{ item.description }}</span>
            </div>
          </div>
        </div>
      </header>
    </div>
  </section>
</template>

<script setup lang="ts">
export interface OverviewAdvantage {
  title: string
  description: string
  icon?: string
}

defineProps<{
  title: string
  description?: string
  advantages?: OverviewAdvantage[]
}>()
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;
@use '@/assets/styles/mixins' as *;

.work-type-overview {
  @include section-padding;
  background: $background-dark;
  color: $text-light;
  
  .container {
    @include section-container;
  }
}

.overview-title {
  @include section-title; // Теперь такой же как в BeforeAfterShowcase
}

.overview-description {
  font-size: 1.12rem;
  line-height: 1.7;
  color: $text-light;
  margin: 0 0 2rem;
}

.overview-advantages {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
}

.advantage-item {
  @include dark-card;
  display: flex;
  align-items: flex-start;
  gap: 0.9rem;
  padding: 1.1rem 1.2rem;

  &:hover {
    border-color: rgba(0, 195, 245, 0.3);
    background: rgba(0, 195, 245, 0.04);
  }

  &__icon {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 42px;
    height: 42px;
    background: rgba(0, 195, 245, 0.12);
    color: $blue-light;
    border-radius: 10px;
  }

  &__content {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }

  &__title {
    font-family: 'Rubik', sans-serif;
    font-size: 0.95rem;
    font-weight: 600;
    color: $text-light;
    line-height: 1.3;
  }

  &__desc {
    font-size: 0.82rem;
    color: rgba($text-light, 0.6);
    line-height: 1.4;
  }
}

.overview-details {
  max-width: 800px;
  margin: 0 0 2rem;

  :deep(p) {
    font-size: 1.02rem;
    line-height: 1.7;
    color: rgba($text-light, 0.65);
    margin: 0 0 1.1rem;

    &:last-child {
      margin-bottom: 0;
    }
  }

  :deep(a) {
    color: $blue-light;
    text-decoration: underline;
    text-decoration-thickness: 1px;
    text-underline-offset: 3px;
    transition: color 0.2s ease;

    &:hover {
      color: $blue;
    }
  }

  :deep(strong),
  :deep(b) {
    color: $text-light;
    font-weight: 600;
  }
}

@media (max-width: 768px) {
  .overview-header {
    margin-bottom: 2rem;
  }

  .overview-advantages {
    grid-template-columns: 1fr;
  }
}
</style>
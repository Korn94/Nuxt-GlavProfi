<template>
  <section class="work-type-overview">
    <div class="container">
      <header class="overview-header">
        <span class="overview-category">
          <Icon :name="categoryIcon || 'mdi:tooltip-outline'" size="16" />
          {{ categoryLabel }}
        </span>

        <h1 class="overview-title" v-html="title" />

        <p v-if="description" class="overview-description">{{ description }}</p>

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

      <!-- Расширенное описание с перелинковкой -->
      <div v-if="$slots.details" class="overview-details">
        <slot name="details" />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
export interface OverviewAdvantage {
  title: string
  description: string
  icon?: string
}

withDefaults(
  defineProps<{
    categoryLabel: string
    categoryIcon?: string
    title: string
    description?: string
    advantages?: OverviewAdvantage[]
  }>(),
  {}
)
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;

.work-type-overview {
  display: flex;
  align-items: center;
  background: $background-dark;
  min-height: 100vh;
  
  .container {
    max-width: 1200px;
    width: 100%;
    margin: 0 auto;
    padding: 0 2rem;
    @media (max-width: 768px) { padding: 0 1.2rem; }
  }
}

.overview-header {
  margin-bottom: 2.5rem;
  max-width: 800px;
}

.overview-category {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-family: 'Rubik', sans-serif;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: $blue;
  padding: 0.35rem 0.9rem;
  background: rgba(0, 195, 245, 0.12);
  border-radius: 50px;
  margin-bottom: 1.2rem;
}

.overview-title {
  font-family: 'Rubik', sans-serif;
  font-size: 2.6rem;
  font-weight: 700;
  color: $text-light;
  margin: 0 0 1.2rem;
  line-height: 1.15;
  letter-spacing: -0.02em;

  @media (max-width: 768px) { font-size: 1.9rem; }

  :deep(span),
  :deep(.accent) {
    background: $blue-gradient;
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
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
  display: flex;
  align-items: flex-start;
  gap: 0.9rem;
  padding: 1.1rem 1.2rem;
  background: rgba(255, 255, 255, 0.035);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: $border-radius;
  transition: border-color 0.3s ease, background 0.3s ease;

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

// === Расширенное описание ===
.overview-details {
  margin-bottom: 0;
  max-width: 800px;

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
  .work-type-overview {
    padding: 2rem 0;
  }

  .overview-header {
    margin-bottom: 2rem;
  }

  .overview-advantages {
    grid-template-columns: 1fr;
  }
}
</style>
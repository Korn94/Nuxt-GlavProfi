<!-- app/components/pages/public/remontPomescheniy/pageTypes/workTypes/ui/ServiceNavigation.vue -->
<template>
  <section class="service-nav">
    <div class="container">
      <h2 class="service-nav__title" v-html="title" />
      <div class="service-nav__grid">
        <NuxtLink
          v-for="item in items"
          :key="item.to"
          :to="item.to"
          class="service-card"
          :class="{ 'service-card--active': item.active }"
        >
          <div class="service-card__icon">
            <Icon :name="item.icon || 'mdi:wrench'" size="28" />
          </div>
          <h3 class="service-card__title">{{ item.title }}</h3>
          <p class="service-card__desc">{{ item.description }}</p>
          <div class="service-card__price" v-if="item.priceFrom">
            от <strong>{{ item.priceFrom }} ₽/м²</strong>
          </div>
          <span class="service-card__link">
            Подробнее <Icon name="mdi:arrow-right" size="16" />
          </span>
        </NuxtLink>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
export interface ServiceNavItem {
  title: string
  description: string
  to: string
  icon?: string
  priceFrom?: number | string
  active?: boolean
}

defineProps<{
  title?: string
  items: ServiceNavItem[]
}>()
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;

.service-nav {
  padding: 4rem 0;
  background: $background-dark;

  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 2rem;
    @media (max-width: 768px) { padding: 0 1.2rem; }
  }

  &__title {
    font-family: 'Rubik', sans-serif;
    font-size: 2rem;
    font-weight: 700;
    color: $text-light;
    margin: 0 0 2rem;
    line-height: 1.25;
    position: relative;
    padding-bottom: 1rem;

    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      width: 80px;
      height: 4px;
      background: $blue-gradient;
      border-radius: 2px;
    }
    :deep(span) {
      background: $blue-gradient;
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
    }
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1.5rem;
  }
}

.service-card {
  position: relative;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: $border-radius;
  text-decoration: none;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  transition: transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    border-color: $blue;
    box-shadow: 0 10px 30px rgba(0, 195, 245, 0.15);
  }

  &--active {
    border-color: $blue;
    background: rgba(0, 195, 245, 0.08);
    &::before {
      content: 'Текущая услуга';
      position: absolute;
      top: -10px;
      right: 1rem;
      background: $blue-gradient;
      color: $background-dark;
      font-size: 0.72rem;
      font-weight: 700;
      padding: 0.25rem 0.7rem;
      border-radius: 50px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
  }

  &__icon {
    width: 52px;
    height: 52px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 195, 245, 0.12);
    color: $blue-light;
    border-radius: 12px;
    margin-bottom: 0.5rem;
  }

  &__title {
    font-family: 'Rubik', sans-serif;
    font-size: 1.3rem;
    font-weight: 700;
    color: $text-light;
    margin: 0;
  }

  &__desc {
    font-size: 0.95rem;
    line-height: 1.55;
    color: rgba($text-light, 0.75);
    margin: 0;
    flex: 1;
  }

  &__price {
    font-size: 1rem;
    color: rgba($text-light, 0.85);
    strong { color: $blue-light; font-weight: 700; }
  }

  &__link {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    color: $blue-light;
    font-size: 0.9rem;
    font-weight: 600;
    margin-top: 0.5rem;
  }
}
</style>
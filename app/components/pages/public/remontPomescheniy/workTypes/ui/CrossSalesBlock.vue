<!-- app/components/pages/public/remontPomescheniy/pageTypes/workTypes/ui/CrossSalesBlock.vue -->
<template>
  <section class="cross-sales">
    <div class="container">
      <h2 class="cross-sales__title" v-html="title" />
      <p class="cross-sales__subtitle" v-if="subtitle">{{ subtitle }}</p>

      <div class="cross-sales__grid">
        <NuxtLink
          v-for="item in items"
          :key="item.to"
          :to="item.to"
          class="cross-card"
        >
          <div class="cross-card__image" v-if="item.image">
            <img :src="item.image" :alt="item.title" loading="lazy" />
          </div>
          <div class="cross-card__content">
            <h3 class="cross-card__title">{{ item.title }}</h3>
            <p class="cross-card__desc" v-if="item.description">{{ item.description }}</p>
            <div class="cross-card__price" v-if="item.priceFrom">
              от <strong>{{ item.priceFrom }} ₽/м²</strong>
            </div>
            <span class="cross-card__link">
              Заказать <Icon name="mdi:arrow-right" size="16" />
            </span>
          </div>
        </NuxtLink>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
export interface CrossSalesItem {
  title: string
  description?: string
  to: string
  image?: string
  priceFrom?: number | string
}

defineProps<{
  title: string
  subtitle?: string
  items: CrossSalesItem[]
}>()
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;

.cross-sales {
  padding: 5rem 0;
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
    margin: 0 0 0.8rem;
    :deep(span) {
      background: $blue-gradient;
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
    }
  }

  &__subtitle {
    font-size: 1.05rem;
    color: rgba($text-light, 0.75);
    margin: 0 0 2rem;
    max-width: 720px;
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1.5rem;
  }
}

.cross-card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 14px;
  overflow: hidden;
  text-decoration: none;
  display: flex;
  flex-direction: column;
  transition: transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    border-color: $blue;
    box-shadow: 0 10px 30px rgba(0, 195, 245, 0.15);
    .cross-card__link { gap: 0.7rem; }
  }

  &__image {
    aspect-ratio: 16 / 9;
    overflow: hidden;
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.6s ease;
    }
    &:hover img { transform: scale(1.08); }
  }

  &__content {
    padding: 1.5rem;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  &__title {
    font-family: 'Rubik', sans-serif;
    font-size: 1.2rem;
    font-weight: 700;
    color: $text-light;
    margin: 0;
  }

  &__desc {
    font-size: 0.92rem;
    line-height: 1.5;
    color: rgba($text-light, 0.75);
    margin: 0;
    flex: 1;
  }

  &__price {
    color: rgba($text-light, 0.9);
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
    transition: gap 0.3s ease;
  }
}
</style>
<!-- app/components/pages/public/remontPomescheniy/pageTypes/workTypes/ui/GuaranteesGrid.vue -->
<template>
  <section class="guarantees">
    <div class="container">
      <h2 class="guarantees__title" v-html="title" />
      <p class="guarantees__subtitle" v-if="subtitle">{{ subtitle }}</p>

      <div class="guarantees__grid">
        <article
          v-for="(item, index) in items"
          :key="index"
          class="guarantee-card"
        >
          <div class="guarantee-card__icon">
            <Icon :name="item.icon || 'mdi:shield-check'" size="32" />
          </div>
          <h3 class="guarantee-card__title">{{ item.title }}</h3>
          <p class="guarantee-card__desc">{{ item.description }}</p>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
export interface GuaranteeItem {
  title: string
  description: string
  icon?: string
}

defineProps<{
  title: string
  subtitle?: string
  items: GuaranteeItem[]
}>()
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;

.guarantees {
  padding: 5rem 0;
  background: $background-light;

  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 2rem;
    @media (max-width: 768px) { padding: 0 1.2rem; }
  }

  &__title {
    font-family: 'Rubik', sans-serif;
    font-size: 2.2rem;
    font-weight: 700;
    color: $text-dark;
    margin: 0 0 0.8rem;
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

  &__subtitle {
    font-size: 1.05rem;
    color: $text-gray;
    margin: 0 0 2.5rem;
    max-width: 720px;
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 1.5rem;
  }
}

.guarantee-card {
  padding: 2rem;
  background: #fff;
  border: 1px solid $border-color;
  border-radius: 14px;
  transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 30px rgba(0, 195, 245, 0.12);
    border-color: $blue;
  }

  &__icon {
    width: 60px;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 195, 245, 0.1);
    color: $blue;
    border-radius: 14px;
    margin-bottom: 1.2rem;
  }

  &__title {
    font-family: 'Rubik', sans-serif;
    font-size: 1.15rem;
    font-weight: 700;
    color: $text-dark;
    margin: 0 0 0.6rem;
  }

  &__desc {
    font-size: 0.95rem;
    line-height: 1.55;
    color: $text-gray;
    margin: 0;
  }
}
</style>
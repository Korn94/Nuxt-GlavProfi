<!-- app/components/pages/public/remontPomescheniy/pageTypes/workTypes/ui/GuaranteesGrid.vue -->
<template>
  <section class="guarantees" :class="`guarantees--${theme}`">
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

withDefaults(
  defineProps<{
    title: string
    subtitle?: string
    items: GuaranteeItem[]
    theme?: 'light' | 'dark'
  }>(),
  {
    theme: 'light',
  }
)
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;
@use '@/assets/styles/mixins' as *;

.guarantees {
  @include section-padding;

  // === THEME: LIGHT (default) ===
  &--light {
    --section-bg: #{$background-light};
    --section-text: #{$text-dark};
    --section-text-secondary: #{$text-gray};
    --card-bg: #fff;
    --card-border: #{$border-color};
    --card-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
    --card-hover-shadow: 0 12px 32px rgba(0, 0, 0, 0.1);
    --icon-bg: rgba(0, 195, 245, 0.1);
    --icon-color: #{$blue};
  }

  // === THEME: DARK ===
  &--dark {
    --section-bg: #{$background-dark};
    --section-text: #{$text-light};
    --section-text-secondary: rgba(255, 255, 255, 0.6);
    --card-bg: rgba(255, 255, 255, 0.035);
    --card-border: rgba(255, 255, 255, 0.08);
    --card-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
    --card-hover-shadow: 0 12px 32px rgba(0, 0, 0, 0.3);
    --icon-bg: rgba(0, 195, 245, 0.12);
    --icon-color: #{$blue-light};
  }

  background: var(--section-bg);
  color: var(--section-text);

  .container {
    @include section-container;
  }

  &__title {
    @include section-title;
  }

  &__subtitle {
    @include section-subtitle;
    color: var(--section-text-secondary);
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 1.5rem;
  }
}

.guarantee-card {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 14px;
  padding: 2rem;
  box-shadow: var(--card-shadow);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: var(--card-hover-shadow);
    border-color: $blue;
  }

  &__icon {
    width: 60px;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--icon-bg);
    color: var(--icon-color);
    border-radius: 14px;
    margin-bottom: 1.2rem;
  }

  &__title {
    font-family: 'Rubik', sans-serif;
    font-size: 1.15rem;
    font-weight: 700;
    color: var(--section-text);
    margin: 0 0 0.6rem;
  }

  &__desc {
    font-size: 0.95rem;
    line-height: 1.55;
    color: var(--section-text-secondary);
    margin: 0;
  }
}
</style>
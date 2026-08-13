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
@use '@/assets/styles/mixins' as *;

.guarantees {
  @include section-padding;
  background: $background-light;
  color: $text-dark;

  .container {
    @include section-container;
  }

  &__title {
    @include section-title;
  }

  &__subtitle {
    @include section-subtitle;
    color: $text-gray;
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 1.5rem;
  }
}

.guarantee-card {
  @include light-card;
  padding: 2rem;

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
<!-- app/components/pages/public/remontPomescheniy/workTypes/ui/TechnicalInsights.vue -->
<template>
  <section class="technical-insights">
    <div class="container">
      <!-- Заголовок -->
      <header class="insights-header">
        <span class="insights-badge">
          <Icon name="mdi:lightbulb-on-outline" size="14" />
          Технические нюансы
        </span>
        <h2 class="insights-title" v-html="title" />
        <p v-if="subtitle" class="insights-subtitle">{{ subtitle }}</p>
      </header>

      <!-- Сетка карточек-инсайтов -->
      <div v-if="insights?.length" class="insights-grid">
        <article
          v-for="(item, index) in insights"
          :key="index"
          class="insight-card"
          :class="{ 'insight-card--highlight': item.highlight }"
        >
          <div class="insight-card__number">
            {{ String(index + 1).padStart(2, '0') }}
          </div>

          <div class="insight-card__icon">
            <Icon :name="item.icon || 'mdi:information-outline'" size="24" />
          </div>

          <div class="insight-card__content">
            <h3 class="insight-card__title">{{ item.title }}</h3>
            <p class="insight-card__desc">{{ item.description }}</p>

            <div v-if="item.fact" class="insight-card__fact">
              <Icon name="mdi:flash" size="14" />
              <span>{{ item.fact }}</span>
            </div>
          </div>
        </article>
      </div>

      <!-- 🆕 Блок сравнения фото (0, 1 или 2 фото) -->
      <div
        v-if="comparisonImages?.length"
        class="insights-comparison"
        :class="`insights-comparison--count-${Math.min(comparisonImages.length, 2)}`"
      >
        <div
          v-for="(img, idx) in comparisonImages.slice(0, 2)"
          :key="idx"
          class="comparison-item"
        >
          <div class="comparison-item__image">
            <img
              :src="img.src"
              :alt="img.alt || img.label"
              loading="lazy"
            />
          </div>
          <div class="comparison-item__label">
            {{ img.label }}
          </div>
        </div>
      </div>

      <!-- Произвольный контент через слот (таблицы, картинки, сравнения) -->
      <div v-if="$slots.content" class="insights-custom-content">
        <slot name="content" />
      </div>

      <!-- Итоговая рекомендация -->
      <div v-if="summary || $slots.summary" class="insights-summary">
        <slot name="summary">
          <Icon name="mdi:check-decagram" size="24" class="insights-summary__icon" />
          <p v-html="summary" />
        </slot>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
export interface InsightItem {
  title: string
  description: string
  icon?: string
  highlight?: boolean
  fact?: string
}

/** 🆕 Фото для блока сравнения */
export interface ComparisonImage {
  /** URL изображения */
  src: string
  /** Подпись под фото (например, "1 слой ГКЛ") */
  label: string
  /** alt-атрибут для SEO (если не указан — берётся label) */
  alt?: string
}

defineProps<{
  title: string
  subtitle?: string
  insights?: InsightItem[]
  summary?: string
  /** 🆕 Массив фото для сравнения: 0, 1 или 2 элемента */
  comparisonImages?: ComparisonImage[]
}>()
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;
@use '@/assets/styles/mixins' as *;

.technical-insights {
  @include section-padding;
  background: $background-dark;
  color: $text-light;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: -15%;
    right: -10%;
    width: 600px;
    height: 600px;
    background: radial-gradient(circle, rgba(0, 195, 245, 0.06) 0%, transparent 65%);
    border-radius: 50%;
    pointer-events: none;
  }

  &::after {
    content: '';
    position: absolute;
    bottom: -15%;
    left: -10%;
    width: 500px;
    height: 500px;
    background: radial-gradient(circle, rgba(250, 183, 2, 0.04) 0%, transparent 65%);
    border-radius: 50%;
    pointer-events: none;
  }

  .container {
    @include section-container;
    position: relative;
    z-index: 1;
  }
}

.insights-header {
  margin-bottom: 2.5rem;
  max-width: 760px;
}

.insights-badge {
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
  margin-bottom: 1rem;
}

.insights-title {
  @include section-title;
}

.insights-subtitle {
  @include section-subtitle;
  color: rgba($text-light, 0.7);
}

.insights-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.3rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.insight-card {
  @include dark-card;
  position: relative;
  padding: 1.6rem;
  overflow: hidden;
  transition: all 0.3s ease;

  &:hover {
    border-color: rgba(0, 195, 245, 0.3);
    background: rgba(0, 195, 245, 0.04);
    transform: translateY(-3px);
  }

  &--highlight {
    border-color: $blue;
    background: rgba(0, 195, 245, 0.06);

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: $blue-gradient;
    }

    .insight-card__icon {
      background: $blue-gradient;
      color: $background-dark;
    }
  }

  &__number {
    position: absolute;
    top: 0.8rem;
    right: 1rem;
    font-family: 'Rubik', sans-serif;
    font-size: 1.4rem;
    font-weight: 800;
    background: $blue-gradient;
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    opacity: 0.6;
    pointer-events: none;
    line-height: 1;
  }

  &__icon {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    background: rgba(0, 195, 245, 0.12);
    color: $blue-light;
    border-radius: 12px;
    margin-bottom: 1rem;
    transition: all 0.3s ease;
  }

  &:hover &__icon {
    transform: scale(1.05);
  }

  &__content {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  &__title {
    font-family: 'Rubik', sans-serif;
    font-size: 1.15rem;
    font-weight: 700;
    color: $text-light;
    margin: 0;
    line-height: 1.35;
  }

  &__desc {
    font-size: 0.95rem;
    line-height: 1.6;
    color: rgba($text-light, 0.8);
    margin: 0;
  }

  &__fact {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.4rem 0.8rem;
    background: rgba(250, 183, 2, 0.1);
    border: 1px solid rgba(250, 183, 2, 0.25);
    border-radius: 50px;
    font-family: 'Rubik', sans-serif;
    font-size: 0.82rem;
    font-weight: 600;
    color: $yellow;
    margin-top: 0.5rem;
    align-self: flex-start;

    :deep(.icon) {
      color: $yellow;
    }
  }
}

// ============================================================
// 🆕 БЛОК СРАВНЕНИЯ ФОТО
// ============================================================
.insights-comparison {
  display: grid;
  gap: 1.2rem;
  margin-top: 2rem;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;

  // 2 фото — две колонки на десктопе
  &--count-2 {
    grid-template-columns: 1fr 1fr;

    @media (max-width: 640px) {
      grid-template-columns: 1fr;
    }
  }

  // 1 фото — одна колонка, центрированная
  &--count-1 {
    grid-template-columns: 1fr;
    max-width: 640px;
    margin-left: auto;
    margin-right: auto;
  }
}

.comparison-item {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;

  &__image {
    position: relative;
    aspect-ratio: 4 / 3;
    overflow: hidden;
    border-radius: 10px;
    background: rgba(0, 195, 245, 0.05);
    border: 1px solid rgba(0, 195, 245, 0.15);

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      transition: transform 0.4s ease;
    }

    &:hover img {
      transform: scale(1.03);
    }
  }

  &__label {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.7rem 1rem;
    background: rgba(0, 195, 245, 0.08);
    border: 1px solid rgba(0, 195, 245, 0.2);
    border-radius: 10px;
    font-family: 'Rubik', sans-serif;
    font-size: 0.95rem;
    font-weight: 600;
    text-align: center;
    letter-spacing: 0.01em;
  }
}

// ============================================================
// Произвольный контент через слот
// ============================================================
.insights-custom-content {
  margin-top: 2rem;
  padding: 1.8rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;

  :deep(h3) {
    font-family: 'Rubik', sans-serif;
    font-size: 1.2rem;
    font-weight: 700;
    color: $text-light;
    margin: 0 0 1rem;
  }

  :deep(p) {
    font-size: 0.98rem;
    line-height: 1.65;
    color: rgba($text-light, 0.8);
    margin: 0 0 1rem;
  }

  :deep(strong),
  :deep(b) {
    color: $blue-light;
    font-weight: 600;
  }
}

.insights-summary {
  @include summary-block(dark);
  margin-top: 2rem;
}

@media (max-width: 768px) {
  .insight-card {
    padding: 1.3rem;

    &__icon {
      width: 42px;
      height: 42px;
    }

    &__title {
      font-size: 1.05rem;
    }
  }

  .insights-comparison {
    padding: 1rem;
  }

  .comparison-item {
    &__label {
      font-size: 0.88rem;
      padding: 0.6rem 0.8rem;
    }
  }
}
</style>
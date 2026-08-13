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
          <!-- Индикатор номера -->
          <div class="insight-card__number">
            {{ String(index + 1).padStart(2, '0') }}
          </div>

          <!-- Иконка -->
          <div class="insight-card__icon">
            <Icon :name="item.icon || 'mdi:information-outline'" size="24" />
          </div>

          <!-- Контент -->
          <div class="insight-card__content">
            <h3 class="insight-card__title">{{ item.title }}</h3>
            <p class="insight-card__desc">{{ item.description }}</p>

            <!-- Дополнительный факт (если есть) -->
            <div v-if="item.fact" class="insight-card__fact">
              <Icon name="mdi:flash" size="14" />
              <span>{{ item.fact }}</span>
            </div>
          </div>
        </article>
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
  /** Заголовок инсайта */
  title: string
  /** Описание */
  description: string
  /** Иконка из @iconify */
  icon?: string
  /** Выделить карточку (например, для самого важного) */
  highlight?: boolean
  /** Короткий факт-цифра внизу карточки */
  fact?: string
}

defineProps<{
  title: string
  subtitle?: string
  insights?: InsightItem[]
  summary?: string
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

  // Декоративные свечения
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

// === Заголовок ===
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

// === Сетка карточек ===
.insights-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.3rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

// === Карточка инсайта ===
.insight-card {
  @include dark-card;
  position: relative;
  padding: 1.6rem 1.6rem 1.6rem 1.6rem;
  overflow: hidden;
  transition: all 0.3s ease;

  &:hover {
    border-color: rgba(0, 195, 245, 0.3);
    background: rgba(0, 195, 245, 0.04);
    transform: translateY(-3px);
  }

  // === Выделенная карточка ===
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

  // Номер в углу
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

  // Факт-цифра
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

// === Произвольный контент через слот ===
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

// === Итоговая рекомендация ===
.insights-summary {
  @include summary-block(dark);
  margin-top: 2rem;
}

// === Адаптив ===
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
}
</style>
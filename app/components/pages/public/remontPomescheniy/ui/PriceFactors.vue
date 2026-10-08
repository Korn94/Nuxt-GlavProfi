<!-- app/components/pages/public/remontPomescheniy/pageTypes/ui/PriceFactors.vue -->
<template>
  <section class="price-factors" :class="`price-factors--${theme}`">
    <div class="container">
      <!-- Заголовок -->
      <slot name="header">
        <h2 class="price-factors__title" v-html="title" />
        <p v-if="subtitle" class="price-factors__subtitle">{{ subtitle }}</p>
      </slot>

      <!-- Список факторов -->
      <div class="price-factors__list">
        <article
          v-for="(factor, index) in factors"
          :key="factor.title"
          class="price-factor"
          :style="{ '--delay': index * 0.08 + 's' }"
        >
          <!-- Номер фактора -->
          <div class="price-factor__number">
            {{ String(index + 1).padStart(2, '0') }}
          </div>

          <!-- Иконка -->
          <div class="price-factor__icon">
            <slot name="factor-icon" :factor="factor" :index="index">
              <Icon v-if="factor.icon" :name="factor.icon" size="26" />
              <Icon v-else name="mdi:format-list-numbered" size="26" />
            </slot>
          </div>

          <!-- Контент -->
          <div class="price-factor__content">
            <h3 class="price-factor__title">{{ factor.title }}</h3>
            <p class="price-factor__desc">{{ factor.description }}</p>

            <!-- Опциональный слот для доп. контента внутри фактора -->
            <slot name="factor-content" :factor="factor" :index="index" />
          </div>
        </article>
      </div>

      <!-- Подпись внизу блока (ориентир по цене) -->
      <div v-if="footerNote || $slots.footer" class="price-factors__footer">
        <slot name="footer">
          <Icon name="mdi:information-outline" size="22" class="price-factors__footer-icon" />
          <p class="price-factors__footer-text" v-html="footerNote" />
        </slot>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
export interface PriceFactor {
  title: string
  description: string
  icon?: string
  [key: string]: unknown
}

withDefaults(
  defineProps<{
    title: string
    subtitle?: string
    factors: PriceFactor[]
    footerNote?: string
    /** 🆕 Тема оформления: 'light' | 'dark' */
    theme?: 'light' | 'dark'
  }>(),
  {
    theme: 'dark',
  }
)
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;
@use '@/assets/styles/mixins' as *;

.price-factors {
  @include section-padding;
  position: relative;
  overflow: hidden;

  // ========================================
  // THEME: DARK (по умолчанию)
  // ========================================
  &--dark {
    --section-bg: #{$background-dark};
    --section-text: #{$text-light};
    --section-text-secondary: rgba(255, 255, 255, 0.75);
    --card-bg: rgba(255, 255, 255, 0.035);
    --card-border: rgba(255, 255, 255, 0.08);
    --card-hover-bg: rgba(0, 195, 245, 0.04);
    --card-hover-border: rgba(0, 195, 245, 0.3);
    --icon-bg: rgba(0, 195, 245, 0.12);
    --icon-color: #{$blue-light};
    --footer-bg: rgba(0, 195, 245, 0.06);
    --footer-border: rgba(0, 195, 245, 0.2);
    --footer-text: rgba(255, 255, 255, 0.88);
    --glow-color: rgba(0, 195, 245, 0.05);
  }

  // ========================================
  // THEME: LIGHT
  // ========================================
  &--light {
    --section-bg: #{$background-light};
    --section-text: #{$text-dark};
    --section-text-secondary: #{$text-gray};
    --card-bg: #fff;
    --card-border: #{$border-color};
    --card-hover-bg: rgba(0, 195, 245, 0.02);
    --card-hover-border: rgba(0, 195, 245, 0.4);
    --icon-bg: rgba(0, 195, 245, 0.1);
    --icon-color: #{$blue};
    --footer-bg: rgba(0, 195, 245, 0.04);
    --footer-border: rgba(0, 195, 245, 0.2);
    --footer-text: #{$text-dark};
    --glow-color: rgba(0, 195, 245, 0.03);
  }

  background: var(--section-bg);
  color: var(--section-text);

  // Мягкое свечение в углу
  &::after {
    content: '';
    position: absolute;
    bottom: -15%;
    left: -5%;
    width: 450px;
    height: 450px;
    background: radial-gradient(circle, var(--glow-color) 0%, transparent 70%);
    border-radius: 50%;
    pointer-events: none;
  }

  .container {
    @include section-container;
  }

  // === Заголовок ===
  &__title {
    @include section-title;
  }

  &__subtitle {
    @include section-subtitle;
    color: var(--section-text-secondary);
    margin-top: 1.5rem;
  }

  // === Список факторов ===
  &__list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-top: 2.5rem;
  }

  // === Подпись внизу ===
  &__footer {
    margin-top: 3rem;
    padding: 1.5rem 1.8rem;
    background: var(--footer-bg);
    border: 1px solid var(--footer-border);
    border-left: 4px solid $blue;
    border-radius: $border-radius;
    display: flex;
    align-items: flex-start;
    gap: 1rem;

    @media (max-width: 640px) {
      padding: 1.2rem 1.4rem;
      flex-direction: column;
      gap: 0.6rem;
    }
  }

  &__footer-icon {
    color: $blue;
    flex-shrink: 0;
    margin-top: 2px;
  }

  &__footer-text {
    font-size: 0.98rem;
    line-height: 1.65;
    color: var(--footer-text);
    margin: 0;

    :deep(strong),
    :deep(b) {
      color: $blue;
      font-weight: 600;
    }

    :deep(em),
    :deep(i) {
      color: var(--section-text-secondary);
    }
  }
}

// === Фактор ===
.price-factor {
  position: relative;
  display: grid;
  grid-template-columns: auto auto 1fr;
  gap: 1.2rem 1.2rem;
  align-items: start;
  padding: 1.6rem 1.8rem;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 14px;
  transition: all 0.3s ease;
  backdrop-filter: blur(8px);

  &:hover {
    box-shadow: 0 10px 28px rgba(0, 195, 245, 0.12);
    background: var(--card-hover-bg);
    border-color: var(--card-hover-border);
    transform: translateY(-2px);
  }

  // Анимация появления
  opacity: 0;
  transform: translateY(16px);
  animation: fadeInUp 0.55s var(--delay, 0s) ease forwards;

  // Номер
  &__number {
    position: absolute;
    top: 0.8rem;
    right: 1.2rem;
    font-family: 'Rubik', sans-serif;
    font-size: 1.4rem;
    font-weight: 800;
    background: $blue-gradient;
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    opacity: 0.35;
    pointer-events: none;
    transition: opacity 0.3s ease;
  }

  &:hover &__number {
    opacity: 0.75;
  }

  // Иконка
  &__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 50px;
    height: 50px;
    background: var(--icon-bg);
    color: var(--icon-color);
    border-radius: 12px;
    flex-shrink: 0;
    transition: all 0.3s ease;

    .price-factor:hover & {
      transform: scale(1.05);
    }
  }

  // Контент
  &__content {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  &__title {
    font-family: 'Rubik', sans-serif;
    font-size: 1.2rem;
    font-weight: 600;
    color: var(--section-text);
    margin: 0;
    line-height: 1.3;
  }

  &__desc {
    font-size: 0.98rem;
    line-height: 1.6;
    color: var(--section-text-secondary);
    margin: 0;
  }
}

// === Анимация ===
@keyframes fadeInUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// === Адаптив ===
@media (max-width: 640px) {
  .price-factor {
    grid-template-columns: auto 1fr;
    padding: 1.3rem 1.2rem;
    gap: 0.8rem 1rem;

    &__icon {
      grid-row: span 1;
      width: 44px;
      height: 44px;
    }

    &__number {
      position: static;
      grid-column: 2;
      justify-self: end;
      font-size: 1.1rem;
      opacity: 0.5;
    }

    &__content {
      grid-column: 1 / -1;
    }

    &__title {
      font-size: 1.1rem;
    }
  }
}
</style>
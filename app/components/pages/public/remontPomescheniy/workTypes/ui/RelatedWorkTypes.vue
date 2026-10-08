<!-- app/components/pages/public/remontPomescheniy/workTypes/ui/RelatedWorkTypes.vue -->
<template>
  <section class="related-work-types" :class="`related-work-types--${theme}`">
    <div class="container">
      <!-- Заголовок -->
      <header class="related-header">
        <h2 class="related-header__title" v-html="title" />
        <p v-if="subtitle" class="related-header__subtitle">{{ subtitle }}</p>
      </header>

      <!-- Карточки -->
      <div class="related-grid">
        <NuxtLink
          v-for="item in resolvedItems"
          :key="item.to"
          :to="item.to"
          class="related-card"
          :class="{ 'related-card--active': item.active }"
          :aria-current="item.active ? 'page' : undefined"
        >
          <!-- Верхняя градиентная полоска (акцент) -->
          <span class="related-card__accent" aria-hidden="true" />

          <!-- Изображение -->
          <div class="related-card__image" v-if="item.image">
            <img :src="item.image" :alt="item.title" loading="lazy" />
            <div class="related-card__image-overlay">
              <Icon :name="item.icon || 'mdi:circle'" size="26" />
            </div>
            <div class="related-card__image-gradient" aria-hidden="true" />
          </div>

          <!-- Плейсхолдер, если нет картинки -->
          <div class="related-card__image related-card__image--placeholder" v-else>
            <Icon :name="item.icon || 'mdi:circle'" size="36" />
          </div>

          <!-- Контент -->
          <div class="related-card__content">
            <div class="related-card__head">
              <h3 class="related-card__title">{{ item.title }}</h3>
              <span
                v-if="item.active"
                class="related-card__badge"
                aria-hidden="true"
              >
                <Icon name="mdi:check-circle" size="14" />
                Здесь
              </span>
            </div>

            <p class="related-card__desc" v-if="item.description">
              {{ item.description }}
            </p>

            <div class="related-card__bottom">
              <span v-if="item.priceFrom" class="related-card__price">
                <span class="related-card__price-value">{{ item.priceFrom }}</span>
                <span class="related-card__price-unit">₽/м²</span>
              </span>
              <span v-else class="related-card__price related-card__price--empty">
                По запросу
              </span>

              <span
                class="related-card__action"
                :class="{ 'related-card__action--active': item.active }"
              >
                <template v-if="item.active">
                  Текущая страница
                </template>
                <template v-else>
                  Перейти
                  <Icon name="mdi:arrow-right" size="16" />
                </template>
              </span>
            </div>
          </div>
        </NuxtLink>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { RelatedWorkTypeItem } from '../types'
import type { NormalizedWorkItem } from '~/types/calculator'

export interface PriceData {
  standard: NormalizedWorkItem[]
  piece: NormalizedWorkItem[]
}

const props = withDefaults(
  defineProps<{
    title: string
    subtitle?: string
    items: RelatedWorkTypeItem[]
    /** 🆕 Данные прайс-листа от родителя (чтобы избежать гидратации) */
    priceData?: Record<string, PriceData>
    /** 🆕 Тема оформления: 'light' | 'dark' */
    theme?: 'light' | 'dark'
  }>(),
  {
    title: 'Другие <span>виды работ</span> в этой категории',
    theme: 'dark',
  }
)

/**
 * Ищет работу в переданных данных по ID из БД.
 */
const findWorkById = (id: number): NormalizedWorkItem | undefined => {
  if (!props.priceData) return undefined
  const allWorks = Object.values(props.priceData).flatMap(section => [
    ...section.standard,
    ...section.piece
  ])
  return allWorks.find(w => w.id === id)
}

/**
 * Вычисляемый массив карточек с актуальными ценами из прайс-листа.
 */
const resolvedItems = computed(() => {
  return props.items.map(item => {
    if (item.priceWorkId) {
      const work = findWorkById(item.priceWorkId)
      if (work) {
        return {
          ...item,
          priceFrom: Math.round(work.pricePerUnit),
        }
      }
    }
    return item
  })
})
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;
@use '@/assets/styles/mixins' as *;

.related-work-types {
  @include section-padding;
  position: relative;
  overflow: hidden;

  // ========================================
  // THEME: DARK (по умолчанию)
  // ========================================
  &--dark {
    --section-bg: #{$background-dark};
    --section-text: #{$text-light};
    --section-text-secondary: rgba(255, 255, 255, 0.72);
    --card-bg: rgba(255, 255, 255, 0.035);
    --card-border: rgba(255, 255, 255, 0.08);
    --card-hover-bg: rgba(255, 255, 255, 0.055);
    --card-hover-shadow: 0 18px 40px rgba(0, 0, 0, 0.45);
    --card-active-bg: rgba(0, 195, 245, 0.06);
    --card-active-shadow: 0 0 0 1px #{$blue}, 0 10px 30px rgba(0, 195, 245, 0.18);
    --card-title-color: #{$text-light};
    --card-title-active-color: #{$blue-light};
    --card-desc-color: rgba(255, 255, 255, 0.68);
    --card-bottom-border: rgba(255, 255, 255, 0.08);
    --card-price-color: #{$text-light};
    --card-price-unit-color: rgba(255, 255, 255, 0.55);
    --glow-color: rgba(0, 195, 245, 0.07);
    --placeholder-bg: rgba(255, 255, 255, 0.02);
    --placeholder-color: rgba(255, 255, 255, 0.28);
    --overlay-bg: rgba($background-dark, 0.7);
    --overlay-color: #{$blue-light};
    --badge-bg: rgba(0, 195, 245, 0.14);
    --badge-color: #{$blue-light};
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
    --card-hover-bg: #fff;
    --card-hover-shadow: 0 18px 40px rgba(0, 0, 0, 0.12);
    --card-active-bg: rgba(0, 195, 245, 0.04);
    --card-active-shadow: 0 0 0 1px #{$blue}, 0 10px 30px rgba(0, 195, 245, 0.15);
    --card-title-color: #{$text-dark};
    --card-title-active-color: #{$blue};
    --card-desc-color: #{$text-gray};
    --card-bottom-border: #{$border-color};
    --card-price-color: #{$text-dark};
    --card-price-unit-color: #{$text-gray};
    --glow-color: rgba(0, 195, 245, 0.05);
    --placeholder-bg: rgba(0, 195, 245, 0.04);
    --placeholder-color: rgba($text-dark, 0.25);
    --overlay-bg: rgba(255, 255, 255, 0.85);
    --overlay-color: #{$blue};
    --badge-bg: rgba(0, 195, 245, 0.1);
    --badge-color: #{$blue};
  }

  background: var(--section-bg);
  color: var(--section-text);

  // Декоративное свечение
  &::before {
    content: '';
    position: absolute;
    top: -10%;
    right: -5%;
    width: 500px;
    height: 500px;
    background: radial-gradient(circle, var(--glow-color) 0%, transparent 65%);
    border-radius: 50%;
    pointer-events: none;
  }

  .container {
    @include section-container;
  }
}

// === Заголовок ===
.related-header {
  margin-bottom: 2.75rem;
  max-width: 720px;

  &__title {
    @include section-title;
  }

  &__subtitle {
    @include section-subtitle;
    color: var(--section-text-secondary);
  }
}

// === Сетка карточек ===
.related-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1.1rem;
  }
}

// === Карточка ===
.related-card {
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  text-decoration: none;
  color: inherit;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 16px;
  transition:
    transform 0.35s ease,
    background 0.3s ease,
    border-color 0.3s ease,
    box-shadow 0.35s ease;

  // Верхняя градиентная полоска (появляется на hover)
  &__accent {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: $blue-gradient;
    transform: scaleX(0);
    transform-origin: left center;
    transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: 3;
  }

  &:hover:not(.related-card--active) {
    transform: translateY(-6px);
    background: var(--card-hover-bg);
    border-color: rgba(0, 195, 245, 0.45);
    box-shadow: var(--card-hover-shadow);

    .related-card__accent {
      transform: scaleX(1);
    }

    .related-card__image img {
      transform: scale(1.08);
    }

    .related-card__image-overlay {
      background: rgba(0, 195, 245, 0.9);
      color: $background-dark;
      transform: translateY(-2px);
    }

    .related-card__action {
      gap: 0.7rem;
      color: $blue-light;

      .related-work-types--light & {
        color: $blue;
      }
    }

    .related-card__title {
      color: $blue;
    }

    .related-work-types--dark & .related-card__title {
      color: $blue-light;
    }
  }

  // === Активная карточка ===
  &--active {
    border-color: $blue;
    background: var(--card-active-bg);
    box-shadow: var(--card-active-shadow);
    cursor: default;

    .related-card__accent {
      transform: scaleX(1);
    }

    .related-card__image-overlay {
      background: rgba(0, 195, 245, 0.9);
      color: $background-dark;
    }

    .related-card__title {
      color: var(--card-title-active-color);
    }
  }

  // === Изображение ===
  &__image {
    position: relative;
    aspect-ratio: 16 / 10;
    overflow: hidden;
    background: $background-gray;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      transition: transform 0.7s cubic-bezier(0.2, 0.8, 0.2, 1);
    }

    &--placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--placeholder-color);
      background: var(--placeholder-bg);
    }
  }

  &__image-gradient {
    position: absolute;
    inset: auto 0 0 0;
    height: 55%;
    background: linear-gradient(
      to top,
      rgba(0, 0, 0, 0.45) 0%,
      rgba(0, 0, 0, 0) 100%
    );
    pointer-events: none;
  }

  &__image-overlay {
    position: absolute;
    top: 1rem;
    left: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    background: var(--overlay-bg);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    color: var(--overlay-color);
    border-radius: 12px;
    z-index: 2;
    transition:
      background 0.3s ease,
      color 0.3s ease,
      transform 0.3s ease;
  }

  // === Контент ===
  &__content {
    padding: 1.5rem;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.7rem;
  }

  &__head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.6rem;
  }

  &__title {
    font-family: 'Rubik', sans-serif;
    font-size: 1.15rem;
    font-weight: 700;
    color: var(--card-title-color);
    margin: 0;
    line-height: 1.3;
    transition: color 0.25s ease;
  }

  &__badge {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.25rem 0.55rem;
    background: var(--badge-bg);
    color: var(--badge-color);
    font-family: 'Rubik', sans-serif;
    font-size: 0.72rem;
    font-weight: 600;
    border-radius: 999px;
    white-space: nowrap;
  }

  &__desc {
    font-size: 0.92rem;
    line-height: 1.55;
    color: var(--card-desc-color);
    margin: 0;
    flex: 1;
  }

  // === Нижняя строка: цена + кнопка ===
  &__bottom {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.8rem;
    margin-top: 0.4rem;
    padding-top: 1rem;
    border-top: 1px solid var(--card-bottom-border);
  }

  &__price {
    display: inline-flex;
    align-items: baseline;
    gap: 0.2rem;
    color: var(--card-price-color);
    line-height: 1;

    &-value {
      font-family: 'Rubik', sans-serif;
      font-size: 1.3rem;
      font-weight: 700;
      letter-spacing: -0.01em;
    }

    &-unit {
      font-size: 0.82rem;
      font-weight: 500;
      color: var(--card-price-unit-color);
    }

    &--empty {
      font-size: 0.9rem;
      font-weight: 500;
      color: var(--card-price-unit-color);
    }
  }

  &__action {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.45rem 0.9rem;
    border-radius: 999px;
    background: rgba(0, 195, 245, 0.08);
    font-family: 'Rubik', sans-serif;
    font-size: 0.85rem;
    font-weight: 600;
    color: $blue-light;
    transition:
      gap 0.3s ease,
      background 0.3s ease,
      color 0.25s ease;

    .related-work-types--light & {
      background: rgba(0, 195, 245, 0.1);
      color: $blue;
    }

    &--active {
      background: rgba(0, 161, 42, 0.12);
      color: $green;
      gap: 0.3rem;
    }
  }
}

// === Мобильный адаптив ===
@media (max-width: 768px) {
  .related-header {
    margin-bottom: 2rem;
  }

  .related-card {
    &__content {
      padding: 1.2rem;
    }

    &__image-overlay {
      width: 40px;
      height: 40px;
      top: 0.8rem;
      left: 0.8rem;
    }

    &__title {
      font-size: 1.05rem;
    }

    &__price-value {
      font-size: 1.15rem;
    }

    &__bottom {
      flex-wrap: wrap;
    }
  }
}
</style>
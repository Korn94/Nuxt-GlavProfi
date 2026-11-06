<!-- app/components/pages/public/remontPomescheniy/pageTypes/ui/RelatedServicesGrid.vue -->
<template>
  <section v-if="items.length" class="related-services" :class="`related-services--${theme}`">
    <div class="container">
      <!-- Заголовок -->
      <header class="related-services__header">
        <h2 class="related-services__title" v-html="title" />
        <p v-if="subtitle" class="related-services__subtitle">{{ subtitle }}</p>
      </header>

      <!-- Сетка карточек: другие типы помещений -->
      <div class="related-services__grid">
        <NuxtLink
          v-for="item in items"
          :key="item.slug"
          :to="`/remont-pomescheniy/${item.slug}`"
          class="related-service-card"
        >
          <!-- Верхняя градиентная полоска (акцент на hover) -->
          <span class="related-service-card__accent" aria-hidden="true" />

          <!-- Изображение + подпись поверх -->
          <div class="related-service-card__image">
            <img
              :src="getPremisesImageUrl(item)"
              :alt="item.title"
              loading="lazy"
            >
            <div class="related-service-card__overlay">
              <h3 class="related-service-card__title">{{ item.title }}</h3>
              <p v-if="item.subtitle" class="related-service-card__subtitle">
                {{ item.subtitle }}
              </p>
            </div>
          </div>

          <!-- Цена и переход -->
          <div class="related-service-card__body">
            <div class="related-service-card__footer">
              <span class="related-service-card__price">{{ item.price }}</span>
              <span class="related-service-card__action">
                Перейти
                <Icon name="mdi:arrow-right" size="16" />
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
import { getPremisesImageUrl, getSimilarPremises } from '../data/premisesCatalog'

const props = withDefaults(
  defineProps<{
    /** Slug текущей страницы услуги: 'banki', 'ofisy', 'sklady' … */
    category: string
    /** Сколько карточек показывать (по умолчанию 3) */
    limit?: number
    /** Тема оформления секции */
    theme?: 'dark' | 'light'
    /** Заголовок (можно с <span> для градиентного акцента) */
    title?: string
    /** Подзаголовок */
    subtitle?: string
  }>(),
  {
    limit: 3,
    theme: 'dark',
    title: 'Также выполняем <span>ремонт других помещений</span>',
    subtitle:
      'Работаем с коммерческими, производственными и медицинскими объектами: от небольших МОПов и офисов до складов, цехов и клиник. Выберите свой тип помещения — покажем состав работ и ориентиры по цене.',
  },
)

/**
 * Другие категории: текущая страница исключена, неготовые услуги
 * (`isReady: false`) тоже — ссылка не должна вести «в никуда».
 */
const items = computed(() => getSimilarPremises(props.category, props.limit))
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;
@use '@/assets/styles/mixins' as *;

.related-services {
  @include section-padding;
  position: relative;
  overflow: hidden;

  // ========================================
  // ТЕМА: DARK (по умолчанию)
  // ========================================
  &--dark {
    --rs-bg: #{$background-dark};
    --rs-text: #{$text-light};
    --rs-text-secondary: rgba(255, 255, 255, 0.72);
    --rs-card-bg: rgba(255, 255, 255, 0.035);
    --rs-card-border: rgba(255, 255, 255, 0.08);
    --rs-card-hover-bg: rgba(255, 255, 255, 0.055);
    --rs-card-hover-shadow: 0 18px 40px rgba(0, 0, 0, 0.45);
    --rs-card-footer-border: rgba(255, 255, 255, 0.08);
    --rs-price-color: #{$blue-light};
    --rs-image-overlay: linear-gradient(
      to top,
      rgba(0, 0, 0, 0.78) 0%,
      rgba(0, 0, 0, 0) 72%
    );
    --rs-glow: rgba(0, 195, 245, 0.07);
  }

  // ========================================
  // ТЕМА: LIGHT
  // ========================================
  &--light {
    --rs-bg: #{$background-light};
    --rs-text: #{$text-dark};
    --rs-text-secondary: #{$text-gray};
    --rs-card-bg: #fff;
    --rs-card-border: #{$border-color};
    --rs-card-hover-bg: #fff;
    --rs-card-hover-shadow: 0 18px 40px rgba(0, 0, 0, 0.12);
    --rs-card-footer-border: #{$border-color};
    --rs-price-color: #{$blue};
    --rs-image-overlay: linear-gradient(
      to top,
      rgba(0, 0, 0, 0.72) 0%,
      rgba(0, 0, 0, 0) 72%
    );
    --rs-glow: rgba(0, 195, 245, 0.05);
  }

  background: var(--rs-bg);
  color: var(--rs-text);

  // Декоративное свечение справа сверху
  &::before {
    content: '';
    position: absolute;
    top: -15%;
    right: -8%;
    width: 520px;
    height: 520px;
    background: radial-gradient(circle, var(--rs-glow) 0%, transparent 65%);
    border-radius: 50%;
    pointer-events: none;
  }

  .container {
    @include section-container;
  }

  &__header {
    margin-bottom: 2.75rem;
    max-width: 760px;
  }

  &__title {
    @include section-title;
  }

  &__subtitle {
    @include section-subtitle;
    color: var(--rs-text-secondary);
  }

  // === Сетка: 3 → 2 → 1 ===
  &__grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1.5rem;

    @media (max-width: 1024px) {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    @media (max-width: 680px) {
      grid-template-columns: 1fr;
      gap: 1.1rem;
    }
  }
}

// ========================================
// КАРТОЧКА
// ========================================
.related-service-card {
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  text-decoration: none;
  color: inherit;
  background: var(--rs-card-bg);
  border: 1px solid var(--rs-card-border);
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

  &:hover {
    transform: translateY(-6px);
    background: var(--rs-card-hover-bg);
    border-color: rgba(0, 195, 245, 0.45);
    box-shadow: var(--rs-card-hover-shadow);

    .related-service-card__accent {
      transform: scaleX(1);
    }

    .related-service-card__image img {
      transform: scale(1.06);
    }

    .related-service-card__action {
      gap: 0.65rem;
    }

    .related-service-card__title {
      color: $blue-light;

      .related-services--light & {
        color: $blue;
      }
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

    // Затемнение снизу — чтобы подпись читалась на любом фото
    &::after {
      content: '';
      position: absolute;
      inset: 0;
      background: var(--rs-image-overlay);
      pointer-events: none;
    }
  }

  // === Подпись поверх изображения ===
  &__overlay {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 2;
    padding: 1.25rem 1.35rem 1.15rem;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  &__title {
    margin: 0;
    font-family: 'Rubik', sans-serif;
    font-size: 1.2rem;
    font-weight: 700;
    line-height: 1.25;
    color: #fff;
    transition: color 0.25s ease;
  }

  &__subtitle {
    margin: 0;
    font-size: 0.82rem;
    line-height: 1.4;
    color: rgba(255, 255, 255, 0.85);
  }

  // === Нижняя часть: цена + «Перейти» ===
  &__body {
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    flex: 1;
    padding: 1.1rem 1.35rem 1.25rem;
  }

  &__footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.85rem;
    padding-top: 0.9rem;
    border-top: 1px solid var(--rs-card-footer-border);
  }

  &__price {
    font-family: 'Rubik', sans-serif;
    font-size: 1rem;
    font-weight: 700;
    color: var(--rs-price-color);
    white-space: nowrap;
  }

  &__action {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    font-family: 'Rubik', sans-serif;
    font-size: 0.88rem;
    font-weight: 600;
    color: $blue-light;
    transition: gap 0.3s ease;

    .related-services--light & {
      color: $blue;
    }
  }
}

// === Мобильный адаптив ===
@media (max-width: 768px) {
  .related-services {
    &__header {
      margin-bottom: 2rem;
    }
  }

  .related-service-card {
    &__title {
      font-size: 1.08rem;
    }

    &__overlay {
      padding: 1.1rem 1.2rem 1rem;
    }

    &__body {
      padding: 1rem 1.2rem 1.15rem;
    }
  }
}
</style>

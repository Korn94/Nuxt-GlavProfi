<!-- app\components\pages\public\remontPomescheniy\workTypes\ui\RelatedWorkTypes.vue -->
<template>
  <section class="related-work-types">
    <div class="container">
      <!-- Заголовок -->
      <header class="related-header">
        <h2 class="related-header__title" v-html="title" />
        <p v-if="subtitle" class="related-header__subtitle">{{ subtitle }}</p>
      </header>

      <!-- Карточки -->
      <div class="related-grid">
        <NuxtLink
          v-for="item in items"
          :key="item.to"
          :to="item.to"
          class="related-card"
          :class="{ 'related-card--active': item.active }"
          :aria-current="item.active ? 'page' : undefined"
        >
          <!-- Изображение -->
          <div class="related-card__image" v-if="item.image">
            <img :src="item.image" :alt="item.title" loading="lazy" />
            <!-- Оверлей с иконкой -->
            <div class="related-card__image-overlay">
              <Icon :name="item.icon || 'mdi:circle'" size="28" />
            </div>
          </div>

          <!-- Плейсхолдер, если нет картинки -->
          <div class="related-card__image related-card__image--placeholder" v-else>
            <Icon :name="item.icon || 'mdi:circle'" size="36" />
          </div>

          <!-- Контент -->
          <div class="related-card__content">
            <h3 class="related-card__title">{{ item.title }}</h3>
            <p class="related-card__desc" v-if="item.description">
              {{ item.description }}
            </p>

            <div class="related-card__bottom">
              <span v-if="item.priceFrom" class="related-card__price">
                {{ item.priceFrom }} ₽/м²
              </span>

              <!-- Кнопка действия -->
              <span
                class="related-card__action"
                :class="{ 'related-card__action--active': item.active }"
              >
                <template v-if="item.active">
                  <Icon name="mdi:check-circle" size="16" />
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
import type { WorkTypeNavItem } from './WorkTypeNavigator.vue'

/** Расширенный тип с картинкой */
export interface RelatedWorkTypeItem extends WorkTypeNavItem {
  /** URL картинки для карточки */
  image?: string
}

withDefaults(
  defineProps<{
    title: string
    subtitle?: string
    items: RelatedWorkTypeItem[]
  }>(),
  {
    title: 'Другие <span>виды работ</span> в этой категории',
  }
)
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;
@use '@/assets/styles/mixins' as *;

.related-work-types {
  @include section-padding; // БЫЛО: padding: 5rem 0;
  background: $background-dark;
  color: $text-light; // ДОБАВИЛИ: наследование цвета
  position: relative;
  overflow: hidden;

  // Декоративное свечение
  &::before {
    content: '';
    position: absolute;
    top: -10%;
    right: -5%;
    width: 500px;
    height: 500px;
    background: radial-gradient(circle, rgba(0, 195, 245, 0.05) 0%, transparent 65%);
    border-radius: 50%;
    pointer-events: none;
  }

  .container {
    @include section-container; // БЫЛО: дублирование, СТАЛО: миксин
  }
}

// === Заголовок ===
.related-header {
  margin-bottom: 2.5rem;
  max-width: 720px;

  &__title {
    @include section-title; // БЫЛО: 25 строк дублирования, СТАЛО: 1 строка
  }

  &__subtitle {
    @include section-subtitle;
    color: rgba($text-light, 0.7);
  }
}

// === Сетка карточек ===
.related-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

// === Карточка ===
.related-card {
  @include dark-card; // БЫЛО: дублирование hover-эффектов
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  text-decoration: none;

  &:hover:not(.related-card--active) {
    .related-card__image img {
      transform: scale(1.06);
    }

    .related-card__action {
      gap: 0.7rem;
      color: $blue-light;
    }
  }

  // === Активная карточка ===
  &--active {
    border-color: $blue;
    background: rgba(0, 195, 245, 0.06);
    box-shadow: 0 0 0 1px $blue, 0 8px 24px rgba(0, 195, 245, 0.12);

    .related-card__image-overlay {
      background: rgba(0, 195, 245, 0.85);
      color: $background-dark;
    }

    .related-card__title {
      color: $blue-light;
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
      transition: transform 0.5s ease;
    }

    &--placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      color: rgba($text-light, 0.3);
      background: linear-gradient(
        135deg,
        rgba(0, 195, 245, 0.08) 0%,
        rgba(0, 195, 245, 0.02) 100%
      );
    }
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
    background: rgba($background-dark, 0.75);
    backdrop-filter: blur(8px);
    color: $blue-light;
    border-radius: 12px;
    transition: all 0.3s ease;
  }

  // === Контент ===
  &__content {
    padding: 1.5rem;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  &__title {
    font-family: 'Rubik', sans-serif;
    font-size: 1.15rem;
    font-weight: 700;
    color: $text-light;
    margin: 0;
    line-height: 1.3;
    transition: color 0.2s ease;
  }

  &__desc {
    font-size: 0.92rem;
    line-height: 1.55;
    color: rgba($text-light, 0.7);
    margin: 0;
    flex: 1;
  }

  // === Нижняя строка: цена + кнопка ===
  &__bottom {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.8rem;
    margin-top: 0.5rem;
    padding-top: 1rem;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
  }

  &__price {
    font-size: 0.95rem;
    font-weight: 600;
    color: rgba($text-light, 0.85);
  }

  &__action {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    font-family: 'Rubik', sans-serif;
    font-size: 0.88rem;
    font-weight: 600;
    color: $blue-light;
    transition: gap 0.3s ease, color 0.2s ease;

    &--active {
      color: $green;
      gap: 0.4rem;
    }
  }
}

// === Мобильный адаптив ===
@media (max-width: 768px) {
  // УБРАЛИ: padding: 3.5rem 0; (уже в section-padding)

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
  }
}
</style>
<template>
  <section class="prices-showcase">
    <div class="container">
      <!-- Заголовок -->
      <header class="prices-showcase__header">
        <h2 class="prices-showcase__title" v-html="title" />
        <p v-if="subtitle" class="prices-showcase__subtitle">{{ subtitle }}</p>
      </header>

      <!-- Промо-блок + статистика -->
      <div class="prices-showcase__top">
        <!-- Промо -->
        <div class="promo-card">
          <span class="promo-card__label">
            <Icon name="mdi:file-document-outline" size="14" />
            {{ promoLabel }}
          </span>
          <h3 class="promo-card__title">{{ promoTitle }}</h3>
          <p v-if="promoDescription" class="promo-card__desc">{{ promoDescription }}</p>
          <NuxtLink :to="promoHref" class="promo-card__btn">
            {{ promoButtonText }}
            <Icon name="mdi:arrow-right" size="18" />
          </NuxtLink>
        </div>

        <!-- Статистика -->
        <div class="stats-grid">
          <div v-for="(stat, index) in stats" :key="index" class="stat-card">
            <span class="stat-card__value">{{ stat.value }}</span>
            <span class="stat-card__label">{{ stat.label }}</span>
          </div>
        </div>
      </div>

      <!-- Карточки категорий -->
      <div class="categories-grid">
        <NuxtLink
          v-for="cat in categories"
          :key="cat.href"
          :to="cat.href"
          class="category-card"
        >
          <div class="category-card__icon">
            <Icon :name="cat.icon || 'mdi:folder-outline'" size="24" />
          </div>
          <div class="category-card__content">
            <h3 class="category-card__title">{{ cat.name }}</h3>
            <p class="category-card__desc">{{ cat.desc }}</p>
          </div>
          <span class="category-card__arrow" aria-hidden="true">
            <Icon name="mdi:arrow-right" size="20" />
          </span>
        </NuxtLink>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
export interface PriceStat {
  value: string
  label: string
}

export interface PriceCategory {
  name: string
  desc: string
  icon?: string
  href: string
}

withDefaults(
  defineProps<{
    /** Заголовок секции (span — градиентный акцент) */
    title?: string
    subtitle?: string
    promoLabel?: string
    promoTitle?: string
    promoDescription?: string
    promoHref?: string
    promoButtonText?: string
    stats?: PriceStat[]
    categories?: PriceCategory[]
  }>(),
  {
    title: 'Прайс-лист на <span>ремонт и отделку</span>',
    subtitle:
      'Прозрачные цены без скрытых доплат. Фиксируем смету в договоре до начала работ.',
    promoLabel: 'Прайс-лист 2026',
    promoTitle: 'Ремонт и отделка коммерческих помещений под ключ',
    promoDescription:
      'Полный прайс на все виды работ с ценами за м². Посмотрите онлайн или запросите смету.',
    promoHref: '/prices/otdelochnye-raboty',
    promoButtonText: 'Смотреть цены',
    stats: () => [
      { value: '2014 г.', label: 'На рынке с' },
      { value: '250+', label: 'Объектов сдано' },
      { value: 'до 20%', label: 'Экономия на материалах' },
      { value: '5', label: 'Специализированных бригад' },
    ],
    categories: () => [
      {
        name: 'Отделочные работы',
        desc: 'Полы, стены, потолки — любые материалы и технологии',
        icon: 'mdi:format-paint',
        href: '/prices/otdelochnye-raboty',
      },
      {
        name: 'Сантехника',
        desc: 'Монтаж труб, установка санфаянса, ремонт коммуникаций',
        icon: 'mdi:water-pump',
        href: '/prices/plumbing',
      },
      {
        name: 'Электромонтаж',
        desc: 'Прокладка проводки, освещение, щитки, розетки',
        icon: 'mdi:electricity',
        href: '/prices/electricity',
      },
    ],
  }
)
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;
@use '@/assets/styles/mixins' as *;

.prices-showcase {
  @include section-padding;
  background: $background-light;
  color: $text-dark;

  .container {
    @include section-container;
  }

  // === Заголовок ===
  &__header {
    margin-bottom: 2.5rem;
    max-width: 720px;
  }

  &__title {
    @include section-title;
  }

  &__subtitle {
    @include section-subtitle;
    color: $text-gray;
  }

  // === Верх: промо + статистика ===
  &__top {
    display: grid;
    grid-template-columns: 1.15fr 1fr;
    gap: 1.5rem;
    margin-bottom: 1.5rem;

    @media (max-width: 900px) {
      grid-template-columns: 1fr;
    }
  }
}

// === Промо-карточка ===
.promo-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 2rem;
  background: $background-gray;
  // border: 1px solid $border-color;
  border-radius: 14px;
  overflow: hidden;
  transition: $transition;

  // Градиентная полоса сверху
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: $blue-gradient;
  }

  &:hover {
    border-color: rgba(0, 195, 245, 0.4);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.08);
  }

  &__label {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    align-self: flex-start;
    padding: 0.35rem 0.9rem;
    background: rgba(0, 195, 245, 0.1);
    color: $blue;
    border-radius: 50px;
    font-family: 'Rubik', sans-serif;
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;

    :deep(.icon) {
      flex-shrink: 0;
    }
  }

  &__title {
    font-family: 'Rubik', sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
    color: $text-light;
    margin: 0;
    line-height: 1.3;
  }

  &__desc {
    font-size: 0.98rem;
    line-height: 1.6;
    color: rgba($text-light, 0.65);
    margin: 0;
    flex: 1;
  }

  &__btn {
    @include btn-primary;
    align-self: flex-start;
  }
}

// === Статистика ===
.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
}

.stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
  padding: 1.5rem 1rem;
  background: #fff;
  border: 1px solid $border-color;
  border-radius: 14px;
  text-align: center;
  transition: $transition;

  &:hover {
    border-color: $blue;
    transform: translateY(-3px);
    box-shadow: 0 8px 24px rgba(0, 195, 245, 0.12);
  }

  &__value {
    font-family: 'Rubik', sans-serif;
    font-size: 1.8rem;
    font-weight: 800;
    color: $blue;
    line-height: 1.1;
  }

  &__label {
    font-size: 0.85rem;
    color: $text-gray;
    line-height: 1.4;
  }
}

// === Категории ===
.categories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.category-card {
  @include light-card;
  display: flex;
  align-items: flex-start;
  gap: 1.2rem;
  padding: 1.8rem;
  text-decoration: none;

  &__icon {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 52px;
    height: 52px;
    background: rgba(0, 195, 245, 0.1);
    color: $blue;
    border-radius: 12px;
    transition: $transition;
  }

  &__content {
    flex: 1;
    min-width: 0;
  }

  &__title {
    font-family: 'Rubik', sans-serif;
    font-size: 1.15rem;
    font-weight: 700;
    color: $text-dark;
    margin: 0 0 0.4rem;
    line-height: 1.3;
    transition: color 0.2s ease;
  }

  &__desc {
    font-size: 0.92rem;
    line-height: 1.55;
    color: $text-gray;
    margin: 0;
  }

  &__arrow {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    background: #f0f2f5;
    color: $text-gray;
    border-radius: 50%;
    transition: $transition;
    margin-top: 0.4rem;
  }

  // Ховер всей карточки
  &:hover {
    .category-card__icon {
      background: $blue-gradient;
      color: $background-dark;
    }

    .category-card__title {
      color: $blue;
    }

    .category-card__arrow {
      background: $blue;
      color: #fff;
      transform: translateX(4px);
    }
  }
}
</style>
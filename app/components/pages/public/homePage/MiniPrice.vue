<!-- app\components\pages\public\homePage\MiniPrice.vue -->
<template>
  <section class="prices-showcase">
    <!-- Декоративная сетка на фоне -->
    <div class="prices-showcase__grid-pattern" aria-hidden="true"></div>

    <div class="container">
      <!-- Хедер секции -->
      <div class="prices-showcase__header">
        <div class="prices-showcase__header-left">
          <div class="prices-showcase__badge">
            <Icon name="mdi:tag-outline" size="14" />
            <span>Прайс-лист</span>
          </div>

          <h2 class="prices-showcase__title" v-html="title" />
        </div>

        <p v-if="subtitle" class="prices-showcase__subtitle">{{ subtitle }}</p>
      </div>

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
          <span class="promo-card__corner" aria-hidden="true"></span>
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
          <span class="category-card__corner" aria-hidden="true"></span>
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
  position: relative;
  overflow: hidden;

  // === Фоновая «сетка» из тонких линий (светлая тема) ===
  &__grid-pattern {
    position: absolute;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    background-image:
      linear-gradient(rgba(0, 0, 0, 0.035) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0, 0, 0, 0.035) 1px, transparent 1px);
    background-size: 64px 64px;
    mask-image: radial-gradient(ellipse at 50% 40%, #000 20%, transparent 75%);
    -webkit-mask-image: radial-gradient(ellipse at 50% 40%, #000 20%, transparent 75%);
  }

  .container {
    @include section-container;
    position: relative;
    z-index: 1;
  }

  // ========================================
  // ХЕДЕР СЕКЦИИ
  // ========================================
  &__header {
    display: grid;
    grid-template-columns: 1fr 1fr;
    align-items: end;
    gap: 3rem;
    margin-bottom: 2.5rem;

    @media (max-width: 900px) {
      grid-template-columns: 1fr;
      gap: 1.2rem;
      margin-bottom: 2rem;
    }
  }

  &__header-left {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  // === Бейдж ===
  &__badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.4rem 0.9rem;
    background: rgba(0, 195, 245, 0.08);
    border: 1px solid rgba(0, 195, 245, 0.25);
    border-radius: 100px;
    font-size: 0.78rem;
    font-weight: 500;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: $text-gray;

    :deep(svg) {
      color: $blue;
    }
  }

  // === Заголовок ===
  &__title {
    @include section-title;
    color: $text-dark;
    margin: 0;

    &::after {
      box-shadow: 0 0 14px rgba(0, 195, 245, 0.4);
    }
  }

  // === Подзаголовок (справа) ===
  &__subtitle {
    @include section-subtitle;
    color: $text-gray;
    margin: 0 0 0.4rem;
    max-width: 100%;

    @media (max-width: 900px) {
      margin-top: 0.5rem;
    }

    @media (max-width: 768px) {
      font-size: 0.98rem;
    }
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

// ========================================
// ПРОМО-КАРТОЧКА (тёмный стиль на светлом фоне)
// ========================================
.promo-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 2rem;
  overflow: hidden;
  isolation: isolate;

  // Тёмный градиент как в work-card / feature-card
  background: linear-gradient(
    160deg,
    #232427 0%,
    #18191b 100%
  );
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);

  // Градиентная полоса сверху
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: $blue-gradient;
    z-index: 2;
  }

  // Мягкий голубой «отблеск»
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 0;
    background: radial-gradient(
      circle at 50% 0%,
      rgba(0, 195, 245, 0.14),
      transparent 60%
    );
    opacity: 0;
    transition: opacity 0.4s ease;
    pointer-events: none;
  }

  &:hover {
    transform: translateY(-4px);
    border-color: rgba(0, 195, 245, 0.4);
    box-shadow:
      0 20px 40px -12px rgba(0, 0, 0, 0.35),
      0 0 0 1px rgba(0, 195, 245, 0.15) inset;

    &::after { opacity: 1; }

    .promo-card__corner {
      opacity: 1;
      transform: scale(1);
    }
  }

  &__label {
    position: relative;
    z-index: 1;
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    align-self: flex-start;
    padding: 0.35rem 0.9rem;
    background: rgba(0, 195, 245, 0.1);
    color: $blue-light;
    border: 1px solid rgba(0, 195, 245, 0.25);
    border-radius: 50px;
    font-family: 'Rubik', sans-serif;
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;

    :deep(svg) {
      color: $blue;
      flex-shrink: 0;
    }
  }

  &__title {
    position: relative;
    z-index: 1;
    font-family: 'Rubik', sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
    color: $text-light;
    margin: 0;
    line-height: 1.3;
    letter-spacing: -0.01em;
  }

  &__desc {
    position: relative;
    z-index: 1;
    font-size: 0.98rem;
    line-height: 1.6;
    color: rgba($text-light, 0.68);
    margin: 0;
    flex: 1;
  }

  &__btn {
    @include btn-primary;
    position: relative;
    z-index: 1;
    align-self: flex-start;
  }

  // === Угловой акцент ===
  &__corner {
    position: absolute;
    top: 0;
    right: 0;
    width: 80px;
    height: 80px;
    opacity: 0;
    transform: scale(0.6);
    transition: all 0.4s ease;
    pointer-events: none;
    background: linear-gradient(
      225deg,
      rgba(0, 195, 245, 0.5) 0%,
      transparent 60%
    );
    border-top-right-radius: 14px;
    mask-image: linear-gradient(225deg, #000 0%, transparent 70%);
    -webkit-mask-image: linear-gradient(225deg, #000 0%, transparent 70%);
    z-index: 1;
  }
}

// ========================================
// СТАТИСТИКА (светлые карточки)
// ========================================
.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;

  @media (max-width: 400px) {
    grid-template-columns: 1fr;
  }
}

.stat-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
  padding: 1.5rem 1rem;
  text-align: center;
  overflow: hidden;
  isolation: isolate;

  background: #fff;
  border: 1px solid $border-color;
  border-radius: 14px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94);

  // Тонкая градиентная полоска сверху
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: $blue-gradient;
    opacity: 0.75;
    transition: opacity 0.35s ease;
  }

  &:hover {
    transform: translateY(-4px);
    border-color: $blue;
    box-shadow: 0 12px 24px rgba(0, 195, 245, 0.12);

    &::before { opacity: 1; }

    .stat-card__value {
      color: $blue-light;
    }
  }

  &__value {
    font-family: 'Rubik', sans-serif;
    font-size: 1.8rem;
    font-weight: 800;
    color: $text-dark;
    line-height: 1.1;
    transition: color 0.3s ease;
    letter-spacing: -0.01em;
  }

  &__label {
    font-size: 0.85rem;
    color: $text-gray;
    line-height: 1.4;
  }
}

// ========================================
// КАТЕГОРИИ (тёмные карточки)
// ========================================
.categories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.category-card {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 1.2rem;
  padding: 1.8rem;
  text-decoration: none;
  overflow: hidden;
  isolation: isolate;

  background: linear-gradient(
    160deg,
    #232427 0%,
    #18191b 100%
  );
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  color: $text-light;

  // Мягкий голубой «отблеск»
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 0;
    background: radial-gradient(
      circle at 50% 0%,
      rgba(0, 195, 245, 0.14),
      transparent 60%
    );
    opacity: 0;
    transition: opacity 0.4s ease;
    pointer-events: none;
  }

  &__icon {
    position: relative;
    z-index: 1;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 52px;
    height: 52px;
    background: rgba(0, 195, 245, 0.1);
    border: 1px solid rgba(0, 195, 245, 0.2);
    color: $blue;
    border-radius: 12px;
    transition: all 0.35s ease;
  }

  &__content {
    position: relative;
    z-index: 1;
    flex: 1;
    min-width: 0;
  }

  &__title {
    font-family: 'Rubik', sans-serif;
    font-size: 1.15rem;
    font-weight: 700;
    color: $text-light;
    margin: 0 0 0.4rem;
    line-height: 1.3;
    letter-spacing: -0.01em;
    transition: color 0.25s ease;
  }

  &__desc {
    font-size: 0.92rem;
    line-height: 1.55;
    color: rgba($text-light, 0.68);
    margin: 0;
  }

  &__arrow {
    position: relative;
    z-index: 1;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: rgba($text-light, 0.7);
    border-radius: 50%;
    transition: all 0.35s ease;
    margin-top: 0.4rem;
  }

  // === Угловой акцент ===
  &__corner {
    position: absolute;
    top: 0;
    right: 0;
    width: 80px;
    height: 80px;
    opacity: 0;
    transform: scale(0.6);
    transition: all 0.4s ease;
    pointer-events: none;
    background: linear-gradient(
      225deg,
      rgba(0, 195, 245, 0.5) 0%,
      transparent 60%
    );
    border-top-right-radius: 14px;
    mask-image: linear-gradient(225deg, #000 0%, transparent 70%);
    -webkit-mask-image: linear-gradient(225deg, #000 0%, transparent 70%);
    z-index: 1;
  }

  // Ховер всей карточки
  &:hover {
    transform: translateY(-6px);
    border-color: rgba(0, 195, 245, 0.4);
    box-shadow:
      0 20px 40px -12px rgba(0, 0, 0, 0.35),
      0 0 0 1px rgba(0, 195, 245, 0.15) inset;

    &::before { opacity: 1; }

    .category-card__icon {
      background: $blue-gradient;
      border-color: transparent;
      color: $background-dark;
      box-shadow: 0 0 24px rgba(0, 195, 245, 0.35);
    }

    .category-card__title {
      color: $blue-light;
    }

    .category-card__arrow {
      background: $blue;
      border-color: $blue;
      color: #fff;
      transform: translateX(4px);
    }

    .category-card__corner {
      opacity: 1;
      transform: scale(1);
    }
  }
}

// ========================================
// АДАПТИВ
// ========================================
@media (max-width: 768px) {
  .prices-showcase {
    padding-top: 4rem;
    padding-bottom: 4rem;
  }

  .promo-card {
    padding: 1.6rem;
    gap: 0.85rem;

    &__title { font-size: 1.25rem; }
    &__desc { font-size: 0.92rem; }
  }

  .stat-card {
    padding: 1.25rem 0.9rem;

    &__value { font-size: 1.5rem; }
    &__label { font-size: 0.8rem; }
  }

  .category-card {
    padding: 1.5rem;

    &__title { font-size: 1.05rem; }
    &__desc { font-size: 0.88rem; }
  }
}
</style>
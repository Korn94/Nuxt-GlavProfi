<!-- app\components\pages\public\remontPomescheniy\workTypes\ui\WorkTypeNavigator.vue -->
<template>
  <section class="work-type-navigator">
    <div class="container">
      <!-- Заголовок (опциональный) -->
      <header v-if="title" class="navigator-header">
        <h2 class="navigator-header__title" v-html="title" />
        <p v-if="subtitle" class="navigator-header__subtitle">{{ subtitle }}</p>
      </header>

      <!-- Карточки навигации -->
      <nav class="navigator-grid" :aria-label="navLabel">
        <NuxtLink
          v-for="item in items"
          :key="item.to"
          :to="item.to"
          class="nav-card"
          :class="{ 'nav-card--active': item.active }"
          :aria-current="item.active ? 'page' : undefined"
        >
          <!-- Иконка -->
          <div class="nav-card__icon">
            <Icon :name="item.icon || 'mdi:circle'" size="26" />
          </div>

          <!-- Контент -->
          <div class="nav-card__content">
            <span class="nav-card__title">{{ item.title }}</span>
            <!-- <span v-if="item.description" class="nav-card__desc">
              {{ item.description }}
            </span> -->
            <div class="nav-card__bottom">
              <span v-if="item.priceFrom" class="nav-card__price">
                {{ item.priceFrom }} ₽/м²
              </span>
              <span v-if="item.active" class="nav-card__badge">
                <Icon name="mdi:check-circle" size="12" />
                Текущая страница
              </span>
            </div>
          </div>

          <!-- Стрелка (только неактивные) -->
          <div v-if="!item.active" class="nav-card__arrow" aria-hidden="true">
            <Icon name="mdi:arrow-top-right" size="20" />
          </div>
        </NuxtLink>
      </nav>
    </div>
  </section>
</template>

<script setup lang="ts">
export interface WorkTypeNavItem {
  title: string
  to: string
  icon?: string
  description?: string
  priceFrom?: number | string
  active?: boolean
}

withDefaults(
  defineProps<{
    /** Заголовок блока (опциональный) */
    title?: string
    /** Подзаголовок */
    subtitle?: string
    /** Карточки навигации */
    items: WorkTypeNavItem[]
    /** Aria-label */
    navLabel?: string
  }>(),
  {
    navLabel: 'Виды работ в категории',
  }
)
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;

span {
  color: unset;
}

.work-type-navigator {
  padding: 5rem 0;
  margin-top: 2em;
  background: $background-light;

  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 2rem;
    @media (max-width: 768px) { padding: 0 1.2rem; }
  }
}

// === Заголовок ===
.navigator-header {
  margin-bottom: 2rem;

  &__title {
    font-family: 'Rubik', sans-serif;
    font-size: 1.6rem;
    font-weight: 700;
    color: $text-dark;
    margin: 0 0 0.5rem;
    line-height: 1.3;

    :deep(span),
    :deep(.accent) {
      background: $blue-gradient;
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
    }
  }

  &__subtitle {
    font-size: 1rem;
    color: $text-gray;
    margin: 0;
    max-width: 600px;
  }
}

// === Сетка карточек ===
.navigator-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
}

// === Карточка ===
.nav-card {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.5rem;
  background: #fff;
  border: 1px solid $border-color;
  border-radius: 14px;
  text-decoration: none;
  transition: all 0.3s ease;

  &:hover:not(.nav-card--active) {
    transform: translateY(-4px);
    border-color: $blue;
    box-shadow: 0 10px 30px rgba(0, 195, 245, 0.12);

    .nav-card__arrow {
      background: $blue;
      color: #fff;
      transform: translate(2px, -2px);
    }

    .nav-card__title {
      color: $blue;
    }
  }

  // === Активная карточка ===
  &--active {
    background: rgba(0, 195, 245, 0.06);
    // border-color: $blue;
    box-shadow: 0 0 0 1px $blue, 0 6px 20px rgba(0, 195, 245, 0.1);

    .nav-card__icon {
      background: $blue-gradient;
      color: $background-dark;
    }

    // .nav-card__title {
    //   color: $blue;
    // }
  }

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
    transition: all 0.3s ease;
  }

  &__content {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  &__title {
    font-family: 'Rubik', sans-serif;
    font-size: 1.1rem;
    font-weight: 700;
    color: $text-dark;
    line-height: 1.3;
    transition: color 0.2s ease;
  }

  &__desc {
    font-size: 0.88rem;
    line-height: 1.5;
    color: $text-gray;
  }

  &__bottom {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    flex-wrap: wrap;
    margin-top: 0.3rem;
  }

  &__price {
    font-size: 0.9rem;
    font-weight: 600;
    color: $blue;
  }

  &__badge {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.2rem 0.6rem;
    background: $blue-gradient;
    color: $background-dark;
    font-family: 'Rubik', sans-serif;
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    border-radius: 50px;
  }

  &__arrow {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    background: #f0f2f5;
    color: $text-gray;
    border-radius: 50%;
    transition: all 0.3s ease;
    margin-left: auto;
  }
}

// === Мобильный адаптив ===
@media (max-width: 768px) {
  .work-type-navigator {
    padding: 2rem 0;
  }

  .navigator-header__title {
    font-size: 1.3rem;
  }

  .navigator-grid {
    grid-template-columns: 1fr;
  }

  .nav-card {
    padding: 1.2rem;
  }
}
</style>
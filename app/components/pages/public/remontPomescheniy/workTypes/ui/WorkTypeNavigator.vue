<!-- app\components\pages\public\remontPomescheniy\workTypes\ui\WorkTypeNavigator.vue -->
<template>
  <section class="work-type-navigator">
    <div class="navigator-container">
      <!-- Заголовок (опциональный) — раскомментируй, если нужен -->
      <!-- <header v-if="title" class="navigator-header">
        <span class="navigator-header__label">
          <Icon name="mdi:link-variant" size="16" />
          {{ label }}
        </span>
        <h2 class="navigator-header__title" v-html="title" />
        <p v-if="subtitle" class="navigator-header__subtitle">{{ subtitle }}</p>
      </header> -->

      <!-- Закладки навигации -->
      <nav class="navigator-tabs" :aria-label="navLabel">
        <NuxtLink
          v-for="item in sortedItems"
          :key="item.to"
          :to="item.to"
          class="tab"
          :class="{ 'tab--active': item.active }"
          :aria-current="item.active ? 'page' : undefined"
        >
          <!-- Иконка -->
          <div class="tab__icon">
            <Icon :name="item.icon || 'mdi:circle'" size="24" />
          </div>

          <!-- Контент -->
          <div class="tab__content">
            <span class="tab__title">{{ item.title }}</span>
            <div class="tab__bottom">
              <span v-if="item.priceFrom" class="tab__price">
                {{ item.priceFrom }} ₽/м²
              </span>
              <!-- Бейдж "Вы здесь" для активной -->
              <span v-if="item.active" class="tab__badge">
                <Icon name="mdi:check-circle" size="12" />
                Текущая
              </span>
            </div>
          </div>

          <!-- Индикатор перехода (только для неактивных) -->
          <div
            v-if="!item.active"
            class="tab__link-indicator"
            aria-hidden="true"
          >
            <Icon name="mdi:arrow-top-right" size="20" />
          </div>
        </NuxtLink>
      </nav>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'

export interface WorkTypeNavItem {
  title: string
  to: string
  icon?: string
  description?: string
  priceFrom?: number | string
  active?: boolean
}

const props = withDefaults(
  defineProps<{
    /** Подпись над заголовком */
    label?: string
    /** Заголовок блока */
    title?: string
    /** Подзаголовок */
    subtitle?: string
    /** Карточки-закладки */
    items: WorkTypeNavItem[]
    /** Aria-label */
    navLabel?: string
  }>(),
  {
    label: 'Виды работ',
    navLabel: 'Виды работ в категории',
  }
)

// ============================================================
// ДЕТЕКТ МОБИЛЬНОЙ ВЕРСИИ
// Брейкпоинт совпадает с CSS: @media (max-width: 768px)
// ============================================================
const MOBILE_BREAKPOINT = 768
const isMobile = ref(false)
let mediaQuery: MediaQueryList | null = null

const handleMediaChange = (e: MediaQueryListEvent | MediaQueryList) => {
  isMobile.value = e.matches
}

onMounted(() => {
  mediaQuery = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`)
  handleMediaChange(mediaQuery)
  // Реагируем на поворот экрана / ресайз окна
  mediaQuery.addEventListener('change', handleMediaChange)
})

onBeforeUnmount(() => {
  mediaQuery?.removeEventListener('change', handleMediaChange)
})

// ============================================================
// ПОРЯДОК ТАБОВ
// ПК  → всегда исходный порядок
// Моб → активная вкладка в конце списка
// ============================================================
const sortedItems = computed(() => {
  // ПК и SSR: возвращаем как есть
  if (!isMobile.value) {
    return props.items
  }
  // Мобильный: неактивные в исходном порядке, активная — последней
  const active = props.items.filter((item) => item.active)
  const rest = props.items.filter((item) => !item.active)
  return [...rest, ...active]
})
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;

// УБРАЛИ костыль: span { color: unset; }
// Теперь спаны наследуют цвет правильно

.work-type-navigator {
  padding: 3rem 0 0;
  background: $background-light;
  position: relative;
  display: flex;
  flex-direction: column;
}

// === Контейнер на всю ширину ===
.navigator-container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  flex-direction: column;
  flex: 1;

  @media (max-width: 768px) {
    padding: 0 1.2rem;
  }
}

// === Шапка ===
.navigator-header {
  margin-bottom: 2rem;
  text-align: center;

  &__label {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    font-family: 'Rubik', sans-serif;
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: $blue;
    margin-bottom: 0.6rem;
    padding: 0.3rem 0.8rem;
    background: rgba(0, 195, 245, 0.12);
    border-radius: 50px;
  }

  &__title {
    font-family: 'Rubik', sans-serif;
    font-size: 1.8rem;
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
    margin: 0 auto;
    max-width: 600px;
  }
}

// === Панель закладок ===
.navigator-tabs {
  display: flex;
  gap: 0.3rem;
  align-items: flex-end;
  margin-top: auto;
  padding: 0;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }

  @media (max-width: 640px) {
    gap: 0.15rem;
  }
}

// === Закладка ===
.tab {
  position: relative;
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.3rem 1.6rem;
  background: #f0f2f5;
  border: 1px solid #e2e8f0;
  border-bottom: none;
  border-radius: 10px 10px 0 0;
  text-decoration: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  min-width: 200px;
  flex-shrink: 0;
  flex: 1;
  z-index: 1;

  // === Ховер (неактивная) ===
  &:hover:not(.tab--active) {
    background: #ffffff;
    border-color: $blue;
    transform: translateY(-4px);

    .tab__icon {
      background: rgba(0, 195, 245, 0.15);
      color: $blue;
    }

    .tab__title {
      color: $blue;
    }

    .tab__link-indicator {
      background: $blue;
      color: #fff;
      transform: translate(2px, -2px);
    }
  }

  // === Активная закладка ===
  &--active {
    background: $background-dark;
    border-color: #2c2d30;
    z-index: 2;
    box-shadow: 0 -8px 24px rgba(0, 195, 245, 0.15);
    transform: none;

    .tab__icon {
      background: rgba(0, 195, 245, 0.2);
      color: $blue-light;
    }

    .tab__title {
      color: #fff;
      font-weight: 700;
      white-space: normal;
    }

    .tab__price {
      color: $blue-light;
    }

    .tab__badge {
      background: $blue-gradient;
      color: $background-dark;
      box-shadow: 0 4px 12px rgba(0, 195, 245, 0.4);
    }

    .tab__link-indicator {
      display: none;
    }
  }

  // === Иконка ===
  &__icon {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 46px;
    height: 46px;
    background: #e9ecef;
    color: $text-gray;
    border-radius: 10px;
    transition: all 0.3s ease;
  }

  // === Контент ===
  &__content {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }

  &__title {
    font-family: 'Rubik', sans-serif;
    font-size: 1.05rem;
    font-weight: 600;
    color: $text-dark;
    line-height: 1.3;
    transition: color 0.2s ease;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  // === Нижняя строка: цена + бейдж ===
  &__bottom {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  &__price {
    font-size: 0.88rem;
    color: $text-gray;
    font-weight: 500;
  }

  &__badge {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.2rem 0.6rem;
    background: rgba(0, 195, 245, 0.15);
    color: $blue;
    font-family: 'Rubik', sans-serif;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.03em;
    text-transform: uppercase;
    border-radius: 50px;
  }

  // === Индикатор перехода (стрелка) ===
  &__link-indicator {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    background: #e9ecef;
    color: $text-gray;
    border-radius: 50%;
    transition: all 0.3s ease;
  }
}

// ========================================
// МОБИЛЬНАЯ ВЕРСИЯ: ВЕРТИКАЛЬНЫЙ СТЕК
// ========================================
@media (max-width: 768px) {
  .work-type-navigator {
    padding: 1rem 0;
  }

  .navigator-header {
    margin-bottom: 1.2rem;
    text-align: left;

    &__title {
      font-size: 1.4rem;
    }
  }

  // Табы становятся вертикальным списком
  .navigator-tabs {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
    overflow-x: visible;
  }

  .tab {
    min-width: 0;
    width: 100%;
    padding: 1rem 1.1rem;
    gap: 0.9rem;
    border-radius: 12px; // скругление со всех сторон
    border: 1px solid #e2e8f0;
    border-bottom: 1px solid #e2e8f0; // возвращаем нижнюю границу

    // Убираем эффект «папки»
    &--active {
      transform: none;
      box-shadow: 0 4px 16px rgba(0, 195, 245, 0.2);
    }

    &:hover:not(.tab--active) {
      transform: none;
    }

    &__icon {
      width: 42px;
      height: 42px;
      flex-shrink: 0;
    }

    &__title {
      font-size: 0.98rem;
      white-space: normal; // разрешаем перенос
      overflow: visible;
      text-overflow: clip;
    }

    &__bottom {
      margin-top: 0.15rem;
    }

    &__price {
      font-size: 0.85rem;
    }

    // Стрелку-индикатор делаем компактнее
    &__link-indicator {
      width: 30px;
      height: 30px;
      margin-left: auto;
    }
  }
}

// ========================================
// ОЧЕНЬ УЗКИЕ ЭКРАНЫ (≤375px)
// ========================================
@media (max-width: 375px) {
  .tab {
    padding: 0.85rem 0.9rem;
    gap: 0.7rem;

    &__icon {
      width: 38px;
      height: 38px;
    }

    &__title {
      font-size: 0.92rem;
    }

    &__price {
      font-size: 0.82rem;
    }

    &__badge {
      font-size: 0.68rem;
      padding: 0.15rem 0.5rem;
    }
  }
}
</style>
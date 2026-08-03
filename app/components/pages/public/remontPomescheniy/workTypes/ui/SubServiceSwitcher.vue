<!-- app/components/pages/public/remontPomescheniy/workTypes/ui/SubServiceSwitcher.vue -->
<template>
  <section class="sub-service-switcher">
    <div class="container">
      <header class="switcher-header">
        <span class="switcher-label">
          <Icon name="mdi:link-variant" size="16" />
          {{ label }}
        </span>
        <h2 class="switcher-title" v-if="title" v-html="title" />
      </header>

      <!-- Навигация по страницам (Вкладки) -->
      <nav class="switcher-nav" :aria-label="label">
        <NuxtLink
          v-for="item in items"
          :key="item.to"
          :to="item.to"
          class="switcher-card"
          :class="{ 'switcher-card--active': item.active }"
          :aria-current="item.active ? 'page' : undefined"
        >
          <!-- Иконка услуги -->
          <div class="switcher-card__icon">
            <Icon :name="item.icon || 'mdi:circle'" size="24" />
          </div>

          <!-- Текст -->
          <div class="switcher-card__content">
            <span class="switcher-card__title">{{ item.title }}</span>
            <div class="switcher-card__bottom">
              <span v-if="item.priceFrom" class="switcher-card__price">
                {{ item.priceFrom }} ₽/м²
              </span>
              <!-- Бейдж "Вы здесь" — только для активной -->
              <span v-if="item.active" class="switcher-card__badge">
                <Icon name="mdi:check-circle" size="12" />
                Вы здесь
              </span>
            </div>
          </div>

          <!-- Стрелка перехода — только для неактивных -->
          <div
            v-if="!item.active"
            class="switcher-card__link-indicator"
            aria-hidden="true"
          >
            <Icon name="mdi:arrow-top-right" size="20" />
          </div>
        </NuxtLink>
      </nav>

      <!-- Описание активной страницы перенесено в секцию с черным фоном, которая идет ниже -->
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'

export interface SubServiceItem {
  /** Заголовок страницы/услуги */
  title: string
  /** URL страницы */
  to: string
  /** Иконка из @iconify */
  icon?: string
  /** Цена "от" (для отображения под заголовком) */
  priceFrom?: number | string
  /** Текущая страница */
  active?: boolean
  /** Описание активной страницы (теперь рендерится в черной секции ниже) */
  description?: string
}

const props = withDefaults(
  defineProps<{
    /** Подпись над заголовком */
    label?: string
    /** Заголовок секции */
    title?: string
    /** Массив ссылок на страницы */
    items: SubServiceItem[]
  }>(),
  {
    label: 'Другие виды работ',
  }
)

// Описание можно использовать в родительском компоненте, передав его в черную секцию
const activeDescription = computed(() => {
  const active = props.items.find((i) => i.active)
  return active?.description || null
})

defineExpose({ activeDescription })
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;

span {
  color: unset;
}

.sub-service-switcher {
  padding: 3rem 0 0; // Убран нижний отступ, чтобы вкладки прижались к самому низу
  background: $background-light;
  position: relative;
  display: flex;
  flex-direction: column;

  .container {
    max-width: 100%;
    margin: 0 auto;
    // padding: 0 2rem;
    display: flex;
    flex-direction: column;
    flex: 1;
    width: 100%;
    
    @media (max-width: 768px) {
      padding: 0 1.2rem;
    }
  }
}

// === Шапка ===
.switcher-header {
  margin-bottom: 2rem;
  text-align: center;
}

.switcher-label {
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

.switcher-title {
  font-family: 'Rubik', sans-serif;
  font-size: 1.6rem;
  font-weight: 700;
  color: $text-dark;
  margin: 0;
  line-height: 1.3;

  :deep(span),
  :deep(.accent) {
    background: $blue-gradient;
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
}

// === Навигация (Вкладки прижаты к низу) ===
.switcher-nav {
  display: flex;
  gap: 0.25rem; // Небольшой зазор, сквозь который будет виден черный фон
  align-items: flex-end;
  margin-top: auto; // Прижимает блок вкладок к низу контейнера
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

// === Карточка-вкладка ===
.switcher-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.2rem 1.5rem;
  background: $text-gray;
  border: 1px solid #e2e8f0;
  border-bottom: none; // Убираем нижнюю границу для слияния с черной секцией
  border-radius: 8px 8px 0 0; // Форма закладки/вкладки (скруглен только верх)
  text-decoration: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  min-width: 20px;
  flex-shrink: 0;
  z-index: 1;

  // === Ховер (обычная ссылка) ===
  &:hover:not(.switcher-card--active) {
    background: #ffffff;
    border-color: $blue;
    transform: translateY(-4px); // Вкладка приподнимается

    .switcher-card__icon {
      background: rgba(0, 195, 245, 0.15);
      color: $blue;
    }

    .switcher-card__title {
      color: $blue;
    }

    .switcher-card__link-indicator {
      background: $blue;
      color: #fff;
      transform: translate(2px, -2px);
    }
  }

  // === Активная (текущая) страница ===
  &--active {
    background: $background-dark; // Темный фон, сливающийся с секцией ниже
    border-color: #2c2d30;
    z-index: 2;
    box-shadow: 0 -8px 24px rgba(0, 195, 245, 0.15);
    transform: none; // Не приподнимаем, чтобы плотно лежала на черном фоне

    .switcher-card__icon {
      background: rgba(0, 195, 245, 0.2);
      color: $blue;
    }

    .switcher-card__title {
      color: #fff;
      font-weight: 700;
      white-space: normal;
    }

    .switcher-card__price {
      color: $blue-light;
    }

    .switcher-card__badge {
      background: $blue-gradient;
      color: #fff;
      box-shadow: 0 4px 12px rgba(0, 195, 245, 0.4);
    }

    .switcher-card__link-indicator {
      display: none; // Скрываем стрелку у активной вкладки
    }
  }

  // === Иконка услуги ===
  &__icon {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    background: #e9ecef;
    color: $text-gray;
    border-radius: 10px;
    transition: all 0.3s ease;
  }

  // === Контент (заголовок + нижняя строка) ===
  &__content {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }

  &__title {
    font-family: 'Rubik', sans-serif;
    font-size: 1rem;
    font-weight: 600;
    color: $text-dark;
    line-height: 1.3;
    transition: color 0.2s ease;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  // === Нижняя строка: цена + бейдж в один ряд ===
  &__bottom {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  &__price {
    font-size: 0.85rem;
    color: $text-gray;
    font-weight: 500;
  }

  // === Бейдж "Вы здесь" ===
  &__badge {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.2rem 0.6rem;
    background: $blue-gradient;
    color: #fff;
    font-family: 'Rubik', sans-serif;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.03em;
    text-transform: uppercase;
    border-radius: 50px;
  }

  // === Индикатор ссылки (стрелка перехода) ===
  &__link-indicator {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background: #e9ecef;
    color: $text-gray;
    border-radius: 50%;
    transition: all 0.3s ease;
  }
}

// === Мобильный адаптив ===
@media (max-width: 768px) {
  .sub-service-switcher {
    padding: 2rem 0 0;
  }

  .switcher-title {
    font-size: 1.3rem;
  }

  .switcher-card {
    padding: 1rem 1.2rem;
    gap: 0.8rem;
    min-width: 180px;

    &__icon {
      width: 40px;
      height: 40px;
    }

    &__title {
      font-size: 0.95rem;
    }
  }
}
</style>
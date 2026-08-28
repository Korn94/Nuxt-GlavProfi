<!-- app/components/pages/public/remontPomescheniy/workTypes/ui/MethodComparison.vue -->
<template>
  <section class="method-comparison">
    <div class="container">
      <!-- Заголовок -->
      <header class="method-comparison__header">
        <h2 class="method-comparison__title" v-html="title" />
        <p v-if="subtitle" class="method-comparison__subtitle">{{ subtitle }}</p>
      </header>

      <!-- Карточки методов -->
      <div class="method-comparison__grid">
        <article
          v-for="(method, index) in resolvedMethods"
          :key="index"
          class="method-card"
          :class="{
            'method-card--recommended': method.recommended,
          }"
        >
          <!-- Бейдж "Рекомендуем" -->
          <span v-if="method.recommended" class="method-card__badge">
            <Icon name="mdi:star" size="14" />
            Рекомендуем
          </span>

          <!-- Шапка карточки -->
          <div class="method-card__header">
            <div class="method-card__icon">
              <Icon :name="method.icon || 'mdi:help-circle'" size="26" />
            </div>
            <div class="method-card__header-text">
              <h3 class="method-card__title">{{ method.title }}</h3>
              <span v-if="method.priceFrom" class="method-card__price">
                {{ method.priceFrom }} ₽/м²
              </span>
            </div>
          </div>

          <!-- Когда применять -->
          <div class="method-card__section method-card__section--when">
            <h4 class="method-card__section-title">
              <Icon name="mdi:target" size="16" />
              Когда выбирать
            </h4>
            <ul class="method-card__list">
              <li
                v-for="(item, i) in method.whenToUse"
                :key="i"
                class="method-card__list-item"
              >
                <Icon name="mdi:arrow-right" size="14" class="list-icon" />
                {{ item }}
              </li>
            </ul>
          </div>

          <!-- Плюсы -->
          <div class="method-card__section method-card__section--pros">
            <h4 class="method-card__section-title">
              <Icon name="mdi:thumb-up" size="16" />
              Плюсы
            </h4>
            <ul class="method-card__list">
              <li
                v-for="(item, i) in method.pros"
                :key="i"
                class="method-card__list-item method-card__list-item--pro"
              >
                <Icon name="mdi:check-circle" size="14" class="list-icon" />
                {{ item }}
              </li>
            </ul>
          </div>

          <!-- Минусы -->
          <div v-if="method.cons?.length" class="method-card__section method-card__section--cons">
            <h4 class="method-card__section-title">
              <Icon name="mdi:thumb-down" size="16" />
              Минусы
            </h4>
            <ul class="method-card__list">
              <li
                v-for="(item, i) in method.cons"
                :key="i"
                class="method-card__list-item method-card__list-item--con"
              >
                <Icon name="mdi:close-circle" size="14" class="list-icon" />
                {{ item }}
              </li>
            </ul>
          </div>
        </article>
      </div>

      <!-- Итоговая рекомендация -->
      <div v-if="summary || $slots.summary" class="method-comparison__summary">
        <slot name="summary">
          <Icon name="mdi:lightbulb-outline" size="24" class="summary-icon" />
          <p v-html="summary" />
        </slot>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { NormalizedWorkItem } from '~/types/calculator'

export interface MethodOption {
  /** Название метода (маркетинговое, не зависит от прайса) */
  title: string
  /** Иконка */
  icon?: string
  /** Цена "от" (фоллбэк, если работа не найдена в БД) */
  priceFrom?: number | string
  /** 🆕 ID работы в таблице price_items. Если указан, цена подтянется из прайс-листа */
  priceWorkId?: number
  /** Когда применять */
  whenToUse: string[]
  /** Плюсы */
  pros: string[]
  /** Минусы */
  cons?: string[]
  /** Рекомендуемый вариант */
  recommended?: boolean
}

export interface PriceData {
  standard: NormalizedWorkItem[]
  piece: NormalizedWorkItem[]
}

const props = defineProps<{
  /** Заголовок секции */
  title: string
  /** Подзаголовок */
  subtitle?: string
  /** Массив методов для сравнения */
  methods: MethodOption[]
  /** Итоговая рекомендация (HTML поддерживается) */
  summary?: string
  /** 🆕 Данные прайс-листа от родителя (чтобы избежать гидратации) */
  priceData?: Record<string, PriceData>
}>()

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
 * Вычисляемый массив методов с актуальными ценами из прайс-листа.
 * 🔄 Поддерживает одиночный priceWorkId и массив priceWorkIds (сумма).
 */
const resolvedMethods = computed(() => {
  return props.methods.map(method => {
    // 🆕 Приоритет: массив работ (сумма цен)
    if (method.priceWorkIds?.length) {
      const total = method.priceWorkIds.reduce((sum, id) => {
        const work = findWorkById(id)
        return sum + (work ? work.pricePerUnit : 0)
      }, 0)
      if (total > 0) {
        return { ...method, priceFrom: Math.round(total) }
      }
    }
    // Одиночная работа
    if (method.priceWorkId) {
      const work = findWorkById(method.priceWorkId)
      if (work) {
        return { ...method, priceFrom: Math.round(work.pricePerUnit) }
      }
    }
    return method
  })
})
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;
@use '@/assets/styles/mixins' as *;

// УБРАЛИ костыль: span { color: unset; }
// Теперь спаны наследуют цвет правильно

.method-comparison {
  @include section-padding;
  background: $background-light;
  color: $text-dark;
  position: relative;

  .container {
    @include section-container;
  }

  // === Заголовок ===
  &__header {
    margin-bottom: 2.5rem;
    max-width: 720px;
  }

  &__title {
    @include section-title; // БЫЛО: дублирование, СТАЛО: миксин
  }

  &__subtitle {
    @include section-subtitle;
    color: $text-gray;
  }

  // === Сетка карточек ===
  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 1.5rem;

    @media (max-width: 768px) {
      grid-template-columns: 1fr;
    }
  }

  // === Итоговая рекомендация ===
  &__summary {
    @include summary-block(light); // Используем миксин для светлой темы
  }
}

// === Карточка метода ===
.method-card {
  @include light-card;
  position: relative;
  display: flex;
  flex-direction: column;
  padding: 1.8rem;

  // === Рекомендуемая карточка ===
  &--recommended {
    border-color: $blue;
    box-shadow: 0 0 0 1px $blue, 0 8px 24px rgba(0, 195, 245, 0.12);

    .method-card__icon {
      background: $blue-gradient;
      color: $background-dark;
    }
  }

  // === Бейдж ===
  &__badge {
    position: absolute;
    top: -12px;
    right: 1rem;
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.3rem 0.8rem;
    background: $blue-gradient;
    color: $background-dark;
    font-family: 'Rubik', sans-serif;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    border-radius: 50px;
    box-shadow: 0 4px 12px rgba(0, 195, 245, 0.3);
  }

  // === Шапка ===
  &__header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1.5rem;
    padding-bottom: 1.2rem;
    border-bottom: 1px solid $border-color;
  }

  &__icon {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 52px;
    height: 52px;
    background: rgba(0, 195, 245, 0.1);
    border-radius: 12px;
    transition: all 0.3s ease;
  }

  &__header-text {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }

  &__title {
    font-family: 'Rubik', sans-serif;
    font-size: 1.2rem;
    font-weight: 700;
    color: $text-dark;
    margin: 0;
    line-height: 1.3;
  }

  &__price {
    font-size: 0.9rem;
    font-weight: 600;
    color: $blue;
  }

  // === Секции (Когда / Плюсы / Минусы) ===
  &__section {
    margin-bottom: 1.2rem;

    &:last-child {
      margin-bottom: 0;
    }
  }

  &__section-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-family: 'Rubik', sans-serif;
    font-size: 0.85rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: $text-gray;
    margin: 0 0 0.6rem;

    .method-card__section--when & {
      color: $blue;
    }

    .method-card__section--pros & {
      color: $green;
    }

    .method-card__section--cons & {
      color: $red;
    }
  }

  // === Списки ===
  &__list {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  &__list-item {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    font-size: 0.92rem;
    line-height: 1.5;
    color: $text-dark;

    .list-icon {
      flex-shrink: 0;
      margin-top: 3px;
      color: $text-gray;
    }

    &--pro .list-icon {
      color: $green;
    }

    &--con .list-icon {
      color: $red;
    }
  }
}
</style>
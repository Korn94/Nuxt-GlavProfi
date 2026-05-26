<!-- app/components/pages/public/remontPomescheniy/pageTypes/ui/RisksSection.vue -->
<template>
  <section class="risks-section">
    <div class="container">
      <!-- Заголовок и лид -->
      <slot name="header">
        <header class="risks-section__header">
          <h2 class="risks-section__title" v-html="title" />
          <p v-if="subtitle" class="risks-section__subtitle">{{ subtitle }}</p>
        </header>
      </slot>

      <!-- Группы рисков -->
      <div class="risks-section__groups">
        <div
          v-for="(group, groupIndex) in groups"
          :key="group.name"
          class="risks-group"
          :class="{ 'risks-group--collapsed': isCollapsed(groupIndex) }"
        >
          <!-- Заголовок группы (кнопка на мобильном) -->
          <button
            type="button"
            class="risks-group__toggle"
            :aria-expanded="!isCollapsed(groupIndex)"
            :aria-controls="`risks-group-${groupIndex}`"
            @click="toggleGroup(groupIndex)"
          >
            <slot name="group-header" :group="group" :index="groupIndex">
              <div class="risks-group__header">
                <div class="risks-group__header-accent">
                  <Icon
                    v-if="group.icon"
                    :name="group.icon"
                    size="22"
                    class="risks-group__header-icon"
                  />
                  <Icon
                    v-else
                    name="mdi:folder-outline"
                    size="22"
                    class="risks-group__header-icon"
                  />
                </div>
                <div class="risks-group__header-text">
                  <h3 class="risks-group__title">{{ group.name }}</h3>
                  <span class="risks-group__count">
                    {{ group.cards.length }}
                    {{ pluralize(group.cards.length, ['риск', 'риска', 'рисков']) }}
                  </span>
                </div>
                <span class="risks-group__chevron" aria-hidden="true">
                  <Icon name="mdi:chevron-up" size="24" />
                </span>
              </div>
            </slot>
          </button>

          <!-- Сетка карточек внутри группы (с анимацией раскрытия) -->
          <div
            :id="`risks-group-${groupIndex}`"
            class="risks-group__content"
            :class="{ 'risks-group__content--collapsed': isCollapsed(groupIndex) }"
          >
            <div class="risks-group__grid">
              <PagesPublicRemontPomescheniyPageTypesUiRiskCard
                v-for="(card, cardIndex) in group.cards"
                :key="card.title"
                :title="card.title"
                :mistake="card.mistake"
                :consequence="card.consequence"
                :solution="card.solution"
                :icon="card.icon"
                :number="getGlobalCardNumber(groupIndex, cardIndex)"
              >
                <!-- Пробрасываем слоты RiskCard -->
                <template v-if="$slots['card-icon']" #icon>
                  <slot name="card-icon" :card="card" />
                </template>
                <template v-if="$slots['card-mistake']" #mistake>
                  <slot name="card-mistake" :card="card" />
                </template>
                <template v-if="$slots['card-consequence']" #consequence>
                  <slot name="card-consequence" :card="card" />
                </template>
                <template v-if="$slots['card-solution']" #solution>
                  <slot name="card-solution" :card="card" />
                </template>
                <template v-if="$slots['card-footer']" #footer>
                  <slot name="card-footer" :card="card" />
                </template>
              </PagesPublicRemontPomescheniyPageTypesUiRiskCard>
            </div>
          </div>
        </div>
      </div>

      <!-- Финальная подпись -->
      <div v-if="footerNote || $slots.footer" class="risks-section__footer">
        <slot name="footer">
          <div class="risks-section__footer-icon">
            <Icon name="mdi:shield-check-outline" size="28" />
          </div>
          <div class="risks-section__footer-text">
            <p v-html="footerNote" />
          </div>
        </slot>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

export interface RiskCardData {
  title: string
  mistake: string
  consequence: string
  solution: string
  icon?: string
}

export interface RiskGroup {
  name: string
  icon?: string
  cards: RiskCardData[]
}

const props = withDefaults(
  defineProps<{
    title: string
    subtitle?: string
    groups: RiskGroup[]
    footerNote?: string
    /** Брейкпоинт (px), ниже которого группы сворачиваются */
    mobileBreakpoint?: number
  }>(),
  {
    mobileBreakpoint: 768,
  }
)

// === Состояние: какие группы свёрнуты (хранит индексы) ===
const collapsedGroups = ref<Set<number>>(new Set())

let mediaQuery: MediaQueryList | null = null
let mediaQueryHandler: ((e: MediaQueryListEvent) => void) | null = null

// === Проверка: свёрнута ли группа ===
const isCollapsed = (groupIndex: number): boolean => {
  return collapsedGroups.value.has(groupIndex)
}

// === Переключение группы ===
const toggleGroup = (groupIndex: number) => {
  const newSet = new Set(collapsedGroups.value)
  if (newSet.has(groupIndex)) {
    newSet.delete(groupIndex)
  } else {
    newSet.add(groupIndex)
  }
  collapsedGroups.value = newSet
}

// === Глобальная нумерация карточек ===
const getGlobalCardNumber = (groupIndex: number, cardIndex: number): string => {
  let count = 0
  for (let i = 0; i < groupIndex; i++) {
    const group = props.groups[i]
    if (group) {
      count += group.cards.length
    }
  }
  return String(count + cardIndex + 1).padStart(2, '0')
}

// === Склонение слов ===
const pluralize = (count: number, forms: [string, string, string]): string => {
  const n = Math.abs(count) % 100
  const n1 = n % 10

  if (n > 10 && n < 20) return forms[2]
  if (n1 > 1 && n1 < 5) return forms[1]
  if (n1 === 1) return forms[0]
  return forms[2]
}

// === Логика сворачивания на мобильном ===
const handleMediaChange = (e: MediaQueryListEvent | MediaQueryList) => {
  if (e.matches) {
    // Мобильный — сворачиваем все группы
    collapsedGroups.value = new Set(props.groups.map((_, i) => i))
  } else {
    // Десктоп — разворачиваем все группы
    collapsedGroups.value = new Set()
  }
}

onMounted(() => {
  if (typeof window === 'undefined') return

  mediaQuery = window.matchMedia(`(max-width: ${props.mobileBreakpoint}px)`)

  // Устанавливаем начальное состояние
  handleMediaChange(mediaQuery)

  // Подписываемся на изменения
  mediaQueryHandler = (e: MediaQueryListEvent) => handleMediaChange(e)
  mediaQuery.addEventListener?.('change', mediaQueryHandler)
})

onBeforeUnmount(() => {
  if (mediaQuery && mediaQueryHandler) {
    mediaQuery.removeEventListener?.('change', mediaQueryHandler)
  }
})
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;

span {
  color: unset;
}

.risks-section {
  padding: 5rem 0;
  background: $background-dark;
  position: relative;
  overflow: hidden;

  // Декоративный градиент
  &::before {
    content: '';
    position: absolute;
    top: 5%;
    right: -10%;
    width: 600px;
    height: 600px;
    background: radial-gradient(
      circle,
      rgba(255, 107, 107, 0.06) 0%,
      transparent 60%
    );
    border-radius: 50%;
    pointer-events: none;
  }

  &::after {
    content: '';
    position: absolute;
    bottom: -10%;
    left: -10%;
    width: 500px;
    height: 500px;
    background: radial-gradient(
      circle,
      rgba(0, 195, 245, 0.05) 0%,
      transparent 60%
    );
    border-radius: 50%;
    pointer-events: none;
  }

  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 2rem;
    position: relative;
    z-index: 1;

    @media (max-width: 768px) {
      padding: 0 1.2rem;
    }
  }

  // === Заголовок секции ===
  &__header {
    margin-bottom: 3.5rem;
    max-width: 900px;
  }

  &__title {
    font-family: 'Rubik', sans-serif;
    font-size: 2.2rem;
    font-weight: 700;
    color: $text-light;
    margin: 0 0 1.2rem;
    line-height: 1.25;
    position: relative;
    padding-bottom: 1rem;

    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      width: 80px;
      height: 4px;
      background: linear-gradient(120deg, #ff6b6b, $yellow);
      border-radius: 2px;
      box-shadow: 0 0 10px rgba(255, 107, 107, 0.35);
    }

    @media (max-width: 768px) {
      font-size: 1.7rem;
    }

    :deep(span),
    :deep(.accent) {
      background: linear-gradient(120deg, #ff6b6b, $yellow);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
    }
  }

  &__subtitle {
    font-size: 1.1rem;
    line-height: 1.7;
    color: rgba($text-light, 0.82);
    margin: 1rem 0 0;
    max-width: 820px;
  }

  // === Список групп ===
  &__groups {
    display: flex;
    flex-direction: column;
    gap: 2rem;

    @media (min-width: 769px) {
      gap: 3.5rem;
    }
  }

  // === Финальная подпись ===
  &__footer {
    margin-top: 3.5rem;
    padding: 1.8rem 2rem;
    background: linear-gradient(
      135deg,
      rgba(0, 161, 42, 0.08) 0%,
      rgba(0, 195, 245, 0.06) 100%
    );
    border: 1px solid rgba(0, 161, 42, 0.25);
    border-radius: $border-radius;
    display: flex;
    align-items: flex-start;
    gap: 1.2rem;

    @media (max-width: 640px) {
      padding: 1.4rem 1.5rem;
      flex-direction: column;
      gap: 0.8rem;
    }
  }

  &__footer-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 54px;
    height: 54px;
    background: rgba(0, 161, 42, 0.15);
    color: $green;
    border-radius: 12px;
    flex-shrink: 0;
  }

  &__footer-text {
    :deep(p) {
      font-size: 1.02rem;
      line-height: 1.65;
      color: rgba($text-light, 0.92);
      margin: 0;

      &:not(:last-child) {
        margin-bottom: 0.8rem;
      }
    }

    :deep(strong),
    :deep(b) {
      color: $blue-light;
      font-weight: 600;
    }
  }
}

// === Группа рисков ===
.risks-group {
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.025);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: $border-radius;
  overflow: hidden;
  transition: border-color 0.3s ease, background 0.3s ease;

  &:hover {
    border-color: rgba(0, 195, 245, 0.2);
  }

  // === Кнопка-заголовок (раскрытие группы) ===
  &__toggle {
    width: 100%;
    background: transparent;
    border: none;
    padding: 0;
    text-align: left;
    cursor: pointer;
    font-family: inherit;
    color: inherit;

    // На десктопе — курсор по умолчанию (но клик всё равно работает)
    @media (min-width: 769px) {
      cursor: default;
    }

    &:focus-visible {
      outline: 2px solid $blue;
      outline-offset: -2px;
    }
  }

  &__header {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.5rem 2rem;
    transition: background 0.25s ease;

    @media (max-width: 768px) {
      padding: 1.2rem 1.2rem;
    }

    // Hover на мобильном
    @media (max-width: 768px) {
      .risks-group__toggle:hover & {
        background: rgba(0, 195, 245, 0.04);
      }
    }
  }

  &__header-accent {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 46px;
    height: 46px;
    background: rgba(0, 195, 245, 0.1);
    color: $blue-light;
    border-radius: 10px;
    flex-shrink: 0;

    @media (max-width: 768px) {
      width: 40px;
      height: 40px;
    }
  }

  &__header-icon {
    flex-shrink: 0;
  }

  &__header-text {
    display: flex;
    align-items: baseline;
    gap: .3rem;
    flex-wrap: wrap;
    flex: 1;
    min-width: 0;
  }

  &__title {
    font-family: 'Rubik', sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
    color: $text-light;
    margin: 0;
    line-height: 1.3;

    @media (max-width: 640px) {
      font-size: 1.15rem;
    }
  }

  &__count {
    font-size: 0.85rem;
    font-weight: 500;
    color: rgba($text-light, 0.5);
    padding: 0.25rem 0.7rem;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 50px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    white-space: nowrap;

    @media (max-width: 640px) {
      font-size: 0.78rem;
      padding: 0.2rem 0.6rem;
    }
  }

  // === Шеврон (иконка раскрытия/свёртывания) ===
  &__chevron {
    display: none;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    color: rgba($text-light, 0.5);
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.05);
    flex-shrink: 0;
    transition: transform 0.35s ease, color 0.25s ease, background 0.25s ease;

    // Показываем только на мобильном
    @media (max-width: 768px) {
      display: flex;
    }

    .risks-group__toggle:hover & {
      color: $blue-light;
      background: rgba(0, 195, 245, 0.1);
    }

    // Поворот при свёрнутом состоянии
    .risks-group--collapsed & {
      transform: rotate(-180deg);
    }
  }

  // === Контейнер с карточками (раскрывающийся) ===
  &__content {
    overflow: hidden;
    transition: max-height 0.45s ease, opacity 0.3s ease;
    max-height: 3000px; // Достаточно для любой группы
    opacity: 1;

    // Свёрнутое состояние
    &--collapsed {
      max-height: 0;
      opacity: 0;

      // На десктопе игнорируем сворачивание (страховка от несовпадения состояния)
      @media (min-width: 769px) {
        max-height: 3000px !important;
        opacity: 1 !important;
      }
    }
  }

  // === Сетка карточек ===
  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
    gap: 1.5rem;
    padding: 0 2rem 2rem;

    @media (max-width: 768px) {
      grid-template-columns: 1fr;
      gap: 1.2rem;
      padding: 0 1.2rem 1.5rem;
    }
  }
}

// === Адаптив секции ===
@media (max-width: 768px) {
  .risks-section {
    padding: 3.5rem 0;

    &__header {
      margin-bottom: 2.5rem;
    }
  }
}
</style>
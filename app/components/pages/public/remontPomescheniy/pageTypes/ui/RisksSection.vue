<!-- app/components/pages/public/remontPomescheniy/pageTypes/ui/RisksSection.vue -->
<template>
  <div class="risks-wrapper">

    <!-- Основной блок Риски -->
    <section class="risks">
      <div class="risks__container">
        <header class="risks__header">
          <h2 class="risks__title" v-html="activePage?.title"></h2>
          <p class="risks__subtitle">{{ activePage?.subtitle }}</p>
        </header>

        <ul class="risks__grid">
          <li
            v-for="(item, index) in activePage?.items"
            :key="item.title"
            class="risk"
          >
            <div class="risk__head">
              <span class="risk__num">{{ String(index + 1).padStart(2, '0') }}</span>
              <h3 class="risk__title">{{ item.title }}</h3>
            </div>
            <div class="risk__row risk__row--risk">
              <span class="risk__label">Чем грозит</span>
              <p class="risk__text">{{ item.risk }}</p>
            </div>
            <div class="risk__row risk__row--fix">
              <span class="risk__label">Как делаем мы</span>
              <p class="risk__text">{{ item.fix }}</p>
            </div>
          </li>
        </ul>

        <footer class="risks__footer">
          <p class="risks__note">{{ activePage?.note }}</p>
          <button 
            type="button" 
            class="risks__btn"
            @click="handleBtnClick"
          >
            {{ localBtnText }}
          </button>
        </footer>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

export interface RiskItem {
  title: string
  risk: string
  fix: string
}

export interface RiskPage {
  id: string
  label: string
  title: string
  subtitle: string
  note: string
  items: RiskItem[]
}

const props = withDefaults(
  defineProps<{
    pages: RiskPage[]
    btnText?: string
  }>(),
  {
    btnText: 'Заказать аудит объекта',
  }
)

const activePageId = ref(props.pages[0]?.id || '')
const localBtnText = ref(props.btnText)

const activePage = computed(() => {
  return props.pages.find(p => p.id === activePageId.value) || props.pages[0] || null
})

const setActivePage = (id: string) => {
  activePageId.value = id
}

const handleBtnClick = () => {
  localBtnText.value = 'Демо: здесь откроется форма заявки'
  setTimeout(() => {
    localBtnText.value = props.btnText
  }, 2000)
}
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;

$red-soft: #ff8a80;
$radius: 14px;
$blue-gradient: linear-gradient(120deg, $blue, #71e0fa);

.risks {
  background: $background-dark;
  color: $text-light;
  padding: 5rem 0;

  &__container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1.5rem;
  }

  &__header {
    max-width: 760px;
    margin-bottom: 2.5rem;
  }

  &__title {
    position: relative;
    font-size: 2.2rem;
    font-weight: 700;
    line-height: 1.25;
    padding-bottom: 1rem;
    margin-bottom: 1rem;

    &::after {
      content: "";
      position: absolute;
      left: 0;
      bottom: 0;
      width: 80px;
      height: 4px;
      border-radius: 2px;
      background: $blue-gradient;
    }

    :deep(span) {
      background: $blue-gradient;
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
    }
  }

  &__subtitle {
    font-size: 1.1rem;
    line-height: 1.6;
    color: rgba(255, 255, 255, 0.75);
  }

  &__grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.25rem;
    list-style: none;
    padding: 0;
    margin: 0;
  }

  &__footer {
    margin-top: 2.5rem;
    padding: 1.5rem 1.8rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1.5rem;
    background: rgba(0, 195, 245, 0.06);
    border: 1px solid rgba(0, 195, 245, 0.2);
    border-left: 4px solid $blue;
    border-radius: 6px;
  }

  &__note {
    font-size: 1.02rem;
    line-height: 1.6;
    color: rgba(255, 255, 255, 0.9);
    margin: 0;
  }

  &__btn {
    flex-shrink: 0;
    padding: 12px 24px;
    font: inherit;
    font-weight: 600;
    color: $text-dark;
    background: $blue-gradient;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0, 195, 245, 0.4);
    }

    &:focus-visible {
      outline: 2px solid $blue-light;
      outline-offset: 3px;
    }
  }
}

.risk {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.09);
  border-radius: $radius;
  transition: border-color 0.25s ease, transform 0.25s ease;

  &:hover {
    border-color: $blue;
    transform: translateY(-3px);
  }

  &__head {
    display: flex;
    align-items: flex-start;
    gap: 0.8rem;
  }

  &__num {
    flex-shrink: 0;
    font-size: 0.9rem;
    font-weight: 600;
    line-height: 1.9;
    color: $blue;
    font-variant-numeric: tabular-nums;
  }

  &__title {
    font-size: 1.15rem;
    font-weight: 600;
    line-height: 1.35;
    margin: 0;
  }

  &__row {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding-left: 0.9rem;
    border-left: 3px solid;

    &--risk {
      border-color: $red-soft;

      .risk__label {
        color: $red-soft;
      }
    }

    &--fix {
      border-color: $blue;

      .risk__label {
        color: $blue-light;
      }
    }
  }

  &__label {
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  &__text {
    font-size: 0.97rem;
    line-height: 1.55;
    color: rgba(255, 255, 255, 0.85);
    margin: 0;
  }
}

/* ---------- Адаптив ---------- */
@media (min-width: 640px) {
  .risks__grid {
    grid-template-columns: repeat(2, 1fr);
  }
  /* нечётная последняя карточка растягивается, чтобы не оставлять дыру */
  .risk:last-child:nth-child(odd) {
    grid-column: 1 / -1;
  }
}

@media (min-width: 1024px) {
  .risks__grid {
    grid-template-columns: repeat(3, 1fr);
  }
  .risk:last-child:nth-child(odd) {
    grid-column: auto;
  }
  /* 5 карточек: последняя занимает две колонки */
  .risk:last-child:nth-child(3n + 2) {
    grid-column: span 2;
  }
}

@media (max-width: 768px) {
  .risks {
    padding: 3.5rem 0;
  }
  .risks__container {
    padding: 0 1.2rem;
  }
  .risks__title {
    font-size: 1.7rem;
  }
  .risks__subtitle {
    font-size: 1rem;
  }
  .risks__header {
    margin-bottom: 2rem;
  }
}

@media (max-width: 640px) {
  .risk {
    padding: 1.25rem;
  }
  .risks__footer {
    flex-direction: column;
    align-items: stretch;
    padding: 1.3rem;
    gap: 1rem;
  }
  .risks__btn {
    width: 100%;
  }
}

@media (prefers-reduced-motion: reduce) {
  * {
    transition-duration: 0.01ms !important;
  }
}
</style>
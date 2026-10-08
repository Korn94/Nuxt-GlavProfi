<!-- app/components/pages/public/remontPomescheniy/pageTypes/ui/FAQBlock.vue -->
<template>
  <section class="faq-block" :class="`faq-block--${theme}`">
    <div class="container">
      <!-- Заголовок -->
      <slot name="header">
        <header class="faq-block__header">
          <h2 class="faq-block__title" v-html="title" />
          <p v-if="subtitle" class="faq-block__subtitle">{{ subtitle }}</p>
        </header>
      </slot>

      <!-- Список вопросов -->
      <div class="faq-block__list" role="list">
        <article
          v-for="(item, index) in items"
          :key="index"
          :class="['faq-item', { 'faq-item--open': isOpen(index) }]"
          role="listitem"
        >
          <!-- Кнопка вопроса -->
          <button
            :id="getQuestionId(index)"
            class="faq-item__question"
            :aria-expanded="isOpen(index)"
            :aria-controls="getAnswerId(index)"
            @click="toggle(index)"
          >
            <div class="faq-item__question-marker">
              <span>{{ String(index + 1).padStart(2, '0') }}</span>
            </div>
            <div class="faq-item__question-text">
              <slot name="question" :item="item" :index="index">
                {{ item.question }}
              </slot>
            </div>
            <span class="faq-item__icon" aria-hidden="true">
              <Icon
                :name="isOpen(index) ? 'mdi:minus' : 'mdi:plus'"
                size="22"
              />
            </span>
          </button>

          <!-- Тело ответа -->
          <div
            :id="getAnswerId(index)"
            :class="['faq-item__answer', { 'faq-item__answer--open': isOpen(index) }]"
            role="region"
            :aria-labelledby="getQuestionId(index)"
          >
            <div class="faq-item__answer-inner">
              <slot name="answer" :item="item" :index="index">
                <p v-html="item.answer" />
              </slot>
            </div>
          </div>
        </article>
      </div>

      <!-- Футер (опциональный) -->
      <div v-if="$slots.footer || footerNote" class="faq-block__footer">
        <slot name="footer">
          <div class="faq-block__footer-inner">
            <Icon name="mdi:forum-outline" size="26" class="faq-block__footer-icon" />
            <p v-html="footerNote" />
          </div>
        </slot>
      </div>

      <!-- Кнопка "открыть все" / "закрыть все" -->
      <div v-if="items.length > 2" class="faq-block__controls">
        <button
          v-if="!allOpen"
          class="faq-block__toggle-all"
          @click="openAll"
        >
          <Icon name="mdi:unfold-more-horizontal" size="18" />
          <span>Развернуть все</span>
        </button>
        <button
          v-else
          class="faq-block__toggle-all"
          @click="closeAll"
        >
          <Icon name="mdi:unfold-less-horizontal" size="18" />
          <span>Свернуть все</span>
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

export interface FAQItem {
  question: string
  answer: string
  [key: string]: unknown
}

const props = withDefaults(
  defineProps<{
    title: string
    subtitle?: string
    items: FAQItem[]
    footerNote?: string
    /** Разрешить открывать несколько ответов одновременно */
    allowMultiple?: boolean
    /** Уникальный префикс для ID (если на странице несколько FAQ) */
    idPrefix?: string
    /** 🆕 Тема оформления: 'light' | 'dark' */
    theme?: 'light' | 'dark'
  }>(),
  {
    allowMultiple: false,
    idPrefix: 'faq',
    theme: 'dark',
  }
)

// === Генерация детерминированных ID ===
const getQuestionId = (index: number): string => `${props.idPrefix}-question-${index}`
const getAnswerId = (index: number): string => `${props.idPrefix}-answer-${index}`

// Открытые индексы
const openIndexes = ref<Set<number>>(new Set())

const isOpen = (index: number): boolean => openIndexes.value.has(index)

const allOpen = computed(
  () => props.items.length > 0 && openIndexes.value.size === props.items.length
)

const toggle = (index: number) => {
  if (openIndexes.value.has(index)) {
    openIndexes.value.delete(index)
    openIndexes.value = new Set(openIndexes.value)
  } else {
    if (props.allowMultiple) {
      openIndexes.value.add(index)
      openIndexes.value = new Set(openIndexes.value)
    } else {
      openIndexes.value = new Set([index])
    }
  }
}

const openAll = () => {
  openIndexes.value = new Set(props.items.map((_, i) => i))
}

const closeAll = () => {
  openIndexes.value = new Set()
}
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;
@use '@/assets/styles/mixins' as *;

.faq-block {
  @include section-padding;
  position: relative;
  overflow: hidden;

  // ========================================
  // THEME: DARK (по умолчанию)
  // ========================================
  &--dark {
    --section-bg: #{$background-dark};
    --section-text: #{$text-light};
    --section-text-secondary: rgba(255, 255, 255, 0.78);
    --card-bg: rgba(255, 255, 255, 0.035);
    --card-border: rgba(255, 255, 255, 0.08);
    --card-hover-bg: rgba(255, 255, 255, 0.05);
    --card-hover-border: rgba(0, 195, 245, 0.25);
    --card-open-bg: rgba(0, 195, 245, 0.05);
    --card-open-border: #{$blue};
    --card-open-shadow: 0 6px 24px rgba(0, 195, 245, 0.1);
    --question-text: #{$text-light};
    --question-text-open: #{$blue-light};
    --answer-text: rgba(255, 255, 255, 0.88);
    --answer-border: rgba(255, 255, 255, 0.08);
    --marker-bg: rgba(0, 195, 245, 0.12);
    --marker-text: #{$blue-light};
    --marker-open-bg: #{$blue-gradient};
    --marker-open-text: #{$background-dark};
    --icon-bg: rgba(255, 255, 255, 0.05);
    --icon-color: #{$blue};
    --icon-open-bg: rgba(0, 195, 245, 0.18);
    --icon-open-color: #{$blue-light};
    --toggle-border: rgba(255, 255, 255, 0.2);
    --toggle-text: rgba(255, 255, 255, 0.75);
    --toggle-hover-bg: rgba(0, 195, 245, 0.06);
    --glow-color: rgba(0, 195, 245, 0.06);
  }

  // ========================================
  // THEME: LIGHT
  // ========================================
  &--light {
    --section-bg: #{$background-light};
    --section-text: #{$text-dark};
    --section-text-secondary: #{$text-gray};
    --card-bg: #fff;
    --card-border: #{$border-color};
    --card-hover-bg: rgba(0, 195, 245, 0.02);
    --card-hover-border: rgba(0, 195, 245, 0.4);
    --card-open-bg: rgba(0, 195, 245, 0.03);
    --card-open-border: #{$blue};
    --card-open-shadow: 0 6px 24px rgba(0, 195, 245, 0.08);
    --question-text: #{$text-dark};
    --question-text-open: #{$blue};
    --answer-text: #{$text-dark};
    --answer-border: #{$border-color};
    --marker-bg: rgba(0, 195, 245, 0.1);
    --marker-text: #{$blue};
    --marker-open-bg: #{$blue-gradient};
    --marker-open-text: #fff;
    --icon-bg: rgba(0, 0, 0, 0.04);
    --icon-color: #{$blue};
    --icon-open-bg: rgba(0, 195, 245, 0.15);
    --icon-open-color: #{$blue};
    --toggle-border: #{$border-color};
    --toggle-text: #{$text-gray};
    --toggle-hover-bg: rgba(0, 195, 245, 0.04);
    --glow-color: rgba(0, 195, 245, 0.03);
  }

  background: var(--section-bg);
  color: var(--section-text);

  &::before {
    content: '';
    position: absolute;
    bottom: -15%;
    left: -8%;
    width: 500px;
    height: 500px;
    background: radial-gradient(circle, var(--glow-color) 0%, transparent 65%);
    border-radius: 50%;
    pointer-events: none;
  }

  .container {
    @include section-container;
  }

  // === Заголовок ===
  &__header {
    margin-bottom: 2.5rem;
  }

  &__title {
    @include section-title;
  }

  &__subtitle {
    @include section-subtitle;
    color: var(--section-text-secondary);
  }

  // === Список ===
  &__list {
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
  }

  // === Футер ===
  &__footer {
    margin-top: 2.5rem;
  }

  &__footer-inner {
    margin-top: 2.5rem;
    padding: 1.5rem 1.8rem;
    background: rgba(0, 195, 245, 0.06);
    border: 1px solid rgba(0, 195, 245, 0.2);
    border-left: 4px solid $blue;
    border-radius: $border-radius;
    display: flex;
    align-items: flex-start;
    gap: 1rem;

    @media (max-width: 640px) {
      padding: 1.2rem 1.4rem;
      flex-direction: column;
      gap: 0.6rem;
    }
  }

  &__footer-icon {
    color: $blue;
    flex-shrink: 0;
    margin-top: 2px;
  }

  // === Контролы "развернуть/свернуть" ===
  &__controls {
    margin-top: 1.8rem;
    display: flex;
    justify-content: flex-end;
  }

  &__toggle-all {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.55rem 1.1rem;
    background: transparent;
    border: 1px solid var(--toggle-border);
    color: var(--toggle-text);
    font-family: 'Rubik', sans-serif;
    font-weight: 500;
    font-size: 0.88rem;
    border-radius: 50px;
    cursor: pointer;
    transition: all 0.25s ease;

    &:hover {
      border-color: $blue;
      color: $blue;
      background: var(--toggle-hover-bg);
    }
  }
}

// === Элемент FAQ ===
.faq-item {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 14px;
  transition: all 0.3s ease;
  overflow: hidden;

  &:hover {
    border-color: var(--card-hover-border);
    background: var(--card-hover-bg);
  }

  &--open {
    border-color: var(--card-open-border);
    background: var(--card-open-bg);
    box-shadow: var(--card-open-shadow);
  }

  // === Кнопка вопроса ===
  &__question {
    width: 100%;
    padding: 1.3rem 1.5rem;
    display: flex;
    align-items: center;
    gap: 1rem;
    background: transparent;
    border: none;
    cursor: pointer;
    text-align: left;
    transition: background 0.25s ease;

    @media (max-width: 640px) {
      padding: 1.1rem 1.1rem;
      gap: 0.8rem;
    }

    &:hover {
      background: rgba(255, 255, 255, 0.02);
    }

    &:focus-visible {
      outline: 2px solid $blue;
      outline-offset: -2px;
    }
  }

  &__question-marker {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 38px;
    height: 38px;
    background: var(--marker-bg);
    color: var(--marker-text);
    border-radius: 10px;
    font-family: 'Rubik', sans-serif;
    font-size: 0.88rem;
    font-weight: 700;
    transition: all 0.3s ease;

    .faq-item--open & {
      background: var(--marker-open-bg);
      color: var(--marker-open-text);
    }
  }

  &__question-text {
    flex: 1;
    font-family: 'Rubik', sans-serif;
    font-size: 1.08rem;
    font-weight: 500;
    color: var(--question-text);
    line-height: 1.45;
    transition: color 0.25s ease;

    @media (max-width: 640px) {
      font-size: 1rem;
    }

    .faq-item--open & {
      color: var(--question-text-open);
      font-weight: 600;
    }
  }

  &__icon {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background: var(--icon-bg);
    color: var(--icon-color);
    transition: all 0.3s ease;

    .faq-item--open & {
      background: var(--icon-open-bg);
      color: var(--icon-open-color);
      transform: rotate(180deg);
    }

    .faq-item__question:hover & {
      background: rgba(0, 195, 245, 0.12);
    }
  }

  // === Тело ответа (анимация max-height) ===
  &__answer {
    max-height: 0;
    overflow: hidden;
    transition: max-height 0.4s ease;

    &--open {
      max-height: 1200px;
    }
  }

  &__answer-inner {
    padding: 0 1.5rem 1.5rem 1.5rem;
    padding-left: calc(1.5rem + 38px + 1rem);

    @media (max-width: 640px) {
      padding: 0 1.1rem 1.2rem 1.1rem;
    }

    :deep(p) {
      font-size: 0.98rem;
      line-height: 1.65;
      color: var(--answer-text);
      margin: 0;

      &:not(:last-child) {
        margin-bottom: 0.8rem;
      }

      &:first-child {
        padding-top: 1rem;
        border-top: 1px solid var(--answer-border);
      }
    }

    :deep(strong),
    :deep(b) {
      color: var(--section-text);
      font-weight: 600;
    }

    :deep(ul),
    :deep(ol) {
      margin: 0.6rem 0 0.8rem 1.2rem;
      padding: 0;

      li {
        font-size: 0.95rem;
        line-height: 1.6;
        color: var(--answer-text);
        margin-bottom: 0.3rem;
      }
    }

    :deep(a) {
      color: $blue;
      text-decoration: none;
      font-weight: 500;

      &:hover {
        color: $blue-light;
      }
    }
  }
}
</style>
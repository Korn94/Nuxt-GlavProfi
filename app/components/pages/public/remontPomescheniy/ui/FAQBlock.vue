<!-- app/components/pages/public/remontPomescheniy/pageTypes/ui/FAQBlock.vue -->
<template>
  <section class="faq-block">
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
                :name="isOpen(index) ? 'lucide:minus' : 'lucide:plus'"
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
  }>(),
  {
    allowMultiple: false,
    idPrefix: 'faq',
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

span {
  color: unset;
}

.faq-block {
  padding: 5rem 0;
  background: $background-dark;
  position: relative;
  overflow: hidden;

  // Мягкое свечение
  &::before {
    content: '';
    position: absolute;
    bottom: -15%;
    left: -8%;
    width: 500px;
    height: 500px;
    background: radial-gradient(circle, rgba(0, 195, 245, 0.06) 0%, transparent 65%);
    border-radius: 50%;
    pointer-events: none;
  }

  .container {
    max-width: 900px;
    margin: 0 auto;
    padding: 0 2rem;
    position: relative;
    z-index: 1;

    @media (max-width: 768px) {
      padding: 0 1.2rem;
    }
  }

  // === Заголовок ===
  &__header {
    margin-bottom: 2.5rem;
  }

  &__title {
    font-family: 'Rubik', sans-serif;
    font-size: 2.2rem;
    font-weight: 700;
    color: $text-light;
    margin: 0 0 1rem;
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
      background: $blue-gradient;
      border-radius: 2px;
      box-shadow: 0 0 10px $blue50;
    }

    @media (max-width: 768px) {
      font-size: 1.7rem;
    }

    :deep(span),
    :deep(.accent) {
      background: $blue-gradient;
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
    }
  }

  &__subtitle {
    font-size: 1.08rem;
    line-height: 1.65;
    color: rgba($text-light, 0.78);
    margin: 1rem 0 0;
    max-width: 720px;
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
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    padding: 1.4rem 1.6rem;
    background: rgba(0, 195, 245, 0.06);
    border: 1px solid rgba(0, 195, 245, 0.2);
    border-left: 4px solid $blue;
    border-radius: $border-radius;

    p {
      font-size: 0.98rem;
      line-height: 1.6;
      color: rgba($text-light, 0.88);
      margin: 0;

      :deep(strong),
      :deep(b) {
        color: $blue-light;
        font-weight: 600;
      }

      :deep(a) {
        color: $blue;
        text-decoration: none;
        font-weight: 500;
        &:hover { color: $blue-light; }
      }
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
    border: 1px solid rgba($text-light, 0.2);
    color: rgba($text-light, 0.75);
    font-family: 'Rubik', sans-serif;
    font-weight: 500;
    font-size: 0.88rem;
    border-radius: 50px;
    cursor: pointer;
    transition: all 0.25s ease;

    &:hover {
      border-color: $blue;
      color: $blue-light;
      background: rgba(0, 195, 245, 0.06);
    }
  }
}

// === Элемент FAQ ===
.faq-item {
  background: rgba(255, 255, 255, 0.035);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: $border-radius;
  overflow: hidden;
  transition: border-color 0.3s ease, background 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    border-color: rgba(0, 195, 245, 0.25);
    background: rgba(255, 255, 255, 0.05);
  }

  &--open {
    border-color: $blue;
    background: rgba(0, 195, 245, 0.05);
    box-shadow: 0 6px 24px rgba(0, 195, 245, 0.1);
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
    background: rgba(0, 195, 245, 0.12);
    color: $blue-light;
    border-radius: 10px;
    font-family: 'Rubik', sans-serif;
    font-size: 0.88rem;
    font-weight: 700;
    transition: all 0.3s ease;

    .faq-item--open & {
      background: $blue-gradient;
      color: $background-dark;
    }
  }

  &__question-text {
    flex: 1;
    font-family: 'Rubik', sans-serif;
    font-size: 1.08rem;
    font-weight: 500;
    color: $text-light;
    line-height: 1.45;
    transition: color 0.25s ease;

    @media (max-width: 640px) {
      font-size: 1rem;
    }

    .faq-item--open & {
      color: $blue-light;
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
    background: rgba(255, 255, 255, 0.05);
    color: $blue;
    transition: all 0.3s ease;

    .faq-item--open & {
      background: rgba(0, 195, 245, 0.18);
      color: $blue-light;
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
      color: rgba($text-light, 0.88);
      margin: 0;

      &:not(:last-child) {
        margin-bottom: 0.8rem;
      }

      &:first-child {
        padding-top: 0.5rem;
        border-top: 1px solid rgba(255, 255, 255, 0.08);
        padding-top: 1rem;
      }
    }

    :deep(strong),
    :deep(b) {
      color: $text-light;
      font-weight: 600;
    }

    :deep(ul),
    :deep(ol) {
      margin: 0.6rem 0 0.8rem 1.2rem;
      padding: 0;

      li {
        font-size: 0.95rem;
        line-height: 1.6;
        color: rgba($text-light, 0.88);
        margin-bottom: 0.3rem;
      }
    }

    :deep(a) {
      color: $blue;
      text-decoration: none;
      font-weight: 500;
      &:hover { color: $blue-light; }
    }
  }
}

// === Адаптив ===
@media (max-width: 768px) {
  .faq-block {
    padding: 3.5rem 0;

    &__header {
      margin-bottom: 2rem;
    }

    &__list {
      gap: 0.7rem;
    }
  }
}
</style>
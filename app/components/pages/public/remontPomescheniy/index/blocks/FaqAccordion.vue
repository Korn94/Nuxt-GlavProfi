<!-- app/components/public/remont-pomescheniy/index/blocks/FAQSection.vue -->
<template>
  <section class="faq-section">
    <!-- Декоративная сетка на фоне -->
    <div class="faq-section__grid-pattern" aria-hidden="true"></div>
    <div class="faq-section__glow faq-section__glow--top" aria-hidden="true"></div>
    <div class="faq-section__glow faq-section__glow--bottom" aria-hidden="true"></div>

    <div class="container">
      <!-- Хедер секции -->
      <div class="faq-section__header">
        <div class="faq-section__header-left">
          <div class="faq-section__badge">
            <Icon name="mdi:comment-question-outline" size="14" />
            <span>Вопросы и ответы</span>
          </div>

          <h2 class="faq-section__title">
            Частые <span class="accent">вопросы</span>
          </h2>
        </div>

        <p class="faq-section__subtitle">
          Ответы на вопросы заказчиков и генподрядчиков.
          Если не нашли нужное — напишите нам.
        </p>
      </div>

      <!-- Список вопросов -->
      <div class="faq-list">
        <div
          v-for="(item, index) in faqItems"
          :key="index"
          class="faq-item"
          :class="{ active: activeIndex === index }"
        >
          <button class="faq-item__question" @click="toggle(index)">
            <span class="faq-item__question-text">{{ item.question }}</span>
            <span class="faq-item__icon">
              <Icon v-if="activeIndex === index" name="mdi:minus" size="20" />
              <Icon v-else name="mdi:plus" size="20" />
            </span>
          </button>

          <div class="faq-item__answer" :class="{ open: activeIndex === index }">
            <div class="faq-item__answer-content">
              {{ item.answer }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue';

const activeIndex = ref(null);

const toggle = (index) => {
  activeIndex.value = activeIndex.value === index ? null : index;
};

const faqItems = [
  {
    question: 'Работаете ли вы по безналичному расчету с НДС?',
    answer: 'Да. Работаем с юридическими лицами и ИП: с НДС и без. Предоставляем полный пакет закрывающих документов (КС-2, КС-3, счета-фактуры).'
  },
  {
    question: 'Можно ли начать работы до подписания полного договора?',
    answer: 'Да. Если нужно стартовать срочно, можем начать с протокола о намерениях или договора на предмонтажные работы (замер, аудит, демонтаж). Основной договор подписываем в процессе.'
  },
  {
    question: 'Как оплачиваются работы?',
    answer: 'Стандартно: аванс 30-50% на материалы и мобилизацию, далее поэтапная оплата по актам выполненных работ. Финальный расчет — после подписания итоговых актов. Возможны индивидуальные условия.'
  },
  {
    question: 'Что входит в «под ключ», а что оплачивается отдельно?',
    answer: '«Под ключ» — это работы и материалы по согласованной смете. Отдельно обычно идут: проектирование, согласования с УК/госорганами, закупка оборудования (если не входит в нашу спецификацию), вывоз крупногабаритного мусора сверх нормы.'
  },
  {
    question: 'Как фиксируются изменения в ходе работ?',
    answer: 'Любые доп. работы согласовываем письменно: вы получаете смету на изменение, утверждаете — только потом начинаем. Никаких «сюрпризов» в финальном акте.'
  }
];
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;
@use '@/assets/styles/mixins' as *;

.faq-section {
  @include section-padding;
  background: $background-dark;
  color: $text-light;
  position: relative;
  overflow: hidden;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);

  // === Фоновая «сетка» из тонких линий ===
  &__grid-pattern {
    position: absolute;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    background-image:
      linear-gradient(rgba(255, 255, 255, 0.025) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255, 255, 255, 0.025) 1px, transparent 1px);
    background-size: 64px 64px;
    mask-image: radial-gradient(ellipse at 50% 40%, #000 20%, transparent 75%);
    -webkit-mask-image: radial-gradient(ellipse at 50% 40%, #000 20%, transparent 75%);
  }

  // === Свечения ===
  &__glow {
    position: absolute;
    border-radius: 50%;
    filter: blur(120px);
    pointer-events: none;
    z-index: 0;

    &--top {
      top: -180px;
      right: -140px;
      width: 520px;
      height: 520px;
      background: radial-gradient(circle, rgba(0, 195, 245, 0.14), transparent 70%);
    }

    &--bottom {
      bottom: -200px;
      left: -160px;
      width: 480px;
      height: 480px;
      background: radial-gradient(circle, rgba(2, 254, 255, 0.08), transparent 70%);
    }
  }

  .container {
    @include section-container(900px);
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
    margin-bottom: 3rem;

    @media (max-width: 900px) {
      grid-template-columns: 1fr;
      gap: 1.2rem;
      margin-bottom: 2.5rem;
    }
  }

  &__header-left {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

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
    color: $blue-light;

    :deep(svg) {
      color: $blue;
    }
  }

  &__title {
    @include section-title;
    color: $text-light;
    margin: 0;

    &::after {
      box-shadow: 0 0 14px $blue50;
    }

    .accent {
      background: $blue-gradient;
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
      color: transparent;
    }
  }

  &__subtitle {
    @include section-subtitle;
    color: rgba($text-light, 0.7);
    margin: 0 0 0.4rem;
    max-width: 100%;

    @media (max-width: 900px) {
      margin-top: 0.5rem;
    }

    @media (max-width: 768px) {
      font-size: 0.98rem;
    }
  }
}

// ========================================
// СПИСОК ВОПРОСОВ
// ========================================
.faq-list {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.faq-item {
  position: relative;
  background: linear-gradient(
    160deg,
    rgba(255, 255, 255, 0.045) 0%,
    rgba(255, 255, 255, 0.015) 100%
  );
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  overflow: hidden;
  transition: all 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94);

  &:hover {
    border-color: rgba(0, 195, 245, 0.3);
  }

  &.active {
    border-color: rgba(0, 195, 245, 0.5);
    background: linear-gradient(
      160deg,
      rgba(0, 195, 245, 0.08) 0%,
      rgba(0, 195, 245, 0.02) 100%
    );
    box-shadow:
      0 12px 32px -12px rgba(0, 195, 245, 0.25),
      0 0 0 1px rgba(0, 195, 245, 0.15) inset;

    .faq-item__question-text {
      color: $blue-light;
    }

    .faq-item__icon {
      color: $blue;
      transform: rotate(0);
    }
  }

  // === Вопрос ===
  &__question {
    width: 100%;
    padding: 1.25rem 1.5rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: transparent;
    border: none;
    cursor: pointer;
    text-align: left;
    gap: 1rem;
    transition: padding 0.3s ease;
  }

  &__question-text {
    font-family: 'Rubik', sans-serif;
    font-size: 1.05rem;
    font-weight: 500;
    color: $text-light;
    line-height: 1.4;
    transition: color 0.3s ease;
  }

  &__icon {
    color: rgba($text-light, 0.55);
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.04);
    transition: all 0.3s ease;
  }

  &__question:hover &__icon {
    color: $blue;
    background: rgba(0, 195, 245, 0.1);
  }

  // === Ответ ===
  &__answer {
    max-height: 0;
    overflow: hidden;
    transition: max-height 0.45s cubic-bezier(0.4, 0, 0.2, 1),
                padding 0.35s ease,
                opacity 0.35s ease;
    padding: 0 1.5rem;
    opacity: 0;

    &.open {
      max-height: 400px;
      padding-bottom: 1.5rem;
      opacity: 1;
    }
  }

  &__answer-content {
    font-size: 0.95rem;
    line-height: 1.65;
    color: rgba($text-light, 0.75);
    padding-top: 1rem;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    position: relative;

    // Акцентная левая полоска
    &::before {
      content: '';
      position: absolute;
      top: 1rem;
      left: -1.5rem;
      width: 3px;
      height: calc(100% - 1rem);
      background: $blue-gradient;
      border-radius: 2px;
      opacity: 0.6;
    }
  }
}

// ========================================
// АДАПТИВ
// ========================================
@media (max-width: 768px) {
  .faq-section {
    padding-top: 4rem;
    padding-bottom: 4rem;

    &__glow {
      &--top { width: 340px; height: 340px; }
      &--bottom { width: 300px; height: 300px; }
    }
  }

  .faq-item {
    &__question {
      padding: 1.1rem 1.2rem;
    }

    &__question-text {
      font-size: 0.98rem;
    }

    &__icon {
      width: 28px;
      height: 28px;
    }

    &__answer {
      padding: 0 1.2rem;

      &.open {
        padding-bottom: 1.2rem;
      }
    }

    &__answer-content {
      &::before {
        left: -1.2rem;
      }
    }
  }
}
</style>
<!-- app/components/public/remont-pomescheniy/index/blocks/FAQSection.vue -->
<template>
  <section class="faq-section">
    <div class="container">
      <h2 class="faq-section__title">Частые вопросы</h2>
      <p class="faq-section__subtitle">
        Ответы на вопросы заказчиков и генподрядчиков. Если не нашли нужное — напишите нам.
      </p>

      <div class="faq-list">
        <div
          v-for="(item, index) in faqItems"
          :key="index"
          class="faq-item"
          :class="{ active: activeIndex === index }"
        >
          <!-- Заголовок вопроса -->
          <button class="faq-question" @click="toggle(index)">
            <span class="faq-question__text">{{ item.question }}</span>
            <span class="faq-question__icon">
              <Icon v-if="activeIndex === index" name="lucide:minus" size="20" />
              <Icon v-else name="lucide:plus" size="20" />
            </span>
          </button>

          <!-- Тело ответа (с анимацией) -->
          <div class="faq-answer" :class="{ open: activeIndex === index }">
            <div class="faq-answer__content">
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

const activeIndex = ref(null); // Хранит индекс открытого вопроса (null = все закрыты)

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

<style scoped lang="scss">
@use '@/assets/styles/variables' as *;

.faq-section {
  padding: 4rem 0;
  background: $background-dark;
  position: relative;
  overflow: hidden;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);

  // Легкое свечение на фоне
  &::before {
    content: '';
    position: absolute;
    bottom: -20%;
    left: -10%;
    width: 600px;
    height: 600px;
    background: radial-gradient(circle, rgba(0, 195, 245, 0.05) 0%, transparent 70%);
    border-radius: 50%;
    pointer-events: none;
  }

  .container {
    max-width: 900px; // Более узкий контейнер для читаемости текста FAQ
    margin: 0 auto;
    padding: 0 2rem;
    position: relative;
    z-index: 1;
  }

  // === Заголовок ===
  &__title {
    font-family: 'Rubik', sans-serif;
    font-size: 2rem;
    font-weight: 700;
    color: $text-light;
    margin-bottom: 1rem;
    position: relative;
    padding-bottom: 0.8rem;

    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      width: 60px;
      height: 3px;
      background: $blue-gradient;
      border-radius: 2px;
      box-shadow: 0 0 10px $blue50;
    }
  }

  &__subtitle {
    font-size: 1.1rem;
    color: rgba($text-light, 0.75);
    margin-bottom: 2.5rem;
    line-height: 1.6;
  }

  // === Список вопросов ===
  .faq-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .faq-item {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: $border-radius;
    overflow: hidden;
    transition: all 0.3s ease;

    &:hover {
      border-color: rgba(0, 195, 245, 0.3);
      background: rgba(255, 255, 255, 0.05);
    }

    &.active {
      border-color: $blue;
      background: rgba(0, 195, 245, 0.05);
      box-shadow: 0 4px 20px rgba(0, 195, 245, 0.1);
    }
  }

  .faq-question {
    width: 100%;
    padding: 1.2rem 1.5rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: transparent;
    border: none;
    cursor: pointer;
    text-align: left;
    gap: 1rem;

    &__text {
      font-family: 'Rubik', sans-serif;
      font-size: 1.1rem;
      font-weight: 500;
      color: $text-light;
      transition: color 0.3s ease;
    }

    &__icon {
      color: $blue;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      transition: transform 0.3s ease;
    }

    // При ховере иконка чуть ярче
    &:hover &__icon { color: $blue-light; }
  }

  // === Ответ (Анимация раскрытия) ===
  .faq-answer {
    max-height: 0;
    overflow: hidden;
    transition: max-height 0.4s ease, padding 0.4s ease;
    padding: 0 1.5rem;

    &.open {
      max-height: 300px; // Достаточное значение для текста
      padding-bottom: 1.5rem;
    }

    &__content {
      font-size: 0.95rem;
      line-height: 1.6;
      color: rgba($text-light, 0.85);
      padding-top: 0.5rem;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }
  }
}

// Адаптив
@media (max-width: 768px) {
  .faq-section {
    padding: 3rem 0;
    
    &__title { font-size: 1.6rem; }
    &__subtitle { font-size: 1rem; }

    .container { padding: 0 1.2rem; }

    .faq-question {
      padding: 1rem 1.2rem;
      &__text { font-size: 1rem; }
    }
    
    .faq-answer {
      &.open { padding-bottom: 1rem; }
    }
  }
}
</style>
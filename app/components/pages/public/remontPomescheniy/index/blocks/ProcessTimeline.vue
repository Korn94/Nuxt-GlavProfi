<!-- app/components/pages/public/remontPomescheniy/index/blocks/ProcessTimeline.vue -->
<template>
  <section class="process-timeline">
    <!-- Декоративная сетка на фоне -->
    <div class="process-timeline__grid-pattern" aria-hidden="true"></div>
    <div class="process-timeline__glow process-timeline__glow--top" aria-hidden="true"></div>
    <div class="process-timeline__glow process-timeline__glow--bottom" aria-hidden="true"></div>

    <div class="container">
      <!-- Хедер секции -->
      <div class="process-timeline__header">
        <div class="process-timeline__header-left">
          <div class="process-timeline__badge">
            <Icon name="mdi:progress-clock" size="14" />
            <span>Процесс работы</span>
          </div>

          <h2 class="process-timeline__title">
            Как начать и что <span class="accent">ожидать?</span>
          </h2>
        </div>

        <p class="process-timeline__subtitle">
          Простой процесс от заявки до сдачи. Всё начинается с заявки, дальше выезжаем
          на замер или составляем КП (смету) по вашему проекту.
        </p>
      </div>

      <!-- Сетка этапов -->
      <div class="process-timeline__grid">
        <div
          v-for="(step, index) in steps"
          :key="step.num"
          class="step-card"
        >
          <!-- Номер этапа -->
          <span class="step-card__number">{{ step.num }}</span>

          <!-- Точка-индикатор -->
          <div class="step-card__dot" aria-hidden="true"></div>

          <!-- Контент -->
          <h3 class="step-card__title">{{ step.title }}</h3>
          <p class="step-card__desc">{{ step.desc }}</p>

          <!-- Угловая акцентная линия -->
          <span class="step-card__corner" aria-hidden="true"></span>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
const steps = [
  {
    num: '01',
    title: 'Заявка и выезд инженера',
    desc: 'Обсуждаем задачу, изучаем планировку/ТЗ. Инженер выезжает на объект: замеряет, фиксирует состояние оснований, коммуникаций.'
  },
  {
    num: '02',
    title: 'Смета и договор',
    desc: 'Готовим понятную детализированную смету: по статьям, с объемами и расценками. Фиксируем сроки, порядок оплат, штрафы за просрочку.'
  },
  {
    num: '03',
    title: 'Материалы и логистика',
    desc: 'Закупаем материалы по вашей спецификации или помогаем в закупке. Организуем доставку и хранение.'
  },
  {
    num: '04',
    title: 'Работы и контроль',
    desc: 'Выполняем работы по графику, ведём онлайн-таблицу с этапами работ. Прораб координирует бригады, вы получаете фото/видео с объекта.'
  },
  {
    num: '05',
    title: 'Сдача и документы',
    desc: 'Проходим объект вместе с вами, фиксируем и устраняем замечания. Передаём ключи и исполнительную документацию.'
  },
  {
    num: '06',
    title: 'Сопровождение после сдачи',
    desc: 'Вы всегда можете обратиться по вопросам доработок или изменениям в процессе эксплуатации.'
  }
]
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;
@use '@/assets/styles/mixins' as *;

.process-timeline {
  @include section-padding;
  background: $background-dark;
  color: $text-light;
  position: relative;
  overflow: hidden;

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
      left: -140px;
      width: 560px;
      height: 560px;
      background: radial-gradient(circle, rgba(0, 195, 245, 0.16), transparent 70%);
    }

    &--bottom {
      bottom: -200px;
      right: -160px;
      width: 480px;
      height: 480px;
      background: radial-gradient(circle, rgba(2, 254, 255, 0.1), transparent 70%);
    }
  }

  .container {
    @include section-container;
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
    margin-bottom: 3.5rem;

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

  // ========================================
  // СЕТКА ЭТАПОВ
  // ========================================
  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.25rem;

    @media (max-width: 768px) {
      grid-template-columns: 1fr;
      gap: 1rem;
    }
  }
}

// ========================================
// КАРТОЧКА ЭТАПА
// ========================================
.step-card {
  position: relative;
  padding: 2rem 1.75rem 1.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  overflow: hidden;
  isolation: isolate;

  background: linear-gradient(
    160deg,
    rgba(255, 255, 255, 0.045) 0%,
    rgba(255, 255, 255, 0.015) 100%
  );
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);

  // Мягкий голубой «отблеск» при ховере
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: -1;
    background: radial-gradient(
      circle at 50% 0%,
      rgba(0, 195, 245, 0.14),
      transparent 60%
    );
    opacity: 0;
    transition: opacity 0.4s ease;
  }

  &:hover {
    transform: translateY(-6px);
    border-color: rgba(0, 195, 245, 0.4);
    box-shadow:
      0 20px 40px -15px rgba(0, 0, 0, 0.55),
      0 0 0 1px rgba(0, 195, 245, 0.15) inset;

    &::before {
      opacity: 1;
    }

    .step-card__number {
      color: rgba(0, 195, 245, 0.5);
      transform: translateY(-2px);
    }

    .step-card__dot {
      transform: scale(1.2);
      box-shadow: 0 0 18px rgba(0, 195, 245, 0.7);
    }

    .step-card__corner {
      opacity: 1;
      transform: scale(1);
    }
  }

  // === Номер этапа ===
  &__number {
    position: absolute;
    top: 1.25rem;
    right: 1.5rem;
    font-family: 'Rubik', sans-serif;
    font-size: 0.85rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    color: rgba(255, 255, 255, 0.2);
    transition: all 0.35s ease;
    z-index: 1;
  }

  // === Точка-индикатор ===
  &__dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: $blue;
    box-shadow: 0 0 12px rgba(0, 195, 245, 0.5);
    transition: all 0.35s ease;
    flex-shrink: 0;
    margin-bottom: 0.2rem;
  }

  // === Заголовок ===
  &__title {
    font-size: 1.12rem;
    font-weight: 600;
    color: $text-light;
    line-height: 1.35;
    margin: 0;
    letter-spacing: -0.01em;
  }

  // === Описание ===
  &__desc {
    font-size: 0.94rem;
    line-height: 1.6;
    color: rgba($text-light, 0.68);
    margin: 0;
  }

  // === Угловой акцент ===
  &__corner {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 60px;
    height: 60px;
    opacity: 0;
    transform: scale(0.6);
    transition: all 0.4s ease;
    pointer-events: none;
    background: linear-gradient(
      315deg,
      rgba(0, 195, 245, 0.55) 0%,
      transparent 60%
    );
    border-bottom-right-radius: 16px;
    mask-image: linear-gradient(315deg, #000 0%, transparent 70%);
    -webkit-mask-image: linear-gradient(315deg, #000 0%, transparent 70%);
  }
}

// ========================================
// АДАПТИВ
// ========================================
@media (max-width: 768px) {
  .process-timeline {
    padding-top: 4rem;
    padding-bottom: 4rem;

    &__glow {
      &--top { width: 360px; height: 360px; }
      &--bottom { width: 320px; height: 320px; }
    }
  }

  .step-card {
    padding: 1.6rem 1.4rem 1.5rem;

    &__title {
      font-size: 1.05rem;
    }

    &__desc {
      font-size: 0.9rem;
    }

    &__number {
      top: 1rem;
      right: 1.1rem;
      font-size: 0.78rem;
    }
  }
}
</style>
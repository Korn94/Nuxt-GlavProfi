<!-- app/components/public/remont-pomescheniy/index/blocks/ProcessTimeline.vue -->
<template>
  <section class="process-timeline">
    <div class="container">
      <h2 class="process-timeline__title">Как начать и что ожидать?</h2>
      <p class="process-timeline__subtitle">
        Простой процесс от заявки до сдачи. Все начинается с заявки, дальше выезжаем на замер или составляем КП (смету) по Вашему проекту.
      </p>

      <div class="process-timeline__grid">
        <div
          v-for="(step, index) in steps"
          :key="step.num"
          class="process-timeline__card"
          :style="{ '--delay': index * 0.1 + 's' }"
        >
          <div class="process-timeline__number">{{ step.num }}</div>
          <h3 class="process-timeline__card-title">{{ step.title }}</h3>
          <p class="process-timeline__card-desc">{{ step.desc }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
// Данные храним в компоненте
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
    desc: 'Выполняем работы по графику, ведем онлайн-таблицу с этапами работ. Прораб координирует бригады, вы получаете фото/видео с объекта.'
  },
  {
    num: '05',
    title: 'Сдача и документы',
    desc: 'Проходим объект вместе с вами, фиксируем и устраняем замечания. Передаем ключи и исполнительную документацию.'
  },
  {
    num: '06',
    title: 'Сопровождение после сдачи',
    desc: 'Вы всегда можете обратиться по вопросам доработок или изменениям в процессе эксплуатации.'
  }
]
</script>

<style scoped lang="scss">
@use '@/assets/styles/variables' as *;

// Локальные переменные для темной темы
$timeline-bg: $background-dark;
$timeline-card-bg: rgba(255, 255, 255, 0.04);
$timeline-border: rgba(255, 255, 255, 0.1);
$timeline-hover-border: $blue;
$timeline-hover-bg: rgba(0, 195, 245, 0.06);
$timeline-hover-shadow: 0 12px 32px rgba(0, 195, 245, 0.15);

.process-timeline {
  padding: 4rem 0;
  background: $timeline-bg;
  position: relative;
  overflow: hidden;

  // Фоновое свечение (очень мягкое)
  &::before {
    content: '';
    position: absolute;
    top: 10%;
    left: -10%;
    width: 600px;
    height: 600px;
    background: radial-gradient(circle, rgba(0, 195, 245, 0.06) 0%, transparent 70%);
    border-radius: 50%;
    pointer-events: none;
    z-index: 0;
  }

  .container {
    max-width: 1200px;
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
    max-width: 650px;
  }

  // === Сетка карточек ===
  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 1.5rem;
  }

  // === Карточка этапа ===
  &__card {
    background: $timeline-card-bg;
    backdrop-filter: blur(10px);
    border: 1px solid $timeline-border;
    border-radius: $border-radius;
    padding: 2rem;
    position: relative;
    
    // Анимация появления
    opacity: 0;
    transform: translateY(20px);
    animation: fadeInUp 0.6s var(--delay) ease forwards;
    animation-fill-mode: forwards;
    
    // Плавный ховер (не конфликтует с анимацией)
    transition: transform 0.35s ease, box-shadow 0.35s ease, border-color 0.35s ease, background 0.35s ease;

    &:hover {
      transform: translateY(-6px);
      box-shadow: $timeline-hover-shadow;
      border-color: $timeline-hover-border;
      background: $timeline-hover-bg;
    }
  }

  // Номер этапа (градиент)
  &__number {
    position: absolute;
    top: -15px;
    right: 20px;
    font-family: 'Rubik', sans-serif;
    font-size: 1.8rem;
    font-weight: 800;
    background: $blue-gradient;
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    opacity: 0.7;
    transition: opacity 0.3s ease;
    pointer-events: none;
  }

  &:hover &__number {
    opacity: 1;
  }

  &__card-title {
    font-size: 1.2rem;
    font-weight: 600;
    color: $text-light;
    margin: 0 0 0.8rem;
    line-height: 1.3;
  }

  &__card-desc {
    font-size: 0.95rem;
    line-height: 1.6;
    color: rgba($text-light, 0.8);
    margin: 0;
  }
}

// Анимация
@keyframes fadeInUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// Адаптив
@media (max-width: 768px) {
  .process-timeline {
    padding: 3rem 0;
    
    &__title { font-size: 1.6rem; }
    &__subtitle { font-size: 1rem; }
    &__grid { grid-template-columns: 1fr; }
    &__card { padding: 1.5rem; }
    &__number { font-size: 1.5rem; top: -12px; right: 15px; }
  }
}
</style>
<template>
  <section class="benefits">
    <h2 class="visually-hidden">Наши преимущества</h2>

    <div class="benefits__grid">
      <article
        v-for="(benefit, index) in benefits"
        :key="benefit.title"
        class="benefit"
        :style="{ '--delay': index * 0.1 + 's' }"
      >
        <div class="benefit__icon">
          <Icon :name="benefit.icon" />
        </div>
        <h3 class="benefit__title">{{ benefit.title }}</h3>
        <p class="benefit__description">{{ benefit.description }}</p>
        <span class="benefit__line"></span>
      </article>
    </div>
  </section>
</template>

<script setup>
const benefits = [
  {
    title: 'Удобная оплата для бизнеса',
    description: 'Принимаем любые способы оплаты для вашего удобства',
    icon: 'ph:credit-card-light',
  },
  {
    title: '5 бригад в штате',
    description: 'Электрики, сантехники, отделочники — все специалисты в штате. Без субподряда и посредников',
    icon: 'ph:users-three-light',
  },
  {
    title: 'Гибкий формат сотрудничества',
    description: 'Прямой договор с Вами или субподряд от генподрядчика. Подстраиваемся под ваши процессы',
    icon: 'ph:arrows-counter-clockwise-light',
  },
  // {
  //   title: 'Гарантия качества',
  //   description: 'Мы гарантируем высокое качество выполнения всех работ',
  //   icon: 'ph:shield-check-light',
  // },
];
</script>

<style scoped lang="scss">
@use '@/assets/styles/variables' as *;

// ========================================
// СЕКЦИЯ
// ========================================

.benefits {
  position: relative;
  padding: 5rem 1.5rem;
  background: #18191b;
  color: $text-light;
  overflow: hidden;
  isolation: isolate;

  &__grid {
    max-width: 1200px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1.5rem;
  }
}

// ========================================
// КАРТОЧКА (активное состояние по умолчанию)
// ========================================

.benefit {
  position: relative;
  padding: 2rem 1.75rem 2.25rem;
  background: linear-gradient(
    160deg,
    rgba(0, 195, 245, 0.06) 0%,
    rgba(0, 195, 245, 0.02) 100%
  );
  border: 1px solid rgba(0, 195, 245, 0.4);
  // border-radius: 18px;
  border-radius: $border-radius;
  overflow: hidden;
  opacity: 0;
  transform: translateY(24px);
  animation: fadeUp 0.7s ease var(--delay, 0s) forwards;
  transition: transform 0.35s ease, border-color 0.35s ease, box-shadow 0.35s ease;
  box-shadow:
    0 20px 40px rgba(0, 0, 0, 0.35),
    0 0 0 1px rgba(0, 195, 245, 0.15) inset;

  // световая полоса сверху
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(0, 195, 245, 0.5),
      transparent
    );
  }

  // внутреннее свечение
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(
      circle at 50% 0%,
      rgba(0, 195, 245, 0.12),
      transparent 60%
    );
    pointer-events: none;
  }

  &:hover {
    transform: translateY(-6px);
    border-color: rgba(0, 195, 245, 0.65);
    box-shadow:
      0 28px 50px rgba(0, 0, 0, 0.45),
      0 0 0 1px rgba(0, 195, 245, 0.25) inset,
      0 0 40px rgba(0, 195, 245, 0.15);

    .benefit__icon {
      background: linear-gradient(120deg, rgba(0, 195, 245, 0.28), rgba(2, 254, 255, 0.14));
      border-color: rgba(0, 195, 245, 0.75);
      color: $blue-light;
      transform: rotate(-4deg) scale(1.08);
      box-shadow: 0 10px 28px rgba(0, 195, 245, 0.35);
    }

    .benefit__line {
      transform: scaleX(1);
      box-shadow: 0 0 12px rgba(0, 195, 245, 0.6);
    }

    .benefit__title {
      color: $blue-light;
    }
  }

  // ---------- Иконка ----------
  &__icon {
    position: relative;
    z-index: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 60px;
    height: 60px;
    margin-bottom: 1.5rem;
    border-radius: $border-radius;
    background: linear-gradient(120deg, rgba(0, 195, 245, 0.22), rgba(2, 254, 255, 0.1));
    border: 1px solid rgba(0, 195, 245, 0.55);
    color: $blue-light;
    font-size: 1.85rem;
    transform: rotate(-4deg);
    transition: all 0.35s ease;
    box-shadow: 0 8px 24px rgba(0, 195, 245, 0.25);

    :deep(svg) {
      width: 1em;
      height: 1em;
    }
  }

  // ---------- Заголовок карточки ----------
  &__title {
    position: relative;
    z-index: 1;
    font-family: 'Rubik', sans-serif;
    font-size: 1.2rem;
    font-weight: 600;
    line-height: 1.35;
    color: $blue-light;
    margin: 0 0 0.75rem;
    transition: color 0.3s ease;
  }

  // ---------- Описание ----------
  &__description {
    position: relative;
    z-index: 1;
    font-size: 0.93rem;
    line-height: 1.65;
    color: rgba($text-light, 0.75);
    margin: 0;
  }

  // ---------- Акцентная линия снизу ----------
  &__line {
    position: absolute;
    bottom: 0;
    left: 1.75rem;
    right: 1.75rem;
    height: 2px;
    background: linear-gradient(90deg, $blue, $blue-light);
    border-radius: 2px;
    transform: scaleX(1);
    transform-origin: left center;
    transition: transform 0.4s ease, box-shadow 0.4s ease;
  }
}

// ========================================
// АНИМАЦИИ
// ========================================

@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(24px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// ========================================
// АДАПТИВ
// ========================================

@media (max-width: 768px) {
  .benefits {
    padding: 3.5rem 1rem;

    &__grid {
      gap: 1.1rem;
    }
  }

  .benefit {
    padding: 1.6rem 1.35rem 1.85rem;
    border-radius: 16px;

    &__icon {
      width: 52px;
      height: 52px;
      font-size: 1.6rem;
      margin-bottom: 1.25rem;
    }

    &__title {
      font-size: 1.08rem;
    }

    &__description {
      font-size: 0.88rem;
    }

    &__line {
      left: 1.35rem;
      right: 1.35rem;
    }
  }
}
</style>
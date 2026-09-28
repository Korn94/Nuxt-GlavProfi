<!-- app/components/pages/public/remontPomescheniy/index/blocks/WhyUsBlock.vue -->
<template>
  <section class="why-us">
    <!-- Декоративная сетка на фоне -->
    <div class="why-us__grid-pattern" aria-hidden="true"></div>
    <div class="why-us__glow why-us__glow--top" aria-hidden="true"></div>
    <div class="why-us__glow why-us__glow--bottom" aria-hidden="true"></div>

    <div class="container">
      <!-- Хедер секции: бейдж + заголовок слева, подзаголовок справа -->
      <div class="why-us__header">
        <div class="why-us__header-left">
          <div class="why-us__badge">
            <Icon name="mdi:star-four-points" size="14" />
            <span>Наши преимущества</span>
          </div>

          <h2 class="why-us__title">
            Почему выбирают <span class="accent">ГлавПрофи</span>
          </h2>
        </div>

        <p class="why-us__subtitle">
          Работаем прозрачно: от аудита проекта до сдачи объекта.
          Минимизируем риски и простой вашего бизнеса.
        </p>
      </div>

      <!-- Сетка преимуществ -->
      <div class="why-us__features">
        <div
          v-for="(feature, index) in features"
          :key="index"
          class="feature-card"
        >
          <!-- Номер карточки -->
          <span class="feature-card__number">
            {{ String(index + 1).padStart(2, '0') }}
          </span>

          <!-- Иконка -->
          <div class="feature-card__icon">
            <Icon :name="feature.icon" size="26" />
          </div>

          <!-- Контент -->
          <h3 class="feature-card__title">{{ feature.title }}</h3>
          <p class="feature-card__desc">{{ feature.description }}</p>

          <!-- Угловая акцентная линия -->
          <span class="feature-card__corner" aria-hidden="true"></span>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
// Преимущества в виде карточек
const features = [
  {
    icon: 'material-symbols:search-check',
    title: 'Аудит проекта до начала работ',
    description: 'Проверяем проектную документацию и объект. Если видим риски в технологии или конфликты с реальным объектом — аргументированно сообщаем, чтобы вы не переплачивали.'
  },
  {
    icon: 'material-symbols:verified',
    title: 'Собственные бригады',
    description: 'Профессиональные бригады для выполнения любых задач: ГКЛ, маляры, электрики, плиточники. Работаем как напрямую, так и в рамках субподряда.'
  },
  {
    icon: 'material-symbols:schedule',
    title: 'Сроки и штрафы в договоре',
    description: 'Сдаем объекты в срок. Сроки, смету и штрафы за просрочку фиксируем в договоре. Минимизируем простой вашего бизнеса.'
  },
  {
    icon: 'material-symbols:gavel',
    title: 'Работа по ГОСТ и СНиП',
    description: 'Работаем по ТЗ, проектной документации или помогаем сформировать технически грамотное решение. Соблюдаем все нормы и стандарты.'
  }
]
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;
@use '@/assets/styles/mixins' as *;

.why-us {
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
      right: -140px;
      width: 560px;
      height: 560px;
      background: radial-gradient(circle, rgba(0, 195, 245, 0.18), transparent 70%);
    }

    &--bottom {
      bottom: -200px;
      left: -160px;
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

  // === Бейдж ===
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

  // === Заголовок ===
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

  // === Подзаголовок (справа) ===
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
  // СЕТКА ПРЕИМУЩЕСТВ
  // ========================================
  &__features {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1.25rem;

    @media (max-width: 768px) {
      grid-template-columns: 1fr;
      gap: 1rem;
    }
  }
}

// ========================================
// КАРТОЧКА ПРЕИМУЩЕСТВА
// ========================================
.feature-card {
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

    .feature-card__icon {
      transform: translateY(-2px) scale(1.08);
      background: rgba(0, 195, 245, 0.16);
      box-shadow: 0 0 24px rgba(0, 195, 245, 0.35);
    }

    .feature-card__number {
      color: rgba(0, 195, 245, 0.5);
      transform: translateY(-2px);
    }

    .feature-card__corner {
      opacity: 1;
      transform: scale(1);
    }
  }

  // === Номер карточки ===
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

  // === Иконка ===
  &__icon {
    width: 52px;
    height: 52px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 14px;
    color: $blue;
    background: rgba(0, 195, 245, 0.1);
    border: 1px solid rgba(0, 195, 245, 0.18);
    transition: all 0.35s ease;
    flex-shrink: 0;
  }

  // === Заголовок ===
  &__title {
    font-size: 1.12rem;
    font-weight: 600;
    color: $text-light;
    line-height: 1.35;
    margin: 0.4rem 0 0;
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
  .why-us {
    padding-top: 4rem;
    padding-bottom: 4rem;

    &__glow {
      &--top { width: 360px; height: 360px; }
      &--bottom { width: 320px; height: 320px; }
    }
  }

  .feature-card {
    padding: 1.6rem 1.4rem 1.5rem;

    &__icon {
      width: 46px;
      height: 46px;
    }

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
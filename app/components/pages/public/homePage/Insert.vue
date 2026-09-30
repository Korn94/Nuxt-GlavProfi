<!-- app\components\pages\public\homePage\Insert.vue -->
<template>
  <div class="box" ref="boxRef">
    <h2 class="visually-hidden">Наши работы</h2>

    <!-- Декоративный фон -->
    <div class="box__glow box__glow--1"></div>
    <div class="box__glow box__glow--2"></div>
    <div class="box__grid-pattern"></div>

    <div class="box__content">
      <!-- Вопрос — виден сразу -->
      <p class="box__question">
        Все обещают качественно и в срок?
      </p>

      <!-- Главный акцент: строка 2 «Мы это делаем» — при ~50%.
         Подзаголовок: строка 3 «и показываем на реальных объектах» — при ~65%. -->
      <p class="box__headline">
        <span
          class="box__headline-accent"
          :class="{ 'is-visible': line2Visible }"
        >Мы это делаем</span>
        <span
          class="box__headline-sub"
          :class="{ 'is-visible': line3Visible }"
        >и показываем на реальных объектах</span>
      </p>

      <!-- Стрелка — появляется следом за третьей строкой -->
      <div class="box__arrow" :class="{ 'is-visible': arrowVisible }">
        <UiAnimationsArrow />
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const boxRef = ref(null);

const line2Visible = ref(false); // «Мы это делаем»
const line3Visible = ref(false); // «и показываем на реальных объектах»
const arrowVisible = ref(false);

// Насколько выше/ниже верха окна должен оказаться верх строки, чтобы она появилась.
// 0.5  — строка доходит до 50% высоты окна (вторая строка).
// 0.35 — ~65% от нижнего края (третья строка).
// 0.2  — стрелка после третьей строки.
const LINE2_AT = 0.5;
const LINE3_AT = 0.35;
const ARROW_AT = 0.2;

let rafId = null;

function isElementAbove(selector, fraction) {
  const el = boxRef.value?.querySelector(selector);
  if (!el) return false;
  const vh = window.innerHeight || 1;
  return el.getBoundingClientRect().top <= vh * fraction;
}

function update() {
  rafId = null;

  if (!line2Visible.value && isElementAbove('.box__headline-accent', LINE2_AT)) {
    line2Visible.value = true;
  }
  // Третья строка только после второй, чтобы порядок не нарушался.
  if (line2Visible.value && !line3Visible.value && isElementAbove('.box__headline-sub', LINE3_AT)) {
    line3Visible.value = true;
  }
  if (line3Visible.value && !arrowVisible.value && isElementAbove('.box__arrow', ARROW_AT)) {
    arrowVisible.value = true;
  }
}

function onScroll() {
  if (rafId == null) {
    rafId = requestAnimationFrame(update);
  }
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  // Проверяем сразу: если блок уже в видимой зоне при загрузке (например, короткая страница).
  update();
});

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll);
  window.removeEventListener('resize', onScroll);
  if (rafId != null) {
    cancelAnimationFrame(rafId);
  }
});
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;
@use '@/assets/styles/mixins' as *;

// ========================================
// КОНТЕЙНЕР
// ========================================

.box {
  position: relative;
  padding: 5rem 1.5rem 7rem;
  background: #18191b;
  color: $text-light;
  text-align: center;
  overflow: hidden;
  isolation: isolate;
  clip-path: polygon(
    0% 0%,
    100% 0%,
    100% 82%,
    50% 100%,
    0% 82%
  );

  // ---------- Glow-пятна ----------
  &__glow {
    position: absolute;
    border-radius: 50%;
    filter: blur(140px);
    pointer-events: none;
    z-index: 0;
    animation: floatGlow 16s ease-in-out infinite;

    &--1 {
      top: 50%;
      left: 50%;
      transform: translateX(-50%);
      width: 460px;
      height: 280px;
      background: rgba(0, 195, 245, 0.14);
    }

    &--2 {
      bottom: -10%;
      right: 10%;
      width: 240px;
      height: 240px;
      background: rgba(2, 254, 255, 0.08);
      animation-delay: -8s;
    }
  }

  // ---------- Сетка-паттерн ----------
  &__grid-pattern {
    position: absolute;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    opacity: 0.3;
    background-image:
      linear-gradient(rgba(255, 255, 255, 0.025) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255, 255, 255, 0.025) 1px, transparent 1px);
    background-size: 60px 60px;
    mask-image: radial-gradient(
      ellipse at 50% 40%,
      #000 30%,
      transparent 75%
    );
    -webkit-mask-image: radial-gradient(
      ellipse at 50% 40%,
      #000 30%,
      transparent 75%
    );
  }

  // ---------- Контент ----------
  &__content {
    position: relative;
    z-index: 1;
    max-width: 900px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  // ---------- Вопрос ----------
  &__question {
    font-family: 'Rubik', sans-serif;
    font-size: clamp(0.95rem, 1.3vw, 1.15rem);
    font-weight: 400;
    line-height: 1.5;
    color: rgba($text-light, 0.55);
    text-align: center;
    margin: 0 0 0.5rem;
  }

  // ---------- Главный акцент ----------
  &__headline {
    font-family: 'Rubik', sans-serif;
    font-size: clamp(1.5rem, 3.5vw, 2.25rem);
    font-weight: 700;
    line-height: 1.15;
    letter-spacing: -0.02em;
    text-align: center;
    margin: 0 0 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;

    &-accent {
      background: linear-gradient(120deg, $blue 0%, $blue-light 100%);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
      display: inline-block;
      position: relative;
      opacity: 0;
      transform: translateY(16px);
      transition: opacity 0.6s ease, transform 0.6s ease;

      &.is-visible {
        opacity: 1;
        transform: translateY(0);
      }

      &::after {
        content: '';
        position: absolute;
        inset: -15% -5%;
        background: radial-gradient(
          ellipse at center,
          rgba(0, 195, 245, 0.22) 0%,
          transparent 70%
        );
        z-index: -1;
        pointer-events: none;
      }
    }

    &-sub {
      font-size: 0.52em;
      font-weight: 400;
      letter-spacing: -0.01em;
      color: rgba($text-light, 0.7);
      display: inline-block;
      opacity: 0;
      transform: translateY(16px);
      transition: opacity 0.6s ease, transform 0.6s ease;

      &.is-visible {
        opacity: 1;
        transform: translateY(0);
      }
    }
  }

  // ---------- Блок типологии ----------
  &__types {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
    width: 100%;
    opacity: 0;
    transform: translateY(16px);
    animation: fadeUp 0.6s ease var(--delay, 0s) forwards;
  }

  // ---------- Строка с типами ----------
  &__types-line {
    font-family: 'Rubik', sans-serif;
    font-size: clamp(1rem, 1.5vw, 1.25rem);
    font-weight: 500;
    line-height: 1.4;
    color: rgba($text-light, 0.92);
    margin: 0;
    letter-spacing: 0.01em;
    text-align: center;
  }

  &__type {
    display: inline-block;
  }

  &__type-divider {
    display: inline-block;
    margin: 0 0.55rem;
    color: $blue;
    font-weight: 700;
    opacity: 0.85;
  }

  // ---------- Диапазон ----------
  &__types-range {
    font-family: 'Rubik', sans-serif;
    font-size: clamp(0.85rem, 1.05vw, 0.95rem);
    font-weight: 400;
    color: rgba($text-light, 0.55);
    margin: 0;
    letter-spacing: 0.02em;

    span {
      color: $blue-light;
      font-weight: 600;
    }
  }

  // ---------- Подстрочник ----------
  &__subline {
    font-family: 'Rubik', sans-serif;
    font-size: clamp(0.92rem, 1.2vw, 1.05rem);
    font-weight: 400;
    line-height: 1.55;
    color: rgba($text-light, 0.68);
    text-align: center;
    margin: 0 0 1.5rem;
    max-width: 520px;
    opacity: 0;
    transform: translateY(16px);
    animation: fadeUp 0.6s ease var(--delay, 0s) forwards;
  }

  // ---------- Стрелка ----------
  &__arrow {
    display: flex;
    justify-content: center;
    align-items: center;
    color: $blue;
    animation: bounceArrow 2.4s ease-in-out 0.6s infinite;
    opacity: 0;
    transition: opacity 0.6s ease;

    &.is-visible {
      opacity: 1;
    }

    :deep(svg) {
      filter: drop-shadow(0 0 12px rgba(0, 195, 245, 0.5));
    }
  }
}

// ========================================
// АНИМАЦИИ
// ========================================

@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes floatGlow {
  0%, 100% {
    transform: translate(0, 0) scale(1);
  }
  50% {
    transform: translate(30px, -30px) scale(1.08);
  }
}

@keyframes bounceArrow {
  0%, 100% {
    transform: translateY(0);
    opacity: 1;
  }
  50% {
    transform: translateY(8px);
    opacity: 0.85;
  }
}

// ========================================
// АДАПТИВ
// ========================================

@media (max-width: 768px) {
  .box {
    padding: 3.5rem 1.25rem 5rem;
    clip-path: polygon(
      0% 0%,
      100% 0%,
      100% 88%,
      50% 100%,
      0% 88%
    );

    &__glow {
      filter: blur(90px);
      &--1 { width: 300px; height: 200px; }
      &--2 { width: 180px; height: 180px; }
    }

    &__grid-pattern {
      background-size: 40px 40px;
    }

    &__question {
      margin-bottom: 0.4rem;
    }

    &__headline {
      margin-bottom: 1rem;
    }

    &__types {
      gap: 0.4rem;
      margin-bottom: 1.25rem;
    }

    &__type-divider {
      margin: 0 0.4rem;
    }

    &__subline {
      margin-bottom: 1.25rem;
    }
  }
}
</style>
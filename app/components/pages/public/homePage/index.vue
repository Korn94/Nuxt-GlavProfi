<!-- app\components\pages\public\homePage\index.vue -->
<template>
  <div class="hero">
    <!-- Фон с видео -->
    <div class="hero__background">
      <div class="hero__overlay"></div>
      <div class="hero__glow hero__glow--1"></div>
      <div class="hero__glow hero__glow--2"></div>
      <video
        ref="videoRef"
        class="hero__video"
        autoplay
        muted
        loop
        playsinline
        preload="none"
        poster="/main/video/main-poster.webp"
      >
        <source :src="videoSrc" type="video/mp4" />
      </video>
      <div class="hero__noise"></div>
    </div>

    <!-- Контент -->
    <div class="hero__content">
      <!-- Бейдж-позиционирование -->
      <div class="hero__badge">
        <span class="hero__badge-icon">
          <Icon name="mdi:rocket-launch-outline" size="14" />
        </span>
        <span>От проекта до открытия — 2 месяца</span>
        <!-- <span>Сдаем объект с 0 за 2 месяца</span> -->
      </div>

      <!-- заголовок -->
      <h1 class="hero__title">
        <span class="hero__title-line">
          <span class="hero__title-accent">Ремонт</span> и
          <span class="hero__title-accent">отделка</span>
        </span>
        <span class="hero__title-line">
          коммерческих помещений
        </span>
        <span class="hero__title-line">
          под <span class="hero__title-accent">любые</span> задачи и масштабы
        </span>
      </h1>

      <!-- подзаголовок -->
      <p class="hero__subtitle">
        Берём весь ремонт на себя: смета, материалы, работы и сдача.<br />
        <strong>Вы не тратите время</strong> на контроль рабочих и решение сложных инженерных задач.
      </p>
      <!-- <p class="hero__subtitle">
        Берём весь ремонт на себя: смета, материалы, работы и сдача — вы не тратите время на подрядчиков и на решение инженерных задач.
      </p> -->
      <!-- <p class="hero__subtitle">
        Берём на себя весь цикл работ: от оценки объекта и подготовки сметы до ремонта и сдачи заказчику.
      </p> -->

      <!-- подзаголовок -->
      <!-- <p class="hero__subtitle">
        Фиксированная смета в&nbsp;договоре. Собственные бригады.<br />
        <strong>Экономия до&nbsp;20%</strong> на&nbsp;материалах за&nbsp;счёт прямых контрактов с&nbsp;поставщиками.
      </p> -->

      <!-- Кнопки -->
      <div class="hero__actions">
        <button class="btn btn--primary" @click="openModal">
          <span class="btn__label">Получить смету за 1 день</span>
          <Icon name="mdi:arrow-right" size="18" class="btn__icon" />
          <span class="btn__shine"></span>
        </button>
        <NuxtLink to="/prices/otdelochnye-raboty" class="btn btn--ghost">
          <Icon name="mdi:file-document-outline" size="18" />
          <span>Прайс-лист</span>
        </NuxtLink>
      </div>

      <!-- trust-points -->
      <ul class="hero__trust">
        <li v-for="point in trustPoints" :key="point.text" class="hero__trust-item">
          <span class="hero__trust-icon">
            <Icon :name="point.icon" size="12" />
          </span>
          <span>{{ point.text }}</span>
        </li>
      </ul>

      <!-- Блок со статистикой -->
      <div class="hero__stats">
        <div class="hero__stat" v-for="stat in stats" :key="stat.value">
          <span class="hero__stat-value">{{ stat.value }}</span>
          <span class="hero__stat-label">{{ stat.label }}</span>
        </div>
      </div>

      <!-- Гео -->
      <div class="hero__geo">
        <span class="hero__geo-item">Рязань</span>
        <span class="hero__geo-divider">·</span>
        <span class="hero__geo-item">Москва</span>
        <span class="hero__geo-divider">·</span>
        <span class="hero__geo-item">Области</span>
        <span class="hero__geo-note">Москва и МО — выездной формат без доплат</span>
      </div>
    </div>

    <!-- Модальная форма -->
    <UiFormsContactForm
      v-if="showModal"
      source="Заявка с главной страницы (первый экран)"
      @close="closeModal"
      @formSubmitted="handleFormSubmitted"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';

const isDesktop = ref(false);
const showModal = ref(false);
const videoRef = ref(null);
let observer = null;

const trustPoints = [
  { text: 'Смета в день обращения', icon: 'mdi:phone-in-talk' },
  { text: 'Выезд замерщика бесплатно', icon: 'mdi:map-marker-check' },
  // { text: 'Фиксированная смета', icon: 'mdi:file-document-check' },
  { text: 'Обслуживание после сдачи', icon: 'mdi:wrench' },
  { text: 'Гарантия 3 года', icon: 'mdi:shield-check' },
];

// Статистика
const stats = [
  { value: '250+', label: 'объектов от 80 до 3500+ м²' },
  // { value: '12 лет', label: 'на рынке' },
  { value: '5', label: 'бригад в штате без субподряда' },
  { value: 'до 20%', label: 'экономии на материалах' },
];

// Видео отдаём и на мобиле, и на десктопе.
// Если есть отдельный облегчённый файл для мобильных — подставьте его.
const videoSrc = computed(() =>
  isDesktop.value
    ? '/main/video/main-pk.mp4'
    : '/main/video/main-pk.mp4'
    // : '/main/video/main-mobile.mp4'
);

const openModal = () => (showModal.value = true);
const closeModal = () => (showModal.value = false);
const handleFormSubmitted = (formData) => {
  console.log('Форма отправлена:', formData);
  closeModal();
};

const checkScreenSize = () => {
  isDesktop.value = window.innerWidth > 768;
};

const lazyLoadVideo = () => {
  if (!videoRef.value) return;

  observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        const videoEl = videoRef.value;
        if (videoEl) {
          videoEl.preload = 'auto';
          videoEl.load();
        }
        observer?.disconnect();
        observer = null;
      }
    },
    { rootMargin: '200px' }
  );

  observer.observe(videoRef.value);
};

onMounted(() => {
  checkScreenSize();
  window.addEventListener('resize', checkScreenSize);
  lazyLoadVideo();
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', checkScreenSize);
  observer?.disconnect();
  observer = null;
});
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;

// ========================================
// HERO
// ========================================

.hero {
  position: relative;
  width: 100%;
  min-height: 100vh;
  overflow: hidden;
  isolation: isolate;

  // ---------- Фон ----------
  &__background {
    position: absolute;
    inset: 0;
    z-index: 0;
    background: #0a0c10;
  }

  &__video {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    pointer-events: none;
    user-select: none;
    opacity: 0.85;
  }

  &__overlay {
    position: absolute;
    inset: 0;
    z-index: 1;
    background:
      linear-gradient(
        100deg,
        rgba(6, 8, 12, 0.95) 0%,
        rgba(6, 8, 12, 0.85) 35%,
        rgba(6, 8, 12, 0.5) 60%,
        rgba(6, 8, 12, 0.3) 100%
      ),
      radial-gradient(
        ellipse at 15% 40%,
        rgba(0, 195, 245, 0.12) 0%,
        transparent 55%
      );
  }

  &__glow {
    position: absolute;
    border-radius: 50%;
    filter: blur(120px);
    z-index: 1;
    pointer-events: none;
    animation: floatGlow 12s ease-in-out infinite;

    &--1 {
      top: 10%;
      right: 15%;
      width: 380px;
      height: 380px;
      background: rgba(0, 195, 245, 0.25);
    }

    &--2 {
      bottom: 5%;
      left: 5%;
      width: 300px;
      height: 300px;
      background: rgba(2, 254, 255, 0.12);
      animation-delay: -6s;
    }
  }

  &__noise {
    position: absolute;
    inset: 0;
    z-index: 2;
    pointer-events: none;
    opacity: 0.035;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  }

  // ---------- Контент ----------
  &__content {
    position: relative;
    z-index: 3;
    max-width: 1280px;
    margin: 0 auto;
    padding: 0 2.5em;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  &__badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: rgba(0, 195, 245, 0.08);
    border: 1px solid rgba(0, 195, 245, 0.25);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border-radius: $border-radius;
    color: rgba($text-light, 0.9);
    font-size: 0.85rem;
    font-weight: 500;
    letter-spacing: 0.02em;
    margin-bottom: 1.5rem;
    width: fit-content;
    animation: fadeUp 0.6s ease both;

    &-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: $blue-light;
      animation: pulseIcon 2.5s ease-in-out infinite;
    }
  }

  // ---------- Заголовок ----------
  &__title {
    font-family: 'Rubik', sans-serif;
    color: #fff;
    font-size: clamp(2rem, 4.2vw, 3.4rem);
    font-weight: 700;
    line-height: 1.12;
    letter-spacing: -0.02em;
    margin: 0 0 1.5rem;
    max-width: 900px;
    animation: fadeUp 0.7s ease 0.08s both;

    &-line {
      display: block;
    }

    &-accent {
      background: linear-gradient(120deg, $blue 0%, $blue-light 100%);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
      display: inline-block;
    }
  }

  // ---------- Подзаголовок ----------
  &__subtitle {
    font-size: clamp(0.95rem, 1.1vw, 1.08rem);
    line-height: 1.65;
    color: rgba($text-light, 0.78);
    margin: 0 0 2rem;
    max-width: 620px;
    animation: fadeUp 0.7s ease 0.16s both;

    :deep(strong) {
      color: $blue-light;
      font-weight: 600;
    }

    // @media (max-width: 768px) {
    //   br { display: none; }
    // }
  }

  // ---------- Кнопки ----------
  &__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.9rem;
    margin-bottom: 1.75rem;
    animation: fadeUp 0.7s ease 0.24s both;
  }

  // ---------- Trust ----------
  &__trust {
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem 1.5rem;
    list-style: none;
    margin: 0 0 1.5rem;
    padding: 0;
    animation: fadeUp 0.7s ease 0.32s both;

    &-item {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      color: rgba($text-light, 0.82);
      font-size: 0.88rem;
      font-weight: 500;
    }

    &-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: rgba(0, 195, 245, 0.15);
      border: 1px solid rgba(0, 195, 245, 0.4);
      color: $blue-light;
      flex-shrink: 0;
    }
  }

  &__stats {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem 1.25rem;
    padding: 1rem 1.4rem;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border-radius: $border-radius;
    margin-bottom: 2rem;
    width: fit-content;
    max-width: 100%;
    animation: fadeUp 0.7s ease 0.40s both;
  }

  &__stat {
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
    padding: 0.25rem 0;

    &:not(:last-child) {
      border-right: 1px solid rgba(255, 255, 255, 0.1);
      padding-right: 1.25rem;
    }

    &-value {
      font-family: 'Rubik', sans-serif;
      font-size: 1.25rem;
      font-weight: 700;
      color: $blue-light;
      letter-spacing: -0.01em;
    }

    &-label {
      font-size: 0.82rem;
      color: rgba($text-light, 0.6);
    }
  }

  // ---------- Гео ----------
  &__geo {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.88rem;
    color: rgba($text-light, 0.6);
    animation: fadeUp 0.7s ease 0.48s both;

    &-item {
      color: rgba($text-light, 0.9);
      font-weight: 500;
    }

    &-divider {
      color: rgba($text-light, 0.3);
    }

    &-note {
      margin-left: 0.75rem;
      padding-left: 0.75rem;
      border-left: 1px solid rgba(255, 255, 255, 0.15);
      font-size: 0.78rem;
      color: rgba($text-light, 0.45);

      @media (max-width: 640px) {
        margin-left: 0;
        padding-left: 0;
        border-left: none;
        width: 100%;
      }
    }
  }
}

// ========================================
// КНОПКИ
// ========================================

.btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  padding: 0.95rem 1.65rem;
  font-family: 'Rubik', sans-serif;
  font-size: 0.95rem;
  font-weight: 600;
  letter-spacing: 0.01em;
  border-radius: $border-radius;
  border: none;
  cursor: pointer;
  overflow: hidden;
  transition: transform 0.25s ease, box-shadow 0.25s ease, background 0.25s ease;
  text-decoration: none;
  white-space: nowrap;

  &--primary {
    background: linear-gradient(120deg, $blue 0%, #35d6ff 100%);
    color: #061017;
    box-shadow:
      0 10px 30px rgba(0, 195, 245, 0.35),
      inset 0 1px 0 rgba(255, 255, 255, 0.4);

    .btn__icon {
      transition: transform 0.25s ease;
    }

    &:hover {
      transform: translateY(-2px);
      box-shadow:
        0 16px 40px rgba(0, 195, 245, 0.5),
        inset 0 1px 0 rgba(255, 255, 255, 0.5);

      .btn__icon {
        transform: translateX(4px);
      }

      .btn__shine {
        transform: translateX(200%) skewX(-20deg);
      }
    }

    &:active {
      transform: translateY(0);
    }
  }

  &--ghost {
    background: rgba(255, 255, 255, 0.05);
    color: #fff;
    border: 1px solid rgba(255, 255, 255, 0.18);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);

    &:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(0, 195, 245, 0.6);
      transform: translateY(-2px);
    }

    :deep(svg) {
      color: $blue-light;
    }
  }

  &__shine {
    position: absolute;
    top: 0;
    left: -60%;
    width: 40%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.5),
      transparent
    );
    transform: translateX(-100%) skewX(-20deg);
    transition: transform 0.7s ease;
    pointer-events: none;
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

@keyframes floatGlow {
  0%, 100% {
    transform: translate(0, 0) scale(1);
  }
  50% {
    transform: translate(20px, -30px) scale(1.08);
  }
}

@keyframes pulseIcon {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.15); opacity: 0.85; }
}

// ========================================
// АДАПТИВ
// ========================================

@media (max-width: 1024px) {
  .hero__content {
    padding: 0 4rem;
  }

  .hero__stats {
    gap: 0.3rem 1rem;
  }

  .hero__stat:not(:last-child) {
    padding-right: 1rem;
  }
}

@media (max-width: 768px) {
  .hero {
    min-height: 100svh;

    &__background {
      background: #06080c;
    }

    &__video {
      opacity: 0.75;
      object-position: center;
    }

    &__overlay {
      background:
        linear-gradient(
          180deg,
          rgba(6, 8, 12, 0.45) 0%,
          rgba(6, 8, 12, 0.7) 55%,
          rgba(6, 8, 12, 0.92) 100%
        ),
        radial-gradient(
          ellipse at 50% 15%,
          rgba(0, 195, 245, 0.12) 0%,
          transparent 60%
        );
    }

    &__glow {
      filter: blur(80px);
      &--1 { width: 220px; height: 220px; }
      &--2 { width: 180px; height: 180px; }
    }

    &__content {
      padding: 6rem 1.5rem 3rem;
      min-height: 100svh;
      justify-content: flex-start;
      align-items: flex-start;
      text-align: left;
    }

    &__badge {
      font-size: 0.78rem;
      padding: 0.4rem 0.85rem;
      margin-bottom: 1.25rem;
    }

    &__title {
      font-size: 1.9rem;
      margin-bottom: 1.1rem;
    }

    &__subtitle {
      font-size: 0.95rem;
      margin-bottom: 1.5rem;
    }

    &__actions {
      flex-direction: column;
      width: 100%;
      gap: 0.75rem;
      margin-bottom: 1.5rem;

      .btn {
        width: 100%;
        padding: 0.9rem 1.4rem;
      }
    }

    &__trust {
      gap: 0.5rem 1rem;
      margin-bottom: 1.25rem;

      &-item { font-size: 0.8rem; }
      &-icon { width: 16px; height: 16px; }
    }

    &__stats {
      display: grid;
      grid-template-columns: 1fr;
      gap: 0.6rem 0.8rem;
      width: 100%;
      padding: 1rem;
      margin-bottom: 1.5rem;
    }

    &__stat {
      // flex-direction: column;
      // align-items: center;
      justify-content: center;
      // gap: 0.2rem;
      padding: 0.5rem 0;
      border-right: none !important;
      padding-right: 0 !important;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      padding-bottom: 0.5rem;

      &:nth-child(3),
      &:nth-child(4) {
        border-bottom: none;
      }

      &-value { font-size: 1.15rem; }
      &-label { font-size: 0.75rem; }
    }

    &__geo {
      font-size: 0.82rem;
      text-align: center;
      justify-content: center;
    }
  }
}

@media (max-width: 400px) {
  .hero__title { font-size: 1.65rem; }

  .hero__stats {
    grid-template-columns: 1fr;
  }
}
</style>
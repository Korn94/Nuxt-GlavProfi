<!-- app/components/pages/public/remontPomescheniy/index/blocks/CTASection.vue -->
<template>
  <section class="cta-section">
    <div class="container">
      <div class="cta-card">
        <!-- Декоративные свечения внутри карточки -->
        <div class="cta-card__glow cta-card__glow--one" aria-hidden="true"></div>
        <div class="cta-card__glow cta-card__glow--two" aria-hidden="true"></div>

        <div class="cta-card__inner">
          <!-- Бейдж сверху -->
          <div class="cta-card__badge">
            <span class="cta-card__badge-dot"></span>
            <span>Свободно 3 слота на этот месяц</span>
          </div>

          <!-- Заголовок -->
          <h2 class="cta-card__title">
            Готовы обсудить <span class="accent">ваш проект</span>?
          </h2>

          <!-- Подзаголовок -->
          <p class="cta-card__subtitle">
            Оставьте заявку — подготовим коммерческое предложение с детальной сметой
            в течение 24 часов. Или напишите нам напрямую в телеграме.
          </p>

          <!-- Trust-бейджи -->
          <ul class="cta-card__features">
            <li><Icon name="mdi:clock-fast" size="16" /> Смета за 24 часа</li>
            <li><Icon name="mdi:shield-check-outline" size="16" /> Договор и гарантия</li>
            <li><Icon name="mdi:account-hard-hat-outline" size="16" /> Свои мастера</li>
          </ul>

          <!-- Кнопки действий -->
          <div class="cta-card__actions">
            <UiButtonsPrimary variant="blue" class="cta-card__cta" @click="openModal">
              Получить коммерческое предложение
            </UiButtonsPrimary>

            <a :href="telegramLink" class="cta-card__link" target="_blank" rel="noopener">
              <Icon name="mdi:telegram" size="20" />
              <span>Обсудить в телеграме</span>
              <Icon name="mdi:arrow-right" size="18" class="cta-card__link-arrow" />
            </a>
          </div>

          <!-- Дисклеймер -->
          <p class="cta-card__disclaimer">
            Расчет стоимости в течение 24 часов. Не является публичной офертой.
          </p>
        </div>
      </div>
    </div>

    <!-- Модальная форма -->
    <UiFormsContactForm
      v-if="showModal"
      @close="closeModal"
      @formSubmitted="handleFormSubmitted"
    />
  </section>
</template>

<script setup>
import { ref } from 'vue'

const telegramLink = 'https://t.me/glavprofii'
const showModal = ref(false)

const openModal = () => {
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
}

const handleFormSubmitted = (formData) => {
  console.log('📩 Форма отправлена:', formData)
  closeModal()
}
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;
@use '@/assets/styles/mixins' as *;

// ========================================
// СЕКЦИЯ — СВЕТЛЫЙ ФОН
// ========================================
.cta-section {
  @include section-padding;
  position: relative;
  background: $background-light;
  color: $text-dark;

  .container {
    @include section-container;
  }
}

// ========================================
// ТЁМНАЯ КАРТОЧКА
// ========================================
.cta-card {
  position: relative;
  max-width: 860px;
  margin: 0 auto;
  padding: 3.5rem 3rem;
  overflow: hidden;
  isolation: isolate;

  background: linear-gradient(145deg, #1e1f22 0%, #18191b 55%, #131416 100%);
  border-radius: 24px;
  box-shadow:
    0 30px 70px -20px rgba(0, 0, 0, 0.35),
    0 10px 30px -10px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);

  @media (max-width: 768px) {
    padding: 2.5rem 1.5rem;
    border-radius: 20px;
  }

  // === Свечения внутри карточки ===
  &__glow {
    position: absolute;
    border-radius: 50%;
    filter: blur(100px);
    pointer-events: none;
    z-index: 0;

    &--one {
      width: 420px;
      height: 420px;
      top: -180px;
      left: -120px;
      background: radial-gradient(circle, rgba(0, 195, 245, 0.5), transparent 70%);
      opacity: 0.7;
    }

    &--two {
      width: 380px;
      height: 380px;
      bottom: -180px;
      right: -100px;
      background: radial-gradient(circle, rgba(2, 254, 255, 0.28), transparent 70%);
      opacity: 0.6;
    }
  }

  // === Контент поверх свечений ===
  &__inner {
    position: relative;
    z-index: 1;
    text-align: center;
    color: $text-light;
  }

  // === Бейдж сверху ===
  &__badge {
    display: inline-flex;
    align-items: center;
    gap: 0.55rem;
    padding: 0.4rem 0.9rem;
    margin-bottom: 1.5rem;
    background: rgba(0, 195, 245, 0.08);
    border: 1px solid rgba(0, 195, 245, 0.3);
    border-radius: 100px;
    font-size: 0.82rem;
    font-weight: 500;
    color: $blue-light;
    letter-spacing: 0.02em;
    backdrop-filter: blur(6px);
  }

  &__badge-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: $blue;
    box-shadow: 0 0 0 0 rgba(0, 195, 245, 0.6);
    animation: pulse-dot 2s infinite;
  }

  // === Заголовок ===
  &__title {
    font-family: 'Rubik', sans-serif;
    font-size: 2.6rem;
    font-weight: 700;
    line-height: 1.15;
    letter-spacing: -0.02em;
    margin: 0 0 1.2rem;
    color: $text-light;

    .accent {
      background: $blue-gradient;
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
      color: transparent;
    }

    @media (max-width: 768px) {
      font-size: 1.85rem;
    }
  }

  // === Подзаголовок ===
  &__subtitle {
    font-size: 1.08rem;
    line-height: 1.65;
    color: rgba(255, 255, 255, 0.72);
    max-width: 600px;
    margin: 0 auto 2rem;

    @media (max-width: 768px) {
      font-size: 0.98rem;
      margin-bottom: 1.6rem;
    }
  }

  // === Trust-бейджи ===
  &__features {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.6rem 1.4rem;
    margin: 0 0 2.4rem;
    padding: 0;
    list-style: none;

    li {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.88rem;
      font-weight: 500;
      color: rgba(255, 255, 255, 0.78);

      :deep(svg) {
        color: $blue;
      }
    }

    @media (max-width: 480px) {
      gap: 0.5rem 1rem;
      font-size: 0.82rem;
    }
  }

  // === Действия ===
  &__actions {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1.6rem;
  }

  &__cta {
    padding: 16px 32px !important;
    font-size: 1rem !important;
    border-radius: 12px !important;
    box-shadow: 0 12px 32px rgba(0, 195, 245, 0.35) !important;

    &:hover {
      box-shadow: 0 16px 40px rgba(0, 195, 245, 0.5) !important;
    }
  }

  // === Ссылка на телеграм ===
  &__link {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.7rem 1.2rem;
    font-size: 0.98rem;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.85);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 100px;
    background: rgba(255, 255, 255, 0.03);
    transition: all 0.3s ease;

    :deep(svg) {
      color: $blue;
      transition: transform 0.3s ease;
    }

    &-arrow {
      opacity: 0.6;
      margin-left: 0.15rem;
    }

    &:hover {
      color: $text-light;
      border-color: rgba(0, 195, 245, 0.5);
      background: rgba(0, 195, 245, 0.08);
      transform: translateY(-2px);

      :deep(svg):first-child {
        transform: scale(1.1);
      }

      .cta-card__link-arrow {
        transform: translateX(3px);
        opacity: 1;
      }
    }
  }

  // === Дисклеймер ===
  &__disclaimer {
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.4);
    line-height: 1.45;
    margin: 0 auto;
    max-width: 480px;
  }
}

// ========================================
// АНИМАЦИЯ ПУЛЬСАЦИИ
// ========================================
@keyframes pulse-dot {
  0% {
    box-shadow: 0 0 0 0 rgba(0, 195, 245, 0.6);
  }
  70% {
    box-shadow: 0 0 0 8px rgba(0, 195, 245, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(0, 195, 245, 0);
  }
}

// ========================================
// АДАПТИВ
// ========================================
@media (max-width: 768px) {
  .cta-section {
    padding-top: 3.5rem;
    padding-bottom: 3rem;
  }

  .cta-card__glow {
    &--one { width: 300px; height: 300px; }
    &--two { width: 260px; height: 260px; }
  }
}
</style>
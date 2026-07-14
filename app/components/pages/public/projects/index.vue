<!-- app/components/pages/public/projects/index.vue -->
<template>
  <div class="portfolio-page">
    <!-- Hero-секция в едином стиле -->
    <section class="hero" ref="heroSection">
      <div class="container">
        <div class="hero__content fade-in-up">

          <h1 class="hero__title">
            Реализованные объекты коммерческой недвижимости
          </h1>

          <!-- УТП в виде стеклянной плашки -->
          <div class="hero__badge fade-in-up">
            <p class="hero__badge-text">
              Только реальные проекты — с фото, площадью и сроками. Без рендеров, без маркетинговых обещаний.
              <!-- Каждый объект сдан в срок, по фиксированной смете и с полным пакетом исполнительной документации. -->
            </p>
          </div>

          <!-- Карточки преимуществ -->
          <div class="hero__benefits fade-in-up">
            <div v-for="(benefit, index) in benefits" :key="index" class="hero__benefit-card">
              <div class="hero__row">
                <div class="hero__benefit-icon">
                  <Icon :name="benefit.icon" size="24" />
                </div>
                <h3 class="hero__benefit-title">{{ benefit.title }}</h3>
              </div>
              <p class="hero__benefit-desc">{{ benefit.description }}</p>
            </div>
          </div>

          <!-- CTA блок -->
          <div class="hero__actions fade-in-up">
            <UiButtonsPrimary variant="blue" @click="openModal">
              <span>Получить КП / Смету</span>
              <Icon name="lucide:arrow-right" size="18" />
            </UiButtonsPrimary>
            <p class="hero__disclaimer">
              Бесплатная консультация и предварительный расчёт за 24 часа
            </p>
            <a :href="telegramLink" class="hero__link" target="_blank" rel="noopener">
              <Icon name="lucide:send" size="16" />
              <span>Написать нам в телеграме</span>
              <Icon name="lucide:external-link" size="14" />
            </a>
          </div>

        </div>
      </div>
    </section>

    <!-- Светлая секция с карточками (оставляем ваш компонент без изменений) -->
    <section class="portfolio-cases">
      <div class="container">
        <PagesPublicProjectsCards :tabs="tabs" />
      </div>
    </section>

    <!-- P.S. блок -->
    <section class="ps">
      <div class="container">
        <div class="ps-content">
          <div class="ps-icon">
            <Icon name="lucide:info" size="24" />
          </div>
          <p>
            <strong>P.S.</strong> Портфолио пока в процессе наполнения — мы выкладываем только те объекты, по которым
            есть полный комплект фото. За 11 лет работы компания реализовала более 250 коммерческих объектов, однако не все из них были задокументированы в формате, пригодном для публикации. В первые годы работы мы умели строить, но не умели фотографировать 😅. По запросу пришлём примеры работ именно по вашему
            направлению.
          </p>
        </div>
      </div>
    </section>

    <!-- Модальное окно -->
    <Teleport to="body">
      <UiFormsContactForm v-if="showModal" @close="closeModal" @formSubmitted="handleFormSubmitted" />
    </Teleport>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'

const heroSection = ref(null)
const telegramLink = 'https://t.me/glavprofii'
const showModal = ref(false)

const openModal = () => { showModal.value = true }
const closeModal = () => { showModal.value = false }
const handleFormSubmitted = (formData) => {
  console.log('📩 Форма отправлена:', formData)
  closeModal()
}

// Категории для табов (синхронизируем с cards.vue)
const tabs = [
  'Все',
  'Кафе',
  'Магазины',
  'Клиники',
  'Банки',
  'Фитнес',
  'Производственные',
  'Фасады и Кровля',
  'Прочее'
]

// Преимущества
const benefits = [
  {
    title: 'Полный цикл работ',
    description: 'От уютного кафе до крупного производства — работаем с помещениями любого назначения и сложности.',
    icon: 'mdi:number-1-circle-outline'
  },
  {
    title: 'Специализированные бригады',
    description: 'Каждый этап ремонта — зона ответственности узких экспертов: электрики, отделочники, инженеры.',
    icon: 'mdi:number-2-circle-outline'
  }
]

// Анимация появления при скролле
onMounted(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible')
        }
      })
    },
    { threshold: 0.1 }
  )

  const elements = heroSection.value?.querySelectorAll('.fade-in-up')
  elements?.forEach((el) => {
    el.classList.remove('visible')
    observer.observe(el)
  })
})
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;

span {
  color: unset;
}

.portfolio-page {
  background: $background-dark;
  padding-top: 8em;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: radial-gradient(circle at 5% 0%, $blue20 0%, transparent 10%);
    pointer-events: none;
  }
}

// === HERO СЕКЦИЯ ===
.hero {
  padding: 6rem 0 4rem;
  overflow: hidden;
  position: relative;

  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 2rem;
    position: relative;
    z-index: 1;
  }

  &__content {
    background: rgba(34, 34, 34, 0.6);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: $border-radius;
    padding: 3.5rem;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    position: relative;
  }

  &__title {
    font-family: 'Rubik', sans-serif;
    font-size: 2.3rem;
    font-weight: 700;
    margin-bottom: 1.8rem;
    color: $text-light;
    line-height: 1.3;
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
  }

  &__badge {
    background: rgba($green, 0.08);
    border: 1px solid rgba($green, 0.25);
    border-left: 3px solid $green;
    border-radius: $border-radius;
    padding: 1rem 1.25rem;
    margin-bottom: 2.5rem;
  }

  &__badge-text {
    font-size: 0.95rem;
    line-height: 1.6;
    color: rgba($text-light, 0.95);
    margin: 0;
  }

  &__benefits {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1.4rem;
    margin-bottom: 2.5rem;
  }

  &__benefit-card {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: $border-radius;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.9rem;
    transition: all 0.35s ease;

    &:hover {
      box-shadow: 0 12px 25px rgba(0, 0, 0, 0.25);
      border-color: $blue;
      background: rgba(0, 195, 245, 0.08);
    }

    // Тач-эффект для мобильных
    &:active {
      transform: translateY(-2px);
      transition: transform 0.1s ease;
    }
  }

  &__benefit-icon {
    color: $blue;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    background: rgba(0, 195, 245, 0.1);
    border-radius: 10px;
  }

  &__row {
    display: flex;
    align-items: center;
    gap: 1em;
  }

  &__benefit-title {
    font-size: 1.1rem;
    font-weight: 600;
    color: $text-light;
    margin: 0;
  }

  &__benefit-desc {
    font-size: 0.95rem;
    line-height: 1.6;
    color: rgba($text-light, 0.75);
    margin: 0;
  }

  &__actions {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
    padding-top: 1rem;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
  }

  &__disclaimer {
    font-size: 0.8rem;
    color: rgba($text-light, 0.5);
    margin: 0;
    line-height: 1.4;
  }

  &__link {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    color: $blue;
    font-weight: 500;
    font-size: 0.95rem;
    transition: color 0.3s ease;
    text-decoration: none;
    padding: 0.5rem 0;
    min-height: 44px; // Touch target

    &:hover {
      color: $blue-light;
    }

    &:active {
      color: $blue-light;
    }
  }
}

// === СЕКЦИЯ С КЕЙСАМИ ===
.portfolio-cases {
  padding: 4rem 0;
  background: $color-light;
  position: relative;

  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 2rem;
  }
}

// === P.S. БЛОК ===
.ps {
  padding: 3rem 0 5rem;
  background: $background-gray;

  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 2rem;
  }

  .ps-content {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
    background: rgba(2, 254, 255, 0.1);
    border-radius: $border-radius;
    border: 1px solid $blue20;
    display: flex;
    gap: 1rem;
    align-items: flex-start;

    p {
      line-height: 1.8;
      font-size: 1.1rem;
      color: $text-light;
      margin: 0;

      strong {
        color: $blue;
      }
    }

    .ps-icon {
      flex-shrink: 0;
      color: $blue;
      margin-top: 0.2rem;
    }
  }
}

// === АНИМАЦИИ ===
.fade-in-up {
  opacity: 0;
  transform: translateY(24px);
  transition: opacity 0.6s ease, transform 0.6s ease;

  &.visible {
    opacity: 1;
    transform: translateY(0);
  }
}

// ============================================
// 📱 МОБИЛЬНАЯ АДАПТАЦИЯ
// ============================================

// Планшеты и небольшие ноутбуки
@media (max-width: 992px) {
  .hero {
    padding: 4rem 0 3rem;

    &__content {
      padding: 2.5rem;
    }

    &__title {
      font-size: 2rem;
    }
  }

  .portfolio-cases {
    padding: 3rem 0;
  }

  .ps {
    padding: 2.5rem 0 4rem;
  }
}

// Мобильные устройства
@media (max-width: 768px) {
  .hero {
    padding: 3rem 0 2rem;

    .container {
      padding: 0 1rem;
    }

    &__content {
      padding: 1.5rem;
      border-radius: 8px;
    }

    &__title {
      font-size: 1.5rem;
      margin-bottom: 1.25rem;
      padding-bottom: 0.8rem;

      &::after {
        width: 60px;
        height: 3px;
      }
    }

    &__badge {
      padding: 0.875rem 1rem;
      margin-bottom: 1.75rem;
      border-radius: 6px;

      &-text {
        font-size: 0.875rem;
        line-height: 1.5;
      }
    }

    &__benefits {
      grid-template-columns: 1fr;
      gap: 1rem;
      margin-bottom: 1.75rem;
    }

    &__benefit-card {
      padding: 1.25rem;
      flex-direction: column;
      gap: 1rem;
      border-radius: 8px;

      // На мобильных делаем карточку в две строки
      .hero__row {
        flex: 1;
      }

      .hero__benefit-desc {
        flex: 1 1 100%;
        margin-top: 0.5rem;
      }
    }

    &__benefit-icon {
      width: 36px;
      height: 36px;
      border-radius: 8px;

      :deep(svg) {
        width: 20px;
        height: 20px;
      }
    }

    &__benefit-title {
      font-size: 1rem;
    }

    &__benefit-desc {
      font-size: 0.875rem;
    }

    &__actions {
      align-items: stretch;
      gap: 0.75rem;
      padding-top: 0.875rem;
    }

    &__disclaimer {
      font-size: 0.75rem;
      text-align: center;
      padding: 0 1rem;
    }

    &__link {
      width: 100%;
      justify-content: center;
      padding: 0.875rem 0;
      font-size: 0.9rem;
      border: 1px solid rgba(0, 195, 245, 0.2);
      border-radius: 50px;
      background: rgba(0, 195, 245, 0.05);
      margin-top: 0.5rem;

      &:active {
        background: rgba(0, 195, 245, 0.1);
      }
    }
  }

  .portfolio-cases {
    padding: 2.5rem 0;

    .container {
      padding: 0 1rem;
    }
  }

  .ps {
    padding: 2rem 0 3rem;

    .container {
      padding: 0 1rem;
    }

    .ps-content {
      padding: 1.25rem;
      flex-direction: column;
      align-items: center;
      text-align: center;
      border-radius: 8px;

      p {
        font-size: 0.95rem;
        line-height: 1.6;
      }

      .ps-icon {
        margin-top: 0;
        margin-bottom: 0.5rem;
      }
    }
  }
}

// Маленькие мобильные устройства
@media (max-width: 480px) {
  .hero {
    padding: 2rem 0 1.5rem;

    &__content {
      padding: 1.25rem;
    }

    &__title {
      font-size: 1.25rem;
    }

    &__badge-text {
      font-size: 0.8125rem;
    }

    &__benefit-card {
      padding: 1rem;
    }

    &__benefit-title {
      font-size: 0.9375rem;
    }

    &__benefit-desc {
      font-size: 0.8125rem;
    }
  }

  .ps-content {
    padding: 1rem;

    p {
      font-size: 0.875rem;
    }
  }
}

// iOS Safe Area поддержка
@supports (padding: max(0px)) {
  .portfolio-page {
    padding-bottom: max(0px, env(safe-area-inset-bottom));
  }
}

// Предпочтение уменьшенных анимаций
@media (prefers-reduced-motion: reduce) {
  .fade-in-up {
    opacity: 1;
    transform: none;
    transition: none;
  }

  .hero__benefit-card,
  .hero__link {
    transition: none;

    &:hover {
      transform: none;
    }
  }
}
</style>
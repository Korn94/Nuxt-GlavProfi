<!-- app/components/pages/public/about/blocks/Hero.vue -->
<template>
  <section class="about-hero">
    <!-- Фон -->
    <div class="about-hero__background" aria-hidden="true">
      <img
        class="about-hero__image"
        src="/main/video/main-poster.webp"
        alt=""
        fetchpriority="high"
      />
      <div class="about-hero__overlay"></div>
      <div class="about-hero__glow about-hero__glow--one"></div>
      <div class="about-hero__glow about-hero__glow--two"></div>
    </div>

    <div class="container">
      <div class="about-hero__content">
        <span class="about-hero__badge">
          <Icon name="mdi:map-marker-radius-outline" size="14" />
          <span>Рязань и Рязанская область · с 2014 года</span>
        </span>

        <h1 class="about-hero__title">
          О компании <span class="accent">ГлавПрофи</span>
        </h1>

        <p class="about-hero__subtitle">
          Работаем с <b>2014</b> года и за это время завоевали доверие сотен клиентов.
          Нас рекомендуют, а многие работают с нами не первый год, зная, что мы предлагаем
          надежное качество и четкое выполнение сроков.
        </p>

        <div class="about-hero__actions">
          <UiButtonsPrimary variant="blue" @click="requestContact">
            Обсудить проект
          </UiButtonsPrimary>

          <a class="about-hero__link" href="/projects" @click="trackProjects">
            <span>Смотреть проекты</span>
            <Icon name="mdi:arrow-right" size="18" />
          </a>
        </div>

        <ul class="about-hero__facts">
          <li
            v-for="fact in facts"
            :key="fact.label"
            class="fact-card"
          >
            <span class="fact-card__icon">
              <Icon :name="fact.icon" size="22" />
            </span>
            <span class="fact-card__value">{{ fact.value }}</span>
            <span class="fact-card__label">{{ fact.label }}</span>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { trackCtaClick } from '~/composables/visitor/trackerCta'

const emit = defineEmits<{
  (e: 'open-contact', label: string): void
}>()

const facts = [
  {
    value: '12 лет',
    label: 'на рынке с 2014 года',
    icon: 'mdi:calendar-check-outline',
  },
  {
    value: '250+',
    label: 'реализованных объектов',
    icon: 'mdi:office-building-marker-outline',
  },
  {
    value: '5',
    label: 'специализированных бригад',
    icon: 'mdi:account-hard-hat-outline',
  },
  {
    value: '3 года',
    label: 'гарантия на работы',
    icon: 'mdi:shield-check-outline',
  },
]

function requestContact() {
  // 📊 CTA → модальная форма заявки
  trackCtaClick('О компании — Обсудить проект', { target: 'О компании' })
  emit('open-contact', 'О компании — Обсудить проект')
}

function trackProjects() {
  // Навигационный CTA: ведёт к секции проектов
  trackCtaClick('О компании — Смотреть проекты', {
    target: 'О компании',
    href: '#about-projects',
  })
}
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;
@use '@/assets/styles/mixins' as *;

.about-hero {
  position: relative;
  display: flex;
  align-items: center;
  min-height: 640px;
  padding: 5rem 0 4rem;
  overflow: hidden;
  background: $background-dark;
  color: $text-light;
  isolation: isolate;

  @media (max-width: 768px) {
    min-height: auto;
    padding: 3.5rem 0 3rem;
  }

  &__background {
    position: absolute;
    inset: 0;
    z-index: 0;
    overflow: hidden;
  }

  &__image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
    opacity: 0.55;
  }

  &__overlay {
    position: absolute;
    inset: 0;
    background:
      linear-gradient(
        100deg,
        rgba(6, 8, 12, 0.94) 0%,
        rgba(6, 8, 12, 0.82) 45%,
        rgba(6, 8, 12, 0.55) 100%
      ),
      radial-gradient(
        ellipse at 75% 20%,
        rgba(0, 195, 245, 0.16) 0%,
        transparent 55%
      );
  }

  &__glow {
    position: absolute;
    border-radius: 50%;
    filter: blur(90px);
    pointer-events: none;

    &--one {
      top: -120px;
      right: 8%;
      width: 360px;
      height: 360px;
      background: radial-gradient(circle, rgba(0, 195, 245, 0.28), transparent 70%);
    }

    &--two {
      bottom: -160px;
      left: -80px;
      width: 320px;
      height: 320px;
      background: radial-gradient(circle, rgba(2, 254, 255, 0.14), transparent 70%);
    }
  }

  .container {
    @include section-container;
  }

  &__content {
    position: relative;
    z-index: 1;
    max-width: 860px;
  }

  &__badge {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.45rem 0.95rem;
    margin-bottom: 1.4rem;
    font-size: 0.82rem;
    font-weight: 500;
    line-height: 1.3;
    color: rgba($text-light, 0.9);
    background: rgba(0, 195, 245, 0.08);
    border: 1px solid rgba(0, 195, 245, 0.28);
    border-radius: 100px;

    :deep(svg) {
      color: $blue;
      flex-shrink: 0;
    }
  }

  &__title {
    @include page-title;
    color: $text-light;
    margin-bottom: 1.2rem;

    .accent {
      background: $blue-gradient;
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
    }
  }

  &__subtitle {
    max-width: 720px;
    margin-bottom: 2rem;
    font-size: 1.12rem;
    line-height: 1.7;
    color: rgba($text-light, 0.82);

    b {
      color: $blue-light;
      font-weight: 600;
    }

    @media (max-width: 768px) {
      font-size: 1rem;
      margin-bottom: 1.6rem;
    }
  }

  &__actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.85rem 1.25rem;
    margin-bottom: 2.4rem;

    @media (max-width: 480px) {
      flex-direction: column;
      align-items: stretch;

      :deep(.universal-button) {
        width: 100%;
      }
    }
  }

  &__link {
    display: inline-flex;
    align-items: center;
    gap: 0.55rem;
    padding: 0.85rem 1.4rem;
    font-family: 'Rubik', sans-serif;
    font-size: 0.98rem;
    font-weight: 600;
    color: rgba($text-light, 0.9);
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.16);
    border-radius: var(--border-radius, 6px);
    transition: all 0.3s ease;

    :deep(svg) {
      color: $blue;
      transition: transform 0.3s ease;
    }

    &:hover {
      color: $text-light;
      border-color: rgba(0, 195, 245, 0.55);
      background: rgba(0, 195, 245, 0.08);
      transform: translateY(-2px);

      :deep(svg) {
        transform: translateX(4px);
      }
    }
  }

  &__facts {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0.9rem;
    max-width: 860px;
    margin: 0;
    padding: 0;
    list-style: none;

    @media (max-width: 1024px) {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    @media (max-width: 360px) {
      grid-template-columns: 1fr;
    }
  }
}

.fact-card {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: 1.1rem 1.15rem;
  background: rgba(255, 255, 255, 0.045);
  border: 1px solid rgba(255, 255, 255, 0.09);
  border-radius: 14px;
  backdrop-filter: blur(10px);
  transition: border-color 0.3s ease, background 0.3s ease, transform 0.3s ease;

  &:hover {
    transform: translateY(-3px);
    background: rgba(0, 195, 245, 0.07);
    border-color: rgba(0, 195, 245, 0.35);
  }

  &__icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    margin-bottom: 0.5rem;
    color: $blue;
    background: rgba(0, 195, 245, 0.1);
    border: 1px solid rgba(0, 195, 245, 0.18);
    border-radius: 10px;
  }

  &__value {
    font-family: 'Rubik', sans-serif;
    font-size: 1.45rem;
    font-weight: 700;
    line-height: 1.1;
    color: $blue-light;
  }

  &__label {
    font-size: 0.8rem;
    line-height: 1.35;
    color: rgba($text-light, 0.62);
  }
}

@media (max-width: 768px) {
  .about-hero {
    &__glow {
      &--one { width: 240px; height: 240px; }
      &--two { width: 220px; height: 220px; }
    }
  }

  .fact-card {
    padding: 0.95rem 1rem;

    &__value {
      font-size: 1.25rem;
    }
  }
}
</style>


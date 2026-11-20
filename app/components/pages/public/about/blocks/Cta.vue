<!-- app/components/pages/public/about/blocks/Cta.vue -->
<template>
  <section id="about-contact" class="about-cta">
    <div class="container">
      <div class="cta-card">
        <div class="cta-card__glow cta-card__glow--one" aria-hidden="true"></div>
        <div class="cta-card__glow cta-card__glow--two" aria-hidden="true"></div>

        <div class="cta-card__inner">
          <span class="cta-card__badge">
            <span class="cta-card__dot"></span>
            <span>Бесплатная консультация и выезд</span>
          </span>

          <h2 class="cta-card__title">
            Хотите <span class="accent">знать больше?</span>
          </h2>

          <p class="cta-card__subtitle">
            Свяжитесь с нами для получения подробной консультации или расчета стоимости
            вашего проекта!
          </p>

          <div class="cta-card__actions">
            <UiButtonsPrimary variant="blue" size="" @click="requestContact">
              Связаться с нами
            </UiButtonsPrimary>

            <div class="cta-card__messengers">
              <a
                class="cta-card__messenger cta-card__messenger--telegram"
                href="https://t.me/glavprofii"
                target="_blank"
                rel="noopener"
              >
                <Icon name="mdi:telegram" size="20" />
                <span>Написать в Telegram</span>
                <Icon name="mdi:arrow-right" size="18" class="cta-card__messenger-arrow" />
              </a>

              <a
                class="cta-card__messenger cta-card__messenger--max"
                href="https://max.ru/u/f9LHodD0cOLfbBSpAeCwHBcJ83SJtKVj9mVKY7K8OLd6OwYB0gH6g3XE_Cs"
                target="_blank"
                rel="noopener"
              >
                <img
                  class="cta-card__messenger-logo"
                  src="https://maxicons.ru/icons/Max_logo.svg"
                  alt=""
                  aria-hidden="true"
                  width="20"
                  height="20"
                  loading="lazy"
                />
                <span>Написать в MAX</span>
                <Icon name="mdi:arrow-right" size="18" class="cta-card__messenger-arrow" />
              </a>
            </div>
          </div>

          <ul class="cta-card__contacts">
            <li>
              <a href="tel:+79109096947">
                <Icon name="mdi:phone-outline" size="18" />
                <span>+7 (910) 909-69-47</span>
              </a>
            </li>
            <li>
              <a href="mailto:glavprofi@yandex.ru">
                <Icon name="mdi:email-outline" size="18" />
                <span>glavprofi@yandex.ru</span>
              </a>
            </li>
            <li>
              <Icon name="mdi:map-marker-outline" size="18" />
              <span>г. Рязань, Право-Лыбедская ул., 40</span>
            </li>
          </ul>

          <p class="cta-card__note">
            Расчет стоимости — в течение рабочего дня. Не является публичной офертой.
            <NuxtLink to="/requisites">Реквизиты компании</NuxtLink>
          </p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { trackCtaClick } from '~/composables/visitor/trackerCta'

const emit = defineEmits<{
  (e: 'open-contact', label: string): void
}>()

function requestContact() {
  // 📊 CTA → модальная форма заявки
  trackCtaClick('О компании — Связаться с нами', { target: 'О компании' })
  emit('open-contact', 'О компании — Связаться с нами')
}
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;
@use '@/assets/styles/mixins' as *;

.about-cta {
  @include section-padding;
  background: $background-light;
  color: $text-dark;
  scroll-margin-top: 80px;

  .container {
    @include section-container;
  }
}

.cta-card {
  position: relative;
  overflow: hidden;
  padding: 3rem 2.5rem;
  text-align: center;
  color: $text-light;
  background:
    linear-gradient(145deg, #202329 0%, #121417 65%, #0b0d10 100%);
  border: 1px solid rgba(0, 195, 245, 0.22);
  border-radius: 20px;
  box-shadow:
    0 24px 60px rgba(0, 0, 0, 0.28),
    0 0 0 1px rgba(255, 255, 255, 0.03) inset;
  isolation: isolate;

  &__glow {
    position: absolute;
    border-radius: 50%;
    filter: blur(90px);
    pointer-events: none;
    z-index: -1;

    &--one {
      top: -140px;
      left: -100px;
      width: 360px;
      height: 360px;
      background: radial-gradient(circle, rgba(0, 195, 245, 0.28), transparent 70%);
    }

    &--two {
      right: -120px;
      bottom: -160px;
      width: 340px;
      height: 340px;
      background: radial-gradient(circle, rgba(2, 254, 255, 0.12), transparent 70%);
    }
  }

  &__inner {
    position: relative;
    z-index: 1;
    max-width: 780px;
    margin: 0 auto;
  }

  &__badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.4rem 0.9rem;
    margin-bottom: 1.3rem;
    font-size: 0.8rem;
    font-weight: 500;
    color: rgba($text-light, 0.88);
    background: rgba(0, 195, 245, 0.08);
    border: 1px solid rgba(0, 195, 245, 0.28);
    border-radius: 100px;
  }

  &__dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: $blue;
    box-shadow: 0 0 0 4px rgba(0, 195, 245, 0.12);
    animation: ctaPulse 2s ease-in-out infinite;
  }

  &__title {
    @include section-title-centered;
    color: $text-light;

    .accent {
      background: $blue-gradient;
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
    }
  }

  &__subtitle {
    max-width: 620px;
    margin: 0 auto 2rem;
    font-size: 1.05rem;
    line-height: 1.65;
    color: rgba($text-light, 0.72);
  }

  &__actions {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    margin-bottom: 2rem;
  }

  &__messengers {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.75rem;
  }

  &__messenger {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.7rem 1.2rem;
    font-size: 0.95rem;
    font-weight: 500;
    color: rgba($text-light, 0.85);
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 100px;
    transition: all 0.3s ease;

    :deep(svg) {
      color: $blue;
      transition: transform 0.3s ease;
    }

    &-logo {
      display: block;
      width: 20px;
      height: 20px;
      flex-shrink: 0;
      transition: transform 0.3s ease;
    }

    &-arrow {
      opacity: 0.6;
      margin-left: 0.1rem;
    }

    &:hover {
      color: $text-light;
      background: rgba(0, 195, 245, 0.08);
      border-color: rgba(0, 195, 245, 0.5);
      transform: translateY(-2px);

      :deep(svg):first-child,
      .cta-card__messenger-logo {
        transform: scale(1.1);
      }

      .cta-card__messenger-arrow {
        opacity: 1;
        transform: translateX(3px);
      }
    }
  }

  &__contacts {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.7rem 1.6rem;
    margin: 0 0 1.6rem;
    padding: 1.2rem 0 0;
    list-style: none;
    border-top: 1px solid rgba(255, 255, 255, 0.08);

    li {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      font-size: 0.9rem;
      color: rgba($text-light, 0.78);

      :deep(svg) {
        color: $blue;
        flex-shrink: 0;
      }
    }

    a {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      color: inherit;
      transition: color 0.25s ease;

      &:hover {
        color: $blue-light;
      }
    }
  }

  &__note {
    margin: 0;
    font-size: 0.78rem;
    line-height: 1.5;
    color: rgba($text-light, 0.42);

    a {
      color: rgba($text-light, 0.62);
      text-decoration: underline;
      text-underline-offset: 3px;

      &:hover {
        color: $blue-light;
      }
    }
  }
}

@keyframes ctaPulse {
  0%, 100% {
    box-shadow: 0 0 0 4px rgba(0, 195, 245, 0.12);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(0, 195, 245, 0.04);
  }
}

@media (max-width: 768px) {
  .about-cta {
    padding-top: 3.5rem;
    padding-bottom: 3.5rem;
  }

  .cta-card {
    padding: 2rem 1.25rem;

    &__glow {
      &--one { width: 260px; height: 260px; }
      &--two { width: 240px; height: 240px; }
    }

    &__subtitle {
      font-size: 0.98rem;
      margin-bottom: 1.6rem;
    }

    &__messengers {
      width: 100%;
    }

    &__messenger {
      justify-content: center;
    }

    &__contacts {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.7rem;
      text-align: left;
    }

    &__note {
      text-align: left;
    }
  }
}
</style>

<!-- app/components/pages/public/about/blocks/Works.vue -->
<template>
  <section id="about-works" class="about-works">
    <div class="container">
      <header class="about-section__header">
        <span class="about-section__badge">
          <Icon name="mdi:hammer-screwdriver" size="14" />
          <span>Виды работ</span>
        </span>

        <h2 class="about-section__title">
          Какие виды работ <span class="accent">мы проводим?</span>
        </h2>

        <p class="about-section__subtitle">
          Мы предлагаем:
        </p>
      </header>

      <div class="works-grid">
        <article
          v-for="item in works"
          :key="item.title"
          class="work-card"
        >
          <span class="work-card__icon">
            <Icon :name="item.icon" size="26" />
          </span>

          <h3 class="work-card__title">{{ item.title }}</h3>
          <p class="work-card__desc">{{ item.description }}</p>

          <div v-if="item.links.length" class="work-card__links">
            <NuxtLink
              v-for="link in item.links"
              :key="link.to"
              :to="link.to"
              class="work-card__link"
            >
              <span>{{ link.label }}</span>
              <Icon name="mdi:arrow-right" size="14" />
            </NuxtLink>
          </div>
        </article>
      </div>

      <div class="works-summary">
        <div class="works-summary__text">
          <Icon name="mdi:check-decagram-outline" size="24" class="works-summary__icon" />
          <p>
            <b>Полный комплекс услуг</b>: от разработки проекта до финишной отделки.
            Мы берем на себя все этапы работ!
          </p>
        </div>

        <UiButtonsPrimary variant="outline" @click="openPriceList">
          Смотреть прайс-лист
        </UiButtonsPrimary>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { trackCtaClick } from '~/composables/visitor/trackerCta'

interface WorkLink {
  label: string
  to: string
}

interface WorkCard {
  title: string
  description: string
  icon: string
  links: WorkLink[]
}

const works: WorkCard[] = [
  {
    title: 'Косметический и капитальный ремонт',
    description: 'От обновления отделки до полной реконструкции помещения.',
    icon: 'mdi:hammer-screwdriver',
    links: [{ label: 'Ремонт помещений', to: '/remont-pomescheniy' }],
  },
  {
    title: 'Отделочные работы всех типов',
    description: 'Стены, потолки, полы и финишные покрытия.',
    icon: 'mdi:format-paint',
    links: [{ label: 'Прайс на отделку', to: '/prices/otdelochnye-raboty' }],
  },
  {
    title: 'Монтаж инженерных коммуникаций',
    description: 'Электрика, водоснабжение и вентиляция.',
    icon: 'mdi:pipe-valve',
    links: [
      { label: 'Электромонтаж', to: '/prices/electricity' },
      { label: 'Сантехника', to: '/prices/plumbing' },
    ],
  },
  {
    title: 'Перегородки, двери, стеклянные конструкции',
    description: 'ГКЛ-перегородки, дверные группы и стеклянные элементы.',
    icon: 'mdi:door-sliding',
    links: [{ label: 'Перегородки ГКЛ', to: '/vidy-rabot/peregorodki-gkl' }],
  },
  {
    title: 'Покраска, укладка плитки, паркетных полов',
    description: 'Финишные покрытия для коммерческих помещений.',
    icon: 'mdi:format-color-fill',
    links: [{ label: 'Укладка плитки', to: '/vidy-rabot/ukladka-plitki' }],
  },
  {
    title: 'Сантехнические работы',
    description: 'Монтаж и замена труб, установка санфаянса.',
    icon: 'mdi:water-pump',
    links: [{ label: 'Сантехнический прайс', to: '/prices/plumbing' }],
  },
  {
    title: 'Декоративные работы и сложные дизайнерские решения',
    description: 'Декоративные покрытия и нестандартные решения.',
    icon: 'mdi:palette-outline',
    links: [{ label: 'Облицовка ГКЛ', to: '/vidy-rabot/oblitsovka-gkl' }],
  },
  {
    title: 'И другие работы',
    description: 'Под задачи вашего объекта и требования проекта.',
    icon: 'mdi:plus-circle-outline',
    links: [{ label: 'Все работы', to: '/prices/otdelochnye-raboty' }],
  },
]

function openPriceList() {
  // 📊 Навигационный CTA
  trackCtaClick('О компании — Прайс-лист', {
    target: 'О компании',
    href: '/prices/otdelochnye-raboty',
  })
  navigateTo('/prices/otdelochnye-raboty')
}
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;
@use '@/assets/styles/mixins' as *;

.about-works {
  @include section-padding;
  position: relative;
  overflow: hidden;
  background: $background-dark;
  color: $text-light;
  scroll-margin-top: 80px;

  .container {
    @include section-container;
  }
}

.about-section {
  &__header {
    max-width: 760px;
    margin-bottom: 2.5rem;
  }

  &__badge {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.4rem 0.85rem;
    margin-bottom: 1rem;
    font-size: 0.78rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: $blue;
    background: rgba(0, 195, 245, 0.08);
    border: 1px solid rgba(0, 195, 245, 0.22);
    border-radius: 100px;
  }

  &__title {
    @include section-title;
    color: $text-light;

    .accent {
      background: $blue-gradient;
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
    }
  }

  &__subtitle {
    @include section-subtitle;
    margin-bottom: 0;
    color: rgba($text-light, 0.68);
  }
}

.works-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;

  @media (max-width: 1200px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  @media (max-width: 992px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
}

.work-card {
  @include dark-card;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  padding: 1.5rem 1.35rem 1.35rem;

  &__icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    margin-bottom: 0.35rem;
    color: $blue;
    background: rgba(0, 195, 245, 0.1);
    border: 1px solid rgba(0, 195, 245, 0.18);
    border-radius: 13px;
    transition: all 0.35s ease;
  }

  &:hover &__icon {
    color: $blue-light;
    background: rgba(0, 195, 245, 0.16);
    border-color: rgba(0, 195, 245, 0.4);
    transform: rotate(-4deg) scale(1.05);
  }

  &__title {
    font-size: 1rem;
    font-weight: 600;
    line-height: 1.35;
    margin: 0;
    color: $text-light;
  }

  &__desc {
    flex: 1;
    font-size: 0.85rem;
    line-height: 1.5;
    margin: 0;
    color: rgba($text-light, 0.62);
  }

  &__links {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem 0.8rem;
    margin-top: 0.35rem;
  }

  &__link {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    font-size: 0.8rem;
    font-weight: 600;
    color: $blue;
    transition: all 0.3s ease;

    :deep(svg) {
      transition: transform 0.3s ease;
    }

    &:hover {
      color: $blue-light;

      :deep(svg) {
        transform: translateX(3px);
      }
    }
  }
}

.works-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.25rem;
  margin-top: 2rem;
  padding: 1.25rem 1.4rem;
  background: rgba(0, 195, 245, 0.06);
  border: 1px solid rgba(0, 195, 245, 0.2);
  border-left: 4px solid $blue;
  border-radius: $border-radius;

  &__text {
    display: flex;
    align-items: flex-start;
    gap: 0.8rem;
  }

  &__icon {
    flex-shrink: 0;
    color: $blue;
    margin-top: 2px;
  }

  p {
    margin: 0;
    font-size: 0.98rem;
    line-height: 1.6;
    color: rgba($text-light, 0.82);

    b {
      color: $blue-light;
      font-weight: 600;
    }
  }

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (max-width: 768px) {
  .about-works {
    padding-top: 3.5rem;
    padding-bottom: 3.5rem;
  }

  .about-section {
    &__header {
      margin-bottom: 1.75rem;
    }
  }

  .work-card {
    padding: 1.25rem 1.2rem;

    &__icon {
      width: 44px;
      height: 44px;
    }
  }

  .works-summary {
    margin-top: 1.5rem;
    padding: 1.1rem 1.15rem;
  }
}
</style>

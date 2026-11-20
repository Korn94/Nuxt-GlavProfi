<!-- app/components/pages/public/about/blocks/Objects.vue -->
<template>
  <section id="about-objects" class="about-objects">
    <div class="container">
      <header class="about-section__header">
        <span class="about-section__badge">
          <Icon name="mdi:office-building-outline" size="14" />
          <span>Типы объектов</span>
        </span>

        <h2 class="about-section__title">
          С какими объектами <span class="accent">мы работаем?</span>
        </h2>

        <p class="about-section__subtitle">
          Мы выполняем ремонт и отделку:
        </p>
      </header>

      <div class="objects-grid">
        <NuxtLink
          v-for="item in objects"
          :key="item.title"
          :to="item.to"
          class="object-card"
        >
          <span class="object-card__icon">
            <Icon :name="item.icon" size="26" />
          </span>

          <h3 class="object-card__title">{{ item.title }}</h3>
          <p class="object-card__desc">{{ item.description }}</p>

          <span class="object-card__more">
            <span>Подробнее</span>
            <Icon name="mdi:arrow-right" size="16" />
          </span>
        </NuxtLink>
      </div>

      <div class="about-summary">
        <Icon name="mdi:check-decagram-outline" size="24" class="about-summary__icon" />
        <p>
          Готовы взяться за <b>любой коммерческий объект</b>.
        </p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
interface ObjectCard {
  title: string
  description: string
  icon: string
  to: string
}

const objects: ObjectCard[] = [
  {
    title: 'Офисы',
    description: 'Кабинеты, open-space, переговорные и зоны ресепшн.',
    icon: 'mdi:office-building-outline',
    to: '/remont-pomescheniy/ofisy',
  },
  {
    title: 'Магазины и торговые точки',
    description: 'Торговые залы, витрины, стрит-ритейл.',
    icon: 'mdi:storefront-outline',
    to: '/remont-pomescheniy/magaziny',
  },
  {
    title: 'Рестораны, кафе и бары',
    description: 'Залы, кухни, барные зоны и инженерные системы.',
    icon: 'mdi:silverware-fork-knife',
    to: '/remont-pomescheniy',
  },
  {
    title: 'Салоны красоты, барбершопы и спа-центры',
    description: 'Клиентские зоны, кабинеты и мокрые зоны.',
    icon: 'mdi:scissors-cutting',
    to: '/remont-pomescheniy/salony',
  },
  {
    title: 'Склады',
    description: 'Складские и логистические помещения.',
    icon: 'mdi:warehouse',
    to: '/remont-pomescheniy/sklady',
  },
  {
    title: 'Производственные помещения',
    description: 'Цеха, производственные участки и инженерные системы.',
    icon: 'mdi:factory',
    to: '/remont-pomescheniy/proizvodstvo',
  },
  {
    title: 'Спортивные залы и фитнес-клубы',
    description: 'Тренажёрные залы, раздевалки и душевые.',
    icon: 'mdi:dumbbell',
    to: '/remont-pomescheniy/fitness',
  },
  {
    title: 'Медицинские центры, аптеки и лаборатории',
    description: 'Кабинеты, лаборатории и аптечные помещения.',
    icon: 'mdi:medical-bag',
    to: '/remont-pomescheniy/kliniki',
  },
  {
    title: 'Учебные центры и образовательные учреждения',
    description: 'Классы, аудитории и зоны ожидания.',
    icon: 'mdi:school-outline',
    to: '/remont-pomescheniy',
  },
  {
    title: 'Другие коммерческие объекты',
    description: 'Любые коммерческие помещения под ваши задачи.',
    icon: 'mdi:dots-horizontal-circle-outline',
    to: '/remont-pomescheniy',
  },
]
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;
@use '@/assets/styles/mixins' as *;

.about-objects {
  @include section-padding;
  background: $background-light;
  color: $text-dark;
  position: relative;
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
    color: $text-dark;

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
    color: $text-gray;
  }
}

.objects-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 1rem;

  @media (max-width: 1200px) {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  @media (max-width: 992px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.85rem;
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
}

.object-card {
  @include light-card;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  padding: 1.4rem 1.3rem 1.3rem;
  color: $text-dark;

  &:hover {
    color: $text-dark;

    .object-card__icon {
      color: $blue-light;
      background: $blue-gradient;
      border-color: transparent;
      transform: rotate(-4deg) scale(1.05);
    }

    .object-card__more {
      gap: 0.55rem;
      color: $blue;

      :deep(svg) {
        transform: translateX(4px);
      }
    }
  }

  &__icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    margin-bottom: 0.35rem;
    color: $blue;
    background: rgba(0, 195, 245, 0.1);
    border: 1px solid rgba(0, 195, 245, 0.2);
    border-radius: 13px;
    transition: all 0.35s ease;
  }

  &__title {
    font-size: 1rem;
    font-weight: 600;
    line-height: 1.35;
    margin: 0;
    color: $text-dark;
  }

  &__desc {
    flex: 1;
    font-size: 0.85rem;
    line-height: 1.5;
    margin: 0;
    color: $text-gray;
  }

  &__more {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    margin-top: 0.35rem;
    font-size: 0.82rem;
    font-weight: 600;
    color: $text-gray;
    transition: all 0.3s ease;

    :deep(svg) {
      transition: transform 0.3s ease;
    }
  }
}

.about-summary {
  display: flex;
  align-items: flex-start;
  gap: 0.85rem;
  margin-top: 2rem;
  padding: 1.15rem 1.35rem;
  background: rgba(0, 195, 245, 0.06);
  border: 1px solid rgba(0, 195, 245, 0.2);
  border-left: 4px solid $blue;
  border-radius: $border-radius;

  &__icon {
    flex-shrink: 0;
    color: $blue;
    margin-top: 2px;
  }

  p {
    font-size: 0.98rem;
    line-height: 1.6;
    margin: 0;
    color: $text-dark;

    b {
      color: $blue;
      font-weight: 600;
    }
  }
}

@media (max-width: 768px) {
  .about-objects {
    padding-top: 3.5rem;
    padding-bottom: 3.5rem;
  }

  .about-section {
    &__header {
      margin-bottom: 1.75rem;
    }
  }

  .object-card {
    padding: 1.2rem;

    &__icon {
      width: 44px;
      height: 44px;
    }
  }

  .about-summary {
    margin-top: 1.5rem;
    padding: 1rem 1.1rem;
  }
}
</style>

<!-- app/components/public/remont-pomescheniy/index/blocks/ServicesList.vue -->
<template>
  <section class="services-list">
    <div class="container">
      <h2 class="services-list__title">Основные виды работ</h2>
      <p class="services-list__subtitle">
        Выполняем по проекту или ТЗ
      </p>

      <div class="services-list__grid">
        <div
          v-for="(service, index) in services"
          :key="service.slug"
          class="services-list__item"
          :style="{ '--delay': index * 0.08 + 's' }"
        >
          <h3 class="services-list__item-title">{{ service.title }}</h3>
          <p class="services-list__item-desc">{{ service.description }}</p>
          <a :href="service.link" class="services-list__item-link">Подробнее →</a>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
// Данные храним в компоненте (без composables, как договорились)
const services = [
  {
    slug: 'peregorodki',
    title: 'Перегородки и стены',
    description: 'Монтаж ГКЛ, пазогребневых плит, кирпича, штукатурка, шпаклёвка.',
    link: '/vidy-rabot/peregorodki'
  },
  {
    slug: 'poly',
    title: 'Полы и стяжка',
    description: 'Полусухая и мокрая стяжка, наливные полы, укладка плитки, керамогранита, ламината.',
    link: '/vidy-rabot/poly'
  },
  {
    slug: 'elektrika',
    title: 'Электромонтаж',
    description: 'Прокладка кабелей, сборка электрощитов, установка розеток, выключателей, светильников.',
    link: '/vidy-rabot/elektrika'
  },
  {
    slug: 'santehnika',
    title: 'Сантехника и водоснабжение',
    description: 'Разводка труб, установка сантехприборов, водонагревателей, систем фильтрации.',
    link: '/vidy-rabot/santehnika'
  },
  {
    slug: 'potolki',
    title: 'Потолки и подвесные системы',
    description: 'Потолки из ГКЛ, Армстронг, реечные, покраска, монтаж светильников.',
    link: '/vidy-rabot/potolki'
  },
  {
    slug: 'demontazh',
    title: 'Демонтаж и подготовка оснований',
    description: 'Снос перегородок, снятие покрытий, штробление, вывоз мусора, выравнивание оснований.',
    link: '/vidy-rabot/demontazh'
  },
  {
    slug: 'prom-poly',
    title: 'Промышленные полы',
    description: 'Топпинг, наливные полы, полимерные покрытия, бетонные полы с упрочнением.',
    link: '/vidy-rabot/prom-poly'
  }
]
</script>

<style scoped lang="scss">
@use '@/assets/styles/variables' as *;
@use '@/assets/styles/mixins' as *;

// === Переменные для светлой темы ===
$services-bg: $background-light;
$services-text: $text-dark;
$services-text-secondary: $text-gray;
$services-accent: $blue;
$services-card-bg: #fff;
$services-card-border: rgba(0, 0, 0, 0.08);
$services-card-hover-border: $blue;
$services-card-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
$services-card-hover-shadow: 0 12px 28px rgba(0, 0, 0, 0.12);

.services-list {
  padding: 4rem 0;
  background: $services-bg;
  position: relative;

  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 2rem;
    position: relative;
    z-index: 1;
  }

  // === Заголовок ===
  &__title {
    font-family: 'Rubik', sans-serif;
    font-size: 2rem;
    font-weight: 700;
    color: $services-text;
    margin-bottom: 1rem;
    position: relative;
    padding-bottom: 0.8rem;

    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      width: 60px;
      height: 3px;
      background: $blue-gradient;
      border-radius: 2px;
      box-shadow: 0 0 10px rgba(0, 195, 245, 0.3);
    }
  }

  &__subtitle {
    font-size: 1.1rem;
    color: $services-text-secondary;
    margin-bottom: 2.5rem;
    line-height: 1.6;
    max-width: 600px;
  }

  // === Сетка услуг ===
  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
    gap: 1.5rem;
  }

  // === Карточка услуги ===
  &__item {
    background: $services-card-bg;
    border: 1px solid $services-card-border;
    border-radius: $border-radius;
    padding: 1.8rem;
    display: flex;
    flex-direction: column;
    gap: 0.9rem;
    transition: all 0.35s ease;
    
    // Анимация появления
    opacity: 0;
    transform: translateY(20px);
    animation: fadeInUp 0.6s var(--delay, 0s) ease forwards;

    &:hover {
      transform: translateY(-6px);
      box-shadow: $services-card-hover-shadow;
      border-color: $services-card-hover-border;
    }
  }

  &__item-title {
    font-size: 1.2rem;
    font-weight: 600;
    color: $services-text;
    margin: 0;
    line-height: 1.3;
  }

  &__item-desc {
    font-size: 0.95rem;
    line-height: 1.6;
    color: $services-text-secondary;
    margin: 0;
    flex-grow: 1;
  }

  &__item-link {
    color: $services-accent;
    font-weight: 500;
    font-size: 0.95rem;
    transition: color 0.3s ease;
    text-decoration: none;
    align-self: flex-start;
    margin-top: auto;

    &:hover {
      color: $blue-light;
    }
  }
}

// === Анимация ===
@keyframes fadeInUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// === Адаптив ===
@media (max-width: 768px) {
  .services-list {
    padding: 3rem 0;

    &__title {
      font-size: 1.6rem;
    }

    &__subtitle {
      font-size: 1rem;
    }

    &__grid {
      grid-template-columns: 1fr;
    }

    &__item {
      padding: 1.4rem;
    }
  }
}
</style>
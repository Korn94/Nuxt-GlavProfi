<!-- app/components/pages/public/remontPomescheniy/blocks/WorksGrid.vue -->
<template>
  <section class="works-grid">
    <div class="container">
      <h2 class="works-grid__title">Виды отделочных работ</h2>
      <p class="works-grid__subtitle">
        Полный цикл ремонта: от перегородок до финишной отделки. Нажмите на карточку для перехода к основной услуге.
      </p>

      <!-- Панель управления: табы + переключатель вида -->
      <div class="works-grid__controls">
        <div class="works-grid__tabs-wrapper">
          <div class="works-grid__tabs">
            <button 
              v-for="tab in tabs" 
              :key="tab.key"
              :class="['works-grid__tab', { active: activeTab === tab.key }]" 
              @click="setTab(tab.key)"
            >
              {{ tab.label }}
            </button>
          </div>
        </div>

        <!-- Кнопка переключения вида -->
        <button 
          class="works-grid__view-toggle" 
          @click="toggleView"
          :title="viewMode === 'list' ? 'Показать сеткой' : 'Показать списком'"
        >
          <Icon v-if="viewMode === 'list'" name="mdi:format-list-bulleted" size="16" />
          <Icon v-else name="mdi:view-grid-outline" size="16" />
          <span class="works-grid__view-toggle-text">
            {{ viewMode === 'list' ? 'Список' : 'Сетка' }}
          </span>
        </button>
      </div>

      <!-- Сетка работ -->
      <div :class="['works-grid__list', `works-grid__list--${viewMode}`]">
        <template v-for="work in visibleItems" :key="work.slug">
          <!-- Карточка работы (NuxtLink на первую страницу группы) -->
          <NuxtLink
            :to="work.firstPageUrl"
            :class="['works-grid__card', { 'item-visible': animatedSlugs.has(work.slug) }]"
            @click="handleCardClick(work)"
          >
            <!-- Изображение -->
            <div class="works-grid__card-image">
              <img 
                :src="work.image" 
                :alt="work.title" 
                loading="lazy" 
                class="works-grid__img"
              >
              <div class="works-grid__card-overlay">
                <h3 class="works-grid__card-title">{{ work.title }}</h3>
                <span class="works-grid__card-count">{{ work.links.length }} услуг</span>
              </div>
            </div>

            <!-- Контент карточки -->
            <div class="works-grid__card-body">
              <p class="works-grid__card-desc">{{ work.description }}</p>

              <!-- Кнопки на конкретные страницы -->
              <div class="works-grid__card-links" @click.stop>
                <NuxtLink
                  v-for="link in work.links"
                  :key="link.url"
                  :to="link.url"
                  class="works-grid__card-link"
                  :title="link.title"
                >
                  {{ link.title }}
                </NuxtLink>
              </div>
            </div>
          </NuxtLink>
        </template>
      </div>

      <!-- Кнопка "Показать ещё" (только мобильные) -->
      <div v-if="canShowMore" class="works-grid__footer">
        <UiButtonsPrimary 
          text="Показать ещё" 
          variant="outline" 
          @click="showAllItems" 
        />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useGridControls } from '../../composables/useGridControls'

// Табы для фильтрации работ
const workTabs = [
  { key: 'all', label: 'Все работы' },
  { key: 'walls', label: 'Стены' },
  { key: 'floors', label: 'Полы' },
  { key: 'ceilings', label: 'Потолки' },
  { key: 'finish', label: 'Отделка' }
]

// Данные работ (9 групп) - обновленный порядок
const works = [
  {
    slug: 'peregorodki',
    title: 'Перегородки',
    category: 'walls',
    description: 'Монтаж межкомнатных перегородок из ГКЛ, кирпича, блоков, ПГП',
    image: '/main/remont-pomescheniy/medicina.webp',
    firstPageUrl: '/vidy-rabot/peregorodki-gkl',
    links: [
      { title: 'ГКЛ', url: '/vidy-rabot/peregorodki-gkl' },
      { title: 'Кирпич', url: '/vidy-rabot/peregorodki-kirpich' },
      { title: 'ПГП', url: '/vidy-rabot/peregorodki-pgp' },
      { title: 'Блоки', url: '/peregorodki-bloki' },
      { title: 'Звукоизоляция', url: '/vidy-rabot/zvukoizolyatsiya-peregorodok' }
    ]
  },
  {
    slug: 'oblitsovka',
    title: 'Облицовка стен',
    category: 'walls',
    description: 'Обшивка стен ГКЛ, стеновые панели, зеркала, короба',
    image: '/main/remont-pomescheniy/banki.webp',
    firstPageUrl: '/vidy-rabot/oblitsovka-gkl',
    links: [
      { title: 'ГКЛ', url: '/vidy-rabot/oblitsovka-gkl' },
      { title: 'Панели', url: '/vidy-rabot/stenovye-paneli' },
      { title: 'Зеркала', url: '/vidy-rabot/zerkalnye-paneli' },
      { title: 'Короба', url: '/vidy-rabot/koroba-gkl' },
      { title: 'Декоративные', url: '/vidy-rabot/dekorativnye-paneli' },
      { title: 'Ламинат', url: '/vidy-rabot/oblitsovka-laminatom' }
    ]
  },
  {
    slug: 'pols',
    title: 'Стяжка и выравнивание полов',
    category: 'floors',
    description: 'Стяжка, наливные полы, гидроизоляция, промышленные покрытия',
    image: '/main/remont-pomescheniy/sklady.webp',
    firstPageUrl: '/vidy-rabot/styazhka-pola',
    links: [
      { title: 'Стяжка', url: '/vidy-rabot/styazhka-pola' },
      { title: 'Наливные', url: '/vidy-rabot/nalivnye-poly' },
      { title: 'Промышленные', url: '/vidy-rabot/promyshlennye-poly' },
      { title: 'Гидроизоляция', url: '/vidy-rabot/gidroizolyatsiya-polov' },
      { title: 'Теплоизоляция', url: '/vidy-rabot/teploizolyatsiya-polov' },
      { title: 'Ремонт', url: '/vidy-rabot/remont-osnovaniy' }
    ]
  },
  {
    slug: 'plitka',
    title: 'Плиточные работы',
    category: 'floors',
    description: 'Укладка плитки, керамогранита, мозаики, затирка швов',
    image: '/main/vidy-rabot/plitka.jpg',
    firstPageUrl: '/vidy-rabot/ukladka-plitki',
    links: [
      { title: 'Плитка', url: '/vidy-rabot/ukladka-plitki' },
      { title: 'Керамогранит', url: '/vidy-rabot/ukladka-keramogranita' },
      { title: 'Настенная', url: '/vidy-rabot/ukladka-nastennoy-plitki' },
      { title: 'Напольная', url: '/vidy-rabot/ukladka-napolnoy-plitki' },
      { title: 'Крупноформат', url: '/vidy-rabot/ukladka-krupnoformatnoy-plitki' },
      { title: 'Лестницы', url: '/vidy-rabot/ukladka-plitki-lestnitsy' },
      { title: 'Затирка', url: '/vidy-rabot/zatirka-shvov-plitki' }
    ]
  },
  {
    slug: 'shtukaturka',
    title: 'Штукатурные работы',
    category: 'walls',
    description: 'Штукатурка стен, потолков, откосов, декоративная штукатурка',
    image: '/main/remont-pomescheniy/salony.webp',
    firstPageUrl: '/vidy-rabot/shtukaturka-sten',
    links: [
      { title: 'Стены', url: '/vidy-rabot/shtukaturka-sten' },
      { title: 'Потолки', url: '/vidy-rabot/shtukaturka-potolkov' },
      { title: 'Откосы', url: '/vidy-rabot/shtukaturka-otkosov' },
      { title: 'Декоративная', url: '/vidy-rabot/dekorativnaya-shtukaturka' },
      { title: 'Армирование', url: '/vidy-rabot/armirovanie-shtukaturki' }
    ]
  },
  {
    slug: 'shpaklevka',
    title: 'Шпаклёвка и подготовка',
    category: 'walls',
    description: 'Шпаклёвка стен и потолков, шлифовка, грунтовка',
    image: '/main/vidy-rabot/shpaklevka.jpg',
    firstPageUrl: '/vidy-rabot/shpaklevka-sten',
    links: [
      { title: 'Стены', url: '/vidy-rabot/shpaklevka-sten' },
      { title: 'Потолки', url: '/vidy-rabot/shpaklevka-potolkov' },
      { title: 'Откосы', url: '/vidy-rabot/shpaklevka-otkosov' },
      { title: 'Шлифовка', url: '/vidy-rabot/shlifovka-sten' },
      { title: 'Грунтовка', url: '/vidy-rabot/gruntovka-sten' }
    ]
  },
  {
    slug: 'potolki',
    title: 'Потолки',
    category: 'ceilings',
    description: 'Подвесные потолки: Армстронг, Грильято, ГКЛ, реечные',
    image: '/main/vidy-rabot/potolki.jpg',
    firstPageUrl: '/vidy-rabot/potolki-armstrong',
    links: [
      { title: 'Армстронг', url: '/vidy-rabot/potolki-armstrong' },
      { title: 'Реечные', url: '/vidy-rabot/potolki-reechnye' },
      { title: 'ГКЛ', url: '/vidy-rabot/potolki-gkl' },
      { title: 'Грильято', url: '/vidy-rabot/potolki-grilyato' },
      { title: 'Покраска', url: '/vidy-rabot/pokraska-potolkov' },
      { title: 'Светильники', url: '/vidy-rabot/montazh-svetilnikov' }
    ]
  },
  {
    slug: 'pols-pokrytiya',
    title: 'Напольные покрытия',
    category: 'floors',
    description: 'Ламинат, линолеум, ковролин, ПВХ, паркетная доска, плинтуса',
    image: '/main/vidy-rabot/poly-pokrytiya.jpg',
    firstPageUrl: '/vidy-rabot/ukladka-laminata',
    links: [
      { title: 'Ламинат', url: '/vidy-rabot/ukladka-laminata' },
      { title: 'Линолеум', url: '/vidy-rabot/ukladka-linoleuma' },
      { title: 'Ковролин', url: '/vidy-rabot/ukladka-kovrolina' },
      { title: 'ПВХ/SPC', url: '/vidy-rabot/ukladka-pvh-pokrytiy' },
      { title: 'Паркет', url: '/vidy-rabot/ukladka-parketnoy-doski' },
      { title: 'Деревянные', url: '/vidy-rabot/derevyannye-poly' },
      { title: 'Плинтуса', url: '/vidy-rabot/montazh-plintusov' }
    ]
  },
  {
    slug: 'otdelka',
    title: 'Финишная отделка',
    category: 'finish',
    description: 'Покраска стен, обои, декоративная штукатурка, жидкие обои',
    image: '/main/vidy-rabot/finish.jpg',
    firstPageUrl: '/pokraska-sten',
    links: [
      { title: 'Покраска', url: '/vidy-rabot/pokraska-sten' },
      { title: 'Обои', url: '/vidy-rabot/pokleyka-oboev' },
      { title: 'Декоративная', url: '/vidy-rabot/dekorativnaya-otdelka' },
      { title: 'Жидкие обои', url: '/vidy-rabot/zhidkie-oboi' }
    ]
  }
]

// Используем composable для управления гридом
const {
  activeTab,
  viewMode,
  showAll,
  animatedSlugs,
  filteredItems,
  visibleItems,
  canShowMore,
  setTab,
  toggleView,
  showAllItems,
  tabs
} = useGridControls(() => works, workTabs)

// Обработчик клика по карточке (можно добавить аналитику)
const handleCardClick = (work: any) => {
  console.log('Work card clicked:', work.slug)
  // Здесь можно добавить событие аналитики
}
</script>

<style scoped lang="scss">
@use '@/assets/styles/variables' as *;

.works-grid {
  padding: 4rem 0;
  background: $background-light; // Светлый фон

  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 2rem;
  }

  &__title {
    font-family: 'Rubik', sans-serif;
    font-size: 2rem;
    font-weight: 700;
    color: $text-dark; // Тёмный текст на светлом фоне
    margin-bottom: 0.5rem;
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
    }
  }

  &__subtitle {
    color: $text-secondary;
    font-size: 1rem;
    margin-bottom: 2rem;
    max-width: 600px;
  }

  // === Панель управления ===
  &__controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1.5rem;
    margin-bottom: 2.5rem;
    flex-wrap: wrap;
  }

  &__tabs-wrapper {
    flex: 1;
    min-width: 0;
    max-width: 100%;
    overflow-x: auto;
    scrollbar-width: none;
    -webkit-overflow-scrolling: touch;
    &::-webkit-scrollbar { display: none; }
  }

  &__tabs {
    display: flex;
    gap: 0.75rem;
    min-width: max-content;
  }

  &__tab {
    background: transparent;
    border: 1px solid $border-color;
    color: $text-secondary;
    padding: 0.6rem 1.4rem;
    border-radius: var(--border-radius, 6px);
    font-family: 'Rubik', sans-serif;
    font-weight: 500;
    font-size: 0.95rem;
    cursor: pointer;
    transition: all 0.3s ease;
    white-space: nowrap;

    &:hover {
      border-color: $blue;
      color: $blue;
    }

    &.active {
      background: $blue-gradient;
      border-color: transparent;
      color: #fff;
      font-weight: 600;
    }
  }

  &__view-toggle {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    background: transparent;
    border: 1px solid $border-color;
    color: $text-secondary;
    padding: 0.6rem 1.4rem;
    border-radius: var(--border-radius, 6px);
    font-family: 'Rubik', sans-serif;
    font-weight: 500;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.3s ease;
    white-space: nowrap;

    &:hover {
      background: rgba(0, 195, 245, 0.05);
      border-color: $blue;
      color: $blue;
    }

    &-text {
      @media (max-width: 480px) { display: none; }
    }
  }

  // === Сетка работ ===
  &__list {
    &--grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1.5rem;
    }

    &--list {
      display: flex;
      flex-direction: column;
      gap: 1.2rem;
    }
  }

  &__card {
    background: #fff;
    border: 1px solid $border-color;
    border-radius: $border-radius;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    transition: all 0.35s ease;
    opacity: 0;
    transform: translateY(20px);
    text-decoration: none;
    color: inherit;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

    &.item-visible {
      opacity: 1;
      transform: translateY(0);
      transition: opacity 0.5s ease, transform 0.5s ease;
    }

    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 24px rgba(0, 0, 0, 0.08);
      border-color: $blue;
    }

    &:hover &__img {
      transform: scale(1.05);
    }

    // Режим списка
    .works-grid__list--list & {
      flex-direction: row;
      align-items: stretch;

      @media (max-width: 768px) {
        flex-direction: column;
      }
    }
  }

  &__card-image {
    position: relative;
    width: 100%;
    aspect-ratio: 16 / 9;
    overflow: hidden;
    background: #f5f5f5;

    .works-grid__list--list & {
      width: 200px;
      aspect-ratio: auto;
      height: auto;

      @media (max-width: 768px) {
        width: 100%;
        aspect-ratio: 16 / 9;
      }
    }
  }

  &__img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.4s ease;
  }

  &__card-overlay {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 1rem;
    background: linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%);
  }

  &__card-title {
    font-size: 1.15rem;
    font-weight: 600;
    color: #fff;
    margin: 0 0 0.2rem;
    line-height: 1.3;
  }

  &__card-count {
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.8);
  }

  &__card-body {
    padding: 1.2rem;
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
    flex: 1;
  }

  &__card-desc {
    font-size: 0.9rem;
    line-height: 1.5;
    color: $text-secondary;
    margin: 0;
  }

  // === Кнопки на конкретные страницы ===
  &__card-links {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: auto;
    padding-top: 0.8rem;
    border-top: 1px solid $border-color;
  }

  &__card-links {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: auto;
    padding-top: 0.8rem;
    border-top: 1px solid $border-color;
  }

  &__card-link {
    display: inline-flex;
    align-items: center;
    padding: 0.4rem 0.8rem;
    background: rgba(0, 195, 245, 0.05);
    border: 1px solid rgba(0, 195, 245, 0.2);
    border-radius: 4px;
    font-size: 0.85rem;
    font-weight: 500;
    color: $blue;
    text-decoration: none;
    transition: all 0.2s ease;
    white-space: nowrap;

    &:hover {
      background: $blue;
      border-color: $blue;
      color: #fff;
    }
  }

  &__footer {
    display: flex;
    justify-content: center;
    padding-top: 2rem;
  }
}

@media (max-width: 768px) {
  .works-grid {
    padding: 3rem 0;

    &__title { font-size: 1.6rem; }
    &__list--grid { grid-template-columns: 1fr; }
    
    &__controls {
      flex-direction: column;
      align-items: stretch;
      gap: 1rem;
    }

    &__card-image {
      .works-grid__list--list & {
        width: 100%;
        aspect-ratio: 16 / 9;
      }
    }
  }
}
</style>
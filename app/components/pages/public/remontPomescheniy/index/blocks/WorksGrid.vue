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

          <!-- ==================== КАРТОЧКА, ЕСЛИ ЕСТЬ ХОТЬ ОДНА ГОТОВАЯ СТРАНИЦА ==================== -->
          <NuxtLink
            v-if="hasReadyLinks(work)"
            :to="firstReadyUrl(work)"
            :class="[
              'works-grid__card',
              'is-clickable',
              { 'item-visible': animatedSlugs.has(work.slug) },
            ]"
            @click="handleCardClick(work)"
          >
            <div class="works-grid__card-image">
              <img :src="work.image" :alt="work.title" loading="lazy" class="works-grid__img">
              <div class="works-grid__card-overlay">
                <h3 class="works-grid__card-title">{{ work.title }}</h3>
                <span class="works-grid__card-count">{{ work.links.length }} услуг</span>
              </div>
            </div>

            <div class="works-grid__card-body">
              <p class="works-grid__card-desc">{{ work.description }}</p>

              <div class="works-grid__card-links" @click.stop>
                <template v-for="link in work.links" :key="link.url">
                  <!-- ✅ Готовая ссылка -->
                  <NuxtLink
                    v-if="link.isReady"
                    :to="link.url"
                    class="works-grid__card-link"
                    :title="link.title"
                  >
                    {{ link.title }}
                  </NuxtLink>
                  <!-- ❌ Неготовая ссылка -->
                  <span
                    v-else
                    class="works-grid__card-link works-grid__card-link--disabled"
                    :title="`${link.title} — в разработке`"
                  >
                    <Icon name="mdi:link-off" size="13" />
                    {{ link.title }}
                  </span>
                </template>
              </div>
            </div>
          </NuxtLink>

          <!-- ==================== КАРТОЧКА БЕЗ ГОТОВЫХ СТРАНИЦ ==================== -->
          <div
            v-else
            :class="[
              'works-grid__card',
              'works-grid__card--disabled',
              { 'item-visible': animatedSlugs.has(work.slug) },
            ]"
          >
            <div class="works-grid__card-image">
              <img :src="work.image" :alt="work.title" loading="lazy" class="works-grid__img">
              <div class="works-grid__card-overlay">
                <h3 class="works-grid__card-title">{{ work.title }}</h3>
                <span class="works-grid__card-count">{{ work.links.length }} услуг</span>
              </div>
            </div>

            <div class="works-grid__card-body">
              <p class="works-grid__card-desc">{{ work.description }}</p>

              <div class="works-grid__card-links">
                <span class="works-grid__card-link works-grid__card-link--disabled">
                  <Icon name="mdi:link-off" size="13" />
                  Страницы в разработке
                </span>
              </div>
            </div>
          </div>

        </template>
      </div>

      <!-- Кнопка "Показать ещё" -->
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

const workTabs = [
  { key: 'all', label: 'Все работы' },
  { key: 'walls', label: 'Стены' },
  { key: 'floors', label: 'Полы' },
  { key: 'ceilings', label: 'Потолки' },
  { key: 'finish', label: 'Отделка' },
]

// Каждая ссылка внутри работы имеет свой флаг isReady
const works = [
  {
    slug: 'peregorodki',
    title: 'Перегородки',
    category: 'walls',
    description: 'Монтаж межкомнатных перегородок из ГКЛ, кирпича, блоков, ПГП',
    image: '/main/remont-pomescheniy/medicina.webp',
    links: [
      { title: 'ГКЛ', url: '/vidy-rabot/peregorodki-gkl', isReady: false },
      { title: 'Кирпич', url: '/vidy-rabot/peregorodki-kirpich', isReady: false },
      { title: 'ПГП', url: '/vidy-rabot/peregorodki-pgp', isReady: false },
      { title: 'Блоки', url: '/peregorodki-bloki', isReady: false },
      { title: 'Звукоизоляция', url: '/vidy-rabot/zvukoizolyatsiya-peregorodok', isReady: false },
    ],
  },
  {
    slug: 'oblitsovka',
    title: 'Облицовка стен',
    category: 'walls',
    description: 'Обшивка стен ГКЛ, стеновые панели, зеркала, короба',
    image: '/main/remont-pomescheniy/banki.webp',
    links: [
      { title: 'ГКЛ', url: '/vidy-rabot/oblitsovka-gkl', isReady: true },
      { title: 'Панели', url: '/vidy-rabot/stenovye-paneli', isReady: false },
      { title: 'Зеркала', url: '/vidy-rabot/zerkalnye-paneli', isReady: false },
      { title: 'Короба', url: '/vidy-rabot/koroba-gkl', isReady: false },
      { title: 'Декоративные', url: '/vidy-rabot/dekorativnye-paneli', isReady: false },
      { title: 'Ламинат', url: '/vidy-rabot/oblitsovka-laminatom', isReady: false },
    ],
  },
  {
    slug: 'pols',
    title: 'Стяжка и выравнивание полов',
    category: 'floors',
    description: 'Стяжка, наливные полы, гидроизоляция, промышленные покрытия',
    image: '/main/remont-pomescheniy/sklady.webp',
    links: [
      { title: 'Стяжка', url: '/vidy-rabot/styazhka-pola', isReady: false },
      { title: 'Наливные', url: '/vidy-rabot/nalivnye-poly', isReady: false },
      { title: 'Промышленные', url: '/vidy-rabot/promyshlennye-poly', isReady: false },
      { title: 'Гидроизоляция', url: '/vidy-rabot/gidroizolyatsiya-polov', isReady: false },
      { title: 'Теплоизоляция', url: '/vidy-rabot/teploizolyatsiya-polov', isReady: false },
      { title: 'Ремонт', url: '/vidy-rabot/remont-osnovaniy', isReady: false },
    ],
  },
  {
    slug: 'plitka',
    title: 'Плиточные работы',
    category: 'floors',
    description: 'Укладка плитки, керамогранита, мозаики, затирка швов',
    image: '/main/vidy-rabot/plitka.jpg',
    links: [
      { title: 'Плитка', url: '/vidy-rabot/ukladka-plitki', isReady: false },
      { title: 'Керамогранит', url: '/vidy-rabot/ukladka-keramogranita', isReady: false },
      { title: 'Настенная', url: '/vidy-rabot/ukladka-nastennoy-plitki', isReady: false },
      { title: 'Напольная', url: '/vidy-rabot/ukladka-napolnoy-plitki', isReady: false },
      { title: 'Крупноформат', url: '/vidy-rabot/ukladka-krupnoformatnoy-plitki', isReady: false },
      { title: 'Лестницы', url: '/vidy-rabot/ukladka-plitki-lestnitsy', isReady: false },
      { title: 'Затирка', url: '/vidy-rabot/zatirka-shvov-plitki', isReady: false },
    ],
  },
  {
    slug: 'shtukaturka',
    title: 'Штукатурные работы',
    category: 'walls',
    description: 'Штукатурка стен, потолков, откосов, декоративная штукатурка',
    image: '/main/remont-pomescheniy/salony.webp',
    links: [
      { title: 'Стены', url: '/vidy-rabot/shtukaturka-sten', isReady: false },
      { title: 'Потолки', url: '/vidy-rabot/shtukaturka-potolkov', isReady: false },
      { title: 'Откосы', url: '/vidy-rabot/shtukaturka-otkosov', isReady: false },
      { title: 'Декоративная', url: '/vidy-rabot/dekorativnaya-shtukaturka', isReady: false },
      { title: 'Армирование', url: '/vidy-rabot/armirovanie-shtukaturki', isReady: false },
    ],
  },
  {
    slug: 'shpaklevka',
    title: 'Шпаклёвка и подготовка',
    category: 'walls',
    description: 'Шпаклёвка стен и потолков, шлифовка, грунтовка',
    image: '/main/vidy-rabot/shpaklevka.jpg',
    links: [
      { title: 'Стены', url: '/vidy-rabot/shpaklevka-sten', isReady: false },
      { title: 'Потолки', url: '/vidy-rabot/shpaklevka-potolkov', isReady: false },
      { title: 'Откосы', url: '/vidy-rabot/shpaklevka-otkosov', isReady: false },
      { title: 'Шлифовка', url: '/vidy-rabot/shlifovka-sten', isReady: false },
      { title: 'Грунтовка', url: '/vidy-rabot/gruntovka-sten', isReady: false },
    ],
  },
  {
    slug: 'potolki',
    title: 'Потолки',
    category: 'ceilings',
    description: 'Подвесные потолки: Армстронг, Грильято, ГКЛ, реечные',
    image: '/main/vidy-rabot/potolki.jpg',
    links: [
      { title: 'Армстронг', url: '/vidy-rabot/potolki-armstrong', isReady: false },
      { title: 'Реечные', url: '/vidy-rabot/potolki-reechnye', isReady: false },
      { title: 'ГКЛ', url: '/vidy-rabot/potolki-gkl', isReady: false },
      { title: 'Грильято', url: '/vidy-rabot/potolki-grilyato', isReady: false },
      { title: 'Покраска', url: '/vidy-rabot/pokraska-potolkov', isReady: false },
      { title: 'Светильники', url: '/vidy-rabot/montazh-svetilnikov', isReady: false },
    ],
  },
  {
    slug: 'pols-pokrytiya',
    title: 'Напольные покрытия',
    category: 'floors',
    description: 'Ламинат, линолеум, ковролин, ПВХ, паркетная доска, плинтуса',
    image: '/main/vidy-rabot/poly-pokrytiya.jpg',
    links: [
      { title: 'Ламинат', url: '/vidy-rabot/ukladka-laminata', isReady: false },
      { title: 'Линолеум', url: '/vidy-rabot/ukladka-linoleuma', isReady: false },
      { title: 'Ковролин', url: '/vidy-rabot/ukladka-kovrolina', isReady: false },
      { title: 'ПВХ/SPC', url: '/vidy-rabot/ukladka-pvh-pokrytiy', isReady: false },
      { title: 'Паркет', url: '/vidy-rabot/ukladka-parketnoy-doski', isReady: false },
      { title: 'Деревянные', url: '/vidy-rabot/derevyannye-poly', isReady: false },
      { title: 'Плинтуса', url: '/vidy-rabot/montazh-plintusov', isReady: false },
    ],
  },
  {
    slug: 'otdelka',
    title: 'Финишная отделка',
    category: 'finish',
    description: 'Покраска стен, обои, декоративная штукатурка, жидкие обои',
    image: '/main/vidy-rabot/finish.jpg',
    links: [
      { title: 'Покраска', url: '/vidy-rabot/pokraska-sten', isReady: false },
      { title: 'Обои', url: '/vidy-rabot/pokleyka-oboev', isReady: false },
      { title: 'Декоративная', url: '/vidy-rabot/dekorativnaya-otdelka', isReady: false },
      { title: 'Жидкие обои', url: '/vidy-rabot/zhidkie-oboi', isReady: false },
    ],
  },
]

// === Вспомогательные функции для работы со ссылками ===

/** Проверка: есть ли в карточке хотя бы одна готовая ссылка */
const hasReadyLinks = (work: any): boolean => work.links.some((l: any) => l.isReady)

/** URL первой готовой ссылки — куда ведёт клик по карточке */
const firstReadyUrl = (work: any): string => {
  const first = work.links.find((l: any) => l.isReady)
  return first?.url ?? '#'
}

// === Composable ===
const {
  activeTab,
  viewMode,
  showAll,
  animatedSlugs,
  visibleItems,
  canShowMore,
  setTab,
  toggleView,
  showAllItems,
  tabs,
} = useGridControls(() => works, workTabs)

const handleCardClick = (work: any) => {
  console.log('Work card clicked:', work.slug)
}
</script>

<style scoped lang="scss">
@use '@/assets/styles/variables' as *;

.works-grid {
  padding: 4rem 0;
  background: $background-light;

  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 2rem;
  }

  &__title {
    font-family: 'Rubik', sans-serif;
    font-size: 2rem;
    font-weight: 700;
    color: $text-dark;
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

    &.is-clickable {
      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 12px 24px rgba(0, 0, 0, 0.08);
        border-color: $blue;
      }

      &:hover &__img {
        transform: scale(1.05);
      }
    }

    .works-grid__list--list & {
      flex-direction: row;
      align-items: stretch;

      @media (max-width: 768px) {
        flex-direction: column;
      }
    }

    &--disabled {
      opacity: 0.65;
      cursor: default;
      pointer-events: none;
      background: #fafafa;

      .works-grid__card-image img {
        filter: grayscale(0.4);
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
    background: linear-gradient(to top, rgba(0, 0, 0, 0.7) 0%, transparent 100%);
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
    color: rgba(255, 255, 255, 0.85);
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
    gap: 0.25rem;
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

    &--disabled {
      background: transparent;
      border-color: rgba($text-secondary, 0.25);
      color: rgba($text-secondary, 0.55);
      cursor: default;
      pointer-events: none;
      font-weight: 400;

      &:hover {
        background: transparent;
        border-color: rgba($text-secondary, 0.25);
        color: rgba($text-secondary, 0.55);
      }
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
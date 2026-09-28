<!-- app/components/pages/public/remontPomescheniy/blocks/WorksGrid.vue -->
<template>
  <section class="works-grid">
    <!-- Декоративная сетка на фоне -->
    <div class="works-grid__grid-pattern" aria-hidden="true"></div>

    <div class="container">
      <!-- Хедер секции -->
      <div class="works-grid__header">
        <div class="works-grid__header-left">
          <div class="works-grid__badge">
            <Icon name="mdi:view-grid-outline" size="14" />
            <span>Виды работ</span>
          </div>

          <h2 class="works-grid__title">
            Виды <span class="accent">отделочных работ</span>
          </h2>
        </div>

        <p class="works-grid__subtitle">
          Полный цикл ремонта: от перегородок до финишной отделки.
          Нажмите на карточку для перехода к основной услуге.
        </p>
      </div>

      <!-- Панель управления -->
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

          <!-- ==================== КАРТОЧКА С ГОТОВЫМИ СТРАНИЦАМИ ==================== -->
          <NuxtLink
            v-if="hasReadyLinks(work)"
            :to="firstReadyUrl(work)"
            custom
            v-slot="{ navigate }"
          >
            <div
              :class="[
                'work-card',
                'work-card--clickable',
                { 'item-visible': animatedSlugs.has(work.slug) },
              ]"
              @click="(e) => { navigate(e); handleCardClick(work); }"
              @keyup.enter="(e) => { navigate(e); handleCardClick(work); }"
              role="link"
              tabindex="0"
            >
              <div class="work-card__image">
                <img :src="work.image" :alt="work.title" loading="lazy" class="work-card__img">
                <div class="work-card__overlay">
                  <h3 class="work-card__title">{{ work.title }}</h3>
                  <span class="work-card__count">{{ work.links.length }} услуг</span>
                </div>
              </div>

              <div class="work-card__body">
                <p class="work-card__desc">{{ work.description }}</p>

                <div class="work-card__links" @click.stop>
                  <template v-for="link in work.links" :key="link.url">
                    <NuxtLink
                      v-if="link.isReady"
                      :to="link.url"
                      class="work-card__link"
                      :title="link.title"
                    >
                      {{ link.title }}
                    </NuxtLink>
                    <span
                      v-else
                      class="work-card__link work-card__link--disabled"
                      :title="`${link.title} — в разработке`"
                    >
                      <Icon name="mdi:link-off" size="13" />
                      {{ link.title }}
                    </span>
                  </template>
                </div>
              </div>
            </div>
          </NuxtLink>

          <!-- ==================== КАРТОЧКА БЕЗ ГОТОВЫХ СТРАНИЦ ==================== -->
          <div
            v-else
            :class="[
              'work-card',
              'work-card--disabled',
              { 'item-visible': animatedSlugs.has(work.slug) },
            ]"
          >
            <div class="work-card__image">
              <img :src="work.image" :alt="work.title" loading="lazy" class="work-card__img">
              <div class="work-card__overlay">
                <h3 class="work-card__title">{{ work.title }}</h3>
                <span class="work-card__count">{{ work.links.length }} услуг</span>
              </div>
            </div>

            <div class="work-card__body">
              <p class="work-card__desc">{{ work.description }}</p>

              <div class="work-card__links">
                <span class="work-card__link work-card__link--disabled">
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

const works = [
  {
    slug: 'peregorodki',
    title: 'Перегородки',
    category: 'walls',
    description: 'Монтаж межкомнатных перегородок из ГКЛ, кирпича, блоков, ПГП',
    image: '/main/remont-pomescheniy/medicina.webp',
    links: [
      { title: 'ГКЛ', url: '/vidy-rabot/peregorodki-gkl', isReady: true },
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
      { title: 'Плитка', url: '/vidy-rabot/ukladka-plitki', isReady: true },
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
      { title: 'Стены', url: '/vidy-rabot/shtukaturka-sten', isReady: true },
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
      { title: 'Стены', url: '/vidy-rabot/shpaklevka-sten', isReady: true },
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

const hasReadyLinks = (work: any): boolean => work.links.some((l: any) => l.isReady)

const firstReadyUrl = (work: any): string => {
  const first = work.links.find((l: any) => l.isReady)
  return first?.url ?? '#'
}

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

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;
@use '@/assets/styles/mixins' as *;

.works-grid {
  @include section-padding;
  background: $background-light;
  color: $text-dark;
  position: relative;
  overflow: hidden;

  // === Фоновая «сетка» из тонких линий (светлая тема) ===
  &__grid-pattern {
    position: absolute;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    background-image:
      linear-gradient(rgba(0, 0, 0, 0.035) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0, 0, 0, 0.035) 1px, transparent 1px);
    background-size: 64px 64px;
    mask-image: radial-gradient(ellipse at 50% 40%, #000 20%, transparent 75%);
    -webkit-mask-image: radial-gradient(ellipse at 50% 40%, #000 20%, transparent 75%);
  }

  .container {
    @include section-container;
    position: relative;
    z-index: 1;
  }

  // ========================================
  // ХЕДЕР СЕКЦИИ
  // ========================================
  &__header {
    display: grid;
    grid-template-columns: 1fr 1fr;
    align-items: end;
    gap: 3rem;
    margin-bottom: 2.5rem;

    @media (max-width: 900px) {
      grid-template-columns: 1fr;
      gap: 1.2rem;
      margin-bottom: 2rem;
    }
  }

  &__header-left {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  // === Бейдж ===
  &__badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.4rem 0.9rem;
    background: rgba(0, 195, 245, 0.08);
    border: 1px solid rgba(0, 195, 245, 0.25);
    border-radius: 100px;
    font-size: 0.78rem;
    font-weight: 500;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: $text-gray;

    :deep(svg) {
      color: $blue;
    }
  }

  // === Заголовок ===
  &__title {
    @include section-title;
    color: $text-dark;
    margin: 0;

    &::after {
      box-shadow: 0 0 14px rgba(0, 195, 245, 0.4);
    }

    .accent {
      background: $blue-gradient;
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
      color: transparent;
    }
  }

  // === Подзаголовок (справа) ===
  &__subtitle {
    @include section-subtitle;
    color: $text-gray;
    margin: 0 0 0.4rem;
    max-width: 100%;

    @media (max-width: 900px) {
      margin-top: 0.5rem;
    }

    @media (max-width: 768px) {
      font-size: 0.98rem;
    }
  }

  // ========================================
  // ПАНЕЛЬ УПРАВЛЕНИЯ (табы + переключатель)
  // ========================================
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

  // === Табы ===
  &__tab {
    background: transparent;
    border: 1px solid $border-color;
    color: $text-gray;
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

  // === Переключатель вида ===
  &__view-toggle {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    background: transparent;
    border: 1px solid $border-color;
    color: $text-gray;
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

  // ========================================
  // СЕТКА / СПИСОК
  // ========================================
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

  &__footer {
    display: flex;
    justify-content: center;
    padding-top: 2rem;
  }
}

// ========================================
// КАРТОЧКА РАБОТЫ (светлая)
// ========================================
.work-card {
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  background: #fff;
  border: 1px solid $border-color;
  border-radius: $border-radius;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.35s ease;
  text-decoration: none;
  color: inherit;

  // Анимация появления
  opacity: 0;
  transform: translateY(20px);

  &.item-visible {
    opacity: 1;
    transform: translateY(0);
    transition: opacity 0.5s ease, transform 0.5s ease;
  }

  // === Кликабельная карточка ===
  &--clickable {
    cursor: pointer;

    &:hover {
      transform: translateY(-4px);
      border-color: $blue;
      box-shadow: 0 12px 24px rgba(0, 0, 0, 0.08);

      .work-card__img {
        transform: scale(1.05);
      }
    }

    &.item-visible:hover {
      transform: translateY(-4px);
    }
  }

  // === Неактивная карточка ===
  &--disabled {
    opacity: 0.7;
    cursor: default;
    pointer-events: none;
    background: #fafafa;

    &.item-visible {
      opacity: 0.7;
    }

    .work-card__img {
      filter: grayscale(0.4);
    }
  }

  // === Список-режим ===
  .works-grid__list--list & {
    flex-direction: row;
    align-items: stretch;

    @media (max-width: 768px) {
      flex-direction: column;
    }
  }

  // === Изображение ===
  &__image {
    position: relative;
    width: 100%;
    aspect-ratio: 16 / 9;
    overflow: hidden;
    background: #f5f5f5;
    flex-shrink: 0;

    .works-grid__list--list & {
      width: 260px;
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

  &__overlay {
    position: absolute;
    inset: auto 0 0 0;
    padding: 1.1rem 1.25rem;
    background: linear-gradient(
      to top,
      rgba(0, 0, 0, 0.75) 0%,
      rgba(0, 0, 0, 0.35) 60%,
      transparent 100%
    );
  }

  &__title {
    font-size: 1.15rem;
    font-weight: 600;
    color: #fff;
    margin: 0 0 0.2rem;
    line-height: 1.3;
    letter-spacing: -0.01em;
  }

  &__count {
    font-size: 0.78rem;
    font-weight: 500;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.85);
  }

  // === Тело карточки ===
  &__body {
    padding: 1.2rem;
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
    flex: 1;
  }

  &__desc {
    font-size: 0.9rem;
    line-height: 1.55;
    color: $text-gray;
    margin: 0;
  }

  // === Ссылки внутри карточки ===
  &__links {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: auto;
    padding-top: 0.8rem;
    border-top: 1px solid $border-color;
  }

  // === Кнопки-ссылки внутри карточки ===
  &__link {
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
      border-color: rgba($text-gray, 0.25);
      color: rgba($text-gray, 0.55);
      cursor: default;
      pointer-events: none;
      font-weight: 400;

      &:hover {
        background: transparent;
        border-color: rgba($text-gray, 0.25);
        color: rgba($text-gray, 0.55);
      }
    }
  }
}

// ========================================
// АДАПТИВ
// ========================================
@media (max-width: 768px) {
  .works-grid {
    padding-top: 4rem;
    padding-bottom: 4rem;

    &__list--grid {
      grid-template-columns: 1fr;
    }

    &__controls {
      flex-direction: column;
      align-items: stretch;
      gap: 1rem;
    }

    &__view-toggle {
      justify-content: center;
    }
  }

  .work-card {
    &__title { font-size: 1.05rem; }
    &__desc { font-size: 0.88rem; }
    &__body { padding: 1.2rem; }

    .works-grid__list--list & {
      flex-direction: column;
    }
  }
}
</style>
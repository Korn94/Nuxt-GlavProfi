<!-- app\components\pages\public\prices\index.vue -->
<template>
  <div class="price-page-wrapper">
    <div class="container" :key="activeCategory">
      <!-- ═══════════ HERO ═══════════ -->
      <header class="hero">
        <div class="hero__grid">
          <!-- ── Левая колонка: контент ── -->
          <div class="hero__content">
            <div class="hero__badge">
              <span class="hero__badge-dot"></span>
              <Icon name="mdi:shield-check" size="15" class="green" />
              <span>Актуальные цены <strong>2026</strong></span>
            </div>

            <h1 class="hero__title">
              Актуальные цены на
              <span class="hero__accent">{{ activeCategoryTitle }}</span>
            </h1>

            <p class="hero__subtitle">
              Полный прайс-лист с прозрачными расценками на работы.
              Используйте поиск или навигацию по категориям.
            </p>

            <ul class="hero__meta">
              <li class="hero__meta-item">
                <Icon name="mdi:check-circle" size="16" class="green" />
                <span>Рыночные цены</span>
              </li>
              <li class="hero__meta-item">
                <Icon name="mdi:check-circle" size="16" class="green" />
                <span>Делаем скидки на объем</span>
              </li>
              <li class="hero__meta-item">
                <Icon name="mdi:check-circle" size="16" class="green" />
                <span>Обновлено в 2026</span>
              </li>
            </ul>
          </div>

          <!-- ── Правая колонка: bento-панель ── -->
          <div v-if="dataStore.works?.length" class="hero__bento">
            <div class="bento-tile bento-tile--primary">
              <Icon name="mdi:format-list-checks" size="18" />
              <span class="bento-tile__value">{{ totalItems }}</span>
              <span class="bento-tile__label">позиций</span>
            </div>

            <div class="bento-tile">
              <Icon name="mdi:shape-outline" size="22" />
              <span class="bento-tile__value">{{ dataStore.works.length }}</span>
              <span class="bento-tile__label">категорий</span>
            </div>

            <div class="bento-tile">
              <Icon name="mdi:folder-multiple-outline" size="18" />
              <span class="bento-tile__value">{{ totalSubcategories }}</span>
              <span class="bento-tile__label">подкатегорий</span>
            </div>
          </div>
        </div>
      </header>

      <!-- ═══════════ ОГЛАВЛЕНИЕ ═══════════ -->
      <nav
        v-if="filteredWorks.length"
        class="toc"
        itemscope
        itemtype="https://schema.org/ItemList"
      >
        <meta itemprop="numberOfItems" :content="String(filteredWorks.length)" />
        <div class="toc__header">
          <Icon name="mdi:format-list-bulleted" size="18" />
          <span>Содержание</span>
        </div>
        <ul class="toc__list">
          <li
            v-for="(category, index) in filteredWorks"
            :key="'toc-' + category.id"
            class="toc__item"
            itemprop="itemListElement"
            itemscope
            itemtype="https://schema.org/ListItem"
          >
            <a :href="'#category-' + category.id" class="toc__link" itemprop="item">
              <span class="toc__num">{{ String(index + 1).padStart(2, '0') }}</span>
              <span itemprop="name">{{ category.name }}</span>
            </a>
            <meta itemprop="position" :content="String(index + 1)" />
          </li>
        </ul>
      </nav>

      <!-- ═══════════ НАВИГАЦИЯ ═══════════ -->
      <PagesPublicPricesUiNavigation
        :categories="props.categories"
        :active-category="activeCategory"
        @update:active-category="setCategory"
      />

      <!-- ═══════════ ПРАЙС ═══════════ -->
      <div class="price-list">
        <!-- Поиск -->
        <PagesPublicPricesUiSearchBar
          v-model="uiStore.searchQuery"
          @clear="uiStore.clearSearch"
        />

        <!-- Админ-меню -->
        <div v-if="filteredWorks.length && isAdminMode" class="work-navigation">
          <div class="work-navigation__inner">
            <button
              :class="{ active: uiStore.activeWork === 'all' }"
              @click="uiStore.activeWork = 'all'"
            >
              Все работы
            </button>
            <button
              v-for="category in allWorks"
              :key="category.id"
              :class="{ active: uiStore.activeWork === category.id }"
              @click="uiStore.activeWork = category.id"
            >
              {{ category.title }}
            </button>
            <div class="add-category-button">
              <button @click="editStore.showAddCategory(currentPageId)">
                + Добавить категорию
              </button>
              <div v-if="editStore.showAddCategoryForm" class="form">
                <input
                  v-model="editStore.newCategory.name"
                  placeholder="Название категории"
                />
                <button @click="editStore.addCategory">Сохранить</button>
                <button @click="editStore.cancelAddCategory">Отмена</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Скелетон загрузки -->
        <div v-if="dataStore.isLoading" class="skeleton">
          <div v-for="i in 3" :key="i" class="skeleton__card">
            <div class="skeleton__line skeleton__line--title"></div>
            <div class="skeleton__line"></div>
            <div class="skeleton__line skeleton__line--short"></div>
          </div>
        </div>

        <!-- Ошибка -->
        <div v-if="dataStore.errorMessage" class="error-message">
          <Icon name="mdi:alert-circle-outline" size="20" />
          <span>{{ dataStore.errorMessage }}</span>
        </div>

        <!-- Контент -->
        <div v-if="!dataStore.isLoading && !dataStore.errorMessage">
          <PagesPublicPricesPriceCategory
            v-for="category in filteredWorks"
            :key="category.id"
            :category="category"
            :is-admin="isAdminMode"
            :search-query="uiStore.searchQuery"
          />

          <div v-if="!filteredWorks.length" class="no-results">
            <Icon name="mdi:magnify-close" size="32" />
            <p>Ничего не найдено</p>
            <span>Попробуйте изменить поисковый запрос</span>
          </div>
        </div>
      </div>
    </div>

    <!-- FAB админа -->
    <button
      v-if="dataStore.isAdmin"
      class="admin-toggle-fab"
      :class="{ 'is-active': isAdminMode }"
      :title="isAdminMode ? 'Скрыть кнопки редактирования' : 'Показать кнопки редактирования'"
      @click="uiStore.toggleAdminView"
    >
      <Icon
        :name="isAdminMode ? 'mdi:eye-off-outline' : 'mdi:eye-outline'"
        size="22"
      />
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { usePriceUIStore, usePriceDataStore, usePriceEditStore } from 'stores/price'
import type { PriceCategory } from 'stores/price/types'

const props = withDefaults(defineProps<{
  categories: Array<{ id: number; name: string; slug: string }>
  activeCategory: string
}>(), {
  categories: () => [],
  activeCategory: '',
})

const emit = defineEmits<{
  (e: 'update:active-category', value: string): void
}>()

const uiStore = usePriceUIStore()
const dataStore = usePriceDataStore()
const editStore = usePriceEditStore()
const router = useRouter()

const isAdminMode = computed<boolean>(
  () => dataStore.isAdmin && uiStore.isAdminView,
)

const currentPageId = computed(() => {
  const page = props.categories.find(p => p.slug === props.activeCategory)
  return page?.id ?? 0
})

const categoryTitlesForH1: Record<string, string> = {
  'otdelochnye-raboty': 'отделочные работы',
  'plumbing': 'сантехнические работы',
  'electricity': 'электромонтажные работы',
}

const activeCategoryTitle = computed(() =>
  categoryTitlesForH1[props.activeCategory] || 'ремонтные работы',
)

const allWorks = computed(() =>
  dataStore.works.map(category => ({ id: category.id, title: category.name })),
)

const totalSubcategories = computed(() =>
  dataStore.works.reduce((sum, c) => sum + (c.subcategories?.length ?? 0), 0),
)

const totalItems = computed(() =>
  dataStore.works.reduce(
    (sum, c) =>
      sum +
      (c.subcategories?.reduce((s, sub) => s + (sub.items?.length ?? 0), 0) ?? 0),
    0,
  ),
)

const filteredWorks = computed<PriceCategory[]>(() => {
  const query = uiStore.searchQuery.trim().toLowerCase()
  let filtered: PriceCategory[] = dataStore.works ?? []

  if (isAdminMode.value && uiStore.activeWork !== 'all') {
    filtered = filtered.filter(category => category.id === uiStore.activeWork)
  }

  if (!query) return filtered

  const openSubcategoriesTemp: Record<number, boolean> = {}
  const result = filtered
    .map(category => {
      const filteredSubcategories = category.subcategories
        .map(subcategory => {
          const filteredItems = subcategory.items.filter(item =>
            item.name.toLowerCase().includes(query),
          )
          if (filteredItems.length > 0) {
            openSubcategoriesTemp[subcategory.id] = true
          }
          return { ...subcategory, items: filteredItems }
        })
        .filter(subcategory => subcategory.items.length > 0)

      if (filteredSubcategories.length > 0) {
        return { ...category, subcategories: filteredSubcategories }
      }
      return null
    })
    .filter((c): c is PriceCategory => c !== null)

  uiStore.openSubcategories = { ...openSubcategoriesTemp }
  return result
})

const setCategory = async (categorySlug: string) => {
  await router.push({ params: { category: categorySlug } })
  emit('update:active-category', categorySlug)
}
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;

.container {
  max-width: 1200px;
  margin: 0 auto 3em;
  border-radius: 5px;

  @media (max-width: 768px) {
    margin-top: 1em;
    padding: 0 0.5rem;
  }
}

/* ═══════════════════════════════════════════ */
/* HERO                                        */
/* ═══════════════════════════════════════════ */
.hero {
  position: relative;
  margin-bottom: 2.5em;
  padding: 2.5rem;
  border-radius: 28px;
  overflow: hidden;
  background:
    radial-gradient(80% 100% at 100% 0%, #f0f8ff 0%, transparent 60%),
    linear-gradient(180deg, #fbfcfd 0%, #ffffff 100%);
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 24px 60px -35px rgba(0, 60, 110, 0.35);

  @media (max-width: 900px) {
    padding: 1.8rem;
    border-radius: 22px;
  }

  @media (max-width: 600px) {
    padding: 1.4rem;
    border-radius: 18px;
  }

  /* Декоративное cyan-пятно в правом верхнем углу */
  &::before {
    content: '';
    position: absolute;
    top: -100px;
    right: -100px;
    width: 280px;
    height: 280px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(0, 195, 245, 0.14), transparent 70%);
    pointer-events: none;
  }

  /* ── Grid: 2 колонки ── */
  &__grid {
    position: relative;
    display: grid;
    grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
    gap: 2.5rem;
    align-items: center;

    @media (max-width: 900px) {
      grid-template-columns: 1fr;
      gap: 1.8rem;
    }
  }

  &__content {
    min-width: 0;
  }

  /* ── Бейдж ── */
  &__badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 14px 6px 10px;
    background: #fff;
    border: 1px solid rgba(0, 195, 245, 0.35);
    border-radius: 50px;
    font-size: 0.74rem;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: $text-dark;
    margin-bottom: 1.4rem;
    box-shadow: 0 6px 18px -10px rgba(0, 195, 245, 0.6);

    svg {
      color: $blue;
    }

    strong {
      color: $red;
      font-weight: 800;
    }
  }

  &__badge-dot {
    position: relative;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: $blue;
    box-shadow: 0 0 0 3px rgba(0, 195, 245, 0.18);

    &::after {
      content: '';
      position: absolute;
      inset: -3px;
      border-radius: 50%;
      border: 1px solid rgba(0, 195, 245, 0.6);
      animation: hero-pulse 2.2s ease-out infinite;
    }
  }

  /* ── Заголовок ── */
  &__title {
    font-family: 'Rubik', sans-serif;
    font-size: clamp(1.8rem, 3.4vw, 2.8rem);
    font-weight: 800;
    line-height: 1.1;
    letter-spacing: -0.03em;
    color: $text-dark;
    margin: 0 0 1rem;
    max-width: 520px;

    @media (max-width: 900px) {
      max-width: none;
    }

    @media (max-width: 600px) {
      font-size: 1.55rem;
    }
  }

  &__accent {
    display: inline;
    background: $blue-gradient;
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }

  /* ── Подзаголовок ── */
  &__subtitle {
    font-size: 1rem;
    line-height: 1.65;
    color: $text-gray;
    max-width: 480px;
    margin: 0 0 1.6rem;

    @media (max-width: 900px) {
      max-width: none;
    }

    @media (max-width: 600px) {
      font-size: 0.92rem;
    }
  }

  /* ── Meta-строка ── */
  &__meta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 20px;
    list-style: none;
    padding: 0;
    margin: 0;
  }

  &__meta-item {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 0.82rem;
    font-weight: 500;
    color: $text-dark;

    svg {
      color: $green;
      flex-shrink: 0;
    }
  }

  /* ── Bento-панель ── */
  &__bento {
    display: grid;
    grid-template-columns: 1.15fr 1fr;
    grid-template-rows: 1fr 1fr;
    gap: 10px;
    padding: 12px;
    border-radius: 22px;
    background:
      radial-gradient(120% 100% at 100% 0%, rgba(0, 195, 245, 0.15), transparent 55%),
      linear-gradient(160deg, #0e1e30 0%, #0a1626 100%);
    border: 1px solid rgba(0, 195, 245, 0.22);
    box-shadow:
      0 1px 0 rgba(255, 255, 255, 0.06) inset,
      0 30px 60px -25px rgba(0, 60, 110, 0.65);
    min-height: 280px;

    @media (max-width: 600px) {
      grid-template-columns: 1fr 1fr;
      grid-template-rows: auto auto auto;
      min-height: 0;
      padding: 10px;
      border-radius: 18px;
    }
  }
}

/* ── Bento-плитки ── */
.bento-tile {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 8px;
  padding: 16px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.07);
  color: #fff;
  overflow: hidden;
  transition: all 0.25s ease;
  min-width: 0;

  svg {
    color: $blue;
    opacity: 0.85;
    flex-shrink: 0;
  }

  &__value {
    font-size: 1.75rem;
    font-weight: 800;
    line-height: 1;
    letter-spacing: -0.03em;
    color: #fff;
    font-variant-numeric: tabular-nums;
  }

  &__label {
    font-size: 0.68rem;
    color: rgba(255, 255, 255, 0.55);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-weight: 600;
  }

  /* Главная плитка — крупная, слева, на 2 ряда */
  &--primary {
    grid-row: span 2;
    justify-content: flex-end;
    background:
      radial-gradient(120% 100% at 20% 0%, rgba(0, 195, 245, 0.4), transparent 60%),
      rgba(0, 195, 245, 0.08);
    border-color: rgba(0, 195, 245, 0.4);

    svg {
      color: $blue-light;
      opacity: 1;
      position: absolute;
      top: 16px;
      left: 16px;
    }

    .bento-tile__value {
      font-size: 3rem;
      background: linear-gradient(135deg, #ffffff 0%, #9bfbff 100%);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
    }

    .bento-tile__label {
      color: rgba(255, 255, 255, 0.7);
    }

    /* Пульсирующая точка в углу */
    &::after {
      content: '';
      position: absolute;
      top: 18px;
      right: 18px;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: $blue;
      box-shadow: 0 0 12px rgba(0, 195, 245, 0.9);
      animation: bento-blink 2s ease-in-out infinite;
    }

    @media (max-width: 600px) {
      grid-row: auto;
      grid-column: span 2;
      min-height: 130px;

      .bento-tile__value {
        font-size: 2.4rem;
      }
    }
  }

  /* Hover */
  &:hover {
    border-color: rgba(0, 195, 245, 0.6);
    background: rgba(0, 195, 245, 0.1);
    transform: translateY(-2px);
  }
}

/* ── Анимации ── */
@keyframes hero-pulse {
  0% {
    transform: scale(1);
    opacity: 0.9;
  }
  70% {
    transform: scale(1.9);
    opacity: 0;
  }
  100% {
    transform: scale(1.9);
    opacity: 0;
  }
}

@keyframes bento-blink {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.4;
    transform: scale(0.85);
  }
}

/* ═══════════════════════════════════════════ */
/* TOC                                         */
/* ═══════════════════════════════════════════ */
.toc {
  margin-bottom: 2em;
  padding: 1.2em 1.5em;
  background: linear-gradient(180deg, #fbfcfd 0%, #f5f7fa 100%);
  border: 1px solid $border-color;
  border-radius: 14px;

  @media (max-width: 600px) {
    padding: 1em;
  }

  &__header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding-bottom: 10px;
    margin-bottom: 10px;
    border-bottom: 1px dashed rgba(0, 195, 245, 0.3);
    font-weight: 700;
    font-size: 0.85rem;
    color: $text-dark;
    text-transform: uppercase;
    letter-spacing: 0.05em;

    svg {
      color: $blue;
    }
  }

  &__list {
    list-style: none;
    padding: 0;
    margin: 0;

    column-width: 400px;
    column-gap: 24px;
  }

  &__item {
    break-inside: avoid;
    margin-bottom: 6px;
    display: block;
  }

  &__link {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    border-radius: 8px;
    color: $text-dark;
    font-size: 0.9rem;
    transition: all 0.2s ease;
    border: 1px solid transparent;
    text-decoration: none;

    &:hover {
      background: #fff;
      border-color: rgba(0, 195, 245, 0.3);
      color: $blue;
      transform: translateX(3px);
    }
  }

  &__num {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 26px;
    height: 22px;
    padding: 0 6px;
    background: rgba(0, 195, 245, 0.1);
    color: $blue;
    font-size: 0.72rem;
    font-weight: 700;
    border-radius: 6px;
    font-variant-numeric: tabular-nums;
  }
}

/* ═══════════════════════════════════════════ */
/* АДМИН-НАВИГАЦИЯ                             */
/* ═══════════════════════════════════════════ */
.work-navigation {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  margin-bottom: 20px;
  white-space: nowrap;

  &::-webkit-scrollbar {
    height: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: #ccc;
    border-radius: 3px;
  }
  scrollbar-width: thin;
  scrollbar-color: #ccc transparent;

  &__inner {
    display: inline-flex;
    gap: 8px;
    padding: 8px 0;
  }

  button {
    flex-shrink: 0;
    padding: 8px 16px;
    cursor: pointer;
    background: #fff;
    color: $text-dark;
    border: 1px solid $border-color;
    border-radius: 8px;
    font-weight: 600;
    font-size: 0.85rem;
    transition: all 0.2s ease;

    &.active,
    &:hover {
      background: $blue;
      color: #fff;
      border-color: $blue;
      box-shadow: 0 4px 12px rgba(0, 195, 245, 0.3);
    }
  }
}

.add-category-button {
  margin-left: 8px;

  > button {
    border-style: dashed;
    color: $blue;
    border-color: rgba(0, 195, 245, 0.5);

    &:hover {
      background: rgba(0, 195, 245, 0.08);
      color: $blue;
      box-shadow: none;
    }
  }
}

/* ═══════════════════════════════════════════ */
/* ПРАЙС-ЛИСТ                                  */
/* ═══════════════════════════════════════════ */
.price-list {
  border: 1px solid $border-color;
  border-radius: 16px;
  padding: 24px;
  background: #fff;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.05);

  @media (max-width: 768px) {
    padding: 14px;
    border-radius: 12px;
  }
}

.error-message {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 30px 20px;
  margin: 1em 0;
  color: #d32f2f;
  background: rgba(211, 47, 47, 0.06);
  border-radius: 10px;
  font-weight: 600;
}

.no-results {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 50px 20px;
  text-align: center;
  color: $text-gray;

  svg {
    color: rgba(0, 195, 245, 0.4);
    margin-bottom: 6px;
  }

  p {
    font-weight: 600;
    color: $text-dark;
    margin: 0;
    font-size: 1rem;
  }

  span {
    font-size: 0.85rem;
  }
}

/* ═══════════════════════════════════════════ */
/* SKELETON                                    */
/* ═══════════════════════════════════════════ */
.skeleton {
  display: flex;
  flex-direction: column;
  gap: 16px;

  &__card {
    padding: 20px;
    background: #f7f8fa;
    border-radius: 12px;
  }

  &__line {
    height: 12px;
    background: linear-gradient(90deg, #eef0f3 25%, #f6f7f9 50%, #eef0f3 75%);
    background-size: 200% 100%;
    border-radius: 6px;
    margin-bottom: 10px;
    animation: shimmer 1.4s infinite;

    &--title {
      width: 40%;
      height: 18px;
      margin-bottom: 16px;
    }

    &--short {
      width: 60%;
      margin-bottom: 0;
    }

    &:last-child {
      margin-bottom: 0;
    }
  }
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* ═══════════════════════════════════════════ */
/* ФОРМА                                       */
/* ═══════════════════════════════════════════ */
.form {
  margin-top: 10px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;

  input {
    padding: 8px 12px;
    border: 1px solid $border-color;
    border-radius: 6px;
  }

  button {
    padding: 8px 14px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 600;

    &:first-of-type {
      background: $blue;
      color: #fff;
    }
    &:last-of-type {
      background: #eef0f3;
      color: #333;
    }
  }
}

.price-page-wrapper {
  width: 100%;
}

/* ═══════════════════════════════════════════ */
/* FAB                                         */
/* ═══════════════════════════════════════════ */
.admin-toggle-fab {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 1000;

  display: flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  border: none;
  border-radius: 50%;
  cursor: pointer;

  background: #fff;
  color: $text-dark;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.15);

  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    transform: translateY(-3px) scale(1.05);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  }

  &.is-active {
    background: linear-gradient(135deg, #00c3f5, #00a3d3);
    color: #fff;
    box-shadow: 0 6px 20px rgba(0, 195, 245, 0.4);

    &:hover {
      box-shadow: 0 10px 30px rgba(0, 195, 245, 0.5);
    }
  }

  @media (max-width: 600px) {
    bottom: 16px;
    right: 16px;
    width: 48px;
    height: 48px;
  }
}
</style>
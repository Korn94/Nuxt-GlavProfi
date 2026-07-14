<!-- app\components\pages\public\prices\index.vue -->
<template>
  <div class="price-page-wrapper">
    <div class="container" :key="activeCategory">
      <!-- Заголовок -->
      <h1>Актуальные цены на <span>{{ activeCategoryTitle }}</span> - 2026 год</h1>

      <!-- Оглавление по категориям (анкорные ссылки) -->
      <nav v-if="filteredWorks.length" class="toc" itemscope itemtype="https://schema.org/ItemList">
        <meta itemprop="numberOfItems" :content="String(filteredWorks.length)" />
        <div class="toc__header">
          <Icon name="mdi:format-list-bulleted" class="toc__icon" size="20" />
          <span class="toc__title">Содержание:</span>
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
            <a
              :href="'#category-' + category.id"
              class="toc__link"
              itemprop="item"
            >
              <span itemprop="name">{{ category.name }}</span>
            </a>
            <meta itemprop="position" :content="String(index + 1)" />
          </li>
        </ul>
      </nav>

      <!-- Навигация -->
      <PagesPublicPricesUiNavigation
        :categories="props.categories"
        :active-category="activeCategory"
        @update:active-category="setCategory"
      />

      <!-- Таблица -->
      <div class="price-list">
        <!-- Поиск -->
        <PagesPublicPricesUiSearchBar
          v-model="uiStore.searchQuery"
          @clear="uiStore.clearSearch"
        />

        <!-- Индикатор загрузки -->
        <div v-if="dataStore.isLoading" class="loading-indicator">
          <Icon name="eos-icons:bubble-loading" size="34px" />
          <span>Загрузка данных...</span>
        </div>

        <!-- Ошибка -->
        <div v-if="dataStore.errorMessage" class="error-message">
          {{ dataStore.errorMessage }}
        </div>

        <!-- Контент прайса -->
        <div v-if="!dataStore.isLoading && !dataStore.errorMessage">
          <!-- Результаты поиска / список категорий -->
          <div v-if="filteredWorks.length">
            <!-- Меню навигации по работам (ТОЛЬКО в режиме админа) -->
            <div class="work-navigation" v-if="isAdminMode">
              <div class="work-navigation-inner">
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
                  <!-- Форма добавления категории -->
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
          </div>

          <!-- Список категорий — передаём isAdminMode вместо dataStore.isAdmin -->
          <PagesPublicPricesPriceCategory
            v-for="category in filteredWorks"
            :key="category.id"
            :category="category"
            :is-admin="isAdminMode"
            :search-query="uiStore.searchQuery"
          />

          <!-- Ничего не найдено -->
          <div v-if="!filteredWorks.length" class="no-results">
            <Icon name="mdi:loading" class="animate-spin" size="24" />
            <span class="ml-2">Загрузка...</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 🆕 FLOATING TOGGLE BUTTON (видна ТОЛЬКО настоящим админам) -->
    <button
      v-if="dataStore.isAdmin"
      class="admin-toggle-fab"
      :class="{ 'is-active': isAdminMode }"
      :title="isAdminMode ? 'Скрыть кнопки редактирования' : 'Показать кнопки редактирования'"
      @click="uiStore.toggleAdminView"
    >
      <Icon
        :name="isAdminMode ? 'mdi:eye-off-outline' : 'mdi:eye-outline'"
        size="24"
      />
      <!-- <span class="admin-toggle-fab__label">
        {{ isAdminMode ? 'Просмотр' : 'Редактирование' }}
      </span> -->
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { usePriceUIStore, usePriceDataStore, usePriceEditStore } from 'stores/price'
import type { PriceCategory } from 'stores/price/types'

// ========================================
// 📥 ПРОПСЫ (для навигации со страницы)
// ========================================
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

// ========================================
// 🏪 PINIA STORES (вместо inject)
// ========================================
const uiStore = usePriceUIStore()
const dataStore = usePriceDataStore()
const editStore = usePriceEditStore()

// ========================================
// 🧭 ROUTER
// ========================================
const router = useRouter()

// ========================================
// 🆕 ИТОГОВЫЙ ФЛАГ РЕЖИМА АДМИНА
// ========================================
/**
 * Режим админа активен ТОЛЬКО когда:
 * 1. Пользователь реально имеет роль admin/manager (dataStore.isAdmin)
 * 2. Пользователь включил отображение админских кнопок (uiStore.isAdminView)
 *
 * Это позволяет админу быстро переключаться между "как видит клиент" и "режим редактирования".
 */
const isAdminMode = computed<boolean>(() =>
  dataStore.isAdmin && uiStore.isAdminView
)

// ========================================
// 📋 ЛОКАЛЬНЫЕ ВЫЧИСЛЕНИЯ
// ========================================
/**
 * ID текущей страницы (для добавления категории).
 * Берём из props.categories по текущему slug.
 */
const currentPageId = computed(() => {
  const page = props.categories.find(p => p.slug === props.activeCategory)
  return page?.id ?? 0
})

/**
 * Словарь склонений для H1.
 */
const categoryTitlesForH1: Record<string, string> = {
  'otdelochnye-raboty': 'отделочные работы',
  'plumbing': 'сантехнические работы',
  'electricity': 'электромонтажные работы',
}

const activeCategoryTitle = computed(() =>
  categoryTitlesForH1[props.activeCategory] || 'ремонтные работы',
)

/**
 * Все категории для меню админа.
 */
const allWorks = computed(() => {
  return dataStore.works.map(category => ({
    id: category.id,
    title: category.name,
  }))
})

/**
 * Фильтрация работ по поиску и активной категории.
 *
 * 🆕 ВАЖНО: фильтр по activeWork срабатывает ТОЛЬКО в режиме админа,
 * иначе обычный пользователь не увидит часть прайса из-за случайного состояния.
 */
const filteredWorks = computed<PriceCategory[]>(() => {
  const query = uiStore.searchQuery.trim().toLowerCase()
  let filtered: PriceCategory[] = dataStore.works ?? []

  // Фильтр по активной категории (работает ТОЛЬКО в режиме админа)
  if (isAdminMode.value && uiStore.activeWork !== 'all') {
    filtered = filtered.filter(category => category.id === uiStore.activeWork)
  }

  // Если нет поиска — возвращаем как есть
  if (!query) return filtered

  // Поиск с автооткрытием найденных подкатегорий
  const openSubcategoriesTemp: Record<number, boolean> = {}
  const result = filtered
    .map(category => {
      const filteredSubcategories = category.subcategories
        .map(subcategory => {
          const filteredItems = subcategory.items.filter(item =>
            item.name.toLowerCase().includes(query),
          )
          // Автооткрытие подкатегорий с найденными работами
          if (filteredItems.length > 0) {
            openSubcategoriesTemp[subcategory.id] = true
          }
          return {
            ...subcategory,
            items: filteredItems,
          }
        })
        .filter(subcategory => subcategory.items.length > 0)

      if (filteredSubcategories.length > 0) {
        return {
          ...category,
          subcategories: filteredSubcategories,
        }
      }
      return null
    })
    .filter((c): c is PriceCategory => c !== null)

  // Применяем автооткрытие к UI-стору
  uiStore.openSubcategories = { ...openSubcategoriesTemp }
  return result
})

// ========================================
// 🎯 ОБРАБОТЧИКИ
// ========================================
/**
 * Переключение категории (через роутер).
 */
const setCategory = async (categorySlug: string) => {
  await router.push({ params: { category: categorySlug } })
  emit('update:active-category', categorySlug)
}
</script>

<style lang="scss" scoped>
span {
  color: unset;
}

.container {
  max-width: 1200px;
  margin: auto;
  border-radius: 5px;

  @media (max-width: 768px) {
    margin-top: 2em;
    padding: 0;
  }
}

h1 {
  text-align: center;
  color: $text-dark;
  font-size: 1.7rem;

  @media (max-width: 768px) {
    font-size: 1.4rem;
  }
}

/* ======================================== */
/* Оглавление (toc)                         */
/* ======================================== */
.toc {
  display: grid;
  gap: 12px;
  margin-bottom: 2em;
  padding: 1.2em 1.5em;
  background: #f8f9fa;
  border: 1px solid $border-color;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
}

.toc__header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 8px;
  border-bottom: 1px dashed #ddd; // Визуально отделяет заголовок от списка
}

.toc__icon {
  color: $blue;
}

.toc__title {
  font-weight: 700;
  font-size: 1rem;
  color: $text-dark;
}

.toc__list {
  list-style: none;
  padding: 0;
  margin: 0;
  
  /* Мультиколоночная верстка: заполнение сверху вниз */
  column-width: 400px; // минимальная ширина колонки (авто-адаптив)
  column-gap: 24px; // расстояние между колонками
}

.toc__item {
  /* Предотвращает разрыв элемента между колонками */
  break-inside: avoid;
  margin-bottom: 6px; // вертикальный отступ между пунктами
  display: block;
}

.toc__link {
  display: block;
  width: 100%;
  font-size: 0.9rem;
  color: $text-dark;
  text-decoration: none;
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid transparent;
  transition: all 0.2s ease;

  &::before {
    content: '•';
    color: $blue;
    font-weight: bold;
    margin-right: 8px;
    font-size: 1.2em;
    line-height: 1;
    transition: transform 0.2s ease;
  }

  &:hover {
    background: #fff;
    border-color: $blue;
    color: $blue;
    text-decoration: none;
    
    &::before {
      transform: translateX(4px);
    }
  }
}

/* ======================================== */
/* Навигация по работам (админ)             */
/* ======================================== */
.work-navigation {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  margin-bottom: 20px;
  white-space: nowrap;
  position: relative;

  &::-webkit-scrollbar {
    height: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: #ccc;
    border-radius: 3px;
  }
  scrollbar-width: thin;
  scrollbar-color: #ccc transparent;
}

.work-navigation-inner {
  display: inline-flex;
  gap: 10px;
  padding: 10px 0;
}

.work-navigation button,
.add-category-button > button {
  flex-shrink: 0;
  padding: 10px 15px 8px;
  cursor: pointer;
  border-bottom: 1px solid $blue;
  background: #fff;
  color: $text-dark;
  border-radius: 5px;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 4px 10px rgba(0, 195, 245, 0.3);

  &.active,
  &:hover {
    background: $blue;
    color: $text-light;
  }
}

/* ======================================== */
/* Таблица цен                              */
/* ======================================== */
.price-list {
  border: 1px solid $border-color;
  border-radius: 5px;
  padding: 20px;
  background: $color-light;
  box-shadow: 0 4px 10px $shadow-color;

  @media (max-width: 768px) {
    padding: 10px;
  }

  .loading-indicator {
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 2em;
    gap: 2em;
  }

  .error-message {
    text-align: center;
    padding: 20px;
    font-weight: bold;
    color: #d32f2f;
  }

  .no-results {
    text-align: center;
    padding: 40px;
    color: #888;
    font-style: italic;

    .animate-spin {
      animation: spin 1s linear infinite;
    }
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.form {
  margin-top: 10px;
  display: flex;
  gap: 10px;

  input {
    padding: 8px;
    border: 1px solid $border-color;
    border-radius: 4px;
  }

  button {
    padding: 8px 12px;
    border: none;
    border-radius: 4px;
    cursor: pointer;

    &:first-of-type {
      background: $blue;
      color: white;
    }
    &:last-of-type {
      background: #ddd;
      color: #333;
    }
  }
}

.add-category-button {
  margin-left: 10px;
}

.price-page-wrapper {
  width: 100%;
}

/* ======================================== */
/* 🆕 FLOATING TOGGLE BUTTON                */
/* ======================================== */
.admin-toggle-fab {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 1000;

  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 18px;
  border: none;
  border-radius: 50px;
  cursor: pointer;

  background: #fff;
  color: $text-dark;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);

  font-size: 0.85rem;
  font-weight: 600;

  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
  }

  /* Активное состояние — режим редактирования */
  &.is-active {
    background: linear-gradient(135deg, #00c3f5, #00a3d3);
    color: #fff;
    box-shadow: 0 6px 20px rgba(0, 195, 245, 0.4);

    &:hover {
      box-shadow: 0 8px 25px rgba(0, 195, 245, 0.5);
    }
  }

  /* На десктопе — показываем текст */
  &__label {
    white-space: nowrap;
  }

  /* На мобильных — круглая кнопка без текста */
  @media (max-width: 600px) {
    padding: 14px;
    border-radius: 50%;
    bottom: 16px;
    right: 16px;

    .admin-toggle-fab__label {
      display: none;
    }
  }
}
</style>
<!-- app\components\pages\public\prices\index.vue -->
<template>
  <div class="price-page-wrapper">
    <div class="container" :key="activeCategory">
      <!-- Заголовок -->
      <h1>Актуальные цены на <span>{{ activeCategoryTitle }}</span> - 2026 год</h1>

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
            <!-- Меню навигации по работам (только админ) -->
            <div class="work-navigation" v-if="dataStore.isAdmin">
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

          <!-- Список категорий -->
          <PagesPublicPricesPriceCategory
            v-for="category in filteredWorks"
            :key="category.id"
            :category="category"
            :is-admin="dataStore.isAdmin"
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
 * Логика сохранена, но теперь использует данные из DataStore
 * и UI-состояние из UIStore.
 */
const filteredWorks = computed<PriceCategory[]>(() => {
  const query = uiStore.searchQuery.trim().toLowerCase()

  let filtered: PriceCategory[] = dataStore.works ?? []

  // Фильтр по активной категории (для админа)
  if (uiStore.activeWork !== 'all') {
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
    font-size: 1.2rem;
  }
}

/* Навигация по работам */
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

/* Таблица цен */
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
</style>
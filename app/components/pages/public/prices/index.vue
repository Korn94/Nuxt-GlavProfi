<!-- app\components\pages\public\prices\index.vue -->
<template>
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
      <PagesPublicPricesUiSearchBar v-model="searchQuery" @clear="clearSearch" />

      <!-- Индикатор загрузки -->
      <div v-if="isLoading" class="loading-indicator">
        <Icon name="eos-icons:bubble-loading" size="34px" />
        <span>Загрузка данных...</span>
      </div>

      <!-- Ошибка -->
      <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>

      <!-- Контент прайса -->
      <div v-if="!isLoading && !errorMessage">
        <!-- Результаты поиска / список категорий -->
        <div v-if="filteredWorks.length">
          <!-- Меню навигации по работам (только админ) -->
          <div class="work-navigation" v-if="isAdmin">
            <div class="work-navigation-inner">
              <button :class="{ active: activeWork === 'all' }" @click="setActiveWork('all')">
                Все работы
              </button>
              <button
                v-for="category in allWorks"
                :key="category.id"
                :class="{ active: activeWork === category.id }"
                @click="setActiveWork(category.id)"
              >
                {{ category.title }}
              </button>
              <div v-if="isAdmin" class="add-category-button">
                <button @click="actions.showCategoryForm.value = true">+ Добавить категорию</button>
                <div v-if="actions.showCategoryForm.value" class="form">
                  <input v-model="actions.newCategory.value.name" placeholder="Название категории" />
                  <button @click="actions.addNewCategory(activeCategory)">Сохранить</button>
                  <button @click="actions.handleCancel('category')">Отмена</button>
                </div>
              </div>
            </div>
          </div>

          <!-- Список категорий -->
          <PagesPublicPricesPriceCategory
            v-for="category in filteredWorks"
            :key="category.id"
            :category="category"
            :is-admin="isAdmin"
            :search-query="searchQuery"
            :editing-category-id="actions.editingCategoryId.value"
            :editing-category-data="actions.editingCategoryData.value"
            :editing-sub-category-id="actions.editingSubCategoryId.value"
            :editing-sub-category-data="actions.editingSubCategoryData.value"
            :editing-item-id="actions.editingItemId.value"
            :editing-item-data="actions.editingItemData.value"
            :editing-detail-id="actions.editingDetailId.value"
            :editing-detail-data="actions.editingDetailData.value"
            :editing-dopwork-id="actions.editingDopworkId.value"
            :editing-dopwork-data="actions.editingDopworkData.value"
            :open-subcategories="openSubcategories"
            :open-sub-items="openSubItems"
            :open-sub-item-forms="actions.openSubItemForms.value"
            :new-sub-item="actions.newSubItem.value"
            :show-detail-form-for="actions.showDetailFormFor.value"
            :show-dopwork-form-for="actions.showDopworkFormFor.value"
            :show-work-form-for="actions.showWorkFormFor.value"
            :new-work-for-subcategory="actions.newWorkForSubcategory.value"
            :new-detail="actions.newDetail.value"
            :new-dopwork="actions.newDopwork.value"
            @toggle-subcategory="toggleSubcategory"
            @start-editing-category="actions.startEditingCategory"
            @save-edit-category="actions.saveEditCategory"
            @delete-category="actions.deleteCategory"
            @open-sub-item-form="handleOpenSubItemForm"
            @add-new-sub-item="actions.addNewSubItem"
            @start-editing-sub-category="actions.startEditingSubCategory"
            @save-edit-sub-category="actions.saveEditSubCategory"
            @delete-sub-category="actions.deleteSubCategory"
            @toggle-sub-items="toggleSubItems"
            @start-editing-sub-item="actions.startEditingSubItem"
            @save-edit-sub-item="actions.saveEditSubItem"
            @delete-sub-item="actions.deleteSubItem"
            @handle-copy-click="actions.handleCopyClick"
            @show-detail-form="handleShowDetailForm"
            @show-dopwork-form="handleShowDopworkForm"
            @show-work-form="handleShowWorkForm"
            @add-new-work="actions.addNewWork"
            @start-editing-detail="actions.startEditingDetail"
            @save-edit-detail="actions.saveEditDetail"
            @delete-detail="actions.deleteDetail"
            @start-editing-dopwork="actions.startEditingDopwork"
            @save-edit-dopwork="actions.saveEditDopwork"
            @delete-dopwork="actions.deleteDopwork"
            @cancel="actions.handleCancel"
          />
        </div>

        <!-- Ничего не найдено -->
        <div v-else class="no-results">
          Ничего не найдено по запросу "{{ searchQuery }}"
        </div>
      </div>
    </div>
  </div>

  <UiNotificationsContainer />
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePriceData } from './composables/usePriceData'
import { usePriceActions } from './composables/usePriceActions'
import type { PriceCategory, PriceWorkItem } from './composables/usePriceData'

const props = defineProps<{
  categories: Array<{ id: number; name: string; slug: string }>
  activeCategory: string
}>()

const emit = defineEmits<{
  (e: 'update:active-category', value: string): void
}>()

const route = useRoute()
const router = useRouter()

// === Подключение композаблов ===
const { works, isAdmin, isLoading, errorMessage, refresh } = await usePriceData()
const actions = usePriceActions(works, refresh)

// === Локальные состояния ===
const searchQuery = ref('')

// ✅ ИСПРАВЛЕНИЕ 1, 2, 4: Явно приводим route.params.category к string
// route.params может возвращать string | string[], поэтому обрабатываем массив
const categoryParam = route.params.category
const initialCategory = (Array.isArray(categoryParam) ? categoryParam[0] : categoryParam) || 'floor'
const activeCategory = ref<string>(props.activeCategory || initialCategory)

const activeWork = ref<string | number>('all')
const openSubcategories = ref<Record<number, boolean>>({})
const openSubItems = ref<Record<number, boolean>>({})

// === Словарь склонений для H1 ===
const categoryTitlesForH1: Record<string, string> = {
  'otdelochnye-raboty': 'отделочные работы',
  'plumbing': 'сантехнические работы',
  'electricity': 'электромонтажные работы',
}

const activeCategoryTitle = computed(() =>
  categoryTitlesForH1[activeCategory.value] || 'ремонтные работы'
)

// === Все категории для меню ===
const allWorks = computed(() =>
  works.value.map(category => ({
    id: category.id,
    title: category.title,
  }))
)

// === Фильтрация работ ===
// ✅ ИСПРАВЛЕНИЕ 3: Явно указываем тип возврата и используем type guard в filter
const filteredWorks = computed<PriceCategory[]>(() => {
  const query = searchQuery.value.trim().toLowerCase()
  let filtered = works.value

  if (activeWork.value !== 'all') {
    filtered = filtered.filter(category => category.id === activeWork.value)
  }

  if (!query) return filtered

  const openSubcategoriesTemp: Record<number, boolean> = {}

  const result = filtered
    .map(category => {
      const filteredSubcategories = category.subcategories
        .map(subcategory => {
          const filteredItems = subcategory.items.filter(item =>
            item.name.toLowerCase().includes(query)
          )

          if (filteredItems.length > 0) {
            openSubcategoriesTemp[subcategory.id] = true
          }

          return {
            ...subcategory,
            items: filteredItems
          }
        })
        .filter(subcategory => subcategory.items.length > 0)

      if (filteredSubcategories.length > 0) {
        return {
          ...category,
          subcategories: filteredSubcategories
        }
      }
      return null
    })
    .filter((c): c is PriceCategory => c !== null) // ← Type guard убирает null из типа

  openSubcategories.value = { ...openSubcategoriesTemp }
  return result
})

// === Обработчики событий ===
const clearSearch = () => {
  searchQuery.value = ''
}

const setActiveWork = (categoryId: string | number) => {
  activeWork.value = categoryId
}

const setCategory = async (categoryId: string) => {
  await router.push({ params: { category: categoryId } })
  emit('update:active-category', categoryId)
}

const toggleSubcategory = (id: number) => {
  openSubcategories.value[id] = !openSubcategories.value[id]
  if (searchQuery.value.trim()) {
    openSubcategories.value[id] = true
  }
}

const toggleSubItems = (id: number) => {
  // Ищем работу во всей структуре
  const findItem = (items: PriceCategory[]): PriceWorkItem | null => {
    for (const category of items) {
      for (const subcategory of category.subcategories || []) {
        for (const item of subcategory.items || []) {
          if (item.id === id) return item
          if (item.details?.some(d => d.id === id)) return item
          if (item.dopworks?.some(d => d.id === id)) return item
        }
      }
    }
    return null
  }

  const item = findItem(works.value)
  
  // Проверяем наличие вложенного контента
  const hasNestedContent = (item: PriceWorkItem | null): boolean => {
    if (!item) return false
    return (item.details && item.details.length > 0) ||
           (item.dopworks && item.dopworks.length > 0)
  }

  if (!item || !hasNestedContent(item)) {
    return  // Ничего не делаем, если нет контента
  }

  // Переключаем состояние
  if (openSubItems.value[id]) {
    delete openSubItems.value[id]
  } else {
    openSubItems.value[id] = true
  }
}

const handleOpenSubItemForm = (categoryId: number) => {
  actions.openSubItemForms.value[categoryId] = true
}

const handleShowDetailForm = (itemId: number) => {
  actions.showDetailFormFor.value = itemId
}

const handleShowDopworkForm = (itemId: number) => {
  actions.showDopworkFormFor.value = itemId
}

const handleShowWorkForm = (subcategoryId: number) => {
  actions.showWorkFormFor.value = subcategoryId
  actions.newWorkForSubcategory.value[subcategoryId] = {
    name: '',
    unit: 'м²',
    price: '',
    subCategoryId: subcategoryId
  }
}

// === Синхронизация с props ===
watch(() => props.activeCategory, (newVal) => {
  if (newVal && newVal !== activeCategory.value) {
    activeCategory.value = newVal
  }
})
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
  }
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
</style>
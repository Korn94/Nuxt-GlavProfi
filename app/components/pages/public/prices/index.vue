<!-- app\components\pages\public\prices\index.vue -->
<template>
  <div class="container" :key="activeCategory">
    <!-- Заголовок -->
    <h1>Актуальные цены на <span>{{ activeCategoryTitle }}</span> - 2026 год</h1>

    <!-- Навигация -->
    <PagesPublicPricesUiNavigation :categories="categories" :active-category="activeCategory"
      @update:active-category="setCategory" />

    <!-- Таблица -->
    <div class="price-list">

      <!-- Поиск -->
      <div class="search-bar">
        <div style="position: relative; width: 100%;">
          <Icon name="mdi:search" class="search-icon" width="24" height="24" />
          <input type="text" v-model="searchQuery" placeholder="Поиск по работам..."
            style="padding-left: 36px; padding-right: 30px; width: 100%;" />
          <Icon v-if="searchQuery" name="mdi:close" class="ico" width="24" height="24"
            @click="clearSearch" />
        </div>
      </div>

      <!-- Индикатор загрузки -->
      <div v-if="isLoading" class="loading-indicator">
        <Icon name="eos-icons:bubble-loading" size="34px" />
        <span>Загрузка данных...</span>
      </div>

      <!-- Ошибка -->
      <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>

      <!-- Контент прайса -->
      <div v-if="!isLoading && !errorMessage">

        <!-- Результаты поиска / пустой список -->
        <div v-if="filteredWorks.length">

          <!-- Меню навигации для заголовков работ (только админ) -->
          <div class="work-navigation" v-if="isAdmin">
            <div class="work-navigation-inner">
              <button :class="{ active: activeWork === 'all' }" @click="setActiveWork('all')">
                Все работы
              </button>
              <button v-for="category in allWorks" :key="category.id" :class="{ active: activeWork === category.id }"
                @click="setActiveWork(category.id)">
                {{ category.title }}
              </button>
              <div v-if="isAdmin" class="add-category-button">
                <button @click="showCategoryForm = true">+ Добавить категорию</button>
                <div v-if="showCategoryForm" class="form">
                  <input v-model="newCategory.name" placeholder="Название категории" />
                  <button @click="addNewCategory">Сохранить</button>
                  <button @click="handleCancel('category')">Отмена</button>
                </div>
              </div>
            </div>
          </div>

          <!-- === КАТЕГОРИИ === -->
          <div v-for="category in filteredWorks" :key="category.id" class="category-block">
            <div class="category-header">
              <div>
                <input v-if="editingCategoryId === category.id" v-model="editingCategoryData.name" style="width: 80%" />
                <h2 v-else>{{ category.title }}</h2>
              </div>
              <div v-if="isAdmin" class="category-actions">
                <Icon v-if="editingCategoryId !== category.id" name="bx:edit" size="16"
                  @click.stop="startEditingCategory(category)" style="cursor: pointer; margin-right: 10px;" />
                <Icon v-else name="mdi:content-save-check-outline" size="16"
                  @click.stop="saveEditCategory(category.id)" style="cursor: pointer; margin-right: 10px;" />
                <Icon name="mdi:delete-forever" size="16" @click.stop="deleteCategory(category.id)"
                  style="cursor: pointer;" />
              </div>
            </div>

            <!-- === ПОДКАТЕГОРИИ === -->
            <div v-for="subcategory in category.subcategories" :key="subcategory.id" class="subcategory-block">
              <div class="subcategory-header">
                <h3 @click="toggleSubcategory(subcategory.id)">
                  {{ subcategory.name }}
                  <Icon :name="isSubcategoryOpen(subcategory.id) ? 'mdi:keyboard-arrow-up' : 'mdi:keyboard-arrow-down'" />
                </h3>
                <div v-if="isAdmin" class="subcategory-actions">
                  <Icon name="bx:edit" size="16" @click.stop="startEditingSubCategory(subcategory)"
                    style="cursor: pointer; margin-right: 10px;" />
                  <Icon name="mdi:delete-forever" size="16" @click.stop="deleteSubCategory(subcategory.id)"
                    style="cursor: pointer;" />
                </div>
              </div>

              <!-- Форма редактирования подкатегории -->
              <div v-if="editingSubCategoryId === subcategory.id" class="form">
                <input v-model="editingSubCategoryData.name" placeholder="Название подкатегории" />
                <button @click="saveEditSubCategory(subcategory.id)">Сохранить</button>
                <button @click="handleCancel('subcategory')">Отмена</button>
              </div>

              <!-- === СПИСОК РАБОТ (v-show вместо v-if!) === -->
              <!-- Добавлены классы для анимации и семантика -->
              <dl v-show="isSubcategoryOpen(subcategory.id)" class="works-list"
                :class="{ 'is-open': isSubcategoryOpen(subcategory.id) }">
                <!-- === ОСНОВНАЯ РАБОТА === -->
                <dl v-for="item in subcategory.items" :key="item.id" class="work-item" itemscope
                  itemtype="https://schema.org/Service">
                  <!-- Название услуги (dt) -->
                  <dt class="work-title-wrapper" itemprop="name">
                    <!-- Иконка копирования (вне dt для чистоты семантики, но внутри обертки) -->
                    <Icon :name="item.isCopied ? 'solar:copy-bold-duotone' : 'solar:copy-linear'" class="pointer ico"
                      @click="handleCopyClick(item)" />

                    <!-- Название (кликабельное) -->
                    <span class="work-title pointer" @click="toggleSubItems(item.id)">
                      <span v-if="editingItem !== item.id">
                        <span v-for="(part, index) in splitText(item.name)" :key="index"
                          :class="{ highlight: part.isMatch }">
                          {{ part.text }}
                        </span>
                      </span>
                      <input v-else v-model="editingItemData.name" class="edit-input" style="width: 80%" />
                    </span>
                  </dt>

                  <!-- Цена и единица (dd) -->
                  <dd class="work-meta" itemprop="offers" itemscope itemtype="https://schema.org/Offer">
                    <span v-if="editingItem !== item.id">
                      <span class="work-price" itemprop="price" :content="item.price">
                        {{ Math.round(item.price) }} ₽ /
                      </span>
                      <meta itemprop="priceCurrency" content="RUB" />
                      <span class="work-unit">{{ item.unit }}</span>
                    </span>

                    <!-- Поля редактирования -->
                    <template v-else>
                      <input v-model="editingItemData.unit" class="edit-input edit-unit" style="width: 50px;" />
                      <input v-model.number="editingItemData.price" class="edit-input edit-price"
                        style="width: 70px;" />
                    </template>
                  </dd>

                  <!-- Кнопки сохранения (при редактировании) -->
                  <div v-if="editingItem === item.id" class="edit-buttons">
                    <button @click="saveEditSubItem(item.id)">Сохранить</button>
                    <button @click="handleCancel('editWork')">Отмена</button>
                  </div>

                  <!-- Кнопки админа -->
                  <div class="work-actions" v-if="isAdmin">
                    <Icon name="bx:edit" size="16" @click.stop="startEditingSubItem(item)" />
                    <Icon name="mdi:delete-forever" size="16" @click.stop="deleteSubItem(item)" />
                  </div>

                  <!-- === ФОРМЫ ДОБАВЛЕНИЯ (детали/доп. работы) === -->
                  <div v-if="isAdmin" class="add-detail-button">
                    <button @click="showDetailFormFor = item.id">+ Добавить деталь</button>
                    <div v-if="showDetailFormFor === item.id" class="form">
                      <input v-model="newDetail.name" placeholder="Название" />
                      <PagesPublicPricesUiSelectOrInput v-model="newDetail.unit" />
                      <input v-model.number="newDetail.price" placeholder="Цена" />
                      <button @click="addNewDetail(item.id)">Сохранить</button>
                      <button @click="handleCancel('detail')">Отмена</button>
                    </div>
                  </div>

                  <div v-if="isAdmin" class="add-dopwork-button">
                    <button @click="showDopworkFormFor = item.id">+ Добавить доп. работу</button>
                    <div v-if="showDopworkFormFor === item.id" class="form">
                      <input v-model="newDopwork.label" placeholder="Метка" />
                      <input v-model="newDopwork.dopwork" placeholder="Название работы" />
                      <PagesPublicPricesUiSelectOrInput v-model="newDopwork.unit" />
                      <input v-model.number="newDopwork.price" placeholder="Цена" />
                      <button @click="addNewDopwork(item.id)">Сохранить</button>
                      <button @click="handleCancel('dopwork')">Отмена</button>
                    </div>
                  </div>

                  <!-- === ВЛОЖЕННЫЕ ЭЛЕМЕНТЫ (v-show вместо v-if!) === -->
                  <!-- ДЕТАЛИ РАБОТ -->
                  <dd class="work-nested" v-show="isSubItemsOpen(item.id)">
                    <dl v-if="item.details.length > 0" class="sub-items">
                      <dl v-for="detail in item.details" :key="detail.id" class="sub-work-item" itemscope
                        itemtype="https://schema.org/Service">
                        <dt class="work-title-wrapper" itemprop="name">
                          <Icon :name="detail.isCopied ? 'solar:copy-line-duotone' : 'solar:copy-broken'"
                            class="pointer ico" @click="handleCopyClick(detail)" />
                          <span class="work-title">
                            <span v-if="editingDetailId !== detail.id">{{ detail.name }}</span>
                            <input v-else v-model="editingDetailData.name" class="edit-input" style="width: 80%" />
                          </span>
                        </dt>
                        <dd class="work-meta" itemprop="offers" itemscope itemtype="https://schema.org/Offer">
                          <span v-if="editingDetailId !== detail.id">
                            <span class="work-price" itemprop="price" :content="detail.price">
                              {{ Math.round(detail.price) }} ₽
                            </span>
                            <meta itemprop="priceCurrency" content="RUB" />
                            <span class="work-unit">{{ item.unit }}</span>
                          </span>
                          <template v-else>
                            <input v-model="editingDetailData.unit" class="edit-input" style="width: 50px;" />
                            <input v-model.number="editingDetailData.price" class="edit-input" style="width: 70px;" />
                          </template>
                        </dd>
                        <div v-if="editingDetailId === detail.id" class="edit-buttons">
                          <button @click="saveEditDetail(detail.id)">Сохранить</button>
                          <button @click="handleCancel('editDetail')">Отмена</button>
                        </div>
                        <div class="work-actions" v-if="isAdmin">
                          <Icon name="bx:edit" size="16" @click.stop="startEditingDetail(detail)" />
                          <Icon name="mdi:delete-forever" size="16"
                            @click.stop="deleteDetail(detail.id)" />
                        </div>
                      </dl>
                    </dl>

                    <!-- ДОП. РАБОТЫ -->
                    <dl v-if="item.dopworks.length > 0" class="sub-items">
                      <p class="dop-work-title">Доп. работы</p>
                      <dl v-for="dopwork in item.dopworks" :key="dopwork.id" class="sub-work-item" itemscope
                        itemtype="https://schema.org/Service">
                        <dt class="work-title-wrapper" itemprop="name">
                          <Icon :name="dopwork.isCopied ? 'solar:copy-line-duotone' : 'solar:copy-broken'"
                            class="pointer ico" @click="handleCopyClick(dopwork)" />
                          <span class="work-title">
                            <span v-if="editingDopworkId !== dopwork.id">
                              {{ dopwork.label }} {{ dopwork.dopwork }}
                            </span>
                            <template v-else>
                              <input v-model="editingDopworkData.label" class="edit-input" style="width: 40%" />
                              <input v-model="editingDopworkData.dopwork" class="edit-input" style="width: 40%" />
                            </template>
                          </span>
                        </dt>
                        <dd class="work-meta" itemprop="offers" itemscope itemtype="https://schema.org/Offer">
                          <span v-if="editingDopworkId !== dopwork.id">
                            <span class="work-price" itemprop="price" :content="dopwork.price">
                              {{ Math.round(dopwork.price) }} ₽
                            </span>
                            <meta itemprop="priceCurrency" content="RUB" />
                            <span class="work-unit">{{ item.unit }}</span>
                          </span>
                          <template v-else>
                            <input v-model="editingDopworkData.unit" class="edit-input" style="width: 50px;" />
                            <input v-model.number="editingDopworkData.price" class="edit-input" style="width: 70px;" />
                          </template>
                        </dd>
                        <div v-if="editingDopworkId === dopwork.id" class="edit-buttons">
                          <button @click="saveEditDopwork(dopwork.id)">Сохранить</button>
                          <button @click="handleCancel('editDopwork')">Отмена</button>
                        </div>
                        <div class="work-actions" v-if="isAdmin">
                          <Icon name="bx:edit" size="16" @click.stop="startEditingDopwork(dopwork)" />
                          <Icon name="mdi:delete-forever" size="16"
                            @click.stop="deleteDopwork(dopwork.id)" />
                        </div>
                      </dl>
                    </dl>
                  </dd>
                  <!-- /ВЛОЖЕННЫЕ ЭЛЕМЕНТЫ -->

                </dl>
                <!-- /ОСНОВНАЯ РАБОТА -->

                <!-- Кнопка добавления новой работы (внутри подкатегории) -->
                <div v-if="isAdmin" class="add-work-button">
                  <button
                    @click="showWorkFormFor = subcategory.id; newWorkForSubcategory[subcategory.id] = { name: '', unit: 'м²', price: '', subCategoryId: subcategory.id }">
                    + Добавить работу
                  </button>
                  <div v-if="showWorkFormFor === subcategory.id" class="form add-form">
                    <input v-model="newWorkForSubcategory[subcategory.id].name" placeholder="Название" />
                    <PagesPublicPricesUiSelectOrInput v-model="newWorkForSubcategory[subcategory.id].unit" />
                    <input v-model.number="newWorkForSubcategory[subcategory.id].price" placeholder="Цена" />
                    <button @click="addNewWork(subcategory.id)">Сохранить</button>
                    <button @click="handleCancel('work')">Отмена</button>
                  </div>
                </div>

              </dl>
              <!-- /СПИСОК РАБОТ -->

            </div>
            <!-- /ПОДКАТЕГОРИИ -->

            <!-- Форма добавления новой подкатегории -->
            <div v-if="isAdmin">
              <button @click="openSubItemForms[category.id] = true">+ Добавить подкатегорию</button>
            </div>
            <div v-if="openSubItemForms[category.id]" class="form">
              <input v-model="newSubItem.name" placeholder="Название" />
              <button @click="addNewSubItem(category.id)">Сохранить</button>
              <button @click="handleCancel('subitem')">Отмена</button>
            </div>
          </div>
          <!-- /КАТЕГОРИИ -->

        </div>
        <!-- /filteredWorks.length -->

        <!-- Ничего не найдено -->
        <div v-else class="no-results">
          Ничего не найдено по запросу "{{ searchQuery }}"
        </div>

      </div>
      <!-- /!isLoading && !errorMessage -->
    </div>
    <!-- /price-list -->
  </div>
  <!-- /container -->
   <UiNotificationsContainer />
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from 'stores/auth'

const props = defineProps({
  activeCategory: {
    type: String,
    required: true
  },
  modelValue: {
    type: String,
    default: 'м²'
  },
})

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// Статические категории (временно)
const categories = [
  { id: "otdelochnye-raboty", name: "Отделочные работы", title: "Отделочные работы" },
  { id: "plumbing", name: "Сантехника", title: "работы по Сантехнике" },
  { id: "electricity", name: "Электромонтаж", title: "Электромонтаж" }
]

// Состояния
const activeCategory = ref(route.params.category || 'floor')
const activeWork = ref('all')
const works = ref([])
const searchQuery = ref('')
const openCategories = ref([])
const openSubItems = ref({})
const openWorks = ref({})
const isLoading = ref(false)
const errorMessage = ref('')
// const isAdmin = ref(false)
const openSubcategories = ref({})
const currentSubcategoryId = ref(null)
const showDetailFormFor = ref(null)
const showDopworkFormFor = ref(null)

// Для редактирования
const editingItemId = ref(null)
const editingItem = ref(null)
const editingItemData = ref({})
const editingDetailId = ref(null)
const editingDetailData = ref({})
const editingDopworkId = ref(null)
const editingDopworkData = ref({})
const editingCategoryId = ref(null)
const editingCategoryData = ref({})
const editingSubCategoryId = ref(null)
const editingSubCategoryData = ref({})
const editingSubItemId = ref(null)
const editingSubItemData = ref({})

// Для форм добавления
const openSubItemForms = ref({})
const newSubItem = ref({
  name: '',       // это будет поле `name`
  categoryId: null // необходимо передавать ID категории
})
const toggleSubcategory = (id) => {
  openSubcategories.value[id] = !openSubcategories.value[id]
  if (searchQuery.value.trim()) {
    openSubcategories.value[id] = true
  }
}
const isSubcategoryOpen = (id) => {
  return !!openSubcategories.value[id]
}
const newWorkForSubcategory = ref({})
const showWorkFormFor = ref(null)

const showDetailForm = ref(false)
const newDetail = ref({
  name: '',
  unit: 'м²',
  price: '',
  itemId: null
})

const showDopworkForm = ref(false)
const newDopwork = ref({
  label: '',
  dopwork: '',
  unit: 'м²',
  price: '',
  itemId: null
})

// Загрузка данных через useAsyncData
const { data: pageData, refresh, pending, error } = await useAsyncData(
  `price-${route.params.category}`,
  async () => {
    // --- ИСПРАВЛЕНИЕ 1: Передача токена на сервер ---
    // Создаём заголовки для запросов
    const headers = {}
    if (authStore.token) {
      headers.Authorization = `Bearer ${authStore.token}`
    }

    // Проверка роли (теперь с передачей токена)
    let isAdminUser = false
    if (authStore.token) {
      try {
        const me = await $fetch('/api/me', {
          headers: headers // Передаём токен
        })
        const userRole = me?.user?.role
        isAdminUser = userRole === 'admin' || userRole === 'manager'
      } catch (err) {
        console.error('Ошибка проверки роли:', err)
        // Не выбрасываем ошибку, продолжаем загрузку прайса
      }
    }

    // Загружаем прайс по категории (с токеном, если есть)
    const priceData = await $fetch(`/api/price/list/${route.params.category}`, {
      headers: headers
    })

    // --- ИСПРАВЛЕНИЕ 2: Очистка данных для сериализации ---
    // Преобразуем priceData в чистый POJO (Plain Old JavaScript Object)
    // Это предотвращает ошибку DevalueError
    const cleanPriceData = JSON.parse(JSON.stringify(priceData))

    return {
      priceData: cleanPriceData,
      isAdminUser
    }
  },
  {
    server: true,
    lazy: false,
    default: () => ({
      priceData: null,
      isAdminUser: false
    }),
    // --- ДОПОЛНЕНИЕ: Обработка ошибок ---
    transform: (input) => input, // Можно использовать для преобразования
    onResponseError: (ctx) => {
      // Логируем ошибку, но не прерываем работу
      console.error('Ошибка при загрузке данных:', ctx.error)
    }
  }
)

// Если ошибка — выбрасываем 404
if (error.value || !pageData.value?.priceData) {
  throw createError({ statusCode: 404, statusMessage: 'Страница прайса не найдена' })
}

// Данные из API
const { priceData, isAdminUser } = pageData.value

// Передаём isAdmin как реактивную переменную
const isAdmin = ref(isAdminUser)

// Вычисляемое свойство для динамического заголовка
const activeCategoryTitle = computed(() => {
  const category = categories.find(cat => cat.id === activeCategory.value)
  return category ? category.title : 'Выберите категорию'
})

// Получение всех категорий из всех категорий
const allWorks = computed(() => {
  return works.value.map(category => ({
    id: category.id,
    title: category.title,
  }))
})

// Фильтрация работ
const filteredWorks = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  let filtered = works.value

  if (activeWork.value !== 'all') {
    filtered = filtered.filter(category => category.id === activeWork.value)
  }

  if (!query) return filtered

  const openSubcategoriesTemp = {}
  const openCategoriesTemp = {}

  const result = filtered
    .map(category => {
      const filteredSubcategories = category.subcategories
        .map(subcategory => {
          const filteredItems = subcategory.items.filter(item => {
            return item.name.toLowerCase().includes(query)
          })

          // Если есть совпадения в работах, открываем подкатегорию
          if (filteredItems.length > 0) {
            openSubcategoriesTemp[subcategory.id] = true
            openCategoriesTemp[category.id] = true
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
    .filter(Boolean)

  // Обновляем состояния открытия
  openSubcategories.value = { ...openSubcategoriesTemp }
  openCategories.value = Object.keys(openCategoriesTemp)

  return result
})

const clearSearch = () => {
  searchQuery.value = ''
}

// Установка активной категории
const setActiveWork = (categoryId) => {
  activeWork.value = categoryId
}

// Проверка, открыта ли работа
const isOpenWork = (id) => {
  return searchQuery.value.trim() ? true : !!openWorks.value[id]
}

// Открыть/закрыть работу
const toggleWork = (id) => {
  openWorks.value[id] = !openWorks.value[id]
}

// Проверка, открыты ли вложенные элементы
const isSubItemsOpen = (id) => {
  return !!(openSubItems.value && openSubItems.value[id])
}

// ✅ Проверка: есть ли у работы вложенный контент
const hasNestedContent = (item) => {
  return (item.details && item.details.length > 0) ||
    (item.dopworks && item.dopworks.length > 0)
}

// ✅ Открыть/закрыть вложенные элементы (только если есть контент)
const toggleSubItems = (id) => {
  // Находим работу по ID во всей структуре
  const findItem = (items) => {
    for (const category of items) {
      for (const subcategory of category.subcategories || []) {
        for (const item of subcategory.items || []) {
          if (item.id === id) return item
          // Проверяем детали и доп. работы на всякий случай
          if (item.details?.some(d => d.id === id)) return item
          if (item.dopworks?.some(d => d.id === id)) return item
        }
      }
    }
    return null
  }

  const item = findItem(works.value)

  // Если работы нет или у неё нет вложенного контента — ничего не делаем
  if (!item || !hasNestedContent(item)) {
    return
  }

  // Переключаем состояние
  if (openSubItems.value[id]) {
    delete openSubItems.value[id]
  } else {
    openSubItems.value[id] = true
  }
}

// Подсветка текста
// Метод splitText для подсветки
const splitText = (text) => {
  if (!text || !searchQuery.value.trim()) return [{ text, isMatch: false }]

  const query = searchQuery.value.trim().toLowerCase()
  const parts = []
  let lastIndex = 0

  while (lastIndex < text.length) {
    const index = text.toLowerCase().indexOf(query, lastIndex)
    if (index === -1) {
      parts.push({ text: text.slice(lastIndex), isMatch: false })
      break
    }

    if (index > lastIndex) {
      parts.push({ text: text.slice(lastIndex, index), isMatch: false })
    }

    parts.push({ text: text.slice(index, index + query.length), isMatch: true })
    lastIndex = index + query.length
  }

  return parts
}

// Скопировать в буфер
const handleCopyClick = (item) => {
  let textToCopy = ''

  if (item.type === 'item' && item.name) {
    textToCopy = item.name
  } else if (item.type === 'detail' && item.name) {
    textToCopy = item.name
  } else if (item.type === 'dopwork') {
    textToCopy = [item.label, item.dopwork].filter(Boolean).join(' ')
  }

  if (!textToCopy) {
    alert('Нет текста для копирования')
    return
  }

  // Проверяем, существует ли navigator.clipboard
  if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        item.isCopied = true
        setTimeout(() => {
          item.isCopied = false
        }, 5000)
      })
      .catch(err => {
        console.error('Ошибка копирования:', err)
        alert('Не удалось скопировать текст. Попробуйте вручную.')
      })
  } else {
    // Резервный метод для небезопасных контекстов
    const textArea = document.createElement('textarea')
    textArea.value = textToCopy
    textArea.style.position = 'fixed'
    textArea.style.opacity = '0'
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    try {
      document.execCommand('copy')
      item.isCopied = true
      setTimeout(() => {
        item.isCopied = false
      }, 5000)
    } catch (err) {
      console.error('Ошибка резервного копирования:', err)
      alert('Не удалось скопировать текст. Попробуйте вручную.')
    } finally {
      document.body.removeChild(textArea)
    }
  }
}

// Смена активной категории
const setCategory = async (categoryId) => {
  await router.push({ params: { category: categoryId } })
}

// Реактивное обновление works при изменении pageData
watch(pageData, () => {
  if (pageData.value?.priceData) {
    works.value = pageData.value.priceData.categories.map(category => ({
      id: category.id,
      title: category.name,
      subcategories: category.subcategories.map(subcategory => ({
        id: subcategory.id,
        name: subcategory.name,
        items: (subcategory.items || []).map(item => ({
          id: item.id,
          name: item.name,
          unit: item.unit,
          price: item.price,
          isCopied: false,
          type: 'item',
          details: (item.details || []).map(detail => ({
            id: detail.id,
            name: detail.name,
            unit: detail.unit,
            price: detail.price,
            isCopied: false,
            type: 'detail'
          })),
          dopworks: (item.dopworks || []).map(dopworkGroup => ({
            id: dopworkGroup.id,
            label: dopworkGroup.label,
            dopwork: dopworkGroup.dopwork,
            unit: dopworkGroup.unit,
            price: dopworkGroup.price,
            isCopied: false,
            type: 'dopwork'
          }))
        }))
      }))
    }))
  }
}, { immediate: true })

// Редактирование
const editors = {
  item: {
    id: editingItemId,
    data: editingItemData
  },
  detail: {
    id: editingDetailId,
    data: editingDetailData
  },
  dopwork: {
    id: editingDopworkId,
    data: editingDopworkData
  },
  category: {
    id: editingCategoryId,
    data: editingCategoryData
  }
}

const startEditing = (type, item) => {
  const editor = editors[type]

  if (!editor) {
    console.warn(`Неизвестный тип редактирования: ${type}`)
    return
  }

  editor.id.value = item.id
  editor.data.value = { ...item }
}

// Сохранение изменений
const saveEdit = async (type, itemId) => {
  try {
    let endpoint = ''
    let payload = {}

    if (type === 'item') {
      endpoint = `/api/price/items/${itemId}`
      payload = editingItemData.value
    } else if (type === 'detail') {
      endpoint = `/api/price/details/${itemId}`
      payload = editingDetailData.value
    } else if (type === 'dopwork') {
      endpoint = `/api/price/dopworks/${itemId}`
      payload = editingDopworkData.value
    }

    await $fetch(endpoint, {
      method: 'PUT',
      body: payload
    })

    editingItemId.value = null
    editingDetailId.value = null
    editingDopworkId.value = null

    await refresh()
  } catch (error) {
    alert(`Ошибка при сохранении: ${error.message}`)
    console.error(error)
  }
}

// Удаление элемента
const deleteItem = async (type, itemId) => {
  if (!confirm('Вы уверены, что хотите удалить этот элемент?')) return
  try {
    await $fetch(`/api/price/${type}/${itemId}`, {
      method: 'DELETE'
    })
    await refresh()
  } catch (error) {
    alert('Ошибка при удалении')
    console.error(error)
  }
}

// Для формы добавления категории
const showCategoryForm = ref(false)
const newCategory = ref({
  name: '',
  pageId: null // ID текущей страницы, например, из `data.id`
})

// Метод добавления новой категории
const addNewCategory = async () => {
  const categoryToPageMap = {
    floor: 1,
    walls: 2,
    ceiling: 3,
    plumbing: 4,
    electricity: 5,
    other: 6
    // Добавьте другие категории при необходимости
  }

  const pageId = categoryToPageMap[activeCategory.value] || null

  newCategory.value.pageId = pageId

  try {
    await $fetch('/api/price/categories', {
      method: 'POST',
      body: newCategory.value
    })
    showCategoryForm.value = false
    newCategory.value = { name: '', pageId: null }
    // Перезагружаем данные
    await refresh()
  } catch (error) {
    alert('Ошибка при добавлении категории')
    console.error(error)
  }
}

// Начать редактирование категории
const startEditingCategory = (category) => {
  editingCategoryId.value = category.id
  editingCategoryData.value = { ...category }
}

// Сохранить изменения категории
const saveEditCategory = async (categoryId) => {
  try {
    await $fetch(`/api/price/categories/${categoryId}`, {
      method: 'PUT',
      body: editingCategoryData.value
    })

    editingCategoryId.value = null
    editingCategoryData.value = {}

    await refresh()
  } catch (error) {
    alert('Ошибка при сохранении категории')
    console.error(error)
  }
}

// Удалить категорию
const deleteCategory = async (categoryId) => {
  if (!confirm('Вы уверены, что хотите удалить эту категорию?')) return
  try {
    await $fetch(`/api/price/categories/${categoryId}`, {
      method: 'DELETE'
    })
    await refresh()
  } catch (error) {
    alert('Ошибка при удалении категории')
    console.error(error)
  }
}

const startEditingSubCategory = (subcategory) => {
  editingSubCategoryId.value = subcategory.id
  editingSubCategoryData.value = { ...subcategory }
}

const saveEditSubCategory = async (subcategoryId) => {
  try {
    await $fetch(`/api/price/subcategories/${subcategoryId}`, {
      method: 'PUT',
      body: editingSubCategoryData.value
    })
    editingSubCategoryId.value = null
    editingSubCategoryData.value = {}
    await refresh()
  } catch (error) {
    alert('Ошибка при сохранении подкатегории')
    console.error(error)
  }
}

const deleteSubCategory = async (subcategoryId) => {
  if (!confirm('Вы уверены, что хотите удалить эту подкатегорию?')) return
  try {
    await $fetch(`/api/price/subcategories/${subcategoryId}`, {
      method: 'DELETE'
    })
    await refresh()
  } catch (error) {
    alert('Ошибка при удалении подкатегории')
    console.error(error)
  }
}

// Добавление подкатегории
const startEditingSubItem = (item) => {
  editingItem.value = item.id
  editingItemData.value = { ...item }
}

const saveEditSubItem = async () => {
  if (!editingItem.value) return
  try {
    const updatedItem = await $fetch(`/api/price/items/${editingItem.value}`, {
      method: 'PUT',
      body: editingItemData.value
    })

    // Найдём индексы для обновления
    const categoryIndex = works.value.findIndex(category =>
      category.subcategories.some(subcat => subcat.items.some(i => i.id === updatedItem.id))
    )

    if (categoryIndex !== -1) {
      const subcategoryIndex = works.value[categoryIndex].subcategories.findIndex(
        subcat => subcat.items.some(i => i.id === updatedItem.id)
      )
      const itemIndex = works.value[categoryIndex].subcategories[subcategoryIndex].items.findIndex(
        i => i.id === updatedItem.id
      )

      // Обновляем реактивно
      const newItems = [...works.value[categoryIndex].subcategories[subcategoryIndex].items]
      newItems[itemIndex] = updatedItem
      works.value[categoryIndex].subcategories[subcategoryIndex].items = newItems
    }

    // Сброс состояния
    editingItem.value = null
    editingItemData.value = {}

    await refresh()
  } catch (error) {
    alert('Ошибка при сохранении')
    console.error(error)
  }
}

const deleteSubItem = async (item) => {
  if (!confirm(`Вы уверены, что хотите удалить "${item.name}"?`)) return
  try {
    await $fetch(`/api/price/items/${item.id}`, {
      method: 'DELETE'
    })
    alert('Работа успешно удалена')
    loadCategoryData(activeCategory.value) // Обновляем список
  } catch (error) {
    alert('Ошибка при удалении работы')
    console.error(error)
  }
}

const addNewSubItem = async (categoryId) => {
  if (!newSubItem.value.name || !categoryId) {
    alert("Заполните все поля")
    return
  }
  try {
    await $fetch('/api/price/subcategories', {
      method: 'POST',
      body: {
        categoryId: categoryId,
        name: newSubItem.value.name
      }
    })

    // Закрываем форму только этой категории
    openSubItemForms.value[categoryId] = false

    // Очищаем поле
    newSubItem.value.name = ''

    await refresh()
  } catch (error) {
    alert('Ошибка при добавлении подкатегории')
    console.error(error)
  }
}

// Добавление работы
const addNewWork = async (subcategoryId) => {
  const work = newWorkForSubcategory.value[subcategoryId]

  if (!work.name || !work.unit || !work.price === null) {
    alert('Заполните все поля!')
    return
  }

  try {
    await $fetch('/api/price/items', {
      method: 'POST',
      body: {
        name: work.name,
        unit: work.unit,
        price: parseFloat(work.price).toString(),
        subCategoryId: work.subCategoryId
      }
    })

    showWorkFormFor.value = null
    await refresh()
  } catch (error) {
    alert('Ошибка при добавлении работы')
    console.error(error)
  }
}

// Начать редактирование детали
const startEditingDetail = (detail) => {
  editingDetailId.value = detail.id
  editingDetailData.value = { ...detail }
}

// Сохранить изменения детали
const saveEditDetail = async () => {
  try {
    await $fetch(`/api/price/details/${editingDetailId.value}`, {
      method: 'PUT',
      body: editingDetailData.value
    })

    editingDetailId.value = null
    editingDetailData.value = {}

    // Перезагружаем данные после обновления
    await refresh()
  } catch (error) {
    alert('Ошибка при сохранении детали')
    console.error(error)
  }
}

// Удалить деталь
const deleteDetail = async (detailId) => {
  if (!confirm('Вы уверены, что хотите удалить эту деталь?')) return

  try {
    await $fetch(`/api/price/details/${detailId}`, {
      method: 'DELETE'
    })

    // Перезагружаем данные после удаления
    await refresh()
  } catch (error) {
    alert('Ошибка при удалении детали')
    console.error(error)
  }
}

// Добавление деталей
// Метод добавления новой детали
const addNewDetail = async (itemId) => {
  if (!newDetail.value.name || !newDetail.value.unit || !newDetail.value.price) {
    alert('Заполните все поля!')
    return
  }

  newDetail.value.itemId = itemId

  try {
    await $fetch('/api/price/details', {
      method: 'POST',
      body: newDetail.value
    })

    showDetailFormFor.value = null
    newDetail.value = { name: '', unit: 'м²', price: '', itemId: null }

    // Перезагружаем данные после добавления
    await refresh()
  } catch (error) {
    alert('Ошибка при добавлении детали')
    console.error(error)
  }
}

// Добавление доп.работы
const addNewDopwork = async (itemId) => {
  newDopwork.value.itemId = itemId
  try {
    await $fetch('/api/price/dopworks', {
      method: 'POST',
      body: newDopwork.value
    })
    showDopworkFormFor.value = null
    newDopwork.value = { label: '', dopwork: '', unit: 'м²', price: '', itemId: null }
    await refresh()
  } catch (error) {
    alert('Ошибка при добавлении доп.работы')
    console.error(error)
  }
}

// Начать редактирование доп. работы
const startEditingDopwork = (dopwork) => {
  editingDopworkId.value = dopwork.id
  editingDopworkData.value = { ...dopwork }
}

// Сохранить изменения доп. работы
const saveEditDopwork = async () => {
  try {
    await $fetch(`/api/price/dopworks/${editingDopworkId.value}`, {
      method: 'PUT',
      body: editingDopworkData.value
    })
    editingDopworkId.value = null
    editingDopworkData.value = {}
    await refresh()
  } catch (error) {
    alert('Ошибка сохранения допработы')
    console.error(error)
  }
}

// Удалить доп. работу
const deleteDopwork = async (id) => {
  if (!confirm('Вы уверены?')) return
  try {
    await $fetch(`/api/price/dopworks/${id}`, {
      method: 'DELETE'
    })
    await refresh()
  } catch (error) {
    alert('Ошибка удаления допработы')
    console.error(error)
  }
}

// Общая логика для кнопок отмены
const handleCancel = (type) => {
  switch (type) {
    case 'category':
      showCategoryForm.value = false
      newCategory.value = { name: '', pageId: null }
      break
    case 'subcategory':
      editingSubCategoryId.value = null
      editingSubCategoryData.value = {}
      break
    case 'work':
      showWorkFormFor.value = null
      newWorkForSubcategory.value = {}
      break
    case 'detail':
      showDetailFormFor.value = null
      newDetail.value = { name: '', unit: '', price: '', itemId: null }
      break
    case 'dopwork':
      showDopworkFormFor.value = null
      newDopwork.value = { label: '', dopwork: '', unit: '', price: '', itemId: null }
      break
    case 'subitem':
      openSubItemForms.value = {}
      newSubItem.value = { name: '' }
      break
    case 'editWork': // Редактирование работы
      editingItem.value = null
      editingItemData.value = {}
      break
    case 'editDetail': // Редактирование детали
      editingDetailId.value = null
      editingDetailData.value = {}
      break
    case 'editDopwork': // Редактирование допработы
      editingDopworkId.value = null
      editingDopworkData.value = {}
      break
    default:
      console.warn('Неизвестный тип отмены:', type)
  }
}
</script>

<style lang="scss" scoped>
$primary-color: #00c3f5;
$highlight-color: #00c3f5;
$border-color: #ddd;
$background-light: #f7f7f7;
$sub-item-bg: #f0f0f0;
$text-color: #18191b;
$shadow-color: rgba(0, 0, 0, 0.05);
$blue: #00a3d3;
$text-light: #fff;

.container {
  max-width: 1200px;
  margin: auto;
  border-radius: 5px;

  @media (max-width: 768px) {
    margin-top: 2em;
    padding: 0;
  }
}

.pointer {
  cursor: pointer;
}

h1,
h2 {
  text-align: center;
  color: $text-color;
  font-size: 1.7rem;
}

@media (max-width: 768px) {
  h1 {
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

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  scrollbar-width: thin;
  scrollbar-color: #ccc transparent;
}

.work-navigation-inner {
  display: inline-flex;
  gap: 10px;
  padding: 10px 0;
}

.work-navigation button {
  flex-shrink: 0;
  padding: 10px 15px 8px;
  cursor: pointer;
  border-bottom: 1px solid $primary-color;
  background: #fff;
  color: $text-color;
  border-radius: 5px;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 4px 10px rgba(0, 195, 245, 0.3);

  &.active {
    background: $blue;
    color: $text-light;
  }

  &:hover {
    background: $blue;
    box-shadow: 0 4px 10px rgba(0, 195, 245, 0.3);
  }
}

/* Поиск */
.search-bar {
  margin-bottom: 15px;

  input {
    width: 100%;
    padding: 10px 15px;
    color: $text-color;
    border: 1px solid $border-color;
    border-radius: 5px;
    outline: none;
    transition: all 0.3s ease;
    box-shadow: inset 0 2px 5px rgba(0, 0, 0, 0.05);

    &:focus {
      border-color: $primary-color;
      box-shadow: 0 0 5px rgba(0, 195, 245, 0.5);
    }
  }

  .search-icon {
    position: absolute;
    left: 10px;
    top: 50%;
    transform: translateY(-50%);
    pointer-events: none;
  }

  .ico {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    cursor: pointer;
  }
}

/* Таблица цен */
.price-list {
  border: 1px solid $border-color;
  border-radius: 5px;
  padding: 20px;
  background: $background-light;
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

  .loader,
  .error-message {
    text-align: center;
    padding: 20px;
    font-weight: bold;
  }

  .no-results {
    text-align: center;
    padding: 40px;
    color: #888;
    font-style: italic;
  }
}

/* === SEO: Визуальное скрытие списка работ (контент остаётся в DOM) === */
.works-list {
  max-height: 0;
  overflow: hidden;
  opacity: 0;
  visibility: hidden;
  margin: 0;
  padding: 0;
  transition: max-height 0.3s ease, opacity 0.3s ease, visibility 0.3s;

  &.is-open {
    max-height: 50000px; // Достаточно для любого объёма прайса
    opacity: 1;
    visibility: visible;
  }
}

/* Категории */
.category-block {
  margin-bottom: 20px;
  border-bottom: 1px solid #ddd;

  &:last-child {
    border-bottom: none;
  }

  .category-header {
    margin-bottom: 10px;
    display: flex;
    justify-content: center;
    gap: 1em;

    h2 {
      font-size: 1.5rem;
      color: $text-color;

      @media (max-width: 768px) {
        font-size: 1.2rem;
      }
    }

    .category-actions {
      display: flex;
      margin-top: .5em;
      gap: 10px;

      .ico {
        cursor: pointer;
        transition: transform 0.3s ease;

        &:hover {
          transform: scale(1.2);
        }
      }
    }
  }
}

/* Подкатегории */
.subcategory-block {
  margin-bottom: 15px;
}

.subcategory-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
  background: linear-gradient(to bottom, #ffffff, #f7f7f7);
  transition: border 1.3s ease, box-shadow 1.3s ease;
  border-radius: 5px;
  border: 1px solid $border-color;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);

  &:hover {
    border: 1px solid #00c3f5;
    box-shadow: 0 4px 10px rgba(0, 195, 245, 0.2);
    transition: border 0.3s ease, box-shadow 0.3s ease;
  }

  h3 {
    cursor: pointer;
    font-size: 1rem;
    width: 100%;
    padding: 10px 15px;
    margin: 0;

    .ico {
      margin-left: 1em;
      width: 22px;
      height: 22px;
      transition: transform 0.3s ease;

      &:hover {
        transform: scale(1.2);
        color: #fff;
      }
    }
  }

  .subcategory-actions {
    display: flex;
    margin-right: 1em;
  }
}

/* === Основная работа (адаптировано под <dl>) === */
.work-item {
  display: flex;
  // flex-direction: column;
  justify-content: space-between;
  padding: 10px;
  border-bottom: 1px solid $border-color;
  transition: all 0.3s ease;

  &:hover {
    background: $sub-item-bg;
  }

  /* Заголовок + иконка копирования */
  .work-title-wrapper {
    display: flex;
    align-items: center;
    margin-bottom: 8px;

    .ico {
      margin-right: 1em;
      transition: transform 0.3s ease;

      &:hover {
        transform: scale(1.2);
      }
    }

    .work-title {
      flex: 1;
      white-space: pre-wrap;
      font-size: 1rem;
      color: $text-color;
      display: flex;
      align-items: center;
      gap: 8px;

      .highlight {
        background-color: $highlight-color;
        color: white;
        font-weight: bold;
        padding: 2px 5px;
        border-radius: 3px;
      }

      span {
        color: unset;
      }

      @media (max-width: 768px) {
        font-size: 0.8rem;
      }
    }
  }

  /* Цена и единицы */
  .work-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    // margin-bottom: 8px;
    min-width: 110px;
    justify-content: right;
    // border: 1px solid red;
    text-align: right;

    .work-unit,
    .work-price {
      display: inline-flex;
      align-items: center;
      width: auto;
      margin: 0 2px;
      font-size: 0.9rem;
      color: #555;
    }
  }

  /* Кнопки админа */
  .work-actions {
    display: flex;
    gap: 10px;
    margin-top: 5px;

    .ico {
      cursor: pointer;
      transition: transform 0.3s ease;

      &:hover {
        transform: scale(1.2);
      }
    }
  }

  .edit-buttons {
    display: flex;
    gap: 10px;
    margin-top: 5px;

    button {
      padding: 6px 12px;
      font-size: 0.8rem;
      border-radius: 4px;
      cursor: pointer;
    }
  }

  /* Вложенные элементы (детали/доп. работы) */
  .work-nested {
    width: 100%;
    padding-left: 20px;
    background: $sub-item-bg;
    margin-top: 1em;
    border-radius: 5px;

    .dop-work-title {
      text-align: center;
    }
  }
}

/* === Вложенные работы (адаптировано под <dl>) === */
.sub-items {
  padding: 5px 0;
}

.sub-work-item {
  display: flex;
  flex-direction: column;
  padding: 5px 0;
  border-bottom: 1px solid $border-color;
  gap: 4px;

  &:last-child {
    border-bottom: none;
  }

  .work-title-wrapper {
    .work-title {
      font-weight: normal;
      color: #555;
      font-size: 0.9rem;

      @media (max-width: 768px) {
        font-size: 0.8rem;
      }
    }
  }

  .work-meta {

    .work-unit,
    .work-price {
      font-size: 0.85rem;
    }
  }

  .work-actions {
    gap: 10px;
    margin-top: 4px;
  }
}

/* Формы и кнопки */
.add-work-button {
  margin-top: 1em;
  text-align: center;

  .add-form {
    display: flex;
    gap: 1em;
    margin-top: 1em;
  }
}

.form {
  margin-top: 10px;
  display: flex;
  gap: 10px;

  input {
    padding: 8px;
    margin-bottom: 5px;
    border: 1px solid $border-color;
    border-radius: 4px;
  }

  button {
    padding: 8px 12px;
    border: none;
    border-radius: 4px;
    cursor: pointer;

    &:first-child {
      background: $primary-color;
      color: white;
    }

    &:last-child {
      background: #ddd;
      color: #333;
    }
  }
}

/* Анимация уведомления */
.fade-animation {
  transition: opacity 0.3s ease-in-out;

  &.hidden {
    opacity: 0;
  }
}

/* Адаптивность */
@media (max-width: 768px) {
  h1 {
    font-size: 1.5em;
    margin-bottom: .5em;
  }

  .search-bar input {
    width: 100%;
  }

  .price-list {
    font-size: 0.9rem;
  }
}
</style>
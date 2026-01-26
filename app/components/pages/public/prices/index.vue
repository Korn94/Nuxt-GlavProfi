<template>
  <div class="container" :key="activeCategory" >
    <!-- Заголовок -->

    <!-- Динамический подзаголовок -->
    <h1>Актуальные цены на <span>{{ activeCategoryTitle }}</span> - 2026 год</h1>

    <!-- Навигация -->
    <PagesPublicPricesUiNavigation
      :categories="categories"
      :active-category="activeCategory"
      @update:active-category="setCategory"
    />

    <!-- Таблица -->
    <div class="price-list">

      <!-- Поиск -->
      <div class="search-bar">
        <!-- Обертка с относительным позиционированием -->
        <div style="position: relative; width: 100%;">
          <!-- Иконка поиска -->
          <Icon 
            name="material-symbols:search" 
            class="search-icon"
            width="24" 
            height="24"
          />
          <!-- Инпут с отступом слева, чтобы не перекрывать иконку -->
          <input
            type="text"
            v-model="searchQuery"
            placeholder="Поиск по работам..."
            style="padding-left: 36px; padding-right: 30px; width: 100%;"
          />
          <!-- Иконка "очистить" -->
          <Icon 
            v-if="searchQuery"
            name="material-symbols:close" 
            class="ico"
            width="24" 
            height="24"
            @click="clearSearch"
          />
        </div>
      </div>

      <!-- Условие загрузки -->
      <!-- Индикатор загрузки -->
      <div v-if="isLoading" class="loading-indicator">
        <Icon name="eos-icons:bubble-loading" size="34px" />
        <span>Загрузка данных...</span>
      </div>
      <!-- Условие ошибки -->
      <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>

      <!-- Блок с результатами поиска или сообщением "Ничего не найдено" -->
      <div v-if="!isLoading && !errorMessage">
      <div v-if="filteredWorks.length">
      <!-- Меню навигации для заголовков работ -->
      <div class="work-navigation" v-if="isAdmin">
        <div class="work-navigation-inner">
          <button
            :class="{ active: activeWork === 'all' }"
            @click="setActiveWork('all')"
          >
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
            <button @click="showCategoryForm = true">+ Добавить категорию</button>
            <div v-if="showCategoryForm" class="form">
              <input v-model="newCategory.name" placeholder="Название категории" />
              <button @click="addNewCategory">Сохранить</button>
              <button @click="handleCancel('category')">Отмена</button>
            </div>
          </div>
        </div>
      </div>
    
      <!-- Категории, условие если есть работы -->
        <div v-for="category in filteredWorks" :key="category.id" class="category-block">
          <div class="category-header">
            <!-- Заголовок категории -->
            <div>
              <input v-if="editingCategoryId === category.id" v-model="editingCategoryData.name" style="width: 80%" />
              <h2 v-else>{{ category.title }}</h2>
            </div>
            <!-- Кнопки только для админа -->
            <div v-if="isAdmin" class="category-actions">
              <Icon v-if="editingCategoryId !== category.id" name="bx:edit" size="16" @click.stop="startEditingCategory(category)" style="cursor: pointer; margin-right: 10px;" />
              <Icon v-else name="material-symbols-light:save-outline" size="16" @click.stop="saveEditCategory(category.id)" style="cursor: pointer; margin-right: 10px;" />
              <Icon name="material-symbols:delete-outline" size="16" @click.stop="deleteCategory(category.id)" style="cursor: pointer;" />
            </div>
          </div>
          <!-- Отображение подкатегорий -->
          <div v-for="subcategory in category.subcategories" :key="subcategory.id" class="subcategory-block">
            <div class="subcategory-header">
              <h3 @click="toggleSubcategory(subcategory.id)">
                {{ subcategory.name }}
                <Icon :name="isSubcategoryOpen(subcategory.id) ? 'iconamoon:arrow-up-2' : 'iconamoon:arrow-down-2'" />
              </h3>
              <div v-if="isAdmin" class="subcategory-actions">
                <Icon name="bx:edit" size="16" @click.stop="startEditingSubCategory(subcategory)" style="cursor: pointer; margin-right: 10px;" />
                <Icon name="material-symbols:delete-outline" size="16" @click.stop="deleteSubCategory(subcategory.id)" style="cursor: pointer;" />
              </div>
            </div>
            <!-- Форма редактирования подкатегории -->
            <div v-if="editingSubCategoryId === subcategory.id" class="form">
              <input v-model="editingSubCategoryData.name" placeholder="Название подкатегории" />
              <button @click="saveEditSubCategory(subcategory.id)">Сохранить</button>
              <button @click="handleCancel('subcategory')">Отмена</button>
            </div>
            <!-- Список работ внутри подкатегории -->
            <ul v-if="isSubcategoryOpen(subcategory.id)">
              <li v-for="item in subcategory.items" :key="item.id" class="work-item">
                <!-- Основная работа -->
                <div class="work-main">
                  <!-- Иконка копирования -->
                  <Icon :name="item.isCopied ? 'fluent:copy-16-filled' : 'fluent:copy-16-regular'" 
                        class="pointer ico" 
                        @click="handleCopyClick(item)" />
                  <!-- Поле для редактирования или отображения -->
                  <div class="work-title pointer" @click="toggleSubItems(item.id)">
                      <p v-if="editingItem !== item.id">
                        <span v-for="(part, index) in splitText(item.name)" :key="index" 
                              :class="{ highlight: part.isMatch }">
                          {{ part.text }}
                        </span>
                      </p>
                    <input v-else v-model="editingItemData.name" style="width: 80%" />
                  </div>
                  <p v-if="editingItem !== item.id" class="work-unit">{{ item.unit }}</p>
                  <input v-else v-model="editingItemData.unit" style="width: 50px;" />
                  <p v-if="editingItem !== item.id" class="work-price">{{ Math.round(item.price) }} ₽</p>
                  <input v-else v-model.number="editingItemData.price" style="width: 70px;" />
                  <!-- Кнопки сохранения и отмены -->
                  <div v-if="editingItem === item.id" class="edit-buttons">
                    <button @click="saveEditSubItem(editingItem.value)">Сохранить</button>
                    <button @click="handleCancel('editWork')">Отмена</button>
                  </div>
                  <!-- Кнопки редактирования и удаления -->
                  <div class="actions" v-if="isAdmin">
                    <Icon name="bx:edit" size="16" @click.stop="startEditingSubItem(item)" />
                    <Icon name="material-symbols:delete-outline" size="16" @click.stop="deleteSubItem(item)" />
                  </div>
                </div>

                <!-- Формы добавления деталей и допработ -->
                <div v-if="isAdmin" class="add-detail-button">
                  <button @click="showDetailFormFor = item.id">+ Добавить деталь</button>
                  <div v-if="showDetailFormFor === item.id" class="form">
                    <input v-model="newDetail.name" placeholder="Название" />
                    <!-- <input v-model="newDetail.unit" placeholder="Ед. изм." /> -->
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
                    <!-- <input v-model="newDopwork.unit" placeholder="Ед. изм." /> -->
                    <PagesPublicPricesUiSelectOrInput v-model="newDopwork.unit" />
                    <input v-model.number="newDopwork.price" placeholder="Цена" />
                    <button @click="addNewDopwork(item.id)">Сохранить</button>
                    <button @click="handleCancel('dopwork')">Отмена</button>
                  </div>
                </div>

                <!-- Вложенные элементы (детали и допработы) -->
                <!-- Для деталей -->
                <ul v-if="item.details.length > 0 && isSubItemsOpen(item.id)" class="sub-items">
                  <li v-for="detail in item.details" :key="detail.id" class="sub-work-item">
                    <div class="work-main">
                      <!-- Иконка копирования -->
                      <Icon :name="detail.isCopied ? 'fluent:copy-16-filled' : 'fluent:copy-16-regular'" 
                            class="pointer ico" 
                            @click="handleCopyClick(detail)" />
                      <!-- Поле для редактирования или отображения -->
                      <div class="work-title pointer" @click="toggleSubItems(detail.id)">
                        <p v-if="editingDetailId !== detail.id">{{ detail.name }}</p>
                        <input v-else v-model="editingDetailData.name" style="width: 80%" />
                      </div>
                      <p v-if="editingDetailId !== detail.id" class="work-unit">{{ detail.unit }}</p>
                      <input v-else v-model="editingDetailData.unit" style="width: 50px;" />
                      <p v-if="editingDetailId !== detail.id" class="work-price">{{ Math.round(detail.price) }} ₽</p>
                      <input v-else v-model.number="editingDetailData.price" style="width: 70px;" />
                      <!-- Кнопки сохранения и отмены -->
                      <div v-if="editingDetailId === detail.id" class="edit-buttons">
                        <button @click="saveEditDetail(detail.id)">Сохранить</button>
                        <button @click="handleCancel('editDetail')">Отмена</button>
                      </div>
                      <!-- Кнопки редактирования и удаления -->
                      <div class="actions" v-if="isAdmin">
                        <Icon name="bx:edit" size="16" @click.stop="startEditingDetail(detail)" />
                        <Icon name="material-symbols:delete-outline" size="16" @click.stop="deleteDetail(detail.id)" />
                      </div>
                    </div>
                  </li>
                </ul>

                <!-- Для допработ -->
                <ul v-if="item.dopworks.length > 0 && isSubItemsOpen(item.id)" class="sub-items">
                  <p class="dop-work-title">Доп. работы</p>
                  <li v-for="dopwork in item.dopworks" :key="dopwork.id" class="sub-work-item">
                    <div class="work-main">
                      <!-- Иконка копирования -->
                      <Icon :name="dopwork.isCopied ? 'fluent:copy-16-filled' : 'fluent:copy-16-regular'" 
                            class="pointer ico" 
                            @click="handleCopyClick(dopwork)" />
                      <!-- Поле для редактирования или отображения -->
                      <div class="work-title pointer" @click="toggleSubItems(dopwork.id)">
                        <p v-if="editingDopworkId !== dopwork.id">
                          {{ dopwork.label }} {{ dopwork.dopwork }}
                        </p>
                        <div v-else>
                          <input v-model="editingDopworkData.label" style="width: 40%" />
                          <input v-model="editingDopworkData.dopwork" style="width: 40%" />
                        </div>
                      </div>
                      <p v-if="editingDopworkId !== dopwork.id" class="work-unit">{{ dopwork.unit }}</p>
                      <input v-else v-model="editingDopworkData.unit" style="width: 50px;" />
                      <p v-if="editingDopworkId !== dopwork.id" class="work-price">{{ Math.round(dopwork.price) }} ₽</p>
                      <input v-else v-model.number="editingDopworkData.price" style="width: 70px;" />
                      <!-- Кнопки сохранения и отмены -->
                      <div v-if="editingDopworkId === dopwork.id" class="edit-buttons">
                        <button @click="saveEditDopwork(dopwork.id)">Сохранить</button>
                        <button @click="handleCancel('editDopwork')">Отмена</button>
                      </div>
                      <!-- Кнопки редактирования и удаления -->
                      <div class="actions" v-if="isAdmin">
                        <Icon name="bx:edit" size="16" @click.stop="startEditingDopwork(dopwork)" />
                        <Icon name="material-symbols:delete-outline" size="16" @click.stop="deleteDopwork(dopwork.id)" />
                      </div>
                    </div>
                  </li>
                </ul>
              </li>
              <!-- Кнопка добавления новой работы (внутри подкатегории) -->
              <div v-if="isAdmin" class="add-work-button">
                <button @click="showWorkFormFor = subcategory.id; newWorkForSubcategory[subcategory.id] = { name: '', unit: 'м²', price: '', subCategoryId: subcategory.id }">
                  + Добавить работу
                </button>
                <div v-if="showWorkFormFor === subcategory.id" class="form add-form">
                  <input v-model="newWorkForSubcategory[subcategory.id].name" placeholder="Название" />
                  <!-- <input v-model="newWorkForSubcategory[subcategory.id].unit" placeholder="Ед. изм." /> -->
                    <PagesPublicPricesUiSelectOrInput v-model="newWorkForSubcategory[subcategory.id].unit" />
                  <input v-model.number="newWorkForSubcategory[subcategory.id].price" placeholder="Цена" />
                  <button @click="addNewWork(subcategory.id)">Сохранить</button>
                  <button @click="handleCancel('work')">Отмена</button>
                </div>
              </div>
            </ul>
          </div>
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
      </div>


    <div v-else class="no-results">
      Ничего не найдено по запросу "{{ searchQuery }}"
    </div>
  </div>
    <!-- Всплывающее окно для уведомления -->
    <UiAlerts
      :visible="notificationVisible"
      @update:visible="notificationVisible = $event"
      class="fade-animation"
    />
  </div>
</div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useCookie } from '#app'

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
const token = useCookie('token')

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
const notificationVisible = ref(false)
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
    if (token.value) {
      headers.Authorization = `Bearer ${token.value}`
    }

    // Проверка роли (теперь с передачей токена)
    let isAdminUser = false
    if (token.value) {
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

// Открыть/закрыть вложенные элементы
const toggleSubItems = (id) => {
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
        notificationVisible.value = true
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
      notificationVisible.value = true
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

.container {
  max-width: 1200px;
  margin: auto;
  // padding: 40px 10px 0;
  border-radius: 5px;
  @media (max-width: 768px) {
    margin-top: 2em;
    padding: 0;
  }
}

.pointer {
  cursor: pointer;
}

h1, h2 {
  text-align: center;
  color: $text-color;
  font-size: 1.8rem;
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
    // color: $sub-item-bg;
    background: $blue;
  }
  
  &:hover {
    background: $blue;
    box-shadow: 0 4px 10px rgba(0, 195, 245, 0.3);
  }
}

/* Поиск */
.search-bar {
  margin-bottom: 15px;
  // @media (max-width: 768px) {
  //   padding: 0 10px;
  // }
  
  input {
    width: 100%;
    padding: 10px 15px;
    color: $text-color;
    border: 1px solid $border-color;
    border-radius: 5px;
    outline: none;
    transition: all 0.3s ease;
    box-shadow: inset 0 2px 5px rgba(0, 0, 0, 0.05);
    // box-shadow: 0 0 5px rgba(0, 195, 245, 0.5);
    
    &:focus {
      border-color: $primary-color;
      box-shadow: 0 0 5px rgba(0, 195, 245, 0.5);
    }
  }

  
  .search-icon {
    position: absolute;
    left: 10px; top: 50%;
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
  
  .loader, .error-message {
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
    
    .subcategory-block {
      margin-bottom: 15px;
      
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
            // background: linear-gradient(to right, #00c3f5, #00a3d3);
            // background: linear-gradient(to right, #56d8f8, #f7f7f7);
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
    }

    .add-work-button {
      margin-top: 1em;
      text-align: center;

      .add-form {
        display: flex;
        gap: 1em;
        margin-top: 1em;
      }
    }
    
    .work-item {
      display: flex;
      flex-direction: column;
      padding: 10px;
      border-bottom: 1px solid $border-color;
      transition: all 0.3s ease;
      
      &:hover {
        background: $sub-item-bg;
      }
      
      .work-main {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        
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

          span {
            color: unset;
          }
          
          .highlight {
            background-color: $highlight-color;
            color: white;
            font-weight: bold;
            padding: 2px 5px;
            border-radius: 3px;
          }
          
          @media (max-width: 768px) {
            font-size: 0.8rem;
          }
        }
        
        .work-unit, .work-price {
          display: inline-flex;
          align-items: center;
          width: auto;
          margin: 0 .5em;
          font-size: 0.9rem;
          color: #555;
        }
      }
      
      .actions {
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
      
      .sub-items {
        // width: 100%;
        padding-left: 20px;
        background: $sub-item-bg;
        margin-top: 1em;
        border-radius: 5px;

        .dop-work-title {
          text-align: center;
          // padding-top: 10px;
        }
        
        .sub-work-item {
          display: flex;
          flex-direction: column;
          padding: 5px 0;
          border-bottom: 1px solid $border-color;
          
          .work-main {
            // flex-direction: row;
            // align-items: flex-start;
            
            .work-title {
              font-weight: normal;
              color: #555;
              font-size: 0.9rem;
              @media (max-width: 768px) {
                font-size: 0.8rem;
              }
            }
          }
        }
      }
      
      /* Формы добавления */
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
    }
  }
}

/* Модальные окна */
.fade-animation {
  transition: opacity 0.3s ease-in-out;
  &.hidden {
    opacity: 0;
  }
}

/* Адаптивность */
@media (max-width: 768px) {
  // .container {
  //   margin: 5em 5px;
  // }
  
  h1 {
    font-size: 1.5em;
    margin-bottom: .5em;
  }
  
  // .work-navigation-inner {
  //   flex-direction: column;
  //   gap: 5px;
  // }
  
  .search-bar input {
    width: 100%;
  }
  
  .price-list {
    font-size: 0.9rem;
  }
}
</style>
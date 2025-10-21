<template>
  <div class="price-editor">
    <h1>Редактор прайс-листа</h1>
    
    <!-- Выбор уровня редактирования -->
    <div class="level-selector">
      <select v-model="selectedLevel" class="level-select">
        <option value="pages">Страницы</option>
        <option value="categories">Категории</option>
        <option value="subcategories">Подкатегории</option>
        <option value="items">Работы</option>
        <option value="details">Детали работ</option>
        <option value="dopworks">Доп. работы</option>
      </select>
    </div>

    <!-- Редактор страниц -->
    <div v-if="selectedLevel === 'pages'" class="editor-section">
      <h2>Страницы</h2>
      
      <div class="item-list">
        <div 
          v-for="page in pages" 
          :key="page.id" 
          class="item-card"
          @click="editPage(page)"
        >
          {{ page.title }}
          <button @click.stop="deletePage(page.id)" class="delete-btn">Удалить</button>
        </div>
      </div>
      
      <form @submit.prevent="savePage" class="item-form">
        <input v-model="currentItem.title" placeholder="Название страницы" required>
        <input v-model="currentItem.slug" placeholder="URL-псевдоним" required>
        <input v-model.number="currentItem.order" type="number" placeholder="Порядок">
        <button type="submit">Сохранить</button>
      </form>
    </div>

    <!-- Редактор категорий -->
    <div v-else-if="selectedLevel === 'categories'" class="editor-section">
      <h2>Категории</h2>
      
      <select v-model="selectedPageId" class="sub-select">
        <option v-for="page in pages" :key="page.id" :value="page.id">{{ page.title }}</option>
      </select>
      
      <div class="item-list">
        <div 
          v-for="category in filteredCategories" 
          :key="category.id" 
          class="item-card"
          @click="editCategory(category)"
        >
          {{ category.name }}
          <button @click.stop="deleteCategory(category.id)" class="delete-btn">Удалить</button>
        </div>
      </div>
      
      <form @submit.prevent="saveCategory" class="item-form">
        <input v-model="currentItem.name" placeholder="Название категории" required>
        <input v-model.number="currentItem.order" type="number" placeholder="Порядок">
        <button type="submit">Сохранить</button>
      </form>
    </div>

    <!-- Редактор подкатегорий -->
    <div v-else-if="selectedLevel === 'subcategories'" class="editor-section">
      <h2>Подкатегории</h2>
      
      <select v-model="selectedPageId" class="sub-select">
        <option v-for="page in pages" :key="page.id" :value="page.id">{{ page.title }}</option>
      </select>
      <select v-model="selectedCategoryId" class="sub-select">
        <option v-for="category in filteredCategories" :key="category.id" :value="category.id">{{ category.name }}</option>
      </select>
      
      <div class="item-list">
        <div 
          v-for="subcategory in filteredSubcategories" 
          :key="subcategory.id" 
          class="item-card"
          @click="editSubcategory(subcategory)"
        >
          {{ subcategory.name }}
          <button @click.stop="deleteSubcategory(subcategory.id)" class="delete-btn">Удалить</button>
        </div>
      </div>
      
      <form @submit.prevent="saveSubcategory" class="item-form">
        <input v-model="currentItem.name" placeholder="Название подкатегории" required>
        <input v-model.number="currentItem.order" type="number" placeholder="Порядок">
        <button type="submit">Сохранить</button>
      </form>
    </div>

    <!-- Редактор работ -->
    <div v-else-if="selectedLevel === 'items'" class="editor-section">
      <h2>Работы</h2>
      
      <select v-model="selectedPageId" class="sub-select">
        <option v-for="page in pages" :key="page.id" :value="page.id">{{ page.title }}</option>
      </select>
      <select v-model="selectedCategoryId" class="sub-select">
        <option v-for="category in filteredCategories" :key="category.id" :value="category.id">{{ category.name }}</option>
      </select>
      <select v-model="selectedSubcategoryId" class="sub-select">
        <option v-for="subcategory in filteredSubcategories" :key="subcategory.id" :value="subcategory.id">{{ subcategory.name }}</option>
      </select>
      
      <div class="item-list">
        <div 
          v-for="item in filteredItems" 
          :key="item.id" 
          class="item-card"
          @click="editItem(item)"
        >
          {{ item.name }}
          <button @click.stop="deleteItem(item.id)" class="delete-btn">Удалить</button>
        </div>
      </div>
      
      <form @submit.prevent="saveItem" class="item-form">
        <input v-model="currentItem.name" placeholder="Название работы" required>
        <input v-model="currentItem.unit" placeholder="Единица измерения" required>
        <input v-model.number="currentItem.price" type="number" placeholder="Цена" required>
        <input v-model.number="currentItem.order" type="number" placeholder="Порядок">
        <button type="submit">Сохранить</button>
      </form>
    </div>

    <!-- Редактор деталей работ -->
    <div v-else-if="selectedLevel === 'details'" class="editor-section">
      <h2>Детали работ</h2>
      
      <select v-model="selectedPageId" class="sub-select">
        <option v-for="page in pages" :key="page.id" :value="page.id">{{ page.title }}</option>
      </select>
      <select v-model="selectedCategoryId" class="sub-select">
        <option v-for="category in filteredCategories" :key="category.id" :value="category.id">{{ category.name }}</option>
      </select>
      <select v-model="selectedSubcategoryId" class="sub-select">
        <option v-for="subcategory in filteredSubcategories" :key="subcategory.id" :value="subcategory.id">{{ subcategory.name }}</option>
      </select>
      <select v-model="selectedItemId" class="sub-select">
        <option v-for="item in filteredItems" :key="item.id" :value="item.id">{{ item.name }}</option>
      </select>
      
      <div class="item-list">
        <div 
          v-for="detail in filteredDetails" 
          :key="detail.id" 
          class="item-card"
          @click="editDetail(detail)"
        >
          {{ detail.name }}
          <button @click.stop="deleteDetail(detail.id)" class="delete-btn">Удалить</button>
        </div>
      </div>
      
      <form @submit.prevent="saveDetail" class="item-form">
        <input v-model="currentItem.name" placeholder="Название детали" required>
        <input v-model="currentItem.unit" placeholder="Единица измерения" required>
        <input v-model.number="currentItem.price" type="number" placeholder="Цена" required>
        <input v-model.number="currentItem.order" type="number" placeholder="Порядок">
        <button type="submit">Сохранить</button>
      </form>
    </div>

    <!-- Редактор доп.работ -->
    <div v-else-if="selectedLevel === 'dopworks'" class="editor-section">
      <h2>Дополнительные работы</h2>
      
      <select v-model="selectedPageId" class="sub-select">
        <option v-for="page in pages" :key="page.id" :value="page.id">{{ page.title }}</option>
      </select>
      <select v-model="selectedCategoryId" class="sub-select">
        <option v-for="category in filteredCategories" :key="category.id" :value="category.id">{{ category.name }}</option>
      </select>
      <select v-model="selectedSubcategoryId" class="sub-select">
        <option v-for="subcategory in filteredSubcategories" :key="subcategory.id" :value="subcategory.id">{{ subcategory.name }}</option>
      </select>
      <select v-model="selectedItemId" class="sub-select">
        <option v-for="item in filteredItems" :key="item.id" :value="item.id">{{ item.name }}</option>
      </select>
      
      <div class="item-list">
        <div 
          v-for="dopwork in filteredDopworks" 
          :key="dopwork.id" 
          class="item-card"
          @click="editDopwork(dopwork)"
        >
          {{ dopwork.dopwork }} ({{ dopwork.label }})
          <button @click.stop="deleteDopwork(dopwork.id)" class="delete-btn">Удалить</button>
        </div>
      </div>
      
      <form @submit.prevent="saveDopwork" class="item-form">
        <select v-model="currentItem.label" required>
          <option value="" disabled selected>Выберите тип</option>
          <option value="Подготовка">Подготовка</option>
          <option value="Укрепление">Укрепление</option>
          <option value="Декоративная">Декоративная</option>
        </select>
        <input v-model="currentItem.dopwork" placeholder="Название доп.работы" required>
        <input v-model="currentItem.unit" placeholder="Единица измерения" required>
        <input v-model.number="currentItem.price" type="number" placeholder="Цена" required>
        <input v-model.number="currentItem.order" type="number" placeholder="Порядок">
        <button type="submit">Сохранить</button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

// Состояния
const selectedLevel = ref('pages')
const pages = ref([])
const categories = ref([])
const subcategories = ref([])
const items = ref([])
const details = ref([])
const dopworks = ref([])
const selectedPageId = ref(null)
const selectedCategoryId = ref(null)
const selectedSubcategoryId = ref(null)
const selectedItemId = ref(null)
const currentItem = ref({
  id: null,
  title: '',
  slug: '',
  name: '',
  unit: '',
  price: 0,
  order: 0,
  label: '',
  dopwork: ''
})

definePageMeta({
  layout: 'cabinet',
  middleware: 'auth'
})

onMounted(async () => {
  await fetchPages()
  if (pages.value.length > 0 && selectedLevel.value !== 'pages') {
    selectedPageId.value = pages.value[0].id
    await fetchCategories()
  }
})

// Получение данных
const fetchPages = async () => {
  try {
    const result = await $fetch('/api/price/pages', {
      method: 'GET'
    })
    pages.value = Array.isArray(result) ? result : []
  } catch (error) {
    console.error('Ошибка получения страниц:', error)
  }
}

const fetchCategories = async () => {
  try {
    const data = await $fetch(`/api/price/categories/${selectedPageId.value}`)
    categories.value = data || []
  } catch (error) {
    console.error('Ошибка получения категорий:', error)
  }
}

const fetchSubcategories = async () => {
  try {
    const data = await $fetch(`/api/price/subcategories/${selectedCategoryId.value}`)
    subcategories.value = data || []
  } catch (error) {
    console.error('Ошибка получения подкатегорий:', error)
  }
}

const fetchItems = async () => {
  try {
    const data = await $fetch(`/api/price/items/${selectedSubcategoryId.value}`)
    items.value = data || []
  } catch (error) {
    console.error('Ошибка получения работ:', error)
  }
}

const fetchDetails = async () => {
  try {
    const data = await $fetch(`/api/price/details/${selectedItemId.value}`)
    details.value = data || []
  } catch (error) {
    console.error('Ошибка получения деталей работ:', error)
  }
}

const fetchDopworks = async () => {
  try {
    const data = await $fetch(`/api/price/dopworks/${selectedItemId.value}`)

    // Убедимся, что данные приходят как массив
    dopworks.value = Array.isArray(data) ? data : []
  } catch (error) {
    console.error('Ошибка получения доп.работ:', error)
  }
}

// Фильтрованные данные
const filteredCategories = computed(() => {
  if (!categories.value || !Array.isArray(categories.value)) return []
  return categories.value.filter(cat => cat.pageId === selectedPageId.value)
})

const filteredSubcategories = computed(() => {
  if (!subcategories.value || !Array.isArray(subcategories.value)) return []
  return subcategories.value.filter(sub => sub.categoryId === selectedCategoryId.value)
})

const filteredItems = computed(() => {
  if (!items.value || !Array.isArray(items.value)) return []
  return items.value.filter(item => item.subCategoryId === selectedSubcategoryId.value)
})

const filteredDetails = computed(() => {
  if (!details.value || !Array.isArray(details.value)) return []
  return details.value.filter(detail => detail.itemId === selectedItemId.value)
})

const filteredDopworks = computed(() => {
  if (!dopworks.value || !Array.isArray(dopworks.value)) return []
  
  const result = {}
  dopworks.value
    .filter(dop => dop.itemId === selectedItemId.value)
    .forEach(dop => {
      if (!result[dop.label]) {
        result[dop.label] = []
      }
      result[dop.label].push(dop)
    })

  return Object.entries(result).map(([label, works]) => ({ label, works }))
})

// Обработчики событий
watch(selectedLevel, async (newLevel) => {
  try {
    switch (newLevel) {
      case 'categories':
        await fetchPages()
        break
      case 'subcategories':
        await fetchPages()
        break
      case 'items':
        await fetchPages()
        break
      case 'details':
        await fetchPages()
        break
      case 'dopworks':
        await fetchPages()
        break
    }
  } catch (error) {
    console.error(`Ошибка при переключении на уровень ${newLevel}:`, error)
  }
})

watch(selectedPageId, async (newPage) => {
  if (!newPage) return
  
  try {
    switch (selectedLevel.value) {
      case 'categories':
        await fetchCategories()
        break
      case 'subcategories':
        await fetchCategories()
        break
      case 'items':
        await fetchCategories()
        break
      case 'details':
        await fetchCategories()
        break
      case 'dopworks':
        await fetchCategories()
        break
    }
  } catch (error) {
    console.error('Ошибка при выборе страницы:', error)
  }
})

watch(selectedCategoryId, async (newCategory) => {
  if (!newCategory) return
  
  try {
    switch (selectedLevel.value) {
      case 'subcategories':
        await fetchSubcategories()
        break
      case 'items':
        await fetchSubcategories()
        break
      case 'details':
        await fetchSubcategories()
        break
      case 'dopworks':
        await fetchSubcategories()
        break
    }
  } catch (error) {
    console.error('Ошибка при выборе категории:', error)
  }
})

watch(selectedSubcategoryId, async (newSubcategory) => {
  if (!newSubcategory) return
  
  try {
    switch (selectedLevel.value) {
      case 'items':
        await fetchItems()
        break
      case 'details':
        await fetchItems()
        break
      case 'dopworks':
        await fetchItems()
        break
    }
  } catch (error) {
    console.error('Ошибка при выборе подкатегории:', error)
  }
})

watch(selectedItemId, async (newItem) => {
  if (!newItem) return
  
  try {
    switch (selectedLevel.value) {
      case 'details':
        await fetchDetails()
        break
      case 'dopworks':
        await fetchDopworks()
        break
    }
  } catch (error) {
    console.error('Ошибка при выборе работы:', error)
  }
})

// Методы для редактирования
const editPage = (page) => {
  currentItem.value = { ...page }
}

const editCategory = (category) => {
  currentItem.value = { ...category }
}

const editSubcategory = (subcategory) => {
  currentItem.value = { ...subcategory }
}

const editItem = (item) => {
  currentItem.value = { ...item }
}

const editDetail = (detail) => {
  currentItem.value = { ...detail }
}

const editDopwork = (dopwork) => {
  currentItem.value = { ...dopwork }
}

// Методы сохранения
const savePage = async () => {
  try {
    const method = currentItem.value.id ? 'put' : 'post'
    const url = currentItem.value.id ? `/api/price/pages/${currentItem.value.id}` : '/api/price/pages'
    
    const response = await $fetch(url, {
      method,
      body: currentItem.value
    })

    if (method === 'post') {
      pages.value.push(response)
    } else {
      const index = pages.value.findIndex(p => p.id === currentItem.value.id)
      if (index !== -1) {
        pages.value[index] = response
      }
    }

    resetForm()
  } catch (error) {
    console.error('Ошибка сохранения страницы:', error)
  }
}

const saveCategory = async () => {
  try {
    const method = currentItem.value.id ? 'put' : 'post'
    const url = currentItem.value.id ? `/api/price/categories/${currentItem.value.id}` : '/api/price/categories'
    const body = { ...currentItem.value, pageId: selectedPageId.value }
    
    const response = await $fetch(url, {
      method,
      body
    })
    
    if (method === 'post') {
      categories.value.push(response)
    } else {
      const index = categories.value.findIndex(c => c.id === currentItem.value.id)
      if (index !== -1) {
        categories.value[index] = response
      }
    }
    
    resetForm()
  } catch (error) {
    console.error('Ошибка сохранения категории:', error)
  }
}

const saveSubcategory = async () => {
  try {
    const method = currentItem.value.id ? 'put' : 'post'
    const url = currentItem.value.id ? `/api/price/subcategories/${currentItem.value.id}` : '/api/price/subcategories'
    const body = { ...currentItem.value, categoryId: selectedCategoryId.value }
    
    const response = await $fetch(url, {
      method,
      body
    })
    
    if (method === 'post') {
      subcategories.value.push(response)
    } else {
      const index = subcategories.value.findIndex(s => s.id === currentItem.value.id)
      if (index !== -1) {
        subcategories.value[index] = response
      }
    }
    
    resetForm()
  } catch (error) {
    console.error('Ошибка сохранения подкатегории:', error)
  }
}

const saveItem = async () => {
  try {
    const method = currentItem.value.id ? 'put' : 'post'
    const url = currentItem.value.id ? `/api/price/items/${currentItem.value.id}` : '/api/price/items'
    const body = { ...currentItem.value, subCategoryId: selectedSubcategoryId.value }
    
    const response = await $fetch(url, {
      method,
      body
    })
    
    if (method === 'post') {
      items.value.push(response)
    } else {
      const index = items.value.findIndex(i => i.id === currentItem.value.id)
      if (index !== -1) {
        items.value[index] = response
      }
    }
    
    resetForm()
  } catch (error) {
    console.error('Ошибка сохранения работы:', error)
  }
}

const saveDetail = async () => {
  try {
    const method = currentItem.value.id ? 'put' : 'post'
    const url = currentItem.value.id ? `/api/price/details/${currentItem.value.id}` : '/api/price/details'
    const body = { ...currentItem.value, itemId: selectedItemId.value }
    
    const response = await $fetch(url, {
      method,
      body
    })
    
    if (method === 'post') {
      details.value.push(response)
    } else {
      const index = details.value.findIndex(d => d.id === currentItem.value.id)
      if (index !== -1) {
        details.value[index] = response
      }
    }
    
    resetForm()
  } catch (error) {
    console.error('Ошибка сохранения детали:', error)
  }
}

const saveDopwork = async () => {
  try {
    const method = currentItem.value.id ? 'put' : 'post'
    const url = currentItem.value.id ? `/api/price/dopworks/${currentItem.value.id}` : '/api/price/dopworks'
    const body = { ...currentItem.value, itemId: selectedItemId.value }
    
    const response = await $fetch(url, {
      method,
      body
    })
    
    if (method === 'post') {
      dopworks.value.push(response)
    } else {
      const index = dopworks.value.findIndex(d => d.id === currentItem.value.id)
      if (index !== -1) {
        dopworks.value[index] = response
      }
    }
    
    resetForm()
  } catch (error) {
    console.error('Ошибка сохранения доп.работы:', error)
  }
}

// Методы удаления
const deletePage = async (id) => {
  if (!confirm('Вы уверены, что хотите удалить эту страницу?')) return
  
  try {
    await $fetch(`/api/price/pages/${id}`, { method: 'delete' })
    const index = pages.value.findIndex(p => p.id === id)
    if (index !== -1) {
      pages.value.splice(index, 1)
    }
  } catch (error) {
    console.error('Ошибка удаления страницы:', error)
  }
}

const deleteCategory = async (id) => {
  if (!confirm('Вы уверены, что хотите удалить эту категорию?')) return
  
  try {
    await $fetch(`/api/price/categories/${id}`, { method: 'delete' })
    const index = categories.value.findIndex(c => c.id === id)
    if (index !== -1) {
      categories.value.splice(index, 1)
    }
  } catch (error) {
    console.error('Ошибка удаления категории:', error)
  }
}

const deleteSubcategory = async (id) => {
  if (!confirm('Вы уверены, что хотите удалить эту подкатегорию?')) return
  
  try {
    await $fetch(`/api/price/subcategories/${id}`, { method: 'delete' })
    const index = subcategories.value.findIndex(s => s.id === id)
    if (index !== -1) {
      subcategories.value.splice(index, 1)
    }
  } catch (error) {
    console.error('Ошибка удаления подкатегории:', error)
  }
}

const deleteItem = async (id) => {
  if (!confirm('Вы уверены, что хотите удалить эту работу?')) return
  
  try {
    await $fetch(`/api/price/items/${id}`, { method: 'delete' })
    const index = items.value.findIndex(i => i.id === id)
    if (index !== -1) {
      items.value.splice(index, 1)
    }
  } catch (error) {
    console.error('Ошибка удаления работы:', error)
  }
}

const deleteDetail = async (id) => {
  if (!confirm('Вы уверены, что хотите удалить эту деталь работы?')) return
  
  try {
    await $fetch(`/api/price/details/${id}`, { method: 'delete' })
    const index = details.value.findIndex(d => d.id === id)
    if (index !== -1) {
      details.value.splice(index, 1)
    }
  } catch (error) {
    console.error('Ошибка удаления детали:', error)
  }
}

const deleteDopwork = async (id) => {
  if (!confirm('Вы уверены, что хотите удалить эту доп.работу?')) return
  
  try {
    await $fetch(`/api/price/dopworks/${id}`, { method: 'delete' })
    const index = dopworks.value.findIndex(d => d.id === id)
    if (index !== -1) {
      dopworks.value.splice(index, 1)
    }
  } catch (error) {
    console.error('Ошибка удаления доп.работы:', error)
  }
}

// Вспомогательные функции
const resetForm = () => {
  currentItem.value = {
    id: null,
    title: '',
    slug: '',
    name: '',
    unit: '',
    price: 0,
    order: 0,
    label: '',
    dopwork: ''
  }
}

// Инициализация
fetchPages()

useHead({
  meta: [
    { name: 'robots', content: 'noindex, nofollow' },
  ],
  title: 'CRM — Добавление страниц и категорий'
})
</script>

<style scoped>
.price-editor {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.level-select {
  width: 100%;
  padding: 10px;
  margin-bottom: 20px;
  font-size: 16px;
}

.editor-section {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin-bottom: 20px;
}

.sub-select {
  width: 100%;
  padding: 8px;
  margin: 10px 0;
}

.item-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
  margin: 20px 0;
}

.item-card {
  background: #f8f9fa;
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.item-card:hover {
  background: #e9ecef;
}

.delete-btn {
  position: absolute;
  top: 5px;
  right: 5px;
  background: #dc3545;
  color: white;
  border: none;
  padding: 3px 7px;
  font-size: 12px;
  border-radius: 4px;
  cursor: pointer;
}

.delete-btn:hover {
  background: #c82333;
}

.item-form {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr auto;
  gap: 10px;
  margin-top: 20px;
}

.item-form input, 
.item-form select {
  padding: 8px;
  font-size: 14px;
}

.item-form button {
  padding: 8px;
  background: #28a745;
  color: white;
  border: none;
  cursor: pointer;
  font-size: 14px;
}

.item-form button:hover {
  background: #218838;
}
</style>
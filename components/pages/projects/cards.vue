<template>
  <div class="cases-section">
    <!-- Заголовок и фильтры -->
    <div class="sort">
      <h3 class="cases-title">Наши проекты</h3>

      <!-- Табы с категориями -->
      <div v-if="availableTabs.length" class="tabs-container">
        <div class="tabs-wrapper">
          <button
            v-for="tab in availableTabs"
            :key="tab"
            :class="['tab', { active: activeTab === tab }]"
            @click="setActiveTab(tab)"
            :aria-pressed="activeTab === tab"
          >
            {{ tab }}
            <span v-if="categoryCounts[tab] !== undefined" class="count-badge">
              {{ categoryCounts[tab] }}
            </span>
          </button>
        </div>
      </div>

      <!-- Если нет доступных категорий -->
      <div v-else class="no-categories">
        Нет доступных проектов
      </div>
    </div>

    <!-- Состояния загрузки и ошибки -->
    <div v-if="loading" class="loading">Загрузка проектов...</div>
    <div v-else-if="error" class="error">{{ error }}</div>

    <!-- Сетка проектов -->
    <div v-else class="cases-grid">
      <router-link
        v-for="card in filteredCards"
        :key="card.id"
        :to="`/projects/${card.slug}`"
        class="case-card"
      >
        <div class="image-container">
          <img
            :src="getMainImage(card.images)"
            :alt="card.title"
            class="case-image"
            loading="lazy"
          />
        </div>
        <div class="case-overlay">
          <p>{{ card.space }} м²</p>
          <h3>{{ card.title }}</h3>
          <Icon name="weui:arrow-filled" size="24px" />
        </div>
      </router-link>
    </div>

    <!-- Кнопка "Показать больше" -->
    <div v-if="hasMore && !loading" class="load-more">
      <button @click="loadMore" :disabled="loadingMore">
        {{ loadingMore ? 'Загрузка...' : 'Показать больше' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'

// Состояние
const loading = ref(true)
const loadingMore = ref(false)
const error = ref(null)
const currentPage = ref(1)
const hasMore = ref(true)
const limit = 12

// Все возможные категории (из бэкенда)
const allTabs = [
  'Все',
  'Кафе',
  'Магазины',
  'Клиники',
  'Банки',
  'Фитнес',
  'Производственные',
  'Фасады и Кровля',
  'Прочее'
]

// Активная вкладка
const activeTab = ref('Все')

// Все карточки
const cards = ref([])

// Подсчёт количества проектов по категориям
const categoryCounts = computed(() => {
  const counts = {}
  cards.value.forEach(card => {
    const cat = card.category
    counts[cat] = (counts[cat] || 0) + 1
  })
  return counts
})

// Доступные вкладки (только те, где есть проекты + "Все")
const availableTabs = computed(() => {
  const populated = allTabs.filter(tab => {
    if (tab === 'Все') return true
    return categoryCounts.value[tab] > 0
  })
  return populated
})

// Фильтрация по категории
const filteredCards = computed(() => {
  if (activeTab.value === 'Все') return cards.value
  return cards.value.filter(card => card.category === activeTab.value)
})

// Получение основного изображения
const getMainImage = (images) => {
  if (!images?.length) return '/images/placeholder.jpg'
  const mainImage = images.find(img => img.type === 'main')
  return mainImage?.url || images[0]?.url || '/images/placeholder.jpg'
}

// Получение данных
const fetchData = async (page = 1, append = false) => {
  try {
    if (page === 1) {
      loading.value = true
      cards.value = []
    } else {
      loadingMore.value = true
    }

    const url = '/api/portfolio'
    const query = {
      page,
      limit,
      ...(activeTab.value !== 'Все' && { category: activeTab.value })
    }

    const data = await $fetch(url, {
      method: 'GET',
      params: query
    })

    const newCards = data?.data || []
    if (append) {
      cards.value = [...cards.value, ...newCards]
    } else {
      cards.value = newCards
    }

    currentPage.value = page
    hasMore.value = newCards.length === limit
  } catch (err) {
    error.value = 'Не удалось загрузить проекты. Попробуйте позже.'
    console.error('Ошибка загрузки кейсов:', err)
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

// Методы
const setActiveTab = (tab) => {
  if (activeTab.value === tab) return
  activeTab.value = tab
  currentPage.value = 1
  hasMore.value = true
  fetchData()
}

const loadMore = () => {
  if (loadingMore.value || !hasMore.value) return
  fetchData(currentPage.value + 1, true)
}

// Жизненный цикл
onMounted(() => {
  fetchData()
})

// Следим за изменением активной вкладки
watch(activeTab, () => {
  fetchData()
})
</script>

<style lang="scss" scoped>
.cases-section {
  position: relative;
  z-index: 1;
  background: white;
  border-radius: 2rem;
  margin: 0 1.5rem 2rem;
  padding: 2.5rem;
  // box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);

  @media (max-width: 768px) {
    margin: 0;
    border-radius: unset;
    padding: 5px;
  }
}

.sort {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;

  .cases-title {
    font-size: 1.75rem;
    font-weight: 700;
    color: #111827;
    margin: 0;
  }

  .tabs-container {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none; /* Firefox */
    &::-webkit-scrollbar {
      display: none; /* Chrome/Safari */
    }
  }

  .tabs-wrapper {
    display: flex;
    gap: 0.75rem;
    min-width: 100%;
  }

  .tab {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    background: #f8fafc;
    color: #64748b;
    border: 1px solid #e2e8f0;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;

    &:hover {
      background: #f1f5f9;
      // color: #475569;
      border-color: $blue;
    }

    &.active {
      background: $blue;
      color: white;
      border-color: $blue;
    }
  }

  .count-badge {
    background: rgba(255, 255, 255, 0.25);
    color: inherit;
    font-size: 0.75rem;
    font-weight: 600;
    padding: 0.15rem 0.4rem;
    border-radius: 1rem;
    min-width: 1.25rem;
    text-align: center;
  }

  .no-categories {
    font-size: 1.1rem;
    color: #6b7280;
    text-align: center;
    padding: 1rem;
    font-style: italic;
  }
}

.cases-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(45%, 1fr));
    gap: 2em;
    margin-top: 2rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 5px;
  }
}

.case-card {
  position: relative;
  overflow: hidden;
  height: 32rem;
  border-radius: 1rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  @media (max-width: 768px) {
    border-radius: unset;
  }

  &:hover {
    .image-container .case-image {
      transform: scale(1.08); // Плавное приближение
    }
  }

  .image-container {
    width: 100%;
    height: 100%;
    overflow: hidden;

    .case-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.4s ease;
      transform: scale(1); // Начальное состояние
    }
  }

  .case-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    background: linear-gradient(to bottom, rgba(0, 0, 0, 0.7) 40%, rgba(0, 0, 0, 0) 100%);
    border-top-left-radius: 10px;
    border-top-right-radius: 10px;
    color: white;
    padding: 20px;
    height: 160px;
    display: flex;
    justify-content: space-between;
    z-index: 2;

    @media (max-width: 768px) {
      border-radius: unset;
    }

    p {
      color: white;
      font-weight: 600;
      margin: 0;
    }

    h3 {
      font-size: 1.25rem;
      margin: 0 0 0.75rem 0;
      line-height: 1.3;
    }
  }

  &:hover .case-overlay {
    opacity: 1;
  }
}

.load-more {
  text-align: center;
  margin-top: 3rem;

  button {
    padding: 0.75rem 2rem;
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 1rem;
    font-weight: 600;
    font-size: 1rem;
    cursor: pointer;
    transition: background 0.2s ease;

    &:hover:not(:disabled) {
      background: #2563eb;
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }
}

.loading,
.error {
  padding: 2rem;
  text-align: center;
  color: #666;
  font-size: 1rem;
}

.error {
  color: #ef4444;
}
</style>
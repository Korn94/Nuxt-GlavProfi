<!-- app/components/pages/public/projects/cards.vue -->
<template>
  <div class="cases-section">
    <!-- Заголовок -->
    <header class="cases-section__header">
      <h2 class="cases-section__title">
        Наши реализованные проекты <span>для бизнеса в Рязани</span>
      </h2>
      <!-- <p class="cases-section__subtitle">
        Площади, сроки, выполненные работы.
      </p> -->
    </header>

    <!-- Табы-фильтры -->
    <!-- <div v-if="availableTabs.length" class="cases-section__tabs">
      <div class="tabs-scroll">
        <button
          v-for="tab in availableTabs"
          :key="tab"
          :class="['tab-pill', { active: activeTab === tab }]"
          @click="setActiveTab(tab)"
          :aria-pressed="activeTab === tab"
        >
          <span class="tab-pill__label">{{ tab }}</span>
          <span v-if="categoryCounts[tab] !== undefined" class="tab-pill__count">
            {{ categoryCounts[tab] }}
          </span>
        </button>
      </div>
    </div> -->

    <!-- <div v-else class="cases-section__empty">
      <Icon name="mdi:folder-open-outline" size="48" />
      <p>Категории проектов пока не добавлены</p>
    </div> -->

    <!-- Состояния загрузки / ошибки -->
    <div v-if="loading" class="cases-section__state">
      <div class="cases-section__loader">
        <div class="cases-section__spinner" />
        <span>Загружаем проекты...</span>
      </div>
    </div>

    <div v-else-if="error" class="cases-section__state cases-section__state--error">
      <Icon name="mdi:alert-circle-outline" size="32" />
      <p>{{ error }}</p>
      <button class="cases-section__retry" @click="fetchData">
        Попробовать снова
      </button>
    </div>

    <div v-else-if="validFilteredCards.length === 0" class="cases-section__state">
      <Icon name="mdi:image-filter-none-outline" size="48" />
      <p>В этой категории пока нет проектов</p>
      <button class="cases-section__reset" @click="setActiveTab('Все')">
        Показать все проекты
      </button>
    </div>

    <!-- Сетка карточек -->
    <div v-else class="cases-section__grid">
      <NuxtLink
        v-for="card in validFilteredCards"
        :key="card.id"
        :to="`/projects/${card.slug}`"
        class="case-card"
      >
        <!-- Изображение -->
        <div class="case-card__image">
          <img
            :src="getMainImage(card.images)"
            :alt="card.title"
            loading="lazy"
          />
        </div>

        <!-- Badge с площадью (glassmorphism) -->
        <span v-if="card.space" class="case-card__space">
          {{ card.space }} м²
        </span>

        <!-- Overlay с информацией -->
        <div class="case-card__overlay">
          <h3 class="case-card__title">{{ card.title }}</h3>
          <div class="case-card__flex">
            <div class="case-card__category" v-if="card.category">
              {{ card.category }}
            </div>
            <p v-if="card.subtitle" class="case-card__subtitle">
              {{ card.subtitle }}
            </p>
            <span class="case-card__link">
              Подробнее
              <Icon name="weui:arrow-filled" size="16" />
            </span>
          </div>
        </div>
      </NuxtLink>
    </div>

    <!-- Кнопка "Показать больше" -->
    <div v-if="hasMore && !loading" class="cases-section__footer">
      <button class="load-more-btn" @click="loadMore" :disabled="loadingMore">
        <template v-if="loadingMore">
          <div class="load-more-btn__spinner" />
          <span>Загрузка...</span>
        </template>
        <template v-else>
          <span>Показать ещё проекты</span>
          <Icon name="mdi:arrow-down" size="18" />
        </template>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const loading = ref(true)
const loadingMore = ref(false)
const error = ref(null)
const currentPage = ref(1)
const hasMore = ref(true)
const limit = 12

const allTabs = [
  'Все', 'Кафе', 'Магазины', 'Клиники', 'Банки',
  'Фитнес', 'Производственные', 'Фасады и Кровля', 'Прочее'
]

const activeTab = ref('Все')
const cards = ref([])

const categoryCounts = computed(() => {
  const counts = {}
  cards.value.forEach(card => {
    const cat = card.category
    if (cat) counts[cat] = (counts[cat] || 0) + 1
  })
  return counts
})

const availableTabs = computed(() => {
  return allTabs.filter(tab => {
    if (tab === 'Все') return true
    return categoryCounts.value[tab] > 0
  })
})

const filteredCards = computed(() => {
  if (activeTab.value === 'Все') return cards.value
  return cards.value.filter(card => card.category === activeTab.value)
})

const validFilteredCards = computed(() => 
  filteredCards.value.filter(card => card?.slug)
)

const getMainImage = (images) => {
  if (!images?.length) return '/images/placeholder.jpg'
  const main = images.find(img => img.type === 'main')
  return main?.url || images[0]?.url || '/images/placeholder.jpg'
}

const fetchData = async (page = 1, append = false) => {
  try {
    if (page === 1) {
      loading.value = true
      cards.value = []
    } else {
      loadingMore.value = true
    }

    const query = {
      page,
      limit,
      ...(activeTab.value !== 'Все' && { category: activeTab.value })
    }

    const data = await $fetch('/api/portfolio', { params: query })
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

onMounted(() => {
  fetchData()
})
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;

.cases-section {
  position: relative;
  z-index: 1;
  padding: 0;

  // === Заголовок ===
  &__header {
    margin-bottom: 2rem;
    max-width: 780px;
  }

  &__title {
    font-family: 'Rubik', sans-serif;
    font-size: 2.2rem;
    font-weight: 700;
    color: $text-dark;
    margin: 0 0 1rem;
    line-height: 1.25;
    position: relative;
    padding-bottom: 1rem;

    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      width: 80px;
      height: 4px;
      background: $blue-gradient;
      border-radius: 2px;
      box-shadow: 0 0 10px rgba(0, 195, 245, 0.3);
    }

    :deep(span) {
      background: $blue-gradient;
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
    }

    @media (max-width: 768px) {
      font-size: 1.6rem;
    }
  }

  &__subtitle {
    font-size: 1.05rem;
    line-height: 1.6;
    color: $text-gray;
    margin: 0;

    @media (max-width: 768px) {
      font-size: 0.95rem;
    }
  }

  // === Табы-пилюли ===
  &__tabs {
    margin-bottom: 2.5rem;
  }

  .tabs-scroll {
    display: flex;
    gap: 0.6rem;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    padding-bottom: 0.5rem;
    min-width: max-content;

    &::-webkit-scrollbar { display: none; }
  }

  .tab-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.55rem 1.2rem;
    background: #fff;
    color: $text-dark;
    border: 1px solid $border-color;
    border-radius: 50px;
    cursor: pointer;
    transition: all 0.25s ease;
    white-space: nowrap;
    font-family: 'Rubik', sans-serif;
    font-weight: 500;
    font-size: 0.9rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.03);

    &__label {
      font-weight: 500;
    }

    &__count {
      background: rgba(0, 0, 0, 0.06);
      color: $text-gray;
      font-size: 0.72rem;
      font-weight: 600;
      padding: 0.15rem 0.45rem;
      border-radius: 50px;
      min-width: 1.3rem;
      text-align: center;
      transition: all 0.25s ease;
    }

    &:hover {
      border-color: $blue;
      color: $blue;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 195, 245, 0.12);

      .tab-pill__count {
        background: rgba(0, 195, 245, 0.1);
        color: $blue;
      }
    }

    &.active {
      background: $blue-gradient;
      border-color: transparent;
      color: $background-dark;
      box-shadow: 0 4px 14px rgba(0, 195, 245, 0.3);

      .tab-pill__count {
        background: rgba(255, 255, 255, 0.3);
        color: $background-dark;
      }

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 18px rgba(0, 195, 245, 0.4);
      }
    }
  }

  &__empty {
    padding: 3rem 1.5rem;
    text-align: center;
    color: $text-gray;
    background: rgba(0, 0, 0, 0.02);
    border: 1px dashed $border-color;
    border-radius: $border-radius;
    margin-bottom: 2rem;

    p {
      margin-top: 0.5rem;
      font-size: 1rem;
    }
  }

  // === Состояния ===
  &__state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    padding: 4rem 2rem;
    text-align: center;
    color: $text-gray;
    background: rgba(0, 0, 0, 0.02);
    border-radius: $border-radius;

    &--error {
      color: $red;
      background: rgba(166, 19, 0, 0.05);
      border: 1px solid rgba(166, 19, 0, 0.2);
    }

    p {
      font-size: 1.05rem;
      margin: 0;
    }
  }

  &__loader {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    color: $text-gray;
  }

  &__spinner {
    width: 36px;
    height: 36px;
    border: 3px solid $border-color;
    border-top-color: $blue;
    border-radius: 50%;
    animation: spin 0.9s linear infinite;
  }

  &__retry, &__reset {
    margin-top: 0.5rem;
    padding: 0.6rem 1.4rem;
    background: transparent;
    border: 1px solid currentColor;
    border-radius: 50px;
    font-family: 'Rubik', sans-serif;
    font-weight: 500;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.25s ease;
    color: inherit;

    &:hover {
      background: currentColor;
      color: #fff;
    }
  }

  // === Сетка карточек ===
  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(500px, 1fr));
    gap: 1.5rem;

    @media (max-width: 768px) {
      grid-template-columns: 1fr;
      gap: 1.2rem;
    }
  }

  // === Карточка проекта ===
  .case-card {
    position: relative;
    display: block;
    border-radius: $border-radius;
    overflow: hidden;
    aspect-ratio: 16 / 11;
    background: $background-gray;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
    transition: transform 0.4s ease, box-shadow 0.4s ease;
    text-decoration: none;

    &:hover {
      transform: translateY(-6px);
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.18);

      .case-card__image img {
        transform: scale(1.08);
      }

      .case-card__link {
        gap: 0.7rem;
        color: $yellow;

        :deep(.icon) {
          transform: translateX(4px);
        }
      }

      .case-card__space {
        background: rgba(0, 195, 245, 0.85);
      }
    }

    // Изображение
    &__image {
      position: absolute;
      inset: 0;
      overflow: hidden;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.6s ease;
      }
    }

    // Badge с площадью (glassmorphism)
    &__space {
      position: absolute;
      top: 1rem;
      right: 1rem;
      background: rgba(0, 0, 0, 0.55);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      color: #fff;
      padding: 0.3rem 0.75rem;
      border-radius: 50px;
      font-size: 0.82rem;
      font-weight: 600;
      letter-spacing: 0.02em;
      z-index: 3;
      transition: background 0.3s ease;
      border: 1px solid rgba(255, 255, 255, 0.15);
    }

    // Overlay с информацией
    &__overlay {
      position: absolute;
      inset: 0;
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      background: linear-gradient(
        to top,
        rgba(24, 25, 27, 0.95) 0%,
        rgba(24, 25, 27, 0.6) 45%,
        rgba(24, 25, 27, 0.1) 100%
      );
      color: #fff;
      z-index: 2;
    }

    &__flex {
      display: flex;
      flex-direction: column;
    }

    &__category {
      align-self: flex-start;
      // display: inline;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: $blue-light;
      margin-bottom: 0.5rem;
      padding: 0.2rem 0.6rem;
      background: rgba(0, 195, 245, 0.15);
      border: 1px solid rgba(0, 195, 245, 0.3);
      border-radius: 4px;
    }

    &__title {
      font-family: 'Rubik', sans-serif;
      font-size: 1.35rem;
      font-weight: 700;
      margin: 0 0 0.3rem;
      color: #fff;
      line-height: 1.25;
      text-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);

      @media (max-width: 768px) {
        font-size: 1.2rem;
      }
    }

    &__subtitle {
      font-size: 0.9rem;
      color: rgba(255, 255, 255, 0.85);
      margin: 0 0 0.8rem;
      line-height: 1.4;
    }

    &__link {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      color: $blue-light;
      font-size: 0.92rem;
      font-weight: 600;
      transition: all 0.3s ease;

      :deep(.icon) {
        transition: transform 0.3s ease;
      }
    }
  }

  // === Футер ===
  &__footer {
    margin-top: 3rem;
    display: flex;
    justify-content: center;
  }

  .load-more-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.6rem;
    padding: 0.9rem 2.2rem;
    background: $blue-gradient;
    color: $background-dark;
    font-family: 'Rubik', sans-serif;
    font-weight: 600;
    font-size: 1rem;
    border-radius: 50px;
    border: none;
    cursor: pointer;
    box-shadow: 0 6px 20px rgba(0, 195, 245, 0.3);
    transition: all 0.3s ease;
    min-height: 48px;

    &:hover:not(:disabled) {
      transform: translateY(-3px);
      box-shadow: 0 10px 28px rgba(0, 195, 245, 0.45);
    }

    &:active:not(:disabled) {
      transform: translateY(-1px);
    }

    &:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }

    &__spinner {
      width: 18px;
      height: 18px;
      border: 2px solid rgba(24, 25, 27, 0.2);
      border-top-color: $background-dark;
      border-radius: 50%;
      animation: spin 0.9s linear infinite;
    }
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

// === Мобильная адаптация ===
@media (max-width: 768px) {
  .cases-section {
    &__header {
      margin-bottom: 1.5rem;
    }

    &__tabs {
      margin-bottom: 1.75rem;
    }

    .tabs-scroll {
      gap: 0.5rem;
    }

    .tab-pill {
      padding: 0.5rem 1rem;
      font-size: 0.85rem;
    }

    .case-card {
      aspect-ratio: 16 / 10;

      &__overlay {
        padding: 1.2rem;
      }

      &__space {
        top: 0.8rem;
        right: 0.8rem;
        font-size: 0.75rem;
        padding: 0.25rem 0.6rem;
      }

      &__title {
        font-size: 1.15rem;
      }

      &__subtitle {
        font-size: 0.85rem;
      }

      &__link {
        font-size: 0.88rem;
      }

      &__category {
        font-size: 0.7rem;
      }
    }

    &__state {
      padding: 3rem 1.5rem;
    }
  }
}

@media (max-width: 480px) {
  .cases-section {
    .case-card {
      aspect-ratio: 4 / 3;

      &__title {
        font-size: 1.05rem;
      }
    }

    .load-more-btn {
      width: 100%;
      padding: 0.9rem 1.5rem;
    }
  }
}
</style>
<!-- app\components\pages\public\homePage\MiniProjects.vue -->
<template>
  <div class="featured-projects">
    <h2 class="visually-hidden">Наши проекты</h2>

    <!-- Скелетон: пока данные не готовы (лентяная/повторная загрузка) -->
    <div v-if="loading" class="featured-skeleton-grid" aria-hidden="true">
      <div v-for="n in 2" :key="n" class="skeleton-card">
        <div class="skeleton-card__media"></div>
        <div class="skeleton-card__overlay">
          <div class="skeleton-line skeleton-line--small"></div>
          <div class="skeleton-line skeleton-line--large"></div>
        </div>
      </div>
    </div>

    <div v-else class="featured-grid">
      <router-link
        v-for="card in validFeaturedCards"
        :key="card.id"
        :to="`/projects/${card.slug}`"
        class="featured-card-link"
      >
        <div class="featured-card">
          <div class="image-container">
            <img
              :src="useImageUrl(getMainImage(card.images))"
              :alt="card.title"
              class="featured-image"
              loading="lazy"
            />
          </div>
          <div class="overlay">
            <p>{{ card.space }} м²</p>
            <h3>{{ card.title }}</h3>
            <Icon name="weui:arrow-filled" size="24px" />
          </div>
        </div>
      </router-link>
    </div>

    <router-link to="/projects">
      <UiButtonsPrimary class="openbtn" text="Показать еще" variant="outline-dark"></UiButtonsPrimary>
    </router-link>
  </div>
</template>

<script setup>
import { computed } from 'vue'

// Загрузка данных на сервере (SSR).
// Nuxt выполняет $fetch на сервере, встраивает результат в HTML и в payload;
// на клиенте данные приходят из payload без повторного запроса, поэтому кейсы
// видны и поисковикам, и пользователям с самого первого кадра.
const { data, pending } = await useAsyncData(
  'home-featured',
  async () => {
    try {
      const data = await $fetch('/api/portfolio')
      return data?.data || []
    } catch (err) {
      // Кратковременный сбой API — не роняем SSR-рендер (200 с пустым списком)
      console.error('Ошибка при загрузке проектов:', err)
      return []
    }
  }
)

// Состояние
const allCards = computed(() => data.value || [])
const loading = computed(() => pending.value)

// Выборка нужных кейсов по slug
const featuredCards = computed(() => {
  // const slugs = ['ddx', 'fora-bank', 'klinika-alma', 'zerno']
  const slugs = ['ddx', 'fora-bank']
  return allCards.value.filter(card => slugs.includes(card.slug))
})

// ✅ НОВОЕ: Фильтруем только карточки с валидным slug для рендеринга ссылок
const validFeaturedCards = computed(() => 
  featuredCards.value.filter(card => card?.slug)
)

// Получение основного изображения
const getMainImage = (images) => {
  if (!images?.length) return '/images/placeholder.jpg'
  const mainImage = images.find(img => img.type === 'main')
  return mainImage?.url || images[0]?.url || '/images/placeholder.jpg'
}
</script>

<style lang="scss" scoped>
.featured-projects {
  max-width: 1200px;
  margin: 6em auto;
  padding: 0 5px;
  text-align: center;
}

.featured-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #111827;
  text-align: center;
  margin-bottom: 2rem;
}

.featured-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2.5rem;

  @media (max-width: 768px) {
  gap: 5px;
  }
}

.featured-card {
  position: relative;
  border-radius: 4px;
  overflow: hidden;
  height: 280px;
  max-width: 600px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: none;
  cursor: pointer;

  &:hover {
    .featured-image {
      transform: scale(1.05); /* плавное увеличение изображения */
    }
  }

  .image-container {
    width: 100%;
    height: 100%;
    overflow: hidden;
    .featured-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.4s ease; /* анимация масштабирования */
      transform-origin: center;
    }
  }

  .overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    background: linear-gradient(to bottom, rgba(0, 0, 0, 0.7) 40%, rgba(0, 0, 0, 0) 100%);
    border-top-left-radius: 4px;
    border-top-right-radius: 4px;
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
}

/* ====== Скелетон загрузки ====== */
.featured-skeleton-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2.5rem;

  @media (max-width: 768px) {
    gap: 5px;
  }
}

.skeleton-card {
  position: relative;
  border-radius: 4px;
  overflow: hidden;
  height: 280px;
  max-width: 600px;
  background: #eef0f3;

  &__media {
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, #e9ebef 25%, #dfe2e8 37%, #e9ebef 63%);
    background-size: 400% 100%;
    animation: miniShimmer 1.4s ease infinite;
  }

  &__overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    padding: 20px;
    height: 160px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
}

.skeleton-line {
  height: 16px;
  border-radius: 4px;
  background: linear-gradient(90deg, #dfe2e8 25%, #d3d7df 37%, #dfe2e8 63%);
  background-size: 400% 100%;
  animation: miniShimmer 1.4s ease infinite;

  &--small {
    width: 40%;
  }

  &--large {
    width: 70%;
  }
}

@keyframes miniShimmer {
  0% {
    background-position: 100% 0;
  }
  100% {
    background-position: -100% 0;
  }
}
</style>

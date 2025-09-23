<template>
  <div class="featured-projects">
    <!-- <h2 class="featured-title">Лучшие проекты</h2> -->

    <div class="featured-grid">
      <router-link
        v-for="card in featuredCards"
        :key="card.id"
        :to="`/projects/${card.slug}`"
        class="featured-card-link"
      >
        <div class="featured-card">
          <div class="image-container">
            <img
              :src="getMainImage(card.images)"
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
      <UiButtonsPrimary class="openbtn" text="Показать еще"></UiButtonsPrimary>
    </router-link>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'

// Состояние
const loading = ref(true)
const error = ref(null)
const allCards = ref([])

// Загрузка данных
const fetchData = async () => {
  try {
    const data = await $fetch('/api/portfolio')
    allCards.value = data?.data || []
  } catch (err) {
    error.value = 'Не удалось загрузить проекты.'
    console.error('Ошибка при загрузке:', err)
  } finally {
    loading.value = false
  }
}

// Выборка нужных кейсов по slug
const featuredCards = computed(() => {
  const slugs = ['ddx', 'zerno']
  return allCards.value.filter(card => slugs.includes(card.slug))
})

// Получение основного изображения
const getMainImage = (images) => {
  if (!images?.length) return '/images/placeholder.jpg'
  const mainImage = images.find(img => img.type === 'main')
  return mainImage?.url || images[0]?.url || '/images/placeholder.jpg'
}

// Загрузка при монтировании
onMounted(() => {
  fetchData()
})
</script>

<style lang="scss" scoped>
.featured-projects {
  max-width: 1200px;
  margin: 6em auto;
  padding: 0 5px;
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

.openbtn {
  margin: auto;
}
</style>

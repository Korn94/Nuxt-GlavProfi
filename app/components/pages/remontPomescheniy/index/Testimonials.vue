<template>
  <section class="testimonials">
    <div class="container">
      <h2 class="section-title">Ваш ремонт начнёт приносить деньги с первого дня<br> <span>а не после года эксплуатации</span></h2>

      <div class="featured-grid">
        <PagesRemontPomescheniyIndexUiFeaturedCard
          v-for="card in featuredCards"
          :key="card.id"
          :slug="card.slug"
          :image="getMainImage(card.images)"
          :title="card.title"
          :space="card.space"
        />
      </div>

      <div class="section-btn">
        <router-link to="/projects">
          <UIButtonsMainButton class="openbtn" text="Показать еще" />
        </router-link>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'

const loading = ref(true)
const error = ref(null)
const allCards = ref([])

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

const featuredCards = computed(() => {
  const slugs = ['ddx', 'zerno']
  return allCards.value.filter(card => slugs.includes(card.slug))
})

const getMainImage = (images) => {
  if (!images?.length) return '/images/placeholder.jpg'
  const mainImage = images.find(img => img.type === 'main')
  return mainImage?.url || images[0]?.url || '/images/placeholder.jpg'
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped lang="scss">
.testimonials {
  padding: 5rem 0;

  .container {
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 2rem;
  }
}

.section-title {
  text-align: center;
  font-size: 2.5rem;
  margin-bottom: 3.5rem;

  @media (max-width: 768px) {
    font-size: 2rem;
  }
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

.section-btn {
  text-align: center;

  .openbtn {
    display: inline-block;
  }
}
</style>
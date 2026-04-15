<!-- app/components/public/remont-pomescheniy/index/blocks/CasesBlock.vue -->
<template>
  <section class="testimonials">
    <div class="container">
      
      <h2 class="testimonials__title">Примеры реализованных объектов</h2>
      <!-- <p class="testimonials__subtitle">
        Площадь, сроки, выполненные работы. Без маркетинговых обещаний — только факты.
      </p> -->

      <div class="featured-grid">
        <PagesPublicRemontPomescheniyIndexUiFeaturedCard
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
          <UiButtonsPrimary class="openbtn" text="Показать еще" />
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
  const slugs = ['ddx', 'klinika-alma']
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
  padding: 4rem 0;
  background: #f8f9fa; // светлый фон, как в блоке услуг

  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 2rem;
  }

  // === Заголовок в едином стиле (градиентная линия, Rubik) ===
  &__title {
    font-family: 'Rubik', sans-serif;
    font-size: 2rem;
    font-weight: 700;
    color: $text-dark;
    margin-bottom: 1rem;
    position: relative;
    padding-bottom: 0.8rem;

    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      width: 60px;
      height: 3px;
      background: $blue-gradient;
      border-radius: 2px;
      box-shadow: 0 0 10px rgba(0, 195, 245, 0.3);
    }
  }

  &__subtitle {
    font-size: 1.1rem;
    color: $text-gray;
    margin-bottom: 2.5rem;
    line-height: 1.6;
    max-width: 650px;
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
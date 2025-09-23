<template>
  <div v-if="loading" class="loading"><Icon name="eos-icons:bubble-loading" size="34px" /> Загрузка...</div>
  <div v-else-if="error" class="error">{{ error }}</div>
  
  <div v-else class="portfolio-case-page">
    <!-- Параллакс фон -->
    <div 
      ref="parallaxRef" 
      class="parallax-background"
      :style="{ backgroundImage: `url(${mainImageUrl})` }"
    ></div>

    <!-- Хедер кейса -->
    <PagesPublicProjectsCasePageHeader :case-data="caseData" />

    <!-- Основная информация -->
    <PagesPublicProjectsCasePageIntro :case-data="caseData" :works="works" />

    <!-- Сравнение до/после -->
    <div v-if="groupedImages.length > 0" class="comparison-section">
      <PagesPublicProjectsCasePageBeforeAfter
        :image-pairs="groupedImages.map(g => ({
          before: g.before.url,
          after: g.after.url,
          beforeAlt: g.before.alt,
          afterAlt: g.after.alt
        }))"
      />
    </div>

    <!-- Результаты -->
    <PagesPublicProjectsCasePageResults :case-data="caseData" />

    <!-- Галерея -->
    <PagesPublicProjectsCasePageGallery
      v-if="images.length > 0"
      :images="images.value" 
      :case-data="caseData" 
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'

// Состояние
const route = useRoute()
const caseData = ref(null)
const images = ref([])
const works = ref([])
const loading = ref(true)
const error = ref(null)
const selectedImageIndex = ref(0)

// ID кейса из URL
const slug = computed(() => {
  return route.params.slug
})

// Получение главного изображения
const mainImageUrl = computed(() => {
  const mainImage = images.value.find(img => img.type === 'main')
  return mainImage?.url || '/main/projects.webp' // Резервное изображение
})

// Группировка изображений "до/после"
const groupedImages = computed(() => {
  const groups = {}
  
  images.value
    .filter(img => img.type === 'before' || img.type === 'after')
    .forEach(img => {
      const groupKey = img.pairGroup || 'ungrouped'
      if (!groups[groupKey]) {
        groups[groupKey] = { before: null, after: null }
      }
      groups[groupKey][img.type] = img
    })

  return Object.values(groups).filter(g => g.before && g.after)
})

// Галерея (только изображения типа gallery)
const galleryImages = computed(() => {
  return images.value.filter(img => img.type === 'gallery')
})

// Загрузка данных
const fetchData = async () => {
  try {
    loading.value = true
    error.value = null
    
    // Проверка наличия slug
    if (!slug.value) {
      throw new Error('Slug не найден в URL')
    }

    // Загрузка данных кейса по slug
    const caseDataResponse = await $fetch(`/api/portfolio/${slug.value}`, {
      method: 'GET'
    })
    caseData.value = caseDataResponse

    // Загрузка изображений по slug
    const imagesResponse = await $fetch(`/api/portfolio/${slug.value}/images`, {
      method: 'GET'
    })
    images.value = imagesResponse || []

    // Загрузка работ по slug
    const worksResponse = await $fetch(`/api/portfolio/${slug.value}/works`, {
      method: 'GET'
    })
    works.value = worksResponse || []

  } catch (err) {
    console.error('Ошибка загрузки данных:', err)
    error.value = 'Не удалось загрузить данные кейса'
  } finally {
    loading.value = false
  }
}

// Параллакс-эффект
const parallaxRef = ref(null)
let ticking = false;

const handleScroll = () => {
  if (!ticking) {
    window.requestAnimationFrame(() => {
      if (parallaxRef.value) {
        // Добавляем проверку на существование элемента
        const scrollY = window.scrollY || window.pageYOffset
        parallaxRef.value.style.transform = `translateY(${scrollY * -0.3}px)`
      }
      ticking = false;
    });
    ticking = true;
  }
}

onMounted(async () => {
  try {
    await fetchData()
    window.scrollTo(0, 0)

    console.log('images.value:', images.value)
    console.log('filtered beforeImages:', images.value.filter(img => img.type === 'before'))
    console.log('filtered afterImages:', images.value.filter(img => img.type === 'after'))

    window.addEventListener('scroll', handleScroll)
    handleScroll()

  } catch (error) {
    console.error('Ошибка в onMounted:', error)
  }
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style lang="scss" scoped>
.portfolio-case-page {
  position: relative;
  min-height: 100vh;
  overflow-x: hidden;

  .parallax-background {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 120vh;
    background-size: cover;
    background-position: center;
    z-index: 0;
    transform: translateY(0);
    transition: transform 0.1s ease-out;
    filter: contrast(1.2) brightness(1.2);

    @media (max-width: 768px) {
      height: 110vh;
    }
  }

  .thumbnails {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    padding-top: 5px;
    background: #f8f9fa;
  }

  .thumbnail-wrapper {
    position: relative;
    width: 480px;
    height: 240px;
    cursor: pointer;
    overflow: hidden;
    transition: all 0.3s ease;

    &:hover {
      .thumbnail {
        filter: brightness(1);
        transform: scale(1.05);
      }

      .click-icon {
        opacity: 0;
        visibility: hidden;
      }
    }

    .thumbnail {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      filter: brightness(30%);
      transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1), filter 0.3s ease;
      backface-visibility: hidden;
      will-change: transform;
    }

    .thumbnail.active {
      filter: brightness(1);
      transform: scale(1.05);
      z-index: 1;
    }

    .click-icon {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: white;
      opacity: 0.6;
      pointer-events: none;
      z-index: 1;
      font-size: 24px;
      transition: opacity 0.3s ease, visibility 0.3s ease;
      visibility: visible;
    }
  }
}

  .loading,
  .error {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
    color: #666;

    height: 100vh;
    width: 100%;
  }

  .error {
    color: #ef4444;
  }
</style>
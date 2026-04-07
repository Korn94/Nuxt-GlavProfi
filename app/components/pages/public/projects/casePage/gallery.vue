<template>
  <div class="gallery-container">
    <div>
      <!-- Вкладки -->
      <div class="tabs">
        <h3>Фото с объекта <span>«До»</span> и <span>«После»</span> ремонта</h3>
        <div>
          <button
            v-for="tab in tabs"
            :key="tab"
            :class="['tab', { active: activeTab === tab }]"
            @click="setActiveTab(tab)"
          >
            {{ tab }}
          </button>
        </div>
      </div>

      <!-- Галерея -->
      <div class="gallery">
        <div v-if="filteredImages.length" class="project-card">
          <div class="project-images">
            <img
              v-for="(image, index) in filteredImages"
              :key="index"
              :src="useImageUrl(image.url)"
              :alt="image.alt || `Изображение ${image.type} для проекта`"
              class="thumbnail"
              @click="openLightbox(index)"
            />
          </div>
        </div>
        <div v-else class="no-images">Нет изображений для отображения</div>
      </div>
    </div>

    <!-- Модальное окно (lightbox) -->
    <div v-if="lightboxVisible" class="lightbox-overlay" @click.self="closeLightbox">
      <button
        class="lightbox-nav prev"
        :disabled="currentImageIndex === 0"
        @click.stop="prevImage"
      >
        &#10094;
      </button>

      <img
        :src="useImageUrl(currentImage.url)"
        :alt="currentImage.alt || `Фото ${currentImage.type} проекта`"
        class="lightbox-img"
      />

      <button
        class="lightbox-nav next"
        :disabled="currentImageIndex === filteredImages.length - 1"
        @click.stop="nextImage"
      >
        &#10095;
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  images: {
    type: Array,
    default: () => []
  },
  caseData: {
    type: Object,
    default: null
  }
})

const lightboxVisible = ref(false)
const currentImageIndex = ref(0)
const activeTab = ref('После')

const tabs = ['После', 'До']

const filteredImages = computed(() => {
  const allGalleryImages = props.images.filter(img =>
    img.type === 'before' || img.type === 'after'
  )

  if (activeTab.value === 'До') return allGalleryImages.filter(img => img.type === 'before')
  if (activeTab.value === 'После') return allGalleryImages.filter(img => img.type === 'after')

  return allGalleryImages
})

const currentImage = computed(() => {
  return filteredImages.value[currentImageIndex.value] || { url: '', type: '' }
})

const openLightbox = (index) => {
  currentImageIndex.value = index
  lightboxVisible.value = true
}

const closeLightbox = () => {
  lightboxVisible.value = false
}

const prevImage = () => {
  if (currentImageIndex.value > 0) currentImageIndex.value--
}

const nextImage = () => {
  if (currentImageIndex.value < filteredImages.value.length - 1) currentImageIndex.value++
}

const handleKeydown = (e) => {
  if (!lightboxVisible.value) return
  if (e.key === 'Escape') closeLightbox()
  if (e.key === 'ArrowLeft') prevImage()
  if (e.key === 'ArrowRight') nextImage()
}

const setActiveTab = (tab) => {
  activeTab.value = tab
  currentImageIndex.value = 0
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<style lang="scss" scoped>
.tabs {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 5em 5px;
  background: $background-dark;
  color: $text-light;
  
  h3 {
    font-size: 2em;

    @media (max-width: 768px) {
      font-size: 1.5em;
    }
  }
  
  button {
    border: 1px solid $border-color;
    color: $text-light;
    cursor: pointer;
    transition: all 0.2s ease;
    background: unset;
    border-radius: $border-radius;
    min-width: 150px;
    font-size: 1em;
    border-color: $text-light;
    margin-right: 1em;
    padding: 5px 10px;

    &:last-child {
      margin: unset;
    }
    
    &.active {
      color: $text-dark;
      background: $text-light;
    }
    
    &:hover {
      border-color: $blue;
    }
  }
}

.gallery {
  column-count: 3;
  gap: 5px;
  margin: 5px 0;

  @media (max-width: 992px) {
    column-count: 2;
  }
}

.project-title {
  font-size: 1.2rem;
  font-weight: 500;
  text-align: center;
  margin: 1em 0;
}

.project-images {
  display: grid;
  gap: 5px;
  grid-auto-rows: minmax(150px, auto);
  grid-auto-flow: dense;
  
  @media (max-width: 420px) {
    grid-auto-rows: unset;
  }
}

.thumbnail {
  width: 100%;
  height: auto;
  cursor: pointer;
  transition: filter 0.2s ease;
  object-fit: cover;

  &:hover {
    filter: brightness(120%)
  }
}

.lightbox-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.lightbox-img {
  max-width: 100vw;
  max-height: 100vh;
  // border-radius: 0.5rem;
}

.lightbox-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  font-size: 2rem;
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  z-index: 1001;

  &:hover {
    opacity: 0.8;
  }

  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
    pointer-events: none;
  }
}

.prev {
  left: 2rem;
}

.next {
  right: 2rem;
}
</style>
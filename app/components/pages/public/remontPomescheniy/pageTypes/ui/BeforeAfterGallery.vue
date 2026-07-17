<!-- app/components/pages/public/remontPomescheniy/pageTypes/ui/BeforeAfterGallery.vue -->
<template>
  <section class="before-after-gallery">
    <div class="container">
      <header class="before-after-gallery__header">
        <h2 class="before-after-gallery__title" v-html="title" />
      </header>

      <!-- Состояния загрузки / ошибки / пусто -->
      <div v-if="loading" class="before-after-gallery__state">
        <div class="before-after-gallery__loader">
          <div class="before-after-gallery__spinner" />
          <span>Загружаем фотографии...</span>
        </div>
      </div>

      <div v-else-if="error" class="before-after-gallery__state before-after-gallery__state--error">
        <Icon name="mdi:alert-circle-outline" size="32" />
        <p>{{ error }}</p>
        <button class="before-after-gallery__retry" @click="fetchProjects">
          Попробовать снова
        </button>
      </div>

      <div v-else-if="beforeImages.length === 0 && afterImages.length === 0" class="before-after-gallery__state">
        <Icon name="mdi:folder-open-outline" size="48" />
        <p>Фотографии пока не добавлены</p>
      </div>

      <template v-else>
        <!-- Ряд "После" -->
        <div v-if="afterImages.length > 0" class="before-after-gallery__row">
          <h3 class="before-after-gallery__row-title">После ремонта</h3>
          <div class="before-after-gallery__grid">
            <div
              v-for="(image, index) in afterImages"
              :key="`after-${index}`"
              class="before-after-gallery__card"
              @click="openLightbox(image.url, 'after')"
            >
              <div class="before-after-gallery__card-image">
                <img
                  :src="useImageUrl(image.url)"
                  :alt="image.alt || 'После ремонта'"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Ряд "До" -->
        <div v-if="beforeImages.length > 0" class="before-after-gallery__row">
          <h3 class="before-after-gallery__row-title">До ремонта</h3>
          <div class="before-after-gallery__grid">
            <div
              v-for="(image, index) in beforeImages"
              :key="`before-${index}`"
              class="before-after-gallery__card"
              @click="openLightbox(image.url, 'before')"
            >
              <div class="before-after-gallery__card-image">
                <img
                  :src="useImageUrl(image.url)"
                  :alt="image.alt || 'До ремонта'"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- Футер с кнопкой -->
      <div
        v-if="!loading && !error && (beforeImages.length > 0 || afterImages.length > 0)"
        class="before-after-gallery__footer"
      >
        <NuxtLink :to="footerLink" class="before-after-gallery__footer-link">
          <span>{{ footerLabel }}</span>
          <Icon name="mdi:arrow-right" size="20" />
        </NuxtLink>
      </div>
    </div>

    <!-- Lightbox -->
    <div v-if="lightboxVisible" class="lightbox-overlay" @click.self="closeLightbox">
      <button
        class="lightbox-nav lightbox-nav--prev"
        :disabled="currentImageIndex === 0"
        @click.stop="prevImage"
      >
        &#10094;
      </button>

      <img
        :src="useImageUrl(currentImage.url)"
        :alt="currentImage.alt || 'Фото'"
        class="lightbox-img"
      />

      <button
        class="lightbox-nav lightbox-nav--next"
        :disabled="currentImageIndex === allImagesForLightbox.length - 1"
        @click.stop="nextImage"
      >
        &#10095;
      </button>

      <button class="lightbox-close" @click="closeLightbox">
        <Icon name="mdi:close" size="28" />
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useImageUrl } from '~/composables/useImageUrl'
interface ProjectImage {
  url: string
  type?: string
  alt?: string
}

interface Project {
  id?: number | string
  slug?: string
  title?: string
  images?: ProjectImage[]
  [key: string]: unknown
}

const props = withDefaults(
  defineProps<{
    /** Массив slugs для фильтрации из API */
    slugs?: string[]
    /** URL API для загрузки */
    fetchUrl?: string
    /** Заголовок секции */
    title?: string
    /** Ссылка на страницу со всеми проектами */
    allProjectsLink?: string
  }>(),
  {
    title: 'Фото <span>до и после</span> ремонта',
    fetchUrl: '/api/portfolio',
    allProjectsLink: '/projects',
  }
)

const loading = ref(false)
const error = ref<string | null>(null)
const fetchedProjects = ref<Project[]>([])

// Собираем все изображения before/after из отфильтрованных проектов
const allImages = computed<(ProjectImage & { projectSlug?: string })[]>(() => {
  const projects = fetchedProjects.value
  const images: (ProjectImage & { projectSlug?: string })[] = []

  projects.forEach((project) => {
    if (project.images && Array.isArray(project.images)) {
      project.images.forEach((img) => {
        if (img.type === 'before' || img.type === 'after') {
          images.push({
            ...img,
            projectSlug: project.slug,
          })
        }
      })
    }
  })

  return images
})

// Разделяем на before и after
const beforePool = computed(() =>
  allImages.value.filter((img) => img.type === 'before')
)
const afterPool = computed(() =>
  allImages.value.filter((img) => img.type === 'after')
)

// Перемешиваем и выбираем по 5
const shuffleArray = <T>(arr: T[]): T[] => {
  const shuffled = [...arr]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = shuffled[i] as T
    shuffled[i] = shuffled[j] as T
    shuffled[j] = temp
  }
  return shuffled
}

const beforeImages = computed(() => shuffleArray(beforePool.value).slice(0, 5))
const afterImages = computed(() => shuffleArray(afterPool.value).slice(0, 5))

// Все изображения для lightbox (объединяем: сначала after, потом before)
const allImagesForLightbox = computed(() => [
  ...afterImages.value.map((img) => ({ ...img, type: 'after' as const })),
  ...beforeImages.value.map((img) => ({ ...img, type: 'before' as const })),
])

// ---- Футер ----
const validSlugs = computed<string[]>(() => {
  return (props.slugs || []).filter((s) => s && s.trim() !== '')
})

const footerLink = computed(() => {
  if (validSlugs.value.length === 1) {
    return `/projects/${validSlugs.value[0]}`
  }
  return props.allProjectsLink
})

const footerLabel = computed(() => {
  if (validSlugs.value.length === 1) {
    return 'Смотреть проект'
  }
  return 'Смотреть все проекты'
})

// ---- Lightbox ----
const lightboxVisible = ref(false)
const currentImageIndex = ref(0)

const currentImage = computed(() => {
  return allImagesForLightbox.value[currentImageIndex.value] || { url: '', alt: '' }
})

const openLightbox = (url: string, type: 'before' | 'after') => {
  const index = allImagesForLightbox.value.findIndex(
    (img) => img.url === url && img.type === type
  )
  if (index >= 0) {
    currentImageIndex.value = index
    lightboxVisible.value = true
  }
}

const closeLightbox = () => {
  lightboxVisible.value = false
}

const prevImage = () => {
  if (currentImageIndex.value > 0) currentImageIndex.value--
}

const nextImage = () => {
  if (currentImageIndex.value < allImagesForLightbox.value.length - 1)
    currentImageIndex.value++
}

const handleKeydown = (e: KeyboardEvent) => {
  if (!lightboxVisible.value) return
  if (e.key === 'Escape') closeLightbox()
  if (e.key === 'ArrowLeft') prevImage()
  if (e.key === 'ArrowRight') nextImage()
}

// ---- Fetch ----
const fetchProjects = async () => {
  loading.value = true
  error.value = null

  try {
    const data = await $fetch<{ data?: Project[] } | Project[]>(props.fetchUrl)
    const list = Array.isArray(data) ? data : data?.data
    const allProjects = Array.isArray(list) ? list : []

    // Фильтруем по slugs если они заданы
    if (props.slugs && props.slugs.length > 0) {
      fetchedProjects.value = allProjects.filter(
        (p) => p.slug && props.slugs!.includes(p.slug)
      )
    } else {
      // Если slugs пуст — берем случайные 3 проекта
      fetchedProjects.value = shuffleArray(allProjects).slice(0, 3)
    }
  } catch (err) {
    console.error('[BeforeAfterGallery] Ошибка загрузки проектов:', err)
    error.value = 'Не удалось загрузить фотографии'
    fetchedProjects.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchProjects()
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;

.before-after-gallery {
  padding: 5rem 0;
  background: $background-light;
  position: relative;

  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 2rem;

    @media (max-width: 768px) {
      padding: 0 1.2rem;
    }
  }

  // === Заголовок ===
  &__header {
    margin-bottom: 2.5rem;
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

    @media (max-width: 768px) {
      font-size: 1.7rem;
    }

    :deep(span) {
      background: $blue-gradient;
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
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

    &--error {
      color: $red;
      background: rgba(166, 19, 0, 0.05);
      border: 1px solid rgba(166, 19, 0, 0.2);
      border-radius: 6px;
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

  &__retry {
    margin-top: 0.5rem;
    padding: 0.6rem 1.3rem;
    background: transparent;
    border: 1px solid $red;
    color: $red;
    border-radius: 6px;
    font-family: 'Rubik', sans-serif;
    font-weight: 500;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.25s ease;

    &:hover {
      background: $red;
      color: #fff;
    }
  }

  // === Ряды ===
  &__row {
    margin-bottom: 2.5rem;

    &:last-child {
      margin-bottom: 0;
    }
  }

  &__row-title {
    font-family: 'Rubik', sans-serif;
    font-size: 1.3rem;
    font-weight: 600;
    color: $text-dark;
    margin: 0 0 1rem;
    padding-left: 0.25rem;
  }

  // === Сетка ===
  &__grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 1rem;

    @media (max-width: 992px) {
      grid-template-columns: repeat(3, 1fr);
    }

    @media (max-width: 576px) {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  // === Футер ===
  &__footer {
    margin-top: 2.5rem;
    display: flex;
    justify-content: center;
  }

  &__footer-link {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.9rem 2rem;
    background: $blue-gradient;
    color: $background-dark;
    font-family: 'Rubik', sans-serif;
    font-weight: 600;
    font-size: 1rem;
    border-radius: 6px;
    text-decoration: none;
    box-shadow: 0 6px 20px rgba(0, 195, 245, 0.3);
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-3px);
      box-shadow: 0 10px 28px rgba(0, 195, 245, 0.45);
      color: $background-dark;
    }

    &:active {
      transform: translateY(-1px);
    }
  }

  // === Карточка ===
  &__card {
    border-radius: 8px;
    overflow: hidden;
    cursor: pointer;
    aspect-ratio: 4 / 3;
    background: $background-gray;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    transition: transform 0.3s ease, box-shadow 0.3s ease;

    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);

      img {
        transform: scale(1.08);
      }
    }
  }

  &__card-image {
    width: 100%;
    height: 100%;
    overflow: hidden;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.5s ease;
    }
  }

  // === Lightbox ===
  .lightbox-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.85);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }

  .lightbox-img {
    max-width: 90vw;
    max-height: 85vh;
    object-fit: contain;
    border-radius: 4px;
  }

  .lightbox-nav {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    font-size: 2.5rem;
    background: rgba(0, 0, 0, 0.3);
    border: none;
    color: #fff;
    cursor: pointer;
    z-index: 1001;
    width: 50px;
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: background 0.2s ease;

    &:hover {
      background: rgba(0, 0, 0, 0.6);
    }

    &:disabled {
      opacity: 0.3;
      cursor: not-allowed;
      pointer-events: none;
    }

    &--prev {
      left: 1.5rem;
    }

    &--next {
      right: 1.5rem;
    }
  }

  .lightbox-close {
    position: absolute;
    top: 1.5rem;
    right: 1.5rem;
    background: rgba(0, 0, 0, 0.3);
    border: none;
    color: #fff;
    cursor: pointer;
    z-index: 1001;
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: background 0.2s ease;

    &:hover {
      background: rgba(0, 0, 0, 0.6);
    }

    :deep(.icon) {
      color: #fff;
    }
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

// === Адаптив ===
@media (max-width: 768px) {
  .before-after-gallery {
    padding: 3.5rem 0;

    &__title {
      font-size: 1.7rem;
    }

    &__row-title {
      font-size: 1.1rem;
    }

    &__row {
      margin-bottom: 1.8rem;
    }
  }
}
</style>
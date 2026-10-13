<!-- app\components\ui\map\YandexMap.vue -->
<template>
  <div class="yandex-map-wrapper">
    <div class="yandex-map-header">
      <h2 class="yandex-map-title">
        <Icon name="mdi:map-marker-radius" size="28" class="yandex-map-title-icon" />
        Наши объекты на карте Рязани
      </h2>
      <p class="yandex-map-subtitle">
        {{ projectsWithCoords.length }} реализованных проектов с адресами
      </p>
    </div>

    <div class="yandex-map-container">
      <div ref="mapContainer" class="yandex-map"></div>
      
      <!-- Popup с информацией о проекте -->
      <Transition name="popup">
        <div 
          v-if="activeProject" 
          class="map-popup"
          :style="popupPosition"
        >
          <button class="map-popup__close" @click.stop="closePopup" aria-label="Закрыть">
            <Icon name="mdi:close" size="20" />
          </button>
          
          <!-- Весь контент popup — это ссылка на страницу кейса -->
          <NuxtLink 
            :to="`/projects/${activeProject.slug}`" 
            class="map-popup__body"
            @click="closePopup"
          >
            <div class="map-popup__image">
              <img 
                :src="useImageUrl(activeProject.mainImage)" 
                :alt="activeProject.title"
                loading="lazy"
              />
            </div>
            
            <div class="map-popup__content">
              <div class="map-popup__category" v-if="activeProject.category">
                {{ activeProject.category }}
              </div>
              <h4 class="map-popup__title">{{ activeProject.title }}</h4>
              <div class="map-popup__address">
                <Icon name="mdi:map-marker" size="16" />
                <span>{{ activeProject.address }}</span>
              </div>
              <div class="map-popup__space" v-if="activeProject.space">
                <Icon name="mdi:ruler-square" size="16" />
                <span>{{ activeProject.space }} м²</span>
              </div>
              
              <!-- Заметная кнопка-ссылка -->
              <div class="map-popup__action">
                <span>Перейти к проекту</span>
                <Icon name="weui:arrow-filled" size="16" />
              </div>
            </div>
          </NuxtLink>
        </div>
      </Transition>

      <!-- Подсказка -->
      <div class="yandex-map-hint">
        <Icon name="mdi:information-outline" size="16" />
        <span>Клик — информация о проекте, двойной клик — переход к кейсу</span>
      </div>

      <!-- Загрузка карты -->
      <div v-if="loading" class="yandex-map-loading">
        <div class="loading-spinner"></div>
        <p>Загружаем карту...</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const props = defineProps({
  projects: {
    type: Array,
    default: () => []
  },
  center: {
    type: Array,
    default: () => [54.6269, 39.6916]
  },
  zoom: {
    type: Number,
    default: 12
  }
})

const API_KEY = 'dda27b6a-e4c6-4d25-835b-846135ea9c2b'

const mapContainer = ref(null)
const activeProject = ref(null)
const popupPosition = ref({})
const loading = ref(true)

let map = null
let markers = []
let mapClickHandler = null
let documentClickHandler = null
let clickTimers = new Map() // Таймеры для двойного клика по каждой метке

const projectsWithCoords = computed(() => {
  return props.projects.filter(p => 
    p.coordinates && p.coordinates.latitude && p.coordinates.longitude && p.slug
  )
})

const loadYandexMaps = () => {
  return new Promise((resolve, reject) => {
    if (window.ymaps && window.ymaps.Map) {
      resolve(window.ymaps)
      return
    }

    const oldScripts = document.querySelectorAll('script[src*="api-maps.yandex.ru/v3"]')
    oldScripts.forEach(s => s.remove())

    const script = document.createElement('script')
    script.src = `https://api-maps.yandex.ru/2.1/?apikey=${API_KEY}&lang=ru_RU`
    script.async = true
    
    script.onload = () => {
      if (window.ymaps) {
        window.ymaps.ready(() => resolve(window.ymaps))
      } else {
        reject(new Error('ymaps не определён'))
      }
    }
    
    script.onerror = (error) => {
      console.error('Ошибка загрузки Yandex Maps API:', error)
      reject(error)
    }
    
    document.head.appendChild(script)
  })
}

const createMarkerLayout = (ymaps) => {
  return ymaps.templateLayoutFactory.createClass(
    '<div class="custom-marker">' +
      '<div class="marker-pin">' +
        '<div class="marker-pin__icon">' +
          '<svg width="20" height="20" viewBox="0 0 24 24" fill="none">' +
            '<path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="currentColor"/>' +
          '</svg>' +
        '</div>' +
      '</div>' +
    '</div>'
  )
}

const initMap = async () => {
  try {
    const ymaps = await loadYandexMaps()
    
    if (!mapContainer.value) return

    map = new ymaps.Map(mapContainer.value, {
      center: props.center,
      zoom: props.zoom,
      controls: ['zoomControl']
    }, {
      suppressMapOpenBlock: true
    })

    if (projectsWithCoords.value.length > 0) {
      const bounds = calculateBounds(projectsWithCoords.value)
      if (bounds) {
        map.setBounds(bounds, {
          checkZoomRange: true,
          zoomMargin: [40, 40, 40, 40]
        })
      }
    }

    mapClickHandler = () => {
      if (activeProject.value) closePopup()
    }
    map.events.add('click', mapClickHandler)

    addMarkers(ymaps)
    loading.value = false
  } catch (error) {
    console.error('Ошибка инициализации Яндекс.Карт:', error)
    loading.value = false
  }
}

const calculateBounds = (projects) => {
  if (!projects.length) return null
  
  let minLat = Infinity, maxLat = -Infinity
  let minLon = Infinity, maxLon = -Infinity

  projects.forEach(p => {
    const lat = p.coordinates.latitude
    const lon = p.coordinates.longitude
    if (lat < minLat) minLat = lat
    if (lat > maxLat) maxLat = lat
    if (lon < minLon) minLon = lon
    if (lon > maxLon) maxLon = lon
  })

  return [[minLat, minLon], [maxLat, maxLon]]
}

const navigateToProject = (project) => {
  closePopup()
  router.push(`/projects/${project.slug}`)
}

const addMarkers = (ymaps) => {
  if (!map || !ymaps) return
  
  const IconLayout = createMarkerLayout(ymaps)
  
  markers.forEach(marker => map.geoObjects.remove(marker))
  markers = []
  clickTimers.clear()
  
  projectsWithCoords.value.forEach(project => {
    const placemark = new ymaps.Placemark(
      [project.coordinates.latitude, project.coordinates.longitude],
      {
        hintContent: project.title,
      },
      {
        iconLayout: IconLayout,
        iconShape: {
          type: 'Circle',
          coordinates: [22, 22],
          radius: 22
        },
        iconOffset: [-22, -44]
      }
    )

    // Обработчик кликов с поддержкой двойного клика
    placemark.events.add('click', (e) => {
      e.get('domEvent').stopPropagation()
      
      const existingTimer = clickTimers.get(project.slug)
      
      if (existingTimer) {
        // Двойной клик — сразу переходим к проекту
        clearTimeout(existingTimer)
        clickTimers.delete(project.slug)
        navigateToProject(project)
      } else {
        // Одиночный клик — ждём 300мс на случай двойного
        const timer = setTimeout(() => {
          showPopup(project, placemark)
          clickTimers.delete(project.slug)
        }, 300)
        clickTimers.set(project.slug, timer)
      }
    })

    placemark.events.add('mouseenter', () => {
      const elem = placemark.getElement ? placemark.getElement() : null
      if (elem) elem.classList.add('marker-hover')
    })
    placemark.events.add('mouseleave', () => {
      const elem = placemark.getElement ? placemark.getElement() : null
      if (elem) elem.classList.remove('marker-hover')
    })

    map.geoObjects.add(placemark)
    markers.push(placemark)
  })
}

const showPopup = (project, placemark) => {
  activeProject.value = {
    ...project,
    mainImage: getMainImage(project.images)
  }
  
  const position = placemark.geometry.getCoordinates()
  const projection = map.options.get('projection')
  const pixelCoords = projection.toGlobalPixels(position, map.getZoom())
  
  const mapRect = mapContainer.value.getBoundingClientRect()
  const mapCenter = map.getCenter()
  const centerPixels = projection.toGlobalPixels(mapCenter, map.getZoom())
  
  const offsetX = pixelCoords[0] - centerPixels[0] + mapRect.width / 2
  const offsetY = pixelCoords[1] - centerPixels[1] + mapRect.height / 2

  popupPosition.value = {
    left: `${offsetX}px`,
    top: `${offsetY - 20}px`
  }
}

const closePopup = () => {
  activeProject.value = null
}

const getMainImage = (images) => {
  if (!images?.length) return '/images/placeholder.jpg'
  const mainImage = images.find(img => img.type === 'main')
  return mainImage?.url || images[0]?.url || '/images/placeholder.jpg'
}

documentClickHandler = (e) => {
  if (activeProject.value && !e.target.closest('.map-popup') && !e.target.closest('.custom-marker')) {
    closePopup()
  }
}

onMounted(() => {
  initMap()
  document.addEventListener('click', documentClickHandler)
})

onBeforeUnmount(() => {
  clickTimers.forEach(timer => clearTimeout(timer))
  clickTimers.clear()
  
  if (documentClickHandler) {
    document.removeEventListener('click', documentClickHandler)
  }
  if (map) {
    map.destroy()
  }
})

watch(() => props.projects, () => {
  if (map && !loading.value) {
    loadYandexMaps().then(ymaps => addMarkers(ymaps))
  }
}, { deep: true })
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;

.yandex-map-wrapper {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.yandex-map-header {
  margin-bottom: 2rem;
  text-align: center;
}

.yandex-map-title {
  font-family: 'Rubik', sans-serif;
  font-size: 2rem;
  font-weight: 700;
  color: $text-light;
  margin: 0 0 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;

  &-icon {
    color: $blue;
  }

  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
}

.yandex-map-subtitle {
  font-size: 1.05rem;
  color: rgba($text-light, 0.7);
  margin: 0;

  @media (max-width: 768px) {
    font-size: 0.95rem;
  }
}

.yandex-map-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 1rem;
  font-size: 0.85rem;
  color: rgba($text-light, 0.5);

  :deep(.icon) {
    color: $blue;
  }
}

.yandex-map-container {
  position: relative;
  width: 100%;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.yandex-map {
  width: 100%;
  height: 600px;
  
  @media (max-width: 768px) {
    height: 450px;
  }

  @media (max-width: 480px) {
    height: 380px;
  }
}

.yandex-map-loading {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(24, 25, 27, 0.95);
  backdrop-filter: blur(8px);
  gap: 1rem;
  z-index: 10;

  .loading-spinner {
    width: 48px;
    height: 48px;
    border: 3px solid rgba(255, 255, 255, 0.1);
    border-top-color: $blue;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  p {
    color: rgba($text-light, 0.8);
    font-size: 0.95rem;
    margin: 0;
  }
}

:deep(.custom-marker) {
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover,
  &.marker-hover {
    transform: scale(1.15) translateY(-4px);
  }
  
  .marker-pin {
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: white;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
    border: 2px solid $blue;
    transition: all 0.3s ease;
    
    &__icon {
      transform: rotate(45deg);
      color: $blue;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  &:hover .marker-pin,
  &.marker-hover .marker-pin {
    background: $blue;
    border-color: white;
    
    &__icon {
      color: white;
    }
  }
}

.map-popup {
  position: absolute;
  transform: translate(-50%, -100%);
  background: white;
  border-radius: 12px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
  max-width: 320px;
  min-width: 280px;
  z-index: 1000;
  overflow: hidden;
  
  &__close {
    position: absolute;
    top: 0.75rem;
    right: 0.75rem;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
    border: none;
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    z-index: 10;
    
    &:hover {
      background: rgba(0, 0, 0, 0.8);
      transform: scale(1.1);
    }
  }

  // Весь контент — это ссылка
  &__body {
    display: block;
    text-decoration: none;
    color: inherit;
    cursor: pointer;
    transition: opacity 0.2s ease;

    &:hover {
      opacity: 0.95;
      
      .map-popup__action {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(0, 195, 245, 0.4);
      }
    }
  }
  
  &__image {
    width: 100%;
    height: 160px;
    overflow: hidden;
    position: relative;
    
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.4s ease;
    }

    &:hover img {
      transform: scale(1.05);
    }
  }
  
  &__content {
    padding: 1.25rem;
  }

  &__category {
    display: inline-block;
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: $blue;
    padding: 0.25rem 0.6rem;
    background: rgba(0, 195, 245, 0.1);
    border: 1px solid rgba(0, 195, 245, 0.3);
    border-radius: 4px;
    margin-bottom: 0.5rem;
  }
  
  &__title {
    font-family: 'Rubik', sans-serif;
    font-size: 1.1rem;
    font-weight: 700;
    margin: 0 0 0.75rem;
    color: $text-dark;
    line-height: 1.3;
  }
  
  &__address,
  &__space {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.85rem;
    color: $text-gray;
    margin-bottom: 0.5rem;
    line-height: 1.4;

    :deep(.icon) {
      flex-shrink: 0;
      color: $blue;
    }
  }

  // Заметная кнопка-ссылка
  &__action {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    background: $blue-gradient;
    color: white;
    font-size: 0.9rem;
    font-weight: 600;
    margin-top: 1rem;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    transition: all 0.3s ease;
    box-shadow: 0 4px 12px rgba(0, 195, 245, 0.25);

    :deep(.icon) {
      transition: transform 0.3s ease;
    }
  }
}

.popup-enter-active {
  transition: all 0.3s ease;
}

.popup-leave-active {
  transition: all 0.2s ease;
}

.popup-enter-from {
  opacity: 0;
  transform: translate(-50%, -90%);
}

.popup-leave-to {
  opacity: 0;
  transform: translate(-50%, -110%);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .yandex-map-hint {
    font-size: 0.78rem;
    padding: 0 1rem;
    text-align: center;
  }

  .map-popup {
    max-width: 280px;
    min-width: 240px;

    &__image { height: 140px; }
    &__content { padding: 1rem; }
    &__title { font-size: 1rem; }
    &__address, &__space { font-size: 0.8rem; }
    &__action { 
      padding: 0.6rem 0.9rem;
      font-size: 0.85rem;
    }
  }
}
</style>
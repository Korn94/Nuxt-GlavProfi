<template>
  <div class="admin-portfolio-edit">
    <h1>Редактирование кейса: {{ form.title }}</h1>
    
    <div v-if="loading" class="loading">
      <Icon name="eos-icons:bubble-loading" size="34px" /> Загрузка данных...
    </div>
    
    <div v-else-if="error" class="error">{{ error }}</div>
    
    <form v-else @submit.prevent="submitCase">
      <!-- Основная информация -->
      <BasicInfo
        :title="form.title"
        :slug="form.slug"
        :category="form.category"
        :address="form.address"
        @update:title="form.title = $event"
        @update:slug="form.slug = $event"
        @update:category="form.category = $event"
        @update:address="form.address = $event"
      />

      <!-- Основные изображения и галерея -->
      <ImagesMain
        :main-image="form.mainImage"
        :thumbnail="form.thumbnail"
        :gallery="form.gallery"
        :existing-gallery="existingGallery"
        @update:main-image="form.mainImage = $event"
        @update:thumbnail="form.thumbnail = $event"
        @update:gallery="form.gallery = $event"
        @remove-existing-image="handleRemoveExistingImage"
      />

      <!-- Сравнение: До и После -->
      <BeforeAfter
        :pair-group="form.pairGroup"
        :before-after-pairs="form.beforeAfterPairs"
        @update:pair-group="form.pairGroup = $event"
        @update:before-after-pairs="form.beforeAfterPairs = $event"
      />

      <!-- Описания и результат -->
      <Descriptions
        :object-description="form.objectDescription"
        :short-object="form.shortObject"
        :short-description="form.shortDescription"
        :full-description="form.fullDescription"
        :result="form.result"
        @update:object-description="form.objectDescription = $event"
        @update:short-object="form.shortObject = $event"
        @update:short-description="form.shortDescription = $event"
        @update:full-description="form.fullDescription = $event"
        @update:result="form.result = $event"
      />

      <!-- Работы и статистика -->
      <WorksAndStats
        :works="form.works"
        :space="form.space"
        :duration="form.duration"
        :people="form.people"
        @update:works="form.works = $event"
        @update:space="form.space = $event"
        @update:duration="form.duration = $event"
        @update:people="form.people = $event"
      />

      <!-- SEO-настройки -->
      <Seo
        :meta-title="form.metaTitle"
        :meta-description="form.metaDescription"
        :meta-keywords="form.metaKeywords"
        @update:meta-title="form.metaTitle = $event"
        @update:meta-description="form.metaDescription = $event"
        @update:meta-keywords="form.metaKeywords = $event"
      />

      <!-- Кнопки управления -->
      <div class="form-actions">
        <button type="submit" class="btn primary" :disabled="uploading">
          {{ uploading ? 'Сохранение...' : 'Сохранить изменения' }}
        </button>
        <button
          @click="$router.back()"
          type="button"
          class="btn secondary"
          :disabled="uploading"
        >
          Отмена
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useHead } from '#app'

// Импорт компонентов
import BasicInfo from '~/components/pages/public/projects/create/BasicInfo.vue'
import ImagesMain from '~/components/pages/public/projects/create/ImagesMain.vue'
import BeforeAfter from '~/components/pages/public/projects/create/BeforeAfter.vue'
import Descriptions from '~/components/pages/public/projects/create/Descriptions.vue'
import WorksAndStats from '~/components/pages/public/projects/create/WorksAndStats.vue'
import Seo from '~/components/pages/public/projects/create/Seo.vue'

// Получаем текущий маршрут и роутер
const route = useRoute()
const router = useRouter()

// Состояние
const form = ref({
  title: '',
  slug: '',
  category: 'Кафе',
  objectDescription: '',
  shortObject: '',
  space: 0,
  duration: '',
  people: '',
  shortDescription: '',
  fullDescription: '',
  result: '',
  metaTitle: '',
  metaDescription: '',
  metaKeywords: '',
  address: 'Не указано',
  mainImage: null,
  thumbnail: null,
  beforeAfterPairs: [],
  gallery: [],
  pairGroup: '',
  works: []
})

// Состояние загрузки
const loading = ref(false)
const uploading = ref(false)
const error = ref(null)
const originalCaseData = ref(null)
const existingGallery = ref([])

// Метод для удаления существующего изображения
const handleRemoveExistingImage = (imageId) => {
  if (confirm('Вы уверены, что хотите удалить это изображение?')) {
    // Удаляем изображение через API
    fetch(`/api/portfolio/${route.params.slug}/images/${imageId}`, {
      method: 'DELETE',
      credentials: 'same-origin'
    })
    .then(response => {
      if (response.ok) {
        // Успешно удалено, перезагружаем данные
        loadCaseData()
      } else {
        alert('Не удалось удалить изображение')
      }
    })
    .catch(err => {
      console.error('Ошибка при удалении изображения:', err)
      alert('Ошибка сети при удалении изображения')
    })
  }
}

// Загрузка данных кейса
const loadCaseData = async () => {
  try {
    loading.value = true
    error.value = null

    // Загружаем основные данные кейса
    const caseData = await $fetch(`/api/portfolio/${route.params.slug}`, { method: 'GET' })

    // Загружаем изображения
    const images = await $fetch(`/api/portfolio/${route.params.slug}/images`, { method: 'GET' })

    // Загружаем работы
    const works = await $fetch(`/api/portfolio/${route.params.slug}/works`, { method: 'GET' })

    // Сохраняем оригинальные данные
    originalCaseData.value = caseData

    // Разделяем существующие изображения по типам
    console.log("DEBUG CLIENT: images from API:", images);
    const existingMainImage = images.find(img => img.type === 'main')
    const existingThumbnail = images.find(img => img.type === 'thumbnail')
    console.log("DEBUG CLIENT: existingMainImage:", existingMainImage);
    console.log("DEBUG CLIENT: existingThumbnail:", existingThumbnail);

    // КРИТИЧЕСКИ ВАЖНЫЙ ФРАГМЕНТ - УСТАНОВКА ID ДЛЯ ОСНОВНЫХ ИЗОБРАЖЕНИЙ
    // Устанавливаем главное изображение с ID
    if (existingMainImage) {
      form.value.mainImage = {
        id: existingMainImage.id,
        preview: existingMainImage.url,
        type: 'main'
      }
    }

    // Устанавливаем миниатюру с ID
    if (existingThumbnail) {
      form.value.thumbnail = {
        id: existingThumbnail.id,
        preview: existingThumbnail.url,
        type: 'thumbnail'
      }
    }

    // Фильтруем только изображения типа "before" и "after" для галереи
    existingGallery.value = images.filter(img => img.type === 'before' || img.type === 'after')

    // Преобразуем пары "до/после"
    const beforeAfterMap = new Map()
    existingGallery.value.forEach(img => {
      if (img.type === 'before' || img.type === 'after') {
        const groupKey = img.pairGroup || 'ungrouped'
        if (!beforeAfterMap.has(groupKey)) {
          beforeAfterMap.set(groupKey, { before: null, after: null })
        }
        beforeAfterMap.get(groupKey)[img.type] = {
          file: null,
          preview: img.url,
          id: img.id
        }
      }
    })
    form.value.beforeAfterPairs = Array.from(beforeAfterMap.values())

    // Устанавливаем остальные поля формы
    form.value.title = caseData.title || ''
    form.value.slug = caseData.slug || ''
    form.value.category = caseData.category || 'Кафе'
    form.value.objectDescription = caseData.objectDescription || ''
    form.value.shortObject = caseData.shortObject || ''
    form.value.space = caseData.space || 0
    form.value.duration = caseData.duration || ''
    form.value.people = caseData.people || ''
    form.value.shortDescription = caseData.shortDescription || ''
    form.value.fullDescription = caseData.fullDescription || ''
    form.value.result = caseData.result || ''
    form.value.metaTitle = caseData.metaTitle || ''
    form.value.metaDescription = caseData.metaDescription || ''
    form.value.metaKeywords = caseData.metaKeywords || ''
    form.value.address = caseData.address || 'Не указано'

    console.log("DEBUG CLIENT: form.mainImage after setting:", form.value.mainImage);
    console.log("DEBUG CLIENT: form.thumbnail after setting:", form.value.thumbnail);

    // Устанавливаем работы
    form.value.works = works.map(work => ({
      workType: work.workType,
      progress: work.progress
    }))

  } catch (err) {
    error.value = 'Не удалось загрузить данные кейса для редактирования'
    console.error('Ошибка загрузки кейса:', err)
  } finally {
    loading.value = false
  }
}

// Отправка формы
const submitCase = async () => {
  try {
    uploading.value = true
    error.value = null

    // Определяем, редактируем ли мы существующий кейс
    const isEditing = !!route.params.slug

    console.log("DEBUG CLIENT: submitCase started. form.mainImage:", form.value.mainImage, "form.thumbnail:", form.value.thumbnail);

    // --- ПРОВЕРКИ ---
    // Проверяем, что объекты изображений существуют
    if (!form.value.mainImage) {
      throw new Error('Главное изображение не определено')
    }
    if (!form.value.thumbnail) {
      throw new Error('Миниатюра не определена')
    }

    // Проверяем, что для НОВОГО кейса обязательно загружены файлы
    if (!isEditing) {
      if (!form.value.mainImage.file) {
        throw new Error('Необходимо загрузить главное изображение')
      }
      if (!form.value.thumbnail.file) {
        throw new Error('Необходимо загрузить миниатюру')
      }
    } else { // Проверяем, что при РЕДАКТИРОВАНИИ либо есть файл, либо есть ID существующего изображения
      if (!form.value.mainImage.file && !form.value.mainImage.id) {
        throw new Error('Необходимо загрузить главное изображение или оставить существующее')
      }
      if (!form.value.thumbnail.file && !form.value.thumbnail.id) {
        throw new Error('Необходимо загрузить миниатюру или оставить существующую')
      }
    }

    const formData = new FormData()

    // Добавляем текстовые поля
    Object.entries(form.value).forEach(([key, value]) => {
      // Исключаем сложные объекты, которые будут обрабатываться отдельно
      if (['beforeAfterPairs', 'gallery', 'mainImage', 'thumbnail', 'works'].includes(key)) return
      formData.append(key, value ?? '')
    })

    // --- ОБРАБОТКА ОСНОВНЫХ ИЗОБРАЖЕНИЙ ---
    // Если файл нового главного изображения загружен, отправляем его
    if (form.value.mainImage?.file) {
        console.debug("DEBUG CLIENT: Sending NEW main image file", form.value.mainImage.file);
        formData.append('mainImage', form.value.mainImage.file);
    } else if (form.value.mainImage?.id && form.value.mainImage?.preview) {
        // Если файл не загружен, но есть ID и preview (старое изображение), отправляем ID
        console.debug("DEBUG CLIENT: Keeping EXISTING main image by ID", form.value.mainImage.id);
        formData.append('mainImageId', form.value.mainImage.id);
    }

    // Аналогично для миниатюры
    if (form.value.thumbnail?.file) {
        console.debug("DEBUG CLIENT: Sending NEW thumbnail file", form.value.thumbnail.file);
        formData.append('thumbnail', form.value.thumbnail.file);
    } else if (form.value.thumbnail?.id && form.value.thumbnail?.preview) {
        console.debug("DEBUG CLIENT: Keeping EXISTING thumbnail by ID", form.value.thumbnail.id);
        formData.append('thumbnailId', form.value.thumbnail.id);
    }

    // --- ОБРАБОТКА ГАЛЕРЕИ ---
    // Отправляем только *новые* файлы из галереи (form.value.gallery)
    form.value.gallery.forEach((img, index) => {
      if (img.file) { // Только если это новый файл
        formData.append(`gallery[${index}]`, img.file)
        formData.append(`galleryType[${index}]`, img.type)
      }
    })

    // --- ОБРАБОТКА ПАР "ДО/ПОСЛЕ" ---
    // Отправляем информацию о существующих парах "до/после"
    form.value.beforeAfterPairs.forEach((pair, index) => {
      if (pair.before?.id) {
        formData.append(`existingBeforeImage[${index}]`, pair.before.id)
      }
      if (pair.after?.id) {
        formData.append(`existingAfterImage[${index}]`, pair.after.id)
      }
    })

    // Отправляем информацию о существующих изображениях галереи
    if (Array.isArray(existingGallery.value)) {
      existingGallery.value.forEach((image, index) => {
        formData.append(`existingGalleryImage[${index}]`, image.id)
      })
    }

    // --- ОБРАБОТКА РАБОТ ---
    form.value.works.forEach((work, index) => {
      formData.append(`workType[${index}]`, work.workType)
      formData.append(`progress[${index}]`, work.progress)
    })

    // --- ОТПРАВКА НА СЕРВЕР ---
    const url = route.params.slug
      ? `/api/portfolio/${route.params.slug}` // PUT для обновления
      : '/api/portfolio'                      // POST для создания

    const method = route.params.slug ? 'PUT' : 'POST'

    const response = await $fetch(url, {
      method,
      body: formData,
    })

    console.log("DEBUG CLIENT: Server response:", response);

    // Перенаправление после успешного сохранения
    router.push('/projects')

  } catch (err) {
    console.error('Ошибка при сохранении кейса:', err)
    if (err.data && err.data.statusMessage) {
      error.value = err.data.statusMessage
    } else {
      error.value = err.message || 'Ошибка при сохранении кейса'
    }
    alert(`Не удалось сохранить кейс: ${error.value}`)
  } finally {
    uploading.value = false
  }
}

// Инициализация
onMounted(() => {
  loadCaseData()
})

// Настройка мета-тегов
useHead({
  meta: [
    { name: 'robots', content: 'noindex, nofollow' },
  ],
  title: 'Редактирование кейса',
  meta: [
    { name: 'description', content: 'Редактировать кейс в портфолио' },
    { property: 'og:title', content: 'Редактирование кейса' },
    { property: 'og:description', content: 'Редактировать кейс в портфолио' },
  ]
})
</script>

<style lang="scss" scoped>
.admin-portfolio-edit {
  max-width: 1200px;
  margin: 2rem auto;
  padding: 0 1.5rem;
  
  @media (max-width: 768px) {
    padding: 0 1rem;
  }
  
  h1 {
    font-size: 1.8rem;
    margin-bottom: 2rem;
    color: #111;
  }
  
  .loading, .error {
    padding: 2rem;
    text-align: center;
    font-size: 1.1rem;
    
    .error {
      color: #ef4444;
    }
  }
  
  form {
    display: flex;
    flex-direction: column;
    gap: 2.5rem;
  }
  
  .form-actions {
    display: flex;
    gap: 1rem;
    margin-top: 1rem;
    
    .btn {
      padding: 0.75rem 1.5rem;
      font-size: 1rem;
      border-radius: 0.5rem;
      cursor: pointer;
      transition: all 0.2s ease;
      
      &.primary {
        background: $blue;
        color: white;
      }
      
      &.secondary {
        background: #e2e8f0;
        color: #4a5568;
        
        &:hover:not(:disabled) {
          background: #cbd5e0;
        }
      }
      
      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }
  }
}
</style>

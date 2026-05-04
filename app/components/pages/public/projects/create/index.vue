<!-- app/components/pages/public/projects/create/index.vue -->
<template>
  <div class="portfolio-create-page">

    <!-- Заголовок с действиями -->
    <PagesCabinetUiLayoutPageTitle title="Новый кейс" icon="mdi:plus-circle-outline">
      <template #actions>
        <button 
          type="button" 
          class="crm-btn" 
          @click="$router.push('/cabinet/portfolio')"
        >
          ← Назад к списку
        </button>
      </template>
    </PagesCabinetUiLayoutPageTitle>

    <div class="portfolio-create-page__content">

      <!-- Карточка формы -->
      <div class="form-card">
        <form @submit.prevent="submitCase">

          <!-- Секции формы (аккордеон-стиль) -->
          <div class="form-section">
            <h3 class="form-section__title">Основная информация</h3>
            <PagesPublicProjectsCreateBasicInfo
              :title="form.title" :slug="form.slug" :category="form.category"
              :address="form.address" @update:title="form.title = $event" @update:slug="form.slug = $event"
              @update:category="form.category = $event" @update:address="form.address = $event"
            />
          </div>

          <div class="form-section">
            <h3 class="form-section__title">Изображения</h3>
            <PagesPublicProjectsCreateImagesMain
              :main-image="form.mainImage"
              :thumbnail="form.thumbnail"
              :gallery="form.gallery"
              :existing-gallery="existingGallery"
              @update:main-image="form.mainImage = $event"
              @update:thumbnail="form.thumbnail = $event"
              @update:gallery="form.gallery = $event"
              @remove-existing-image="removeExistingGalleryImage"
            />
          </div>

          <div class="form-section">
            <h3 class="form-section__title">Сравнение: До и После</h3>
            <PagesPublicProjectsCreateBeforeAfter
              :existing-before-after-pairs="existingBeforeAfterPairs"
              :before-after-pairs="form.beforeAfterPairs"
              @update:existing-before-after-pairs="updateExistingBeforeAfterPairs"
              @update:before-after-pairs="updateBeforeAfterPairs"
            />
          </div>

          <div class="form-section">
            <h3 class="form-section__title">Описание и результат</h3>
            <PagesPublicProjectsCreateDescriptions
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
          </div>

          <div class="form-section">
            <h3 class="form-section__title">Работы и статистика</h3>
            <PagesPublicProjectsCreateWorksAndStats
              :works="form.works"
              :space="form.space"
              :duration="form.duration"
              :people="form.people"
              @update:works="form.works = $event"
              @update:space="form.space = $event"
              @update:duration="form.duration = $event"
              @update:people="form.people = $event"
            />
          </div>

          <div class="form-section">
            <h3 class="form-section__title">SEO-настройки</h3>
            <PagesPublicProjectsCreateSeo
              :meta-title="form.metaTitle"
              :meta-description="form.metaDescription"
              :meta-keywords="form.metaKeywords"
              @update:meta-title="form.metaTitle = $event"
              @update:meta-description="form.metaDescription = $event"
              @update:meta-keywords="form.metaKeywords = $event"
            />
          </div>

          <!-- Кнопки управления -->
          <div class="form-actions">
            <button 
              type="submit" 
              class="crm-btn crm-btn--accent" 
              :disabled="uploading || !canSubmit"
            >
              <Icon name="mdi:content-save-outline" size="15" />
              {{ uploading ? 'Сохранение...' : 'Сохранить кейс' }}
            </button>
            <button 
              type="button" 
              class="crm-btn" 
              @click="$router.push('/cabinet/portfolio')"
              :disabled="uploading"
            >
              Отмена
            </button>
          </div>

        </form>
      </div>

    </div>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from 'stores/auth'

// Инициализация
const router = useRouter()
const authStore = useAuthStore()

// Список категорий
const categories = [
  'Кафе', 'Магазины', 'Клиники', 'Банки', 'Фитнес',
  'Производственные', 'Фасады и Кровля', 'Прочее'
]

// Список типов работ из enum
const workTypesEnum = [
  'Демонтаж', 'Перегородки ГКЛ', 'Перегородки', 'Плитка', 'Электромонтаж',
  'Стяжка', 'Поддоконники', 'Кладочные работы', 'Бетонные работы', 'Отделочные работы',
  'Черновые работы', 'Покраска', 'Штукатурка', 'Шпаклёвка', 'Кровля',
  'Фасадные работы', 'Утепление', 'Гидроизоляция', 'Сантехника', 'Полы',
  'Окна', 'Двери', 'Потолки', 'Сверочные работы', 'Покрытие полов',
  'Монтаж металлоконструкций', 'Террасная доска'
]

// Структура формы
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
  mainImage: null,
  thumbnail: null,
  beforeAfterPairs: [],
  gallery: [],
  address: '',
  pairGroup: '',
  works: []
})

// Недостающие свойства и методы
const existingGallery = ref([])
const existingBeforeAfterPairs = ref([])

const removeExistingGalleryImage = (imageId) => {
  existingGallery.value = existingGallery.value.filter(img => img.id !== imageId)
}

const updateExistingBeforeAfterPairs = (value) => {
  existingBeforeAfterPairs.value = value
}

const updateBeforeAfterPairs = (value) => {
  form.value.beforeAfterPairs = value
}

// 🔥 Валидация: можно ли отправить форму
const canSubmit = computed(() => {
  return form.value.title?.trim() && 
         form.value.mainImage?.file && 
         form.value.thumbnail?.file
})

// Состояние загрузки
const uploading = ref(false)

// Отправка формы
const submitCase = async () => {
  try {
    uploading.value = true
    
    // Валидация обязательных полей
    if (!form.value.mainImage?.file || !form.value.thumbnail?.file) {
      throw new Error('Необходимо загрузить главное изображение и миниатюру')
    }
    
    const formData = new FormData()
    
    // Добавление текстовых полей
    Object.entries(form.value).forEach(([key, value]) => {
      if (['beforeAfterPairs', 'gallery', 'mainImage', 'thumbnail', 'works'].includes(key)) return
      formData.append(key, value || '')
    })
    
    // Добавление основных изображений
    const appendImage = (image, prefix) => {
      if (image?.file) {
        formData.append(prefix, image.file)
      }
    }
    appendImage(form.value.mainImage, 'mainImage')
    appendImage(form.value.thumbnail, 'thumbnail')
    
    // Добавление пар "до/после"
    if (form.value.beforeAfterPairs.length > 0) {
      formData.append('pairGroup', form.value.pairGroup || `Сравнение фото - ${Date.now()}`)
      form.value.beforeAfterPairs.forEach((pair, index) => {
        if (pair.before) {
          formData.append(`beforeImage[${index}]`, pair.before)
        }
        if (pair.after) {
          formData.append(`afterImage[${index}]`, pair.after)
        }
      })
    }
    formData.append('pairCount', form.value.beforeAfterPairs.length)
    
    // Добавление галереи
    form.value.gallery.forEach((image, index) => {
      if (image.file) {
        formData.append(`gallery[${index}]`, image.file)
        formData.append(`galleryType[${index}]`, image.type)
      }
    })
    
    // Работы
    form.value.works.forEach((work, index) => {
      formData.append(`workType[${index}]`, work.workType)
      formData.append(`workValue[${index}]`, work.value ?? '')
    })
    
    // Отправка запроса
    const response = await fetch('/api/portfolio', {
      method: 'POST',
      body: formData,
      credentials: 'same-origin'
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.statusMessage || 'Ошибка сети')
    }
    
    const result = await response.json()
    
    // 🔥 Редирект в админку, а не на публичную страницу
    router.push(`/cabinet/portfolio`)
    
  } catch (err) {
    console.error('Ошибка создания кейса:', err)
    alert('Не удалось создать кейс. Проверьте данные и попробуйте снова.')
  } finally {
    uploading.value = false
  }
}
</script>

<style lang="scss" scoped>
.portfolio-create-page {
  display: flex;
  flex-direction: column;
  min-height: 100%;

  &__content {
    padding: 20px 24px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
}

// ── Карточка формы ─────────────────────────────────────────────────
.form-card {
  background: var(--crm-bg-surface);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-lg);
  overflow: hidden;

  form {
    display: flex;
    flex-direction: column;
    gap: 0;
  }
}

// ── Секции формы ──────────────────────────────────────────────────
.form-section {
  padding: 20px 24px;
  border-bottom: 1px solid var(--crm-border);

  &:last-child {
    border-bottom: none;
  }

  &__title {
    font-size: var(--crm-text-lg);
    font-weight: 600;
    color: var(--crm-text-primary);
    margin: 0 0 16px 0;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--crm-border);
  }
}

// ── Кнопки действий ───────────────────────────────────────────────
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  background: var(--crm-bg-elevated);
  border-top: 1px solid var(--crm-border);

  .crm-btn {
    min-width: 140px;
    justify-content: center;
  }
}

// ── Адаптив ───────────────────────────────────────────────────────
@media (max-width: 767.98px) {
  .portfolio-create-page__content {
    padding: 16px;
  }

  .form-section {
    padding: 16px;
  }

  .form-actions {
    flex-direction: column-reverse;
    padding: 16px;

    .crm-btn {
      width: 100%;
    }
  }
}
</style>
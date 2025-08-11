<template>
  <div class="admin-portfolio-create">
    <h1>Новый кейс</h1>
    <form @submit.prevent="submitCase">
      <!-- Основная информация -->
      <BasicInfo
        :title="form.title"
        :slug="form.slug"
        :category="form.category"
        @update:title="form.title = $event"
        @update:slug="form.slug = $event"
        @update:category="form.category = $event"
      />

      <!-- Основные изображения и галерея -->
      <ImagesMain
        :main-image="form.mainImage"
        :thumbnail="form.thumbnail"
        :gallery="form.gallery"
        @update:main-image="form.mainImage = $event"
        @update:thumbnail="form.thumbnail = $event"
        @update:gallery="form.gallery = $event"
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
          {{ uploading ? 'Загрузка...' : 'Сохранить' }}
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
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '~/composables/useAuth'

// Импорт компонентов
import BasicInfo from '~/components/pages/projects/create/BasicInfo.vue'
import ImagesMain from '~/components/pages/projects/create/ImagesMain.vue'
import BeforeAfter from '~/components/pages/projects/create/BeforeAfter.vue'
import Descriptions from '~/components/pages/projects/create/Descriptions.vue'
import WorksAndStats from '~/components/pages/projects/create/WorksAndStats.vue'
import Seo from '~/components/pages/projects/create/Seo.vue'

// Инициализация
const router = useRouter()
const { user } = useAuth()

// Список категорий
const categories = [
  'Кафе', 'Магазины', 'Клиники', 'Банки', 'Фитнес',
  'Производственные', 'Фасады и Кровля', 'Прочее'
]

// Список типов работ из enum
const workTypesEnum = [
  'Демонтаж',
  'Перегородки ГКЛ',
  'Перегородки',
  'Плитка',
  'Электромонтаж',
  'Стяжка',
  'Поддоконники',
  'Кладочные работы',
  'Бетонные работы',
  'Отделочные работы',
  'Черновые работы',
  'Покраска',
  'Штукатурка',
  'Шпаклёвка',
  'Кровля',
  'Фасадные работы',
  'Утепление',
  'Гидроизоляция',
  'Сантехника',
  'Полы',
  'Окна',
  'Двери',
  'Потолки',
  'Сверочные работы',
  'Покрытие полов',
  'Монтаж металлоконструкций',
  'Террасная доска'
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
  pairGroup: '',
  works: []
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
      if (['beforeAfterPairs', 'gallery', 'mainImage', 'thumbnail'].includes(key)) return
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
        if (pair.before?.file) {
          formData.append('beforeImage', pair.before.file) // имя поля — `beforeImage`
        }
        if (pair.after?.file) {
          formData.append('afterImage', pair.after.file) // имя поля — `afterImage`
        }
      })
    }
    formData.append('pairCount', form.value.beforeAfterPairs.length)

    // Добавление галереи
    form.value.gallery.forEach((image, index) => {
      formData.append(`gallery[${index}]`, image.file)
      formData.append(`galleryType[${index}]`, image.type)
    })

    // Работы
    form.value.works.forEach((work, index) => {
      formData.append(`workType[${index}]`, work.workType)
      formData.append(`progress[${index}]`, work.progress.toString())
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
    router.push(`/projects/${result.slug}`)
  } catch (err) {
    console.error('Ошибка создания кейса:', err)
    alert('Не удалось создать кейс. Проверьте данные и попробуйте снова.')
  } finally {
    uploading.value = false
  }
}
</script>

<style lang="scss" scoped>
.admin-portfolio-create {
  background: #f9fafb;
  padding: 5em 0;

  h1 {
    font-size: 2rem;
    text-align: center;
    margin-bottom: 2rem;
    color: #1f2937;
  }

  form {
    max-width: 1000px;
    margin: 0 auto;
    padding: 5px;

    .form-actions {
      display: flex;
      gap: 1rem;
      margin-top: 2rem;
      justify-content: center;

      .btn {
        padding: 0.75rem 1.5rem;
        border: none;
        border-radius: 0.5rem;
        cursor: pointer;
        font-weight: 600;
        transition: all 0.2s;

        &.primary {
          background-color: #3b82f6;
          color: white;

          &:hover {
            background-color: #2563eb;
          }
        }

        &.secondary {
          background-color: transparent;
          color: #3b82f6;
          border: 2px solid #3b82f6;

          &:hover {
            background-color: #bfdbfe;
          }
        }

        &:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
      }
    }
  }
}
</style>
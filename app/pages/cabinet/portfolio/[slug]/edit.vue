<!-- app/pages/cabinet/portfolio/[slug]/edit.vue -->
<template>
  <div class="portfolio-edit-page">

    <!-- Заголовок с действиями -->
    <PagesCabinetUiLayoutPageTitle :title="`Редактирование: ${form?.title || 'Загрузка...'}`" icon="mdi:pencil-outline">
      <template #actions>
        <button 
          type="button" 
          class="crm-btn" 
          @click="$router.push('/cabinet/portfolio')"
          :disabled="uploading"
        >
          ← Назад к списку
        </button>
      </template>
    </PagesCabinetUiLayoutPageTitle>

    <div class="portfolio-edit-page__content">

      <!-- Загрузка -->
      <div v-if="loading" class="loading-state">
        <Icon name="mdi:loading" size="24" class="loading-icon" />
        <span>Загрузка данных кейса...</span>
      </div>

      <!-- Ошибка -->
      <div v-else-if="error" class="error-state">
        <Icon name="mdi:alert-circle-outline" size="24" />
        <span>{{ error }}</span>
        <button class="crm-btn crm-btn--danger" @click="loadCaseData">
          Попробовать снова
        </button>
      </div>

      <!-- Форма -->
      <div v-else-if="form" class="form-card">
        <form @submit.prevent="submitCase">

          <!-- Основная информация -->
          <div class="form-section">
            <h3 class="form-section__title">Основная информация</h3>
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
          </div>

          <!-- Изображения -->
          <div class="form-section">
            <h3 class="form-section__title">Изображения</h3>
            <ImagesMain
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

          <!-- Сравнение До/После -->
          <div class="form-section">
            <h3 class="form-section__title">Сравнение: До и После</h3>
            <BeforeAfter
              :existing-before-after-pairs="existingBeforeAfterPairs"
              :before-after-pairs="form.beforeAfterPairs"
              @update:existing-before-after-pairs="updateExistingBeforeAfterPairs"
              @update:before-after-pairs="updateBeforeAfterPairs"
            />
          </div>

          <!-- Описания -->
          <div class="form-section">
            <h3 class="form-section__title">Описание и результат</h3>
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
          </div>

          <!-- Работы и статистика -->
          <div class="form-section">
            <h3 class="form-section__title">Работы и статистика</h3>
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
          </div>

          <!-- SEO -->
          <div class="form-section">
            <h3 class="form-section__title">SEO-настройки</h3>
            <Seo
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
              :disabled="uploading"
            >
              <Icon name="mdi:content-save-outline" size="15" />
              {{ uploading ? 'Сохранение...' : 'Сохранить изменения' }}
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
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useHead } from '#app'

// 🔥 Импорт компонентов (проверь пути!)
import BasicInfo from '~/components/pages/public/projects/create/BasicInfo.vue'
import ImagesMain from '~/components/pages/public/projects/create/ImagesMain.vue'
import BeforeAfter from '~/components/pages/public/projects/create/BeforeAfter.vue'
import Descriptions from '~/components/pages/public/projects/create/Descriptions.vue'
import WorksAndStats from '~/components/pages/public/projects/create/WorksAndStats.vue'
import Seo from '~/components/pages/public/projects/create/Seo.vue'

definePageMeta({
  layout: 'cabinet',
  middleware: ['auth', 'role'],
  allowedRoles: ['admin', 'manager']
})

useHead({
  title: 'CRM — Редактирование кейса',
  meta: [
    { name: 'robots', content: 'noindex, nofollow' },
    { name: 'description', content: 'Редактировать кейс в портфолио' }
  ]
})

const route = useRoute()
const router = useRouter()
const form = ref(null)
const existingGallery = ref([])
const existingBeforeAfterPairs = ref([])
const originalCaseData = ref(null)
const loading = ref(false)
const uploading = ref(false)
const error = ref(null)

const loadCaseData = async () => {
  try {
    loading.value = true
    error.value = null

    // Загружаем данные кейса, изображения и works параллельно
    const [caseResponse, imagesResponse, worksResponse] = await Promise.all([
      fetch(`/api/portfolio/${route.params.slug}`),
      fetch(`/api/portfolio/${route.params.slug}/images`),
      fetch(`/api/portfolio/${route.params.slug}/works`)
    ])

    if (!caseResponse.ok) {
      throw new Error(`Ошибка загрузки: ${caseResponse.statusText}`)
    }

    const data = await caseResponse.json()
    if (!data) throw new Error('Кейс не найден')

    originalCaseData.value = data

    const allImages = imagesResponse.ok ? await imagesResponse.json() : []
    const worksData = worksResponse.ok ? await worksResponse.json() : []

    // Главное изображение
    const mainImage = allImages.find(img => img.type === 'main')
    const mainImageData = mainImage
      ? { id: mainImage.id, preview: mainImage.url, alt: mainImage.alt || '' }
      : { id: null, preview: null, alt: '' }

    // Миниатюра
    const thumbnailImage = allImages.find(img => img.type === 'thumbnail')
    const thumbnailImageData = thumbnailImage
      ? { id: thumbnailImage.id, preview: thumbnailImage.url, alt: thumbnailImage.alt || '' }
      : { id: null, preview: null, alt: '' }

    // Галерея (before/after без pairGroup)
    existingGallery.value = allImages.filter(img =>
      ['before', 'after'].includes(img.type) && img.pairGroup == null
    )

    // Пары before/after
    const beforeImages = allImages.filter(img => img.type === 'before' && img.pairGroup != null)
    const afterImages = allImages.filter(img => img.type === 'after' && img.pairGroup != null)

    const pairsMap = {}
    beforeImages.forEach(img => {
      if (!pairsMap[img.pairGroup]) {
        pairsMap[img.pairGroup] = { pairGroup: img.pairGroup, id: img.pairGroup }
      }
      pairsMap[img.pairGroup].beforeId = img.id
      pairsMap[img.pairGroup].beforeUrl = img.url
      pairsMap[img.pairGroup].beforeAlt = img.alt
    })
    afterImages.forEach(img => {
      if (!pairsMap[img.pairGroup]) {
        pairsMap[img.pairGroup] = { pairGroup: img.pairGroup, id: img.pairGroup }
      }
      pairsMap[img.pairGroup].afterId = img.id
      pairsMap[img.pairGroup].afterUrl = img.url
      pairsMap[img.pairGroup].afterAlt = img.alt
    })
    existingBeforeAfterPairs.value = Object.values(pairsMap).filter(p => p.beforeId || p.afterId)

    // Инициализация формы
    form.value = {
      title: data.title || '',
      slug: data.slug || '',
      category: data.category || 'Кафе',
      address: data.address || 'Не указано',
      objectDescription: data.objectDescription || '',
      shortObject: data.shortObject || '',
      space: data.space ? parseFloat(data.space) : 0,
      duration: data.duration || '',
      people: data.people || '',
      shortDescription: data.shortDescription || '',
      fullDescription: data.fullDescription || '',
      result: data.result || '',
      metaTitle: data.metaTitle || '',
      metaDescription: data.metaDescription || '',
      metaKeywords: data.metaKeywords || '',
      mainImage: mainImageData,
      thumbnail: thumbnailImageData,
      works: worksData || [],
      beforeAfterPairs: [],
      gallery: [],
    }
  } catch (err) {
    error.value = err.message || 'Ошибка при загрузке данных кейса'
    console.error('[Кейсы]:', err)
  } finally {
    loading.value = false
  }
}

const removeExistingGalleryImage = (imageId) => {
  existingGallery.value = existingGallery.value.filter(img => img.id !== imageId)
}

const updateExistingBeforeAfterPairs = (value) => {
  existingBeforeAfterPairs.value = value
}

const updateBeforeAfterPairs = (value) => {
  form.value.beforeAfterPairs = value
}

const submitCase = async () => {
  try {
    uploading.value = true
    error.value = null

    if (!form.value.mainImage) throw new Error('Главное изображение не определено')
    if (!form.value.thumbnail) throw new Error('Миниатюра не определена')

    if (!form.value.mainImage.file && !form.value.mainImage.id) {
      throw new Error('Необходимо загрузить главное изображение или оставить существующее')
    }
    if (!form.value.thumbnail.file && !form.value.thumbnail.id) {
      throw new Error('Необходимо загрузить миниатюру или оставить существующую')
    }

    const formData = new FormData()

    // Текстовые поля
    Object.entries(form.value).forEach(([key, value]) => {
      if (['beforeAfterPairs', 'mainImage', 'thumbnail', 'works', 'gallery'].includes(key)) return
      formData.append(key, value ?? '')
    })

    // Works
    form.value.works.forEach((work, index) => {
      formData.append(`workType[${index}]`, work.workType)
      formData.append(`workValue[${index}]`, work.value ?? '')
    })

    // Главное изображение
    if (form.value.mainImage?.file) {
      formData.append('mainImage', form.value.mainImage.file)
    } else if (form.value.mainImage?.id) {
      formData.append('mainImageId', String(form.value.mainImage.id))
    }

    // Миниатюра
    if (form.value.thumbnail?.file) {
      formData.append('thumbnail', form.value.thumbnail.file)
    } else if (form.value.thumbnail?.id) {
      formData.append('thumbnailId', String(form.value.thumbnail.id))
    }

    // ID существующих пар before/after которые оставляем
    existingBeforeAfterPairs.value.forEach((pair) => {
      if (pair.beforeId) formData.append('keepImageId[]', pair.beforeId)
      if (pair.afterId) formData.append('keepImageId[]', pair.afterId)
    })

    // Новые пары before/after
    form.value.beforeAfterPairs.forEach((pair, index) => {
      if (pair.before) {
        formData.append(`beforeImage[${index}]`, pair.before)
        formData.append(`beforePairGroup[${index}]`, pair.pairGroup || `new-pair-${index}`)
      }
      if (pair.after) {
        formData.append(`afterImage[${index}]`, pair.after)
        formData.append(`afterPairGroup[${index}]`, pair.pairGroup || `new-pair-${index}`)
      }
    })

    // ID существующей галереи которую оставляем
    existingGallery.value.forEach((img) => {
      if (img.id) formData.append('keepImageId[]', img.id)
    })

    // Новые фото галереи
    if (form.value.gallery?.length > 0) {
      form.value.gallery.forEach((image, index) => {
        formData.append(`gallery[${index}]`, image.file)
        formData.append(`galleryType[${index}]`, image.type)
      })
    }

    const response = await fetch(`/api/portfolio/${route.params.slug}`, {
      method: 'PUT',
      body: formData,
      credentials: 'same-origin'
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(errorText || `HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    
    // 🔥 Уведомление и редирект в админку
    alert('Кейс успешно обновлён!')
    router.push(`/cabinet/portfolio`)
    
  } catch (err) {
    console.error('Submission error:', err)
    error.value = err.message || 'Не удалось сохранить кейс'
    alert(`Ошибка при сохранении: ${error.value}`)
  } finally {
    uploading.value = false
  }
}

onMounted(() => {
  loadCaseData()
})
</script>

<style lang="scss" scoped>
.portfolio-edit-page {
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

// ── Состояния загрузки / ошибки ──────────────────────────────────
.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 60px 20px;
  background: var(--crm-bg-surface);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-lg);
  color: var(--crm-text-secondary);
  font-size: var(--crm-text-sm);

  .loading-icon {
    animation: spin 1s linear infinite;
  }
}

.error-state {
  color: var(--crm-danger);
  border-color: var(--crm-danger);
  background: var(--crm-danger-dim);
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

// ── Карточка формы ──────────────────────────────────────────────
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

// ── Секции формы ────────────────────────────────────────────────
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

// ── Кнопки действий ─────────────────────────────────────────────
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

// ── Адаптив ─────────────────────────────────────────────────────
@media (max-width: 767.98px) {
  .portfolio-edit-page__content {
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

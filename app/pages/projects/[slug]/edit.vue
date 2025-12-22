<template>
  <div v-if="form" class="admin-portfolio-edit">
    <h1>Редактирование кейса: {{ form.title }}</h1>
    <form @submit.prevent="submitCase">
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
      <BeforeAfter
        :existing-before-after-pairs="existingBeforeAfterPairs"
        :before-after-pairs="form.beforeAfterPairs"
        @update:existing-before-after-pairs="updateExistingBeforeAfterPairs"
        @update:before-after-pairs="updateBeforeAfterPairs"
      />
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
      <Seo
        :meta-title="form.metaTitle"
        :meta-description="form.metaDescription"
        :meta-keywords="form.metaKeywords"
        @update:meta-title="form.metaTitle = $event"
        @update:meta-description="form.metaDescription = $event"
        @update:meta-keywords="form.metaKeywords = $event"
      />
      <div class="form-actions">
        <button type="submit" class="btn primary" :disabled="uploading">
          {{ uploading ? 'Сохранение...' : 'Сохранить изменения' }}
        </button>
        <button @click="$router.back()" type="button" class="btn secondary" :disabled="uploading">
          Отмена
        </button>
      </div>
    </form>
  </div>
  <div v-else-if="loading" class="loading">
    Загрузка...
  </div>
  <div v-else-if="error" class="error">
    {{ error }}
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useHead } from '#app'
import BasicInfo from '~/components/pages/public/projects/create/BasicInfo.vue'
import ImagesMain from '~/components/pages/public/projects/create/ImagesMain.vue'
import BeforeAfter from '~/components/pages/public/projects/create/BeforeAfter.vue'
import Descriptions from '~/components/pages/public/projects/create/Descriptions.vue'
import WorksAndStats from '~/components/pages/public/projects/create/WorksAndStats.vue'
import Seo from '~/components/pages/public/projects/create/Seo.vue'

const route = useRoute()
const router = useRouter()
const form = ref(null)
// existingGallery теперь содержит ВСЕ изображения галереи (gallery, before, after), НО НЕ main и thumbnail
const existingGallery = ref([])
const existingBeforeAfterPairs = ref([]) // Этот массив не используется ImagesMain, но нужен BeforeAfter
const originalCaseData = ref(null) // Для отслеживания изменений
const loading = ref(false)
const uploading = ref(false)
const error = ref(null)
const isEditing = !!route.params.slug

const loadCaseData = async () => {
  try {
    loading.value = true;
    error.value = null;
    // Загрузка основных данных кейса
    const response = await fetch(`/api/portfolio/${route.params.slug}`);
    if (!response.ok) {
      throw new Error(`Ошибка загрузки: ${response.statusText}`);
    }
    const data = await response.json();
    if (!data) {
      throw new Error('Кейс не найден');
    }
    originalCaseData.value = data;
    // Загрузка всех изображений для этого кейса
    const imagesResponse = await fetch(`/api/portfolio/${route.params.slug}/images`);
    if (!imagesResponse.ok) {
      console.warn('Не удалось загрузить изображения:', imagesResponse.statusText);
      existingGallery.value = [];
      existingBeforeAfterPairs.value = [];
    } else {
      const allImages = await imagesResponse.json();
      // --- Обработка главного изображения (main) ---
      const mainImage = allImages.find(img => img.type === 'main');
      let mainImageData = { id: null, preview: null, alt: '' };
      if (mainImage) {
        mainImageData = {
          id: mainImage.id,
          preview: mainImage.url,
          alt: mainImage.alt || `Главное фото для кейса ${data.id}`
        };
      }
      // --- Обработка миниатюры (thumbnail) ---
      const thumbnailImage = allImages.find(img => img.type === 'thumbnail');
      let thumbnailImageData = { id: null, preview: null, alt: '' };
      if (thumbnailImage) {
        thumbnailImageData = {
          id: thumbnailImage.id,
          preview: thumbnailImage.url,
          alt: thumbnailImage.alt || `Миниатюра для кейса ${data.id}`
        };
      }
      // --- Фильтрация изображений для ImagesMain (галерея) ---
      // ImagesMain ожидает в existingGallery изображения типа 'before', 'after'
      existingGallery.value = allImages.filter(img => 
        ['before', 'after'].includes(img.type) && 
        (img.pairGroup === null || img.pairGroup === undefined)
      );
      // --- Фильтрация и группировка изображений для BeforeAfter (пары) ---
      // Собираем пары 'before' и 'after' по pairGroup
      const beforeImages = allImages.filter(img => 
        img.type === 'before' && 
        img.pairGroup !== null && 
        img.pairGroup !== undefined
      );
      const afterImages = allImages.filter(img => 
        img.type === 'after' && 
        img.pairGroup !== null && 
        img.pairGroup !== undefined
      );
      const pairsMap = {};
      beforeImages.forEach(img => {
        if (!pairsMap[img.pairGroup]) {
          pairsMap[img.pairGroup] = { pairGroup: img.pairGroup, id: img.pairGroup };
        }
        pairsMap[img.pairGroup].beforeId = img.id;
        pairsMap[img.pairGroup].beforeUrl = img.url;
        pairsMap[img.pairGroup].beforeAlt = img.alt;
      });
      afterImages.forEach(img => {
        if (!pairsMap[img.pairGroup]) {
          // Если была только before, добавляем пустое after
          pairsMap[img.pairGroup] = { pairGroup: img.pairGroup, id: img.pairGroup };
        }
        pairsMap[img.pairGroup].afterId = img.id;
        pairsMap[img.pairGroup].afterUrl = img.url;
        pairsMap[img.pairGroup].afterAlt = img.alt;
      });
      existingBeforeAfterPairs.value = Object.values(pairsMap).filter(pair => pair.beforeId || pair.afterId);
      // --- Инициализация формы ---
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
        // Передаем данные об изображениях с учетом их ID и URL
        mainImage: mainImageData,
        thumbnail: thumbnailImageData,
        works: data.works || [],
        beforeAfterPairs: [], // Для новых пар
        gallery: [], // Для новых файлов
      };
      console.log("DEBUG CLIENT: Loaded case data with images:", form.value);
    }
  } catch (err) {
    error.value = err.message || 'Ошибка при загрузке данных кейса';
    alert(error.value);
  } finally {
    loading.value = false;
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

    // Проверяем, что для НОВОГО кейса обязательно загружены файлы
    // Для редактирования файлы могут быть не загружены, но ID должны быть
    if (!isEditing) { // Создание
        if (!form.value.mainImage.file) throw new Error('Необходимо загрузить главное изображение')
        if (!form.value.thumbnail.file) throw new Error('Необходимо загрузить миниатюру')
    } else { // Редактирование
        if (!form.value.mainImage.file && !form.value.mainImage.id) {
            throw new Error('Необходимо загрузить главное изображение или оставить существующее')
        }
        if (!form.value.thumbnail.file && !form.value.thumbnail.id) {
            throw new Error('Необходимо загрузить миниатюру или оставить существующую')
        }
    }

    const formData = new FormData()
    Object.entries(form.value).forEach(([key, value]) => {
      if (['beforeAfterPairs', 'mainImage', 'thumbnail', 'works'].includes(key)) return
      if (Array.isArray(value)) {
        value.forEach((item, idx) => {
           Object.entries(item).forEach(([subKey, subVal]) => {
             formData.append(`${key}[${idx}][${subKey}]`, subVal ?? '')
           })
        })
        return
      }
      formData.append(key, value ?? '')
    })

    // --- ОБНОВЛЕНО: Отправка mainImage и thumbnail ---
    if (form.value.mainImage?.file) {
      console.debug("DEBUG CLIENT: Sending NEW main image file", form.value.mainImage.file.name);
      formData.append('mainImage', form.value.mainImage.file);
    } else if (form.value.mainImage?.id) {
      // Если файл не загружен, но есть ID, отправляем ID (только при редактировании)
      if (isEditing) {
          console.debug("DEBUG CLIENT: Keeping EXISTING main image by ID", form.value.mainImage.id);
          // ЯВНО ПРЕОБРАЗУЕМ В СТРОКУ
          formData.append('mainImageId', String(form.value.mainImage.id));
      }
    } else if (isEditing) {
        throw new Error('Отсутствует ID существующего главного изображения для редактирования.');
    }

    if (form.value.thumbnail?.file) {
      console.debug("DEBUG CLIENT: Sending NEW thumbnail file", form.value.thumbnail.file.name);
      formData.append('thumbnail', form.value.thumbnail.file);
    } else if (form.value.thumbnail?.id) {
      // Если файл не загружен, но есть ID, отправляем ID (только при редактировании)
      if (isEditing) {
          console.debug("DEBUG CLIENT: Keeping EXISTING thumbnail by ID", form.value.thumbnail.id);
          // ЯВНО ПРЕОБРАЗУЕМ В СТРОКУ
          formData.append('thumbnailId', String(form.value.thumbnail.id));
      }
    } else if (isEditing) {
        throw new Error('Отсутствует ID существующей миниатюры для редактирования.');
    }

    // Отправляем ID существующих изображений, которые НЕ были удалены
    existingBeforeAfterPairs.value.forEach((pair, index) => {
      if (pair.beforeId) {
        formData.append('keepImageId[]', pair.beforeId);
      }
      if (pair.afterId) {
        formData.append('keepImageId[]', pair.afterId);
      }
    })

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

    // --- ОБНОВЛЕНО: Отправка ID изображений галереи (gallery, before, after) ---
    existingGallery.value.forEach((img, index) => {
      // Отправляем ID только для типов, которые не обрабатываются в других блоках (gallery, before, after)
      // main и thumbnail обрабатываются отдельно выше
      if (img.id) {
        formData.append('keepImageId[]', img.id);
      }
    })

    // --- ОБНОВЛЕНО: Отправка новых файлов галереи как отдельные изображения "до" и "после" ---
    if (form.value.gallery && form.value.gallery.length > 0) {
      form.value.gallery.forEach((image, index) => {
        formData.append(`gallery[${index}]`, image.file)
        formData.append(`galleryType[${index}]`, image.type)
      })
    }

    // --- ОБНОВЛЕНО: Определение эндпоинта и метода ---
    let apiEndpoint = '/api/portfolio'
    let method = 'POST'
    if (isEditing) { // Если есть slug в URL, значит, это редактирование
      apiEndpoint = `/api/portfolio/${route.params.slug}`
      method = 'PUT'
    }

    const response = await fetch(apiEndpoint, {
      method,
      body: formData,
      credentials: 'same-origin' // Важно для авторизации
    });

    if (!response.ok) {
      const errorText = await response.text(); // Используем text() для получения подробной ошибки от сервера
      throw new Error(errorText || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('Case saved successfully:', result);
    alert(isEditing ? 'Кейс успешно обновлён!' : 'Кейс успешно создан!');
    router.push(`/projects/${result.slug}`); // Переход на страницу созданного/обновлённого кейса
  } catch (err) {
    console.error('Submission error:', err);
    error.value = err.message || 'Не удалось сохранить кейс';
    alert(`Ошибка при сохранении: ${error.value}`);
  } finally {
    uploading.value = false;
  }
}

onMounted(() => {
  if (isEditing) {
    loadCaseData()
  } else {
    form.value = {
      title: '',
      slug: '',
      category: 'Кафе',
      objectDescription: '',
      shortObject: '',
      shortDescription: '',
      fullDescription: '',
      result: '',
      space: 0,
      duration: '',
      people: '',
      works: [],
      mainImage: { file: null, preview: null },
      thumbnail: { file: null, preview: null },
      gallery: [],
      beforeAfterPairs: [],
      metaTitle: '',
      metaDescription: '',
      metaKeywords: '',
      address: 'Не указано',
    }
  }
})

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

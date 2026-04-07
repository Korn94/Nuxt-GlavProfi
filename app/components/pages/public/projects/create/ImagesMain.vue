<!-- app/components/pages/public/projects/create/ImagesMain.vue -->
<template>
  <div class="images-main-section">
    <h2 class="section-title">Основные изображения</h2>
    <p class="section-description">
      Загрузите главное изображение и миниатюру. Эти изображения обязательны для публикации кейса.
    </p>

    <!-- Главное изображение -->
    <div class="image-upload-group">
      <label class="upload-label">
        <span class="upload-label__text">
          Главное изображение
          <span class="upload-label__required">*</span>
        </span>
        <small class="upload-hint">Основное изображение проекта</small>
      </label>

      <label class="upload-zone" :class="{ 'upload-zone--has-preview': mainImage?.preview || (mainImage?.id && !mainImage?.file) }">
        <input type="file" accept="image/*" class="upload-input" @change="handleMainImage" />
        <div class="upload-zone__content">
          <Icon name="mdi:image-plus-outline" size="20" class="upload-icon" />
          <span class="upload-text">Загрузить изображение</span>
        </div>
      </label>

      <div v-if="mainImage?.preview || (mainImage?.id && !mainImage?.file)" class="image-preview">
        <img 
          :src="mainImage?.preview || (mainImage?.id ? useImageUrl(mainImage.url) : '')"
          :alt="mainImage?.alt || 'Главное изображение'"
          class="preview-img"
          @error="handleImageError($event, 'mainImage')"
        />
        <button type="button" class="preview-remove" @click="removeMainImage" title="Удалить">
          <Icon name="mdi:trash-can-outline" size="12" />
        </button>
      </div>

      <input v-if="!mainImage?.file && mainImage?.id" type="hidden" name="mainImageId" :value="mainImage.id" />
    </div>

    <!-- Миниатюра -->
    <div class="image-upload-group">
      <label class="upload-label">
        <span class="upload-label__text">
          Миниатюра
          <span class="upload-label__required">*</span>
        </span>
        <small class="upload-hint">Для превью в карточке (400×300)</small>
      </label>

      <label class="upload-zone" :class="{ 'upload-zone--has-preview': thumbnail?.preview || (thumbnail?.id && !thumbnail?.file) }">
        <input type="file" accept="image/*" class="upload-input" @change="handleThumbnail" />
        <div class="upload-zone__content">
          <Icon name="mdi:image-size-select-large-outline" size="20" class="upload-icon" />
          <span class="upload-text">Загрузить миниатюру</span>
        </div>
      </label>

      <div v-if="thumbnail?.preview || (thumbnail?.id && !thumbnail?.file)" class="image-preview image-preview--small">
        <img 
          :src="thumbnail?.preview || (thumbnail?.id ? useImageUrl(thumbnail.url) : '')"
          :alt="thumbnail?.alt || 'Миниатюра'"
          class="preview-img"
          @error="handleImageError($event, 'thumbnail')"
        />
        <button type="button" class="preview-remove" @click="removeThumbnail" title="Удалить">
          <Icon name="mdi:trash-can-outline" size="12" />
        </button>
      </div>

      <input v-if="!thumbnail?.file && thumbnail?.id" type="hidden" name="thumbnailId" :value="thumbnail.id" />
    </div>

    <!-- Галерея: разделена на "До" и "После" -->
    <div class="image-upload-group">
      <label class="upload-label">
        <span class="upload-label__text">Галерея «До» и «После»</span>
        <small class="upload-hint">Загружайте фотографии в соответствующую группу</small>
      </label>

      <div class="gallery-columns">
        
        <!-- Колонка "До" -->
        <div class="gallery-column">
          <div class="gallery-column__header">
            <h4 class="gallery-column__title">
              <span class="badge badge--before">До</span>
              <span class="gallery-column__count">{{ beforeCount }}</span>
            </h4>
            <button type="button" class="crm-btn crm-btn--outline crm-btn--mini" @click="triggerGalleryUpload('before')">
              <Icon name="mdi:plus" size="12" />
            </button>
          </div>
          
          <input id="gallery-upload-before" type="file" accept="image/*" multiple class="upload-input-hidden" @change="(e) => handleGalleryImages(e, 'before')" />
          
          <div v-if="existingBefore.length || newBefore.length" class="gallery-grid-compact">
            <div v-for="image in existingBefore" :key="`existing-before-${image.id}`" class="gallery-thumb">
              <div class="gallery-thumb__image">
                <img :src="useImageUrl(image.url)" :alt="image.alt || 'Фото До'" class="gallery-thumb__img" @error="handleImageError($event, 'gallery', image.id)" />
                <div class="gallery-thumb__overlay">
                  <button type="button" class="gallery-thumb__btn gallery-thumb__btn--move" @click="moveToAfter(image.id, 'existing')" title="В «После»">
                    <Icon name="mdi:arrow-right" size="12" />
                  </button>
                  <button type="button" class="gallery-thumb__btn gallery-thumb__btn--remove" @click="removeExistingImage(image.id)" title="Удалить">
                    <Icon name="mdi:trash-can-outline" size="12" />
                  </button>
                </div>
              </div>
            </div>
            <div v-for="(image, index) in newBefore" :key="`new-before-${index}`" class="gallery-thumb gallery-thumb--new">
              <div class="gallery-thumb__image">
                <img :src="image.preview" :alt="image.alt || 'Новое фото До'" class="gallery-thumb__img" @error="handleImageError($event, 'newGallery', index)" />
                <div class="gallery-thumb__overlay">
                  <button type="button" class="gallery-thumb__btn gallery-thumb__btn--move" @click="moveToAfter(index, 'new-before')" title="В «После»">
                    <Icon name="mdi:arrow-right" size="12" />
                  </button>
                  <button type="button" class="gallery-thumb__btn gallery-thumb__btn--remove" @click="removeGalleryImage(index, 'before')" title="Удалить">
                    <Icon name="mdi:trash-can-outline" size="12" />
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="gallery-empty">
            <Icon name="mdi:image-off-outline" size="16" />
            <span>Нет изображений</span>
          </div>
        </div>
        
        <!-- Колонка "После" -->
        <div class="gallery-column">
          <div class="gallery-column__header">
            <h4 class="gallery-column__title">
              <span class="badge badge--after">После</span>
              <span class="gallery-column__count">{{ afterCount }}</span>
            </h4>
            <button type="button" class="crm-btn crm-btn--outline crm-btn--mini" @click="triggerGalleryUpload('after')">
              <Icon name="mdi:plus" size="12" />
            </button>
          </div>
          
          <input id="gallery-upload-after" type="file" accept="image/*" multiple class="upload-input-hidden" @change="(e) => handleGalleryImages(e, 'after')" />
          
          <div v-if="existingAfter.length || newAfter.length" class="gallery-grid-compact">
            <div v-for="image in existingAfter" :key="`existing-after-${image.id}`" class="gallery-thumb">
              <div class="gallery-thumb__image">
                <img :src="useImageUrl(image.url)" :alt="image.alt || 'Фото После'" class="gallery-thumb__img" @error="handleImageError($event, 'gallery', image.id)" />
                <div class="gallery-thumb__overlay">
                  <button type="button" class="gallery-thumb__btn gallery-thumb__btn--move" @click="moveToBefore(image.id, 'existing')" title="В «До»">
                    <Icon name="mdi:arrow-left" size="12" />
                  </button>
                  <button type="button" class="gallery-thumb__btn gallery-thumb__btn--remove" @click="removeExistingImage(image.id)" title="Удалить">
                    <Icon name="mdi:trash-can-outline" size="12" />
                  </button>
                </div>
              </div>
            </div>
            <div v-for="(image, index) in newAfter" :key="`new-after-${index}`" class="gallery-thumb gallery-thumb--new">
              <div class="gallery-thumb__image">
                <img :src="image.preview" :alt="image.alt || 'Новое фото После'" class="gallery-thumb__img" @error="handleImageError($event, 'newGallery', index)" />
                <div class="gallery-thumb__overlay">
                  <button type="button" class="gallery-thumb__btn gallery-thumb__btn--move" @click="moveToBefore(index, 'new-after')" title="В «До»">
                    <Icon name="mdi:arrow-left" size="12" />
                  </button>
                  <button type="button" class="gallery-thumb__btn gallery-thumb__btn--remove" @click="removeGalleryImage(index, 'after')" title="Удалить">
                    <Icon name="mdi:trash-can-outline" size="12" />
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="gallery-empty">
            <Icon name="mdi:image-off-outline" size="16" />
            <span>Нет изображений</span>
          </div>
        </div>
        
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onUnmounted } from 'vue'

// ── Пропсы и события ─────────────────────────────────────────────
const props = defineProps({
  mainImage: { type: Object, default: null },
  thumbnail: { type: Object, default: null },
  gallery: { type: Array, default: () => [] },
  existingGallery: { type: Array, default: () => [] }
})

const emit = defineEmits([
  'update:mainImage',
  'update:thumbnail',
  'update:gallery',
  'remove-existing-image'
])

// ── Реактивные геттеры/сеттеры ───────────────────────────────────
const mainImage = computed({
  get: () => props.mainImage,
  set: (value) => emit('update:mainImage', value)
})

const thumbnail = computed({
  get: () => props.thumbnail,
  set: (value) => emit('update:thumbnail', value)
})

// ── Вычисляемые свойства: разделение галереи ─────────────────────
const existingBefore = computed(() => props.existingGallery.filter(img => img.type === 'before'))
const existingAfter = computed(() => props.existingGallery.filter(img => img.type === 'after'))
const newBefore = computed(() => props.gallery.filter(img => img.type === 'before' && !img.id))
const newAfter = computed(() => props.gallery.filter(img => img.type === 'after' && !img.id))
const beforeCount = computed(() => existingBefore.value.length + newBefore.value.length)
const afterCount = computed(() => existingAfter.value.length + newAfter.value.length)

// ── Обработчики: главное изображение и миниатюра ─────────────────
const handleMainImage = (event) => {
  const file = event.target.files?.[0]
  if (file) {
    const preview = URL.createObjectURL(file)
    mainImage.value = { ...mainImage.value, file, preview, alt: `Главное фото ${file.name}`, url: preview }
  }
}

const handleThumbnail = (event) => {
  const file = event.target.files?.[0]
  if (file) {
    const preview = URL.createObjectURL(file)
    thumbnail.value = { ...thumbnail.value, file, preview, alt: `Миниатюра ${file.name}`, url: preview }
  }
}

const removeMainImage = () => { mainImage.value = { ...mainImage.value, file: null, preview: null } }
const removeThumbnail = () => { thumbnail.value = { ...thumbnail.value, file: null, preview: null } }

// ── Обработчики: галерея ─────────────────────────────────────────
const triggerGalleryUpload = (type) => {
  const inputId = type === 'before' ? 'gallery-upload-before' : 'gallery-upload-after'
  document.getElementById(inputId)?.click()
}

const handleGalleryImages = (event, type) => {
  const files = Array.from(event.target.files || [])
  if (files.length === 0) return
  
  const newImages = files.map(file => ({
    file,
    preview: URL.createObjectURL(file),
    type,
    alt: `Галерея ${type} - ${file.name}`
  }))
  
  // ✅ Создаём новый массив вместо мутации
  emit('update:gallery', [...props.gallery, ...newImages])
  event.target.value = ''
}

// ── Перемещение между группами (ИСПРАВЛЕНО) ──────────────────────
const moveToAfter = (identifier, source) => {
  if (source === 'existing') {
    // Для существующих: находим изображение
    const img = props.existingGallery.find(i => i.id === identifier)
    if (img) {
      // ✅ Создаём новый массив gallery с добавленным изображением
      const updatedGallery = [
        ...props.gallery,
        {
          id: img.id,
          url: img.url,
          type: 'after', // новый тип
          alt: img.alt,
          file: null,
          preview: img.url
        }
      ]
      emit('update:gallery', updatedGallery)
      emit('remove-existing-image', identifier)
    }
  } else {
    // Для новых: меняем тип в массиве gallery
    const img = newBefore.value[identifier]
    if (img) {
      const updatedGallery = props.gallery.map(item => 
        item === img ? { ...item, type: 'after' } : item
      )
      emit('update:gallery', updatedGallery)
    }
  }
}

const moveToBefore = (identifier, source) => {
  if (source === 'existing') {
    const img = props.existingGallery.find(i => i.id === identifier)
    if (img) {
      const updatedGallery = [
        ...props.gallery,
        {
          id: img.id,
          url: img.url,
          type: 'before', // новый тип
          alt: img.alt,
          file: null,
          preview: img.url
        }
      ]
      emit('update:gallery', updatedGallery)
      emit('remove-existing-image', identifier)
    }
  } else {
    const img = newAfter.value[identifier]
    if (img) {
      const updatedGallery = props.gallery.map(item => 
        item === img ? { ...item, type: 'before' } : item
      )
      emit('update:gallery', updatedGallery)
    }
  }
}

// ── Удаление изображений ─────────────────────────────────────────
const removeGalleryImage = (localIndex, type) => {
  let found = 0
  const globalIndex = props.gallery.findIndex(img => {
    if (img.type === type && !img.id) {
      if (found === localIndex) return true
      found++
    }
    return false
  })
  
  if (globalIndex !== -1) {
    const updated = [...props.gallery]
    updated.splice(globalIndex, 1)
    emit('update:gallery', updated)
  }
}

const removeExistingImage = (id) => {
  emit('remove-existing-image', id)
}

const handleImageError = (event, type, id) => {
  console.warn(`Ошибка загрузки изображения (${type}):`, id)
  event.target.src = '/images/placeholder.jpg'
}

// ── Очистка blob: URL ────────────────────────────────────────────
onUnmounted(() => {
  const revoke = (url) => url?.startsWith('blob:') && URL.revokeObjectURL(url)
  revoke(props.mainImage?.preview)
  revoke(props.thumbnail?.preview)
  props.gallery.forEach(img => revoke(img.preview))
})
</script>

<style lang="scss" scoped>
.images-main-section {
  background: var(--crm-bg-surface);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-lg);
  padding: 16px 20px;
}

.section-title {
  font-size: var(--crm-text-base);
  font-weight: 600;
  color: var(--crm-text-primary);
  margin: 0 0 6px 0;
}

.section-description {
  font-size: var(--crm-text-xs);
  color: var(--crm-text-muted);
  margin: 0 0 16px 0;
  line-height: 1.3;
}

// ── Группа загрузки ─────────────────────────────────────────────
.image-upload-group {
  padding: 12px 0;
  border-bottom: 1px solid var(--crm-border);
  &:last-child { border-bottom: none; }
}

.upload-label {
  display: block;
  margin-bottom: 8px;
  &__text {
    font-size: var(--crm-text-xs);
    font-weight: 500;
    color: var(--crm-text-secondary);
    display: flex;
    align-items: center;
    gap: 4px;
  }
  &__required { color: var(--crm-danger); font-weight: 600; }
}

.upload-hint {
  display: block;
  font-size: 10px;
  color: var(--crm-text-disabled);
  margin-top: 2px;
}

// ── Зона загрузки ───────────────────────────────────────────────
.upload-zone {
  display: block;
  position: relative;
  border: 1px dashed var(--crm-border);
  border-radius: var(--crm-radius-sm);
  padding: 12px;
  text-align: center;
  cursor: pointer;
  transition: var(--crm-transition);
  background: var(--crm-bg-elevated);

  &:hover {
    border-color: var(--crm-accent);
    background: var(--crm-accent-dim);
  }
  &:has(.upload-input:focus) {
    border-color: var(--crm-accent);
    box-shadow: 0 0 0 2px var(--crm-accent-dim);
  }
  &--has-preview { display: none; }
}

.upload-input {
  position: absolute; inset: 0; width: 100%; height: 100%;
  opacity: 0; cursor: pointer;
}

.upload-input-hidden {
  display: none;
}

.upload-zone__content {
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  pointer-events: none;
}

.upload-icon { color: var(--crm-text-muted); }
.upload-text {
  font-size: var(--crm-text-xs);
  font-weight: 500;
  color: var(--crm-text-secondary);
}

// ── Превью ──────────────────────────────────────────────────────
.image-preview {
  position: relative;
  margin-top: 8px;
  border-radius: var(--crm-radius-sm);
  overflow: hidden;
  background: var(--crm-bg-elevated);
  border: 1px solid var(--crm-border);
  max-width: 100%;
  width: fit-content;
  max-width: 200px;

  &--small { max-width: 120px; }
}

.preview-img {
  display: block;
  max-width: 100%;
  max-height: 120px;
  object-fit: cover;
  background: var(--crm-bg-base);
}

.preview-remove {
  position: absolute;
  top: 4px; right: 4px;
  width: 22px; height: 22px;
  display: flex; align-items: center; justify-content: center;
  background: var(--crm-danger);
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: var(--crm-transition);
  padding: 0;

  &:hover {
    background: var(--crm-danger-hover);
    transform: scale(1.05);
  }
}

// ── Галерея: колонки ────────────────────────────────────────────
.gallery-columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;

  @media (max-width: 768px) { grid-template-columns: 1fr; }
}

.gallery-column {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px;
  background: var(--crm-bg-elevated);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-sm);
}

.gallery-column__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.gallery-column__title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 600;
  color: var(--crm-text-secondary);
  margin: 0;
}

// ── Бейджи ──────────────────────────────────────────────────────
.badge {
  padding: 1px 6px;
  border-radius: 8px;
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.3px;

  &--before { background: var(--crm-warning-dim); color: var(--crm-warning); }
  &--after { background: var(--crm-success-dim); color: var(--crm-success); }
}

.gallery-column__count {
  font-size: 9px;
  color: var(--crm-text-muted);
  background: var(--crm-bg-overlay);
  padding: 1px 5px;
  border-radius: 6px;
  font-weight: 600;
}

// ── Сетка миниатюр ──────────────────────────────────────────────
.gallery-grid-compact {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
  gap: 6px;
}

.gallery-thumb {
  position: relative;
  border-radius: var(--crm-radius-xs);
  overflow: hidden;
  background: var(--crm-bg-base);
  border: 1px solid var(--crm-border);
  aspect-ratio: 1;

  &--new {
    border-color: var(--crm-accent-border);
  }
}

.gallery-thumb__image {
  position: relative;
  width: 100%;
  height: 100%;
  background: var(--crm-bg-base);
  overflow: hidden;
}

.gallery-thumb__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.gallery-thumb__overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  background: rgba(0,0,0,0.6);
  opacity: 0;
  transition: var(--crm-transition);

  .gallery-thumb__image:hover & { opacity: 1; }
}

.gallery-thumb__btn {
  width: 20px; height: 20px;
  display: flex; align-items: center; justify-content: center;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  padding: 0;
  transition: var(--crm-transition);

  &--move {
    background: var(--crm-info);
    color: white;
    &:hover {
      background: var(--crm-info-hover);
      transform: scale(1.1);
    }
  }

  &--remove {
    background: var(--crm-danger);
    color: white;
    &:hover {
      background: var(--crm-danger-hover);
      transform: scale(1.1);
    }
  }
}

// ── Пустое состояние ────────────────────────────────────────────
.gallery-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 20px 10px;
  color: var(--crm-text-disabled);
  font-size: 10px;
  border: 1px dashed var(--crm-border);
  border-radius: var(--crm-radius-sm);
  background: var(--crm-bg-base);
}

// ── Кнопки ──────────────────────────────────────────────────────
.crm-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 4px;
  padding: 5px 10px;
  border-radius: var(--crm-radius-sm);
  font-size: 10px;
  font-weight: 500;
  cursor: pointer;
  transition: var(--crm-transition);
  border: 1px solid var(--crm-border);
  background: var(--crm-bg-elevated);
  color: var(--crm-text-secondary);

  &:hover {
    background: var(--crm-bg-overlay);
    color: var(--crm-text-primary);
  }

  &--outline {
    background: transparent;
    border-color: var(--crm-accent-border);
    color: var(--crm-accent);

    &:hover {
      background: var(--crm-accent-dim);
    }
  }

  &--mini {
    padding: 4px;
    width: 24px;
    height: 24px;
  }

  &--danger {
    background: var(--crm-danger-dim);
    border-color: var(--crm-danger-border);
    color: var(--crm-danger);

    &:hover {
      background: var(--crm-danger);
      color: white;
    }
  }
}

// ── Адаптив ─────────────────────────────────────────────────────
@media (max-width: 767.98px) {
  .images-main-section { padding: 12px 14px; }
  .gallery-columns { gap: 10px; }
  .gallery-column { padding: 8px; }
  .gallery-grid-compact {
    grid-template-columns: repeat(auto-fill, minmax(50px, 1fr));
    gap: 5px;
  }
  .preview-img { max-height: 100px; }
}
</style>

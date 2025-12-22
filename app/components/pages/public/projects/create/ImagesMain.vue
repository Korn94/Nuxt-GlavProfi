<template>
  <div class="images-main-section">
    <h2>Основные изображения</h2>
    <p class="section-description">Загрузите главное изображение и миниатюру. Эти изображения обязательны для публикации кейса.</p>
    <!-- Главное изображение -->
    <div class="form-group">
      <label for="mainImage">Главное изображение</label>
      <input
        id="mainImage"
        type="file"
        accept="image/*"
        @change="handleMainImage"
      />
      <small>Основное изображение проекта, будет отображаться на странице кейса</small>
      <!-- Превью существующего или нового главного изображения -->
      <div v-if="mainImage?.preview || (mainImage?.id && !mainImage?.file)" class="image-preview">
        <img 
          :src="mainImage?.preview || (mainImage?.id ? mainImage.url : '')" 
          :alt="mainImage?.alt || 'Главное изображение'" 
          @error="handleImageError($event, 'mainImage')"
        />
        <button
          type="button"
          @click="removeMainImage"
          class="remove-image-btn"
        >
          ×
        </button>
      </div>
      <!-- Передаём ID существующего изображения, если оно не заменено -->
      <input
        v-if="!mainImage?.file && mainImage?.id"
        type="hidden"
        name="mainImageId"
        :value="mainImage.id"
      />
    </div>
    <!-- Миниатюра -->
    <div class="form-group">
      <label for="thumbnail">Миниатюра</label>
      <input
        id="thumbnail"
        type="file"
        accept="image/*"
        @change="handleThumbnail"
      />
      <small>Изображение для превью в карточке проекта (рекомендуемый размер: 400×300)</small>
      <!-- Превью существующего или нового изображения миниатюры -->
      <div v-if="thumbnail?.preview || (thumbnail?.id && !thumbnail?.file)" class="image-preview">
        <img 
          :src="thumbnail?.preview || (thumbnail?.id ? thumbnail.url : '')" 
          :alt="thumbnail?.alt || 'Миниатюра'" 
          @error="handleImageError($event, 'thumbnail')"
        />
        <button
          type="button"
          @click="removeThumbnail"
          class="remove-image-btn"
        >
          ×
        </button>
      </div>
      <!-- Передаём ID существующего изображения, если оно не заменено -->
      <input
        v-if="!thumbnail?.file && thumbnail?.id"
        type="hidden"
        name="thumbnailId"
        :value="thumbnail.id"
      />
    </div>
    <!-- Галерея -->
    <div class="form-group">
      <label>Галерея "до" и "после"</label>
      <input
        id="gallery-upload"
        type="file"
        accept="image/*"
        multiple
        @change="handleGalleryImages"
      />
      <button
        type="button"
        @click="triggerGalleryUpload"
        class="btn secondary"
      >
        + Добавить фото в галерею
      </button>
      <small>Дополнительные изображения проекта. Можно загрузить несколько сразу.</small>
      <!-- Превью существующих изображений из БД -->
      <div v-if="existingGallery.length" class="existing-gallery-preview">
        <h4>Существующие фотографии:</h4>
        <div class="gallery-grid">
          <div 
            v-for="image in existingGallery" 
            :key="image.id" 
            class="gallery-item"
          >
            <div class="image-container">
              <img 
                :src="image.url" 
                :alt="`Фото ${image.type}`" 
                @error="handleImageError($event, 'gallery', image.id)"
              />
              <div class="image-overlay">
                <span class="type-badge">{{ getImageTypeLabel(image.type) }}</span>
                <button
                  type="button"
                  @click="removeExistingImage(image.id)"
                  class="remove-gallery-btn danger"
                >
                  Удалить
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- Превью новых изображений (ещё не загруженных на сервер) -->
      <div v-if="gallery.length" class="new-gallery-preview">
        <h4>Новые фотографии (будут добавлены):</h4>
        <div class="gallery-grid">
          <div
            v-for="(image, index) in gallery"
            :key="index"
            class="gallery-item"
          >
            <div class="image-container">
              <img 
                :src="image.preview" 
                :alt="`Новое фото ${index + 1}`" 
                @error="handleImageError($event, 'newGallery', index)"
              />
              <div class="image-overlay">
                <select v-model="image.type" class="type-select">
                  <option value="after">После</option>
                  <option value="before">До</option>
                </select>
                <button
                  type="button"
                  @click="removeGalleryImage(index)"
                  class="remove-gallery-btn"
                >
                  Удалить
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onUnmounted } from 'vue'

// Определение пропсов
const props = defineProps({
  mainImage: { type: Object, default: null }, // Может содержать { id, preview, alt, url }
  thumbnail: { type: Object, default: null }, // Может содержать { id, preview, alt, url }
  gallery: { type: Array, default: () => [] }, // Только новые файлы
  existingGallery: { type: Array, default: () => [] } // Список существующих изображений из БД
})

// Определение событий
const emit = defineEmits([
  'update:mainImage',
  'update:thumbnail',
  'update:gallery',
  'remove-existing-image'
])

// Реактивные геттеры и сеттеры
const mainImage = computed({
  get: () => props.mainImage,
  set: (value) => {
    emit('update:mainImage', value)
  }
})
const thumbnail = computed({
  get: () => props.thumbnail,
  set: (value) => {
    emit('update:thumbnail', value)
  }
})
const gallery = computed({
  get: () => props.gallery,
  set: (value) => {
    emit('update:gallery', value)
  }
})

// Обработчики загрузки изображений
const handleMainImage = (event) => {
  const file = event.target.files[0]
  if (file) {
    const preview = URL.createObjectURL(file)
    // Обновляем существующий объект, сохраняя id, если он был
    mainImage.value = {
      ...mainImage.value,
      file,
      preview,
      alt: `Главное фото ${file.name}`,
      url: preview // Для совместимости с существующими изображениями
    }
  }
}

const handleThumbnail = (event) => {
  const file = event.target.files[0]
  if (file) {
    const preview = URL.createObjectURL(file)
    // Обновляем существующий объект, сохраняя id, если он был
    thumbnail.value = {
      ...thumbnail.value,
      file,
      preview,
      alt: `Миниатюра ${file.name}`,
      url: preview // Для совместимости с существующими изображениями
    }
  }
}

// Галерея
const triggerGalleryUpload = () => {
  document.getElementById('gallery-upload').click()
}

const handleGalleryImages = (event) => {
  const files = Array.from(event.target.files)
  if (files.length === 0) return
  const newImages = files.map(file => ({
    file,
    preview: URL.createObjectURL(file),
    type: 'after', // или 'before' в зависимости от выбора пользователя
    alt: `Галерея ${file.name}`
  }))
  gallery.value = [...gallery.value, ...newImages]
}

// Удаление изображения из галереи (нового)
const removeGalleryImage = (index) => {
  const updatedGallery = [...gallery.value]
  updatedGallery.splice(index, 1)
  gallery.value = updatedGallery
}

const removeExistingImage = (id) => {
  emit('remove-existing-image', id)
}

// Удаление главного изображения (локально)
const removeMainImage = () => {
  // Удаляем file и preview, но оставляем id и другие поля, если они были
  mainImage.value = {
    ...mainImage.value,
    file: null,
    preview: null
  }
}

// Удаление миниатюры (локально)
const removeThumbnail = () => {
  // Удаляем file и preview, но оставляем id и другие поля, если они были
  thumbnail.value = {
    ...thumbnail.value,
    file: null,
    preview: null
  }
}

// Вспомогательная функция для получения понятного названия типа изображения
const getImageTypeLabel = (type) => {
  switch(type) {
    case 'before': return 'До'
    case 'after': return 'После'
    default: return type
  }
}

// Обработка ошибок загрузки изображений
const handleImageError = (event, type, id) => {
  console.warn(`Ошибка загрузки изображения (${type}):`, id)
  event.target.src = '/images/placeholder.jpg' // Замена на плейсхолдер при ошибке
}

// Очищаем URL.createObjectURL при уничтожении компонента
onUnmounted(() => {
  if (props.mainImage?.preview?.startsWith('blob:')) {
    URL.revokeObjectURL(props.mainImage.preview)
  }
  if (props.thumbnail?.preview?.startsWith('blob:')) {
    URL.revokeObjectURL(props.thumbnail.preview)
  }
  props.gallery.forEach(img => {
    if (img.preview?.startsWith('blob:')) {
      URL.revokeObjectURL(img.preview)
    }
  })
})
</script>

<style lang="scss" scoped>
.images-main-section {
  background: #ffffff;
  padding: 1.5rem;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 1.5rem;
  
  h2 {
    font-size: 1.5rem;
    margin-bottom: 1rem;
    color: #1f2937;
    font-weight: 600;
  }
  
  .section-description {
    color: #6b7280;
    margin-bottom: 1.5rem;
    font-size: 0.95rem;
  }
}

.form-group {
  margin-bottom: 1.5rem;
  
  label {
    display: block;
    font-weight: 600;
    margin-bottom: 0.5rem;
    color: #4b5563;
  }
  
  input[type="file"] {
    width: 100%;
    padding: 0.75rem;
    border: 1px dashed #d1d5db;
    border-radius: 0.5rem;
    background-color: #f9fafb;
    cursor: pointer;
    font-size: 0.95rem;
    &:hover {
      border-color: #9ca3af;
    }
  }
  
  small {
    display: block;
    margin-top: 0.5rem;
    color: #6b7280;
    font-size: 0.875rem;
  }
}

.image-preview {
  position: relative;
  display: inline-block;
  margin-top: 1rem;
  border-radius: 0.5rem;
  overflow: hidden;
  max-width: 100%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  
  img {
    width: 100%;
    height: auto;
    max-height: 300px;
    object-fit: contain;
    background: #f3f4f6;
    display: block;
  }
  
  .remove-image-btn {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    background: rgba(239, 68, 68, 0.8);
    color: white;
    border: none;
    width: 2rem;
    height: 2rem;
    border-radius: 50%;
    cursor: pointer;
    font-size: 1.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;
    &:hover {
      background: rgba(239, 68, 68, 1);
    }
  }
}

.existing-gallery-preview,
.new-gallery-preview {
  margin-top: 1.5rem;
  
  h4 {
    font-size: 1.1rem;
    margin-bottom: 1rem;
    color: #374151;
    font-weight: 600;
  }
  
  .gallery-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
    margin-top: 1rem;
  }
  
  .gallery-item {
    position: relative;
    border-radius: 0.5rem;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    
    .image-container {
      position: relative;
      aspect-ratio: 4/3;
      background: #f3f4f6;
      overflow: hidden;
      
      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }
      
      .image-overlay {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        background: linear-gradient(to top, rgba(0, 0, 0, 0.7), transparent);
        padding: 0.5rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
        
        .type-badge {
          background: rgba(255, 255, 255, 0.3);
          color: white;
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
        }
        
        .remove-gallery-btn {
          background: rgba(239, 68, 68, 0.8);
          color: white;
          border: none;
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          cursor: pointer;
          font-size: 0.75rem;
          transition: background 0.2s;
          &:hover {
            background: rgba(239, 68, 68, 1);
          }
          
          &.danger {
            background: rgba(239, 68, 68, 0.8);
            &:hover {
              background: rgba(239, 68, 68, 1);
            }
          }
        }
      }
    }
  }
  
  .type-select {
    width: 100%;
    padding: 0.25rem 0.5rem;
    border: 1px solid #d1d5db;
    border-radius: 0.25rem;
    font-size: 0.75rem;
    background-color: white;
    cursor: pointer;
    transition: border-color 0.2s;
    &:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
    }
  }
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.95rem;
  transition: all 0.2s;
  
  &.secondary {
    background-color: #f3f4f6;
    color: #374151;
    border: 1px solid #d1d5db;
    &:hover {
      background-color: #e5e7eb;
    }
  }
  
  &.danger {
    background-color: #ef4444;
    color: white;
    &:hover {
      background-color: #dc2626;
    }
  }
}
</style>
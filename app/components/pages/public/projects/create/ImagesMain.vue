<template>
  <div class="images-main-section">
    <h2>Основные изображения</h2>
    <p class="section-description">
      Загрузите главное изображение и миниатюру. Эти изображения обязательны для публикации кейса.
    </p>

    <!-- Главное изображение -->
    <div class="form-group">
      <label for="mainImage">Главное изображение</label>
      <input
        id="mainImage"
        type="file"
        accept="image/*"
        @change="handleMainImage"
        required
      />
      <small>Основное изображение проекта, будет отображаться на странице кейса</small>
      <div v-if="mainImage" class="image-preview">
        <img :src="mainImage.preview" alt="Главное изображение" />
        <button
          type="button"
          @click="removeMainImage"
          class="remove-image-btn"
        >
          ×
        </button>
      </div>
    </div>

    <!-- Миниатюра -->
    <div class="form-group">
      <label for="thumbnail">Миниатюра</label>
      <input
        id="thumbnail"
        type="file"
        accept="image/*"
        @change="handleThumbnail"
        required
      />
      <small>Изображение для превью в карточке проекта (рекомендуемый размер: 400×300)</small>
      <div v-if="thumbnail" class="image-preview">
        <img :src="thumbnail.preview" alt="Миниатюра" />
        <button
          type="button"
          @click="removeThumbnail"
          class="remove-image-btn"
        >
          ×
        </button>
      </div>
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

      <!-- Превью галереи -->
      <div v-if="gallery.length" class="gallery-preview">
        <div
          v-for="(image, index) in gallery"
          :key="index"
          class="gallery-item"
        >
          <img :src="image.preview" :alt="`Фото галереи ${index + 1}`" />
          <div class="gallery-item-controls">
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
</template>

<script setup>
import { computed } from 'vue'

// Определение пропсов
const props = defineProps({
  mainImage: { type: Object, default: null },
  thumbnail: { type: Object, default: null },
  gallery: { type: Array, default: () => [] }
})

// Определение событий
const emit = defineEmits(['update:mainImage', 'update:thumbnail', 'update:gallery'])

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

// Главное изображение
const handleMainImage = (event) => {
  const file = event.target.files[0]
  if (file) {
    const preview = URL.createObjectURL(file)
    emit('update:mainImage', { file, preview })
  }
}

// Миниатюра
const handleThumbnail = (event) => {
  const file = event.target.files[0]
  if (file) {
    const preview = URL.createObjectURL(file)
    emit('update:thumbnail', { file, preview })
  }
}

// Открытие диалога выбора файлов для галереи
const triggerGalleryUpload = () => {
  document.getElementById('gallery-upload').click()
}

// Загрузка изображений галереи
const handleGalleryImages = (event) => {
  const files = Array.from(event.target.files)
  if (files.length === 0) return

  const newImages = files.map(file => ({
    file,
    preview: URL.createObjectURL(file),
    type: 'after' // тип по умолчанию
  }))

  emit('update:gallery', [...props.gallery, ...newImages])
}

// Удаление изображения из галереи
const removeGalleryImage = (index) => {
  const updatedGallery = [...props.gallery]
  updatedGallery.splice(index, 1)
  emit('update:gallery', updatedGallery)
}

// Удаление главного изображения
const removeMainImage = () => {
  emit('update:mainImage', null)
}

// Удаление миниатюры
const removeThumbnail = () => {
  emit('update:thumbnail', null)
}
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

    .image-preview,
    .gallery-preview {
      margin-top: 1rem;
      position: relative;

      img {
        max-width: 300px;
        max-height: 300px;
        object-fit: cover;
        border-radius: 0.5rem;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      .remove-image-btn {
        position: absolute;
        top: -6px;
        right: -6px;
        width: 24px;
        height: 24px;
        background: #ef4444;
        color: white;
        border: none;
        border-radius: 50%;
        font-size: 16px;
        line-height: 1;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.2s;

        &:hover {
          background: #dc2626;
        }
      }
    }

    .gallery-preview {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      margin-top: 1rem;

      .gallery-item {
        position: relative;
        max-width: 300px;

        img {
          width: 100%;
          height: 200px;
          object-fit: cover;
        }

        .gallery-item-controls {
          display: flex;
          gap: 0.5rem;
          margin-top: 0.5rem;
          align-items: center;

          .type-select {
            flex: 1;
            padding: 0.5rem;
            border: 1px solid #d1d5db;
            border-radius: 0.5rem;
            font-size: 0.9rem;
            background: white;

            &:focus {
              outline: none;
              border-color: #3b82f6;
            }
          }

          .remove-gallery-btn {
            padding: 0.4rem 0.75rem;
            background: #ef4444;
            color: white;
            border: none;
            border-radius: 0.5rem;
            font-size: 0.875rem;
            cursor: pointer;

            &:hover {
              background: #dc2626;
            }
          }
        }
      }
    }
  }

  .btn {
    padding: 0.75rem 1rem;
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
    font-weight: 600;
    font-size: 0.95rem;
    transition: all 0.2s;
    margin-top: 0.5rem;

    &.secondary {
      background-color: #f3f4f6;
      color: #374151;
      border: 1px solid #d1d5db;

      &:hover {
        background-color: #e5e7eb;
      }
    }
  }
}
</style>
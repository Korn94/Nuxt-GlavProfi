<!-- app/components/pages/public/projects/create/GalleryImages.vue -->
<template>
  <div class="gallery-images-section">
    <h3>Дополнительные фото</h3>
    <p class="section-description">
      Загрузите фото для галереи кейса. Можно добавить изображения «До» и «После» для сравнения.
    </p>

    <!-- Загрузка новых фото -->
    <div class="upload-area">
      <input
        id="gallery-upload"
        ref="galleryInput"
        type="file"
        accept="image/*"
        multiple
        @change="handleGalleryUpload"
        class="file-input"
      />
      <label for="gallery-upload" class="upload-trigger">
        <Icon name="mdi:plus" size="16" />
        Добавить фото
      </label>
      <small>Можно выбрать несколько файлов. Макс. размер каждого: 20 МБ.</small>
    </div>

    <!-- Существующие фото из БД -->
    <div v-if="existingImages.length" class="images-list">
      <h4>Загруженные:</h4>
      <div class="images-grid">
        <div 
          v-for="image in existingImages" 
          :key="image.id" 
          class="image-card"
        >
          <div class="image-wrapper">
            <img 
              :src="useImageUrl(image.url)" 
              :alt="image.alt || `Фото ${image.type}`" 
              @error="handleImageError($event, 'existing', image.id)"
              class="image-preview"
            />
            <div class="image-actions">
              <span class="type-badge">{{ getTypeLabel(image.type) }}</span>
              <button 
                type="button"
                @click="removeExisting(image.id)"
                class="btn-remove"
                title="Удалить"
              >
                <Icon name="mdi:trash-can-outline" size="14" />
              </button>
            </div>
          </div>
          <!-- Если это часть пары до/после -->
          <span v-if="image.pairGroup" class="pair-label">
            Группа: {{ image.pairGroup }}
          </span>
        </div>
      </div>
    </div>

    <!-- Новые фото (ещё не загружены на сервер) -->
    <div v-if="newImages.length" class="images-list">
      <h4>Новые:</h4>
      <div class="images-grid">
        <div 
          v-for="(image, index) in newImages" 
          :key="index" 
          class="image-card"
        >
          <div class="image-wrapper">
            <img 
              :src="image.preview" 
              :alt="image.alt || `Новое фото ${index + 1}`" 
              @error="handleImageError($event, 'new', index)"
              class="image-preview"
            />
            <div class="image-actions">
              <select 
                v-model="image.type" 
                class="type-select"
                @change="emit('update:newImages', newImages)"
              >
                <option value="after">После</option>
                <option value="before">До</option>
                <option value="gallery">Галерея</option>
              </select>
              <button 
                type="button"
                @click="removeNew(index)"
                class="btn-remove"
                title="Удалить"
              >
                <Icon name="mdi:close" size="14" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// ── Пропсы ─────────────────────────────────────────────────────
const props = defineProps({
  // Существующие фото из БД
  existingImages: { 
    type: Array as () => Array<{
      id: number
      url: string
      type: 'before' | 'after' | 'gallery'
      pairGroup?: string | null
      alt?: string
    }>, 
    default: () => [] 
  },
  // Новые фото (ещё не загружены)
  newImages: { 
    type: Array as () => Array<{
      file: File
      preview: string
      type: 'before' | 'after' | 'gallery'
      alt?: string
    }>, 
    default: () => [] 
  }
})

// ── Эмиты ──────────────────────────────────────────────────────
const emit = defineEmits([
  'update:newImages',      // Для синхронизации новых фото с родителем
  'remove-existing-image'  // Для удаления существующего фото из БД
])

// ── Рефы ───────────────────────────────────────────────────────
const galleryInput = ref<HTMLInputElement | null>(null)

// ── Вспомогательные функции ────────────────────────────────────

const getTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    before: 'До',
    after: 'После',
    gallery: 'Фото'
  }
  return labels[type] || type
}

// ── Обработчики загрузки ───────────────────────────────────────

const handleGalleryUpload = (event: Event) => {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files || [])
  
  if (files.length === 0) return

  // Фильтруем и валидируем файлы
  const validFiles = files.filter(file => {
    // Проверка размера (20 МБ)
    if (file.size > 20 * 1024 * 1024) {
      alert(`Файл "${file.name}" слишком большой. Макс. 20 МБ`)
      return false
    }
    // Проверка типа
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      alert(`Формат "${file.name}" не поддерживается. Используйте JPG, PNG или WebP`)
      return false
    }
    return true
  })

  if (validFiles.length === 0) {
    input.value = ''
    return
  }

  // Создаём превью для новых фото
  const newPreviews = validFiles.map(file => ({
    file,
    preview: URL.createObjectURL(file),
    type: 'after' as const,
    alt: `Галерея: ${file.name}`
  }))

  // Обновляем список новых фото
  emit('update:newImages', [...props.newImages, ...newPreviews])

  // Сбрасываем инпут, чтобы можно было выбрать те же файлы снова
  input.value = ''
}

// ── Удаление фото ──────────────────────────────────────────────

// Удаление существующего фото (из БД)
const removeExisting = (id: number) => {
  emit('remove-existing-image', id)
}

// Удаление нового фото (ещё не загружено)
const removeNew = (index: number) => {
  const image = props.newImages[index]
  
  // Освобождаем память от blob:URL
  if (image?.preview?.startsWith('blob:')) {
    URL.revokeObjectURL(image.preview)
  }
  
  const updated = [...props.newImages]
  updated.splice(index, 1)
  emit('update:newImages', updated)
}

// ── Обработка ошибок загрузки ──────────────────────────────────

/**
 * Защита от бесконечного цикла ошибок при загрузке картинки
 */
const handleImageError = (event: Event, type: string, id?: number | string) => {
  const img = event.target as HTMLImageElement
  
  // Если уже обрабатывали ошибку для этого элемента — выходим
  if (img.dataset.errorHandled === 'true') return
  
  console.warn(`⚠️ Ошибка загрузки (${type}, id: ${id}):`, img.src)
  
  // Ставим флажок, чтобы не зациклиться
  img.dataset.errorHandled = 'true'
  
  // Показываем плейсхолдер
  img.src = '/images/placeholder.jpg'
  
  // Через 5 секунд убираем флажок (на случай восстановления сети)
  setTimeout(() => {
    delete img.dataset.errorHandled
  }, 5000)
}

// ── Очистка при размонтировании ────────────────────────────────

// Родительский компонент должен вызывать эту функцию при unmount,
// или мы можем сделать это через onUnmounted, если компонент монтируется надолго
const cleanupPreviews = () => {
  props.newImages.forEach(img => {
    if (img.preview?.startsWith('blob:')) {
      URL.revokeObjectURL(img.preview)
    }
  })
}

// Автоматическая очистка, если компонент уничтожается
import { onUnmounted } from 'vue'
import { useImageUrl } from '~/composables/useImageUrl'
onUnmounted(() => {
  cleanupPreviews()
})
</script>

<style lang="scss" scoped>
.gallery-images-section {
  background: var(--crm-bg-surface);
  padding: 1.5rem;
  border-radius: var(--crm-radius-lg);
  border: 1px solid var(--crm-border);
  
  h3 {
    font-size: var(--crm-text-lg);
    font-weight: 600;
    color: var(--crm-text-primary);
    margin: 0 0 0.5rem 0;
  }
  
  .section-description {
    color: var(--crm-text-muted);
    margin-bottom: 1.5rem;
    font-size: var(--crm-text-sm);
    line-height: 1.4;
  }
}

// ── Область загрузки ───────────────────────────────────────────
.upload-area {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1.5rem;
  border: 2px dashed var(--crm-border);
  border-radius: var(--crm-radius-md);
  background: var(--crm-bg-elevated);
  margin-bottom: 1.5rem;
  
  .file-input {
    display: none;
  }
  
  .upload-trigger {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: var(--crm-accent-dim);
    border: 1px solid var(--crm-accent-border);
    border-radius: var(--crm-radius-md);
    color: var(--crm-accent);
    font-size: var(--crm-text-sm);
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    
    &:hover {
      background: rgba(0, 195, 245, 0.25);
      border-color: var(--crm-accent);
    }
  }
  
  small {
    color: var(--crm-text-muted);
    font-size: var(--crm-text-xs);
  }
}

// ── Списки изображений ─────────────────────────────────────────
.images-list {
  margin-bottom: 1.5rem;
  
  &:last-child {
    margin-bottom: 0;
  }
  
  h4 {
    font-size: var(--crm-text-sm);
    font-weight: 600;
    color: var(--crm-text-secondary);
    margin: 0 0 0.75rem 0;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
}

.images-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 0.75rem;
}

.image-card {
  background: var(--crm-bg-elevated);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-md);
  overflow: hidden;
  
  .image-wrapper {
    position: relative;
    aspect-ratio: 4/3;
    background: var(--crm-bg-base);
    
    .image-preview {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    
    .image-actions {
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      align-items: flex-end;
    }
    
    .type-badge {
      font-size: 10px;
      font-weight: 700;
      padding: 2px 6px;
      background: var(--crm-accent-dim);
      color: var(--crm-accent);
      border-radius: 3px;
      text-transform: uppercase;
    }
    
    .btn-remove {
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(242, 95, 92, 0.9);
      color: white;
      border: none;
      border-radius: 50%;
      cursor: pointer;
      transition: all 0.2s ease;
      
      &:hover {
        background: var(--crm-danger);
        transform: scale(1.1);
      }
    }
  }
  
  .pair-label {
    display: block;
    padding: 0.5rem 0.75rem;
    font-size: 10px;
    color: var(--crm-text-muted);
    background: var(--crm-bg-base);
    border-top: 1px solid var(--crm-border);
  }
}

.type-select {
  padding: 2px 4px;
  font-size: 10px;
  background: var(--crm-bg-surface);
  border: 1px solid var(--crm-border);
  border-radius: 3px;
  color: var(--crm-text-primary);
  cursor: pointer;
  
  &:focus {
    outline: none;
    border-color: var(--crm-accent);
  }
}

// ── Адаптив ───────────────────────────────────────────────────
@media (max-width: 768px) {
  .gallery-images-section {
    padding: 1rem;
  }
  
  .images-grid {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)) !important;
  }
}
</style>

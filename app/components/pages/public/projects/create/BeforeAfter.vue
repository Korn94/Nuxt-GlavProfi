<!-- app/components/pages/public/projects/create/BeforeAfter.vue -->
<template>
  <div class="before-after-section">
    <h2 class="section-title">Сравнение: До и После</h2>
    <p class="section-description">Добавьте пары фото для визуального сравнения изменений.</p>

    <!-- Секция для существующих пар -->
    <div v-if="existingBeforeAfterPairs.length > 0" class="pairs-section">
      <h3 class="pairs-section__title">
        <span class="badge badge--existing">Существующие</span>
        <span class="pairs-count">{{ existingBeforeAfterPairs.length }}</span>
      </h3>
      
      <div class="pairs-grid">
        <div 
          v-for="(pair, index) in existingBeforeAfterPairs" 
          :key="`existing-${pair.id || index}`" 
          class="pair-card"
        >
          <!-- Заголовок пары -->
          <div class="pair-card__header">
            <span class="pair-group">{{ pair.pairGroup || `Пара #${index + 1}` }}</span>
            <button 
              type="button" 
              class="crm-btn crm-btn--mini crm-btn--danger"
              @click="removeExistingPair(index)"
              title="Удалить пару"
            >
              <Icon name="mdi:trash-can-outline" size="12" />
            </button>
          </div>
          
          <!-- Изображения пары -->
          <div class="pair-images">
            <!-- Фото "До" -->
            <div v-if="pair.beforeUrl" class="pair-image">
              <span class="pair-image__label badge badge--before">До</span>
              <div class="pair-image__container">
                <img 
                  :src="useImageUrl(pair.beforeUrl)" 
                  :alt="pair.beforeAlt || 'Фото До'" 
                  class="pair-image__img"
                  @error="handleImageError($event, 'existing-before', pair.beforeId)"
                />
              </div>
              <button 
                type="button" 
                class="pair-image__remove"
                @click="removeExistingBeforeImage(pair)"
                title="Удалить фото"
              >
                <Icon name="mdi:trash-can-outline" size="12" />
              </button>
              <input 
                v-if="pair.beforeId" 
                type="hidden" 
                :name="`existingBeforeImageId[${index}]`" 
                :value="pair.beforeId" 
              />
            </div>
            
            <!-- Фото "После" -->
            <div v-if="pair.afterUrl" class="pair-image">
              <span class="pair-image__label badge badge--after">После</span>
              <div class="pair-image__container">
                <img 
                  :src="useImageUrl(pair.afterUrl)" 
                  :alt="pair.afterAlt || 'Фото После'" 
                  class="pair-image__img"
                  @error="handleImageError($event, 'existing-after', pair.afterId)"
                />
              </div>
              <button 
                type="button" 
                class="pair-image__remove"
                @click="removeExistingAfterImage(pair)"
                title="Удалить фото"
              >
                <Icon name="mdi:trash-can-outline" size="12" />
              </button>
              <input 
                v-if="pair.afterId" 
                type="hidden" 
                :name="`existingAfterImageId[${index}]`" 
                :value="pair.afterId" 
              />
            </div>
          </div>
          
          <!-- Pair Group (readonly) -->
          <div class="pair-meta">
            <small class="pair-meta__label">Группа:</small>
            <code class="pair-meta__value">{{ pair.pairGroup || '—' }}</code>
          </div>
        </div>
      </div>
    </div>

    <!-- Секция для новых пар -->
    <div class="pairs-section">
      <h3 class="pairs-section__title">
        <span class="badge badge--new">Новые пары</span>
        <span class="pairs-count">{{ beforeAfterPairs.length }}</span>
      </h3>
      
      <div class="pairs-grid">
        <div 
          v-for="(pair, index) in beforeAfterPairs" 
          :key="`new-${index}`" 
          class="pair-card pair-card--new"
        >
          <!-- Заголовок пары -->
          <div class="pair-card__header">
            <span class="pair-group">Новая пара #{{ index + 1 }}</span>
            <button 
              type="button" 
              class="crm-btn crm-btn--mini crm-btn--danger"
              @click="removePair(index)"
              title="Удалить пару"
            >
              <Icon name="mdi:trash-can-outline" size="12" />
            </button>
          </div>
          
          <!-- Загрузка изображений -->
          <div class="pair-uploads">
            <!-- Загрузка "До" -->
            <div class="pair-upload">
              <span class="pair-upload__label badge badge--before">До</span>
              <label class="upload-zone">
                <input
                  type="file"
                  accept="image/*"
                  class="upload-input"
                  @change="(e) => handleNewImage(e, index, 'before')"
                />
                <div v-if="pair.before" class="upload-preview">
                  <img :src="pair.beforePreview" class="upload-preview__img" />
                  <button 
                    type="button" 
                    class="upload-preview__remove"
                    @click.stop="removeBeforeImage(index)"
                  >
                    <Icon name="mdi:trash-can-outline" size="12" />
                  </button>
                </div>
                <div v-else class="upload-zone__content">
                  <Icon name="mdi:image-plus-outline" size="16" class="upload-icon" />
                  <span class="upload-text">Загрузить</span>
                </div>
              </label>
              <input type="hidden" :name="`beforeImage[${index}]`" :value="pair.before?.name" />
            </div>
            
            <!-- Загрузка "После" -->
            <div class="pair-upload">
              <span class="pair-upload__label badge badge--after">После</span>
              <label class="upload-zone">
                <input
                  type="file"
                  accept="image/*"
                  class="upload-input"
                  @change="(e) => handleNewImage(e, index, 'after')"
                />
                <div v-if="pair.after" class="upload-preview">
                  <img :src="pair.afterPreview" class="upload-preview__img" />
                  <button 
                    type="button" 
                    class="upload-preview__remove"
                    @click.stop="removeAfterImage(index)"
                  >
                    <Icon name="mdi:trash-can-outline" size="12" />
                  </button>
                </div>
                <div v-else class="upload-zone__content">
                  <Icon name="mdi:image-plus-outline" size="16" class="upload-icon" />
                  <span class="upload-text">Загрузить</span>
                </div>
              </label>
              <input type="hidden" :name="`afterImage[${index}]`" :value="pair.after?.name" />
            </div>
          </div>
          
          <!-- Pair Group -->
          <div class="pair-meta">
            <label class="pair-meta__label">Группа:</label>
            <input
              type="text"
              :value="pair.pairGroup || ''"
              @input="(e) => updatePairGroup(index, e.target.value)"
              placeholder="auto"
              class="pair-meta__input"
            />
          </div>
        </div>
      </div>
      
      <!-- Кнопка добавления новой пары -->
      <button @click="addPair" type="button" class="crm-btn crm-btn--outline">
        <Icon name="mdi:plus" size="14" />
        Добавить новую пару
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

// --- Пропсы и события ---
const props = defineProps({
  existingBeforeAfterPairs: { type: Array, default: () => [] },
  beforeAfterPairs: { type: Array, default: () => [] }
})

const emit = defineEmits([
  'update:existingBeforeAfterPairs',
  'update:beforeAfterPairs'
])

// --- Обработчик ошибок изображений ---
const handleImageError = (event, type, id) => {
  console.warn(`Ошибка загрузки изображения (${type}):`, id)
  event.target.src = '/images/placeholder.jpg'
}

// --- Методы для новых пар ---
const addPair = () => {
  const newPairs = [...props.beforeAfterPairs]
  newPairs.push({
    before: null,
    after: null,
    beforePreview: null,
    afterPreview: null,
    pairGroup: `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  })
  emit('update:beforeAfterPairs', newPairs)
}

const removePair = (index) => {
  const newPairs = [...props.beforeAfterPairs]
  newPairs.splice(index, 1)
  emit('update:beforeAfterPairs', newPairs)
}

const updatePairGroup = (index, value) => {
  const newPairs = [...props.beforeAfterPairs]
  if (newPairs[index]) {
    newPairs[index].pairGroup = value
  }
  emit('update:beforeAfterPairs', newPairs)
}

const handleNewImage = (event, index, type) => {
  const file = event.target.files?.[0]
  if (!file) return
  
  const newPairs = [...props.beforeAfterPairs]
  const preview = URL.createObjectURL(file)
  
  if (type === 'before') {
    newPairs[index] = { ...newPairs[index], before: file, beforePreview: preview }
  } else {
    newPairs[index] = { ...newPairs[index], after: file, afterPreview: preview }
  }
  
  emit('update:beforeAfterPairs', newPairs)
  event.target.value = '' // сброс input
}

const removeBeforeImage = (index) => {
  const newPairs = [...props.beforeAfterPairs]
  if (newPairs[index]?.beforePreview) {
    URL.revokeObjectURL(newPairs[index].beforePreview)
  }
  newPairs[index] = { ...newPairs[index], before: null, beforePreview: null }
  emit('update:beforeAfterPairs', newPairs)
}

const removeAfterImage = (index) => {
  const newPairs = [...props.beforeAfterPairs]
  if (newPairs[index]?.afterPreview) {
    URL.revokeObjectURL(newPairs[index].afterPreview)
  }
  newPairs[index] = { ...newPairs[index], after: null, afterPreview: null }
  emit('update:beforeAfterPairs', newPairs)
}

// --- Методы для существующих пар ---
const removeExistingPair = (index) => {
  const newExistingPairs = [...props.existingBeforeAfterPairs]
  newExistingPairs.splice(index, 1)
  emit('update:existingBeforeAfterPairs', newExistingPairs)
}

const removeExistingBeforeImage = (pair) => {
  if (pair.beforeId) {
    emit('remove-existing-image', pair.beforeId) // родитель должен обработать
  }
}

const removeExistingAfterImage = (pair) => {
  if (pair.afterId) {
    emit('remove-existing-image', pair.afterId)
  }
}

// --- Очистка blob: URL при размонтировании ---
onUnmounted(() => {
  props.beforeAfterPairs.forEach(pair => {
    if (pair.beforePreview) URL.revokeObjectURL(pair.beforePreview)
    if (pair.afterPreview) URL.revokeObjectURL(pair.afterPreview)
  })
})
</script>

<style lang="scss" scoped>
.before-after-section {
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

// ── Секция пар ──────────────────────────────────────────────────
.pairs-section {
  padding: 12px 0;
  border-bottom: 1px solid var(--crm-border);
  
  &:last-child { border-bottom: none; }
}

.pairs-section__title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: var(--crm-text-sm);
  font-weight: 600;
  color: var(--crm-text-secondary);
  margin: 0 0 12px 0;
}

.pairs-count {
  font-size: 10px;
  color: var(--crm-text-muted);
  background: var(--crm-bg-overlay);
  padding: 1px 6px;
  border-radius: 8px;
  font-weight: 600;
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
  &--existing { background: var(--crm-info-dim); color: var(--crm-info); }
  &--new { background: var(--crm-accent-dim); color: var(--crm-accent); }
}

// ── Сетка пар ───────────────────────────────────────────────────
.pairs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

// ── Карточка пары ───────────────────────────────────────────────
.pair-card {
  background: var(--crm-bg-elevated);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-md);
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;

  &--new {
    border-color: var(--crm-accent-border);
  }
}

.pair-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.pair-group {
  font-size: 11px;
  font-weight: 600;
  color: var(--crm-text-secondary);
  font-family: var(--crm-font-mono);
}

// ── Изображения пары ────────────────────────────────────────────
.pair-images {
  display: flex;
  gap: 8px;
}

.pair-image {
  position: relative;
  flex: 1;
}

.pair-image__label {
  position: absolute;
  top: 4px;
  left: 4px;
  z-index: 2;
}

.pair-image__container {
  aspect-ratio: 1;
  background: var(--crm-bg-base);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-sm);
  overflow: hidden;
}

.pair-image__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.pair-image__remove {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--crm-danger);
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  padding: 0;
  z-index: 2;
  transition: var(--crm-transition);

  &:hover {
    background: var(--crm-danger-hover);
    transform: scale(1.05);
  }
}

// ── Загрузка новых изображений ──────────────────────────────────
.pair-uploads {
  display: flex;
  gap: 8px;
}

.pair-upload {
  position: relative;
  flex: 1;
}

.pair-upload__label {
  position: absolute;
  top: 4px;
  left: 4px;
  z-index: 2;
}

.upload-zone {
  display: block;
  position: relative;
  aspect-ratio: 1;
  border: 1px dashed var(--crm-border);
  border-radius: var(--crm-radius-sm);
  cursor: pointer;
  transition: var(--crm-transition);
  background: var(--crm-bg-base);
  overflow: hidden;

  &:hover {
    border-color: var(--crm-accent);
    background: var(--crm-accent-dim);
  }
}

.upload-input {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}

.upload-zone__content {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  pointer-events: none;
}

.upload-icon {
  color: var(--crm-text-muted);
}

.upload-text {
  font-size: 9px;
  color: var(--crm-text-secondary);
  font-weight: 500;
}

.upload-preview {
  position: relative;
  width: 100%;
  height: 100%;
}

.upload-preview__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.upload-preview__remove {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--crm-danger);
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  padding: 0;
  transition: var(--crm-transition);

  &:hover {
    background: var(--crm-danger-hover);
    transform: scale(1.05);
  }
}

// ── Мета-информация ─────────────────────────────────────────────
.pair-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 10px;
}

.pair-meta__label {
  color: var(--crm-text-muted);
  font-weight: 500;
}

.pair-meta__value {
  font-family: var(--crm-font-mono);
  color: var(--crm-text-secondary);
  background: var(--crm-bg-overlay);
  padding: 1px 6px;
  border-radius: 4px;
}

.pair-meta__input {
  flex: 1;
  padding: 2px 6px;
  border: 1px solid var(--crm-border);
  border-radius: 4px;
  background: var(--crm-bg-base);
  color: var(--crm-text-primary);
  font-size: 10px;
  font-family: var(--crm-font-mono);

  &:focus {
    outline: none;
    border-color: var(--crm-accent);
  }

  &::placeholder {
    color: var(--crm-text-disabled);
  }
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
    // width: 100%;
    margin-top: 4px;

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
  .pairs-grid {
    grid-template-columns: 1fr;
  }
  
  .pair-images,
  .pair-uploads {
    flex-direction: column;
  }
  
  .before-after-section {
    padding: 12px 14px;
  }
}
</style>

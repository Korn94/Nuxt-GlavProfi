<template>
  <div class="seo-section">
    <h2>SEO-настройки</h2>
    <p class="section-description">
      Настройте мета-теги для улучшения поисковой оптимизации страницы кейса.
    </p>

    <!-- Meta Title -->
    <div class="form-group">
      <label for="metaTitle">Meta Title</label>
      <input
        id="metaTitle"
        v-model="metaTitle"
        type="text"
        placeholder="Введите заголовок страницы (рекомендуется до 60 символов)"
      />
      <small>Отображается в вкладке браузера и в результатах поиска. Влияет на кликабельность.</small>
      <div class="char-counter" :class="{ 'warning': metaTitle.length > 60 }">
        {{ metaTitle.length }} / 60 символов
      </div>
    </div>

    <!-- Meta Description -->
    <div class="form-group">
      <label for="metaDescription">Meta Description</label>
      <textarea
        id="metaDescription"
        v-model="metaDescription"
        placeholder="Введите описание страницы для поисковых систем (рекомендуется 120–160 символов)"
        rows="3"
      />
      <small>Показывается в сниппетах поисковиков. Важен для привлечения внимания пользователей.</small>
      <div class="char-counter" :class="{ 'warning': metaDescription.length > 160 || metaDescription.length < 120 }">
        {{ metaDescription.length }} / 160 символов
      </div>
    </div>

    <!-- Meta Keywords -->
    <div class="form-group">
      <label for="metaKeywords">Meta Keywords</label>
      <input
        id="metaKeywords"
        v-model="metaKeywords"
        type="text"
        placeholder="Ключевые слова через запятую, например: ремонт кафе, дизайн интерьера, строительство"
      />
      <small>Хотя и не влияет напрямую на SEO, может использоваться для внутренней аналитики и фильтрации.</small>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, computed } from 'vue'

// Определение пропсов
const props = defineProps({
  metaTitle: { type: String, default: '' },
  metaDescription: { type: String, default: '' },
  metaKeywords: { type: String, default: '' }
})

// Определение событий
const emit = defineEmits(['update:metaTitle', 'update:metaDescription', 'update:metaKeywords'])

// Реактивные геттеры и сеттеры
const metaTitle = computed({
  get: () => props.metaTitle,
  set: (value) => {
    emit('update:metaTitle', value)
  }
})

const metaDescription = computed({
  get: () => props.metaDescription,
  set: (value) => {
    emit('update:metaDescription', value)
  }
})

const metaKeywords = computed({
  get: () => props.metaKeywords,
  set: (value) => {
    emit('update:metaKeywords', value)
  }
})
</script>

<style lang="scss" scoped>
.seo-section {
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

    input[type="text"],
    textarea {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 0.5rem;
      font-size: 1rem;
      transition: border-color 0.2s;
      background-color: #f9fafb;

      &:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
      }

      &::placeholder {
        color: #9ca3af;
      }
    }

    small {
      display: block;
      margin-top: 0.5rem;
      color: #6b7280;
      font-size: 0.875rem;
    }

    .char-counter {
      margin-top: 0.5rem;
      font-size: 0.875rem;
      color: #6b7280;

      &.warning {
        color: #ef4444;
        font-weight: 500;
      }
    }
  }
}
</style>
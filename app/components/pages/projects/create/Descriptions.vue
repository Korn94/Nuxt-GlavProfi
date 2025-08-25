<template>
  <div class="descriptions-section">
    <h2>Описания и результат</h2>
    <p class="section-description">
      Заполните текстовые описания проекта. Краткое описание для страницы кейса — обязательное поле.
    </p>

    <!-- Описание объекта -->
    <div class="form-group">
      <label for="objectDescription">Описание компании или объекта. Вначале всегда будет заголовое кейса, дальше уже введенный текст</label>
      <textarea
        id="objectDescription"
        v-model="objectDescription"
        placeholder="это современное фитнесс-пространство с ..."
        required
      />
    </div>

    <!-- Краткое описание (для карточки) -->
    <div class="form-group">
      <label for="shortObject">Краткое описание компании или объекта</label>
      <textarea
        id="shortObject"
        v-model="shortObject"
        placeholder="Федеральная сеть фитнес-клубов DDX Fitness"
        required
      />
    </div>

    <!-- Краткое описание для страницы кейса (ОБЯЗАТЕЛЬНОЕ) -->
    <div class="form-group">
      <label for="shortDescription">Краткое описание для объекта/помещения</label>
      <textarea
        id="shortDescription"
        v-model="shortDescription"
        placeholder="Торговый центр..."
        required
      />
    </div>

    <!-- Полное описание -->
    <div class="form-group">
      <label for="fullDescription">Полное описание</label>
      <textarea
        id="fullDescription"
        v-model="fullDescription"
        placeholder="Подробное описание хода работ, использованных материалов, решений и особенностей проекта"
        rows="6"
      />
    </div>

    <!-- Результат -->
    <div class="form-group">
      <label for="result">Результат</label>
      <textarea
        id="result"
        v-model="result"
        placeholder="Опишите итоговый результат, преимущества, улучшения, которые были достигнуты"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

// Определение пропсов
const props = defineProps({
  objectDescription: { type: String, default: '' },
  shortObject: { type: String, default: '' },
  shortDescription: { type: String, default: '' },
  fullDescription: { type: String, default: '' },
  result: { type: String, default: '' }
})

// Определение событий
const emit = defineEmits([
  'update:objectDescription',
  'update:shortObject',
  'update:shortDescription',
  'update:fullDescription',
  'update:result'
])

// Реактивные геттеры и сеттеры
const objectDescription = computed({
  get: () => props.objectDescription,
  set: (value) => {
    emit('update:objectDescription', value)
  }
})

const shortObject = computed({
  get: () => props.shortObject,
  set: (value) => {
    emit('update:shortObject', value)
  }
})

const shortDescription = computed({
  get: () => props.shortDescription,
  set: (value) => {
    emit('update:shortDescription', value)
  }
})

const fullDescription = computed({
  get: () => props.fullDescription,
  set: (value) => {
    emit('update:fullDescription', value)
  }
})

const result = computed({
  get: () => props.result,
  set: (value) => {
    emit('update:result', value)
  }
})
</script>

<style lang="scss" scoped>
.descriptions-section {
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

    textarea {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 0.5rem;
      font-size: 1rem;
      resize: vertical;
      min-height: 100px;
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
      color: #ef4444;
      font-size: 0.875rem;
      font-weight: 500;
    }
  }
}
</style>
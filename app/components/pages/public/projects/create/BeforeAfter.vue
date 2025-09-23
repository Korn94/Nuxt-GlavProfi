<template>
  <div class="before-after-section">
    <h2>Сравнение: До и После</h2>
    <p class="section-description">
      Добавьте пары фото для визуального сравнения изменений.
    </p>

    <!-- Группа парных фото -->
    <div class="form-group">
      <label for="pairGroup">Группа парных фото (необязательно) - пока не заполнять</label>
      <input
        id="pairGroup"
        v-model="pairGroup"
        type="text"
        placeholder="Например: Ремонт фасада, Внутренние работы и т.п."
      />
      <small>Опционально: название группы для объединения нескольких пар "до/после"</small>
    </div>

    <!-- Существующие пары "до/после" -->
    <div
      v-for="(pair, index) in beforeAfterPairs"
      :key="index"
      class="pair-group"
    >
      <h3>Пара {{ index + 1 }}</h3>

      <div class="image-pair">
        <!-- Фото "До" -->
        <div class="image-input">
          <label>Фото "До"</label>
          <input
            type="file"
            accept="image/*"
            @change="handleBeforeImage($event, index)"
          />
          <div v-if="pair.before" class="image-preview">
            <img :src="pair.before.preview" alt="Фото до" />
            <button
              type="button"
              @click="removeBeforeImage(index)"
              class="remove-image-btn"
            >
              ×
            </button>
          </div>
        </div>

        <!-- Фото "После" -->
        <div class="image-input">
          <label>Фото "После"</label>
          <input
            type="file"
            accept="image/*"
            @change="handleAfterImage($event, index)"
          />
          <div v-if="pair.after" class="image-preview">
            <img :src="pair.after.preview" alt="Фото после" />
            <button
              type="button"
              @click="removeAfterImage(index)"
              class="remove-image-btn"
            >
              ×
            </button>
          </div>
        </div>
      </div>

      <!-- Удаление пары -->
      <button
        v-if="beforeAfterPairs.length > 1"
        type="button"
        @click="removePair(index)"
        class="btn danger small"
      >
        Удалить пару
      </button>
    </div>

    <!-- Кнопка добавления новой пары -->
    <button type="button" @click="addPair" class="btn secondary">
      + Добавить пару "до/после"
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'

// Определение пропсов
const props = defineProps({
  pairGroup: { type: String },
  beforeAfterPairs: {
    type: Array,
    default: () => []
  }
})

// Определение событий
const emit = defineEmits(['update:pairGroup', 'update:beforeAfterPairs'])

// Реактивные геттеры и сеттеры
const pairGroup = computed({
  get: () => props.pairGroup,
  set: (value) => {
    emit('update:pairGroup', value)
  }
})

const beforeAfterPairs = computed({
  get: () => props.beforeAfterPairs,
  set: (value) => {
    emit('update:beforeAfterPairs', value)
  }
})

// Добавление новой пары
const addPair = () => {
  const newPairs = [...props.beforeAfterPairs]
  newPairs.push({
    before: null,
    after: null
  })
  emit('update:beforeAfterPairs', newPairs)
}

// Удаление пары
const removePair = (index) => {
  const newPairs = [...props.beforeAfterPairs]
  newPairs.splice(index, 1)
  emit('update:beforeAfterPairs', newPairs)
}

// Обработчик фото "до"
const handleBeforeImage = (event, index) => {
  const file = event.target.files[0]
  if (file) {
    const newPairs = [...props.beforeAfterPairs]
    newPairs[index].before = {
      file,
      preview: URL.createObjectURL(file)
    }
    emit('update:beforeAfterPairs', newPairs)
  }
}

// Обработчик фото "после"
const handleAfterImage = (event, index) => {
  const file = event.target.files[0]
  if (file) {
    const newPairs = [...props.beforeAfterPairs]
    newPairs[index].after = {
      file,
      preview: URL.createObjectURL(file)
    }
    emit('update:beforeAfterPairs', newPairs)
  }
}

// Удаление фото "до"
const removeBeforeImage = (index) => {
  const newPairs = [...props.beforeAfterPairs]
  newPairs[index].before = null
  emit('update:beforeAfterPairs', newPairs)
}

// Удаление фото "после"
const removeAfterImage = (index) => {
  const newPairs = [...props.beforeAfterPairs]
  newPairs[index].after = null
  emit('update:beforeAfterPairs', newPairs)
}
</script>

<style lang="scss" scoped>
.before-after-section {
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

    input[type="text"] {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 0.5rem;
      font-size: 1rem;
      background-color: #f9fafb;

      &:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
      }
    }

    small {
      display: block;
      margin-top: 0.5rem;
      color: #6b7280;
      font-size: 0.875rem;
    }
  }

  .pair-group {
    background: #f3f4f6;
    padding: 1.25rem;
    border-radius: 0.5rem;
    margin-bottom: 1rem;
    position: relative;

    &:last-child {
      margin-bottom: 0;
    }

    h3 {
      margin: 0 0 1rem 0;
      font-size: 1.1rem;
      color: #374151;
      font-weight: 600;
    }

    .image-pair {
      display: flex;
      gap: 1.5rem;
      margin-bottom: 1rem;

      @media (max-width: 768px) {
        flex-direction: column;
      }
    }

    .image-input {
      flex: 1;
      label {
        display: block;
        font-weight: 600;
        margin-bottom: 0.5rem;
        color: #4b5563;
        font-size: 0.95rem;
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

      .image-preview {
        position: relative;
        margin-top: 0.75rem;
        display: inline-block;

        img {
          max-width: 200px;
          max-height: 200px;
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
    }

    .btn.danger {
      background-color: #ef4444;
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      font-size: 0.875rem;

      &:hover {
        background-color: #dc2626;
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
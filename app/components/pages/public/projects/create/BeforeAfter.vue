<template>
  <div class="before-after-section">
    <h2>Сравнение: До и После</h2>
    <p class="section-description">Добавьте пары фото для визуального сравнения изменений.</p>

    <!-- Секция для существующих пар -->
    <div v-if="existingBeforeAfterPairs.length > 0" class="existing-pairs-section">
      <h3>Существующие пары</h3>
      <div v-for="(pair, index) in existingBeforeAfterPairs" :key="`existing-${pair.id || index}`" class="existing-pair-item">
        <div class="pair-info">
          <span>Pair Group: {{ pair.pairGroup || 'NULL' }}</span>
          <button @click="removeExistingPair(index)" class="btn-remove-pair">Удалить пару</button>
        </div>
        <div class="existing-image-row">
          <div v-if="pair.beforeUrl" class="existing-image-container">
            <label>Фото До:</label>
            <img :src="pair.beforeUrl" alt="Before" style="max-width: 200px; max-height: 200px;" />
            <button @click="removeExistingBeforeImage(pair)">Удалить фото До</button>
            <!-- Скрытое поле для отправки ID существующего изображения -->
            <input type="hidden" :name="`existingBeforeImageId[${index}]`" :value="pair.beforeId" v-if="pair.beforeId" />
          </div>
          <div v-if="pair.afterUrl" class="existing-image-container">
            <label>Фото После:</label>
            <img :src="pair.afterUrl" alt="After" style="max-width: 200px; max-height: 200px;" />
            <button @click="removeExistingAfterImage(pair)">Удалить фото После</button>
            <input type="hidden" :name="`existingAfterImageId[${index}]`" :value="pair.afterId" v-if="pair.afterId" />
          </div>
        </div>
         <div class="form-group">
            <label>Pair Group (редактируемый):</label>
            <input type="text" :value="pair.pairGroup || ''" readonly /> <!-- Пока readOnly, если не планируете редактировать -->
         </div>
      </div>
    </div>

    <!-- Секция для новых пар -->
    <div class="new-pairs-section">
      <h3>Новые пары</h3>
      <div v-for="(pair, index) in beforeAfterPairs" :key="`new-${index}`" class="pair-item">
        <div class="image-upload-row">
          <div class="upload-column">
            <label>Фото До</label>
            <input
              :name="`beforeImage[${index}]`"
              type="file"
              accept="image/*"
              @change="(e) => pair.before = e.target.files[0]"
            />
            <button v-if="pair.before" @click="removeBeforeImage(index)">Удалить фото До</button>
            <div v-if="pair.before">{{ pair.before.name }}</div>
          </div>
          <div class="upload-column">
            <label>Фото После</label>
            <input
              :name="`afterImage[${index}]`"
              type="file"
              accept="image/*"
              @change="(e) => pair.after = e.target.files[0]"
            />
            <button v-if="pair.after" @click="removeAfterImage(index)">Удалить фото После</button>
            <div v-if="pair.after">{{ pair.after.name }}</div>
          </div>
        </div>
        <div class="form-group">
          <label>Pair Group (для новой пары)</label>
          <input
            type="text"
            :value="pair.pairGroup || ''"
            @input="(e) => updatePairGroup(index, e.target.value)"
            placeholder="Введите ID группы для пары"
          />
        </div>
        <button @click="removePair(index)" class="btn-remove-pair">Удалить пару</button>
      </div>
      <button @click="addPair" type="button" class="btn-add-pair">Добавить новую пару</button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

// --- Определение пропсов ---
const props = defineProps({
  existingBeforeAfterPairs: { type: Array, default: () => [] },
  beforeAfterPairs: { type: Array, default: () => [] }
})

// --- Определение событий ---
const emit = defineEmits([
  'update:existingBeforeAfterPairs',
  'update:beforeAfterPairs'
])

// --- Методы для новых пар ---
const addPair = () => {
  const newPairs = [...props.beforeAfterPairs]; // Только новые
  newPairs.push({
    before: null,
    after: null,
    pairGroup: `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` // Генерируем уникальный ID для новой пары
  });
  emit('update:beforeAfterPairs', newPairs);
};

const removePair = (index) => {
  const newPairs = [...props.beforeAfterPairs]; // Только новые
  newPairs.splice(index, 1);
  emit('update:beforeAfterPairs', newPairs);
};

const updatePairGroup = (index, value) => {
  const newPairs = [...props.beforeAfterPairs]; // Только новые
  if (newPairs[index]) {
    newPairs[index].pairGroup = value;
  }
  emit('update:beforeAfterPairs', newPairs);
};

const removeBeforeImage = (index) => {
  const newPairs = [...props.beforeAfterPairs];
  if (newPairs[index]) {
      newPairs[index].before = null; // Устанавливаем в null, чтобы сервер знал, что нужно удалить
  }
  emit('update:beforeAfterPairs', newPairs);
};

const removeAfterImage = (index) => {
  const newPairs = [...props.beforeAfterPairs];
  if (newPairs[index]) {
       newPairs[index].after = null; // Устанавливаем в null, чтобы сервер знал, что нужно удалить
  }
  emit('update:beforeAfterPairs', newPairs);
};

// --- Методы для существующих пар ---
const removeExistingPair = (index) => {
  const newExistingPairs = [...props.existingBeforeAfterPairs];
  newExistingPairs.splice(index, 1);
  emit('update:existingBeforeAfterPairs', newExistingPairs);
};

const removeExistingBeforeImage = (pair) => {
  if (pair.beforeId) { // Предполагаем, что у существующей пары есть beforeId
     pair.beforeId = null; // Устанавливаем ID в null, чтобы сервер знал, что нужно удалить
  }
};

const removeExistingAfterImage = (pair) => {
  if (pair.afterId) { // Предполагаем, что у существующей пары есть afterId
     pair.afterId = null; // Устанавливаем ID в null, чтобы сервер знал, что нужно удалить
  }
};

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

  // --- Секция существующих пар ---
  .existing-pairs-section {
    margin-bottom: 2rem;

    h3 {
      font-size: 1.2rem;
      margin-bottom: 1rem;
      color: #374151;
      font-weight: 600;
    }

    .existing-pair-item {
      background: #f3f4f6;
      padding: 1.25rem;
      border-radius: 0.5rem;
      margin-bottom: 1rem;

      &:last-child {
        margin-bottom: 0;
      }

      .pair-info {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;

        span {
          font-weight: 600;
          color: #4b5563;
        }

        .btn-remove-pair {
          background: #ef4444;
          color: white;
          border: none;
          padding: 0.375rem 0.75rem;
          border-radius: 0.375rem;
          cursor: pointer;
          font-size: 0.875rem;
          transition: background 0.2s;

          &:hover {
            background: #dc2626;
          }
        }
      }

      .existing-image-row {
        display: flex;
        gap: 1.5rem;
        margin-bottom: 1rem;

        @media (max-width: 768px) {
          flex-direction: column;
        }

        .existing-image-container {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 0.5rem;

          label {
            font-weight: 600;
            color: #4b5563;
            font-size: 0.95rem;
          }

          img {
            max-width: 200px;
            max-height: 200px;
            object-fit: cover;
            border-radius: 0.5rem;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }

          button {
            background: #ef4444;
            color: white;
            border: none;
            padding: 0.375rem 0.75rem;
            border-radius: 0.375rem;
            cursor: pointer;
            font-size: 0.875rem;
            transition: background 0.2s;

            &:hover {
              background: #dc2626;
            }
          }
        }
      }

      .form-group {
        margin-bottom: 0;

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
          cursor: not-allowed; // readOnly

          &:focus {
            outline: none;
            border-color: #3b82f6;
            box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
          }
        }
      }
    }
  }

  // --- Секция новых пар ---
  .new-pairs-section {
    h3 {
      font-size: 1.2rem;
      margin-bottom: 1rem;
      color: #374151;
      font-weight: 600;
    }

    .pair-item {
      background: #f3f4f6;
      padding: 1.25rem;
      border-radius: 0.5rem;
      margin-bottom: 1rem;

      &:last-child {
        margin-bottom: 0;
      }

      .image-upload-row {
        display: flex;
        gap: 1.5rem;
        margin-bottom: 1rem;

        @media (max-width: 768px) {
          flex-direction: column;
        }

        .upload-column {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;

          label {
            font-weight: 600;
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

          button {
            background: #ef4444;
            color: white;
            border: none;
            padding: 0.375rem 0.75rem;
            border-radius: 0.375rem;
            cursor: pointer;
            font-size: 0.875rem;
            transition: background 0.2s;

            &:hover {
              background: #dc2626;
            }
          }

          div { // Отображение имени файла
            font-size: 0.875rem;
            color: #374151;
            background: #e5e7eb;
            padding: 0.5rem;
            border-radius: 0.375rem;
            word-break: break-all;
          }
        }
      }

      .form-group {
        margin-bottom: 1rem;

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
      }

      .btn-remove-pair {
        background: #ef4444;
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 0.5rem;
        cursor: pointer;
        font-size: 0.875rem;
        transition: background 0.2s;

        &:hover {
          background: #dc2626;
        }
      }
    }

    .btn-add-pair {
      background: #3b82f6;
      color: white;
      border: none;
      padding: 0.75rem 1rem;
      border-radius: 0.5rem;
      cursor: pointer;
      font-weight: 600;
      font-size: 0.95rem;
      transition: background 0.2s;

      &:hover {
        background: #2563eb;
      }
    }
  }
}
</style>
<template>
  <div class="works-and-stats-section">
    <h2>Виды работ и характеристики</h2>
    <p class="section-description">
      Укажите виды выполненных работ и основные характеристики проекта.
    </p>

    <!-- Виды работ -->
    <div class="form-group">
      <label>Виды работ</label>
      <div
        v-for="(work, index) in works"
        :key="index"
        class="work-item"
      >
        <div class="work-type-selector">
          <select
            :value="work.workType"
            @change="onWorkTypeSelect($event, index)"
            class="work-type-select"
            required
          >
            <option value="" disabled selected>— Выберите вид работ —</option>
            <optgroup label="Популярные виды работ">
              <option
                v-for="type in workTypesEnum"
                :key="type"
                :value="type"
              >
                {{ type }}
              </option>
            </optgroup>
            <option value="__custom">+ Другое (ввести вручную)</option>
          </select>

          <!-- Поле для ручного ввода вида работы -->
          <input
            v-if="work.customInput"
            v-model="work.workType"
            type="text"
            placeholder="Введите вид работы"
            class="custom-work-input"
            required
          />
        </div>

        <!-- Прогресс выполнения -->
        <div class="progress-input">
          <label>Выполнено</label>
          <input
            v-model.number="work.progress"
            type="number"
            min="0"
            max="100"
            placeholder="%"
            required
          />
        </div>

        <!-- Кнопка удаления работы -->
        <button
          v-if="works.length > 1"
          type="button"
          @click="removeWork(index)"
          class="btn danger"
        >
          Удалить
        </button>
      </div>

      <!-- Кнопка добавления новой работы -->
      <button
        type="button"
        @click="addWork"
        class="btn secondary"
      >
        + Добавить работу
      </button>
    </div>

    <!-- Характеристики проекта -->
    <div class="form-row">
      <div class="form-group">
        <label for="space">Площадь (м²)</label>
        <input
          id="space"
          v-model.number="space"
          type="number"
          min="0"
          placeholder="Например: 120"
          required
        />
      </div>

      <div class="form-group">
        <label for="duration">Срок выполнения</label>
        <input
          id="duration"
          v-model="duration"
          type="text"
          placeholder="Например: 3 мес."
          required
        />
        <small>Обязательно добавлять - "мес." или "дней"</small>
      </div>

      <div class="form-group">
        <label for="people">Количество людей</label>
        <input
          id="people"
          v-model="people"
          type="text"
          placeholder="Например: 25 чел."
          required
        />
        <small>Обязательно добавлять - "чел." или "бригад"</small>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

// Определение пропсов
const props = defineProps({
  works: {
    type: Array,
    default: () => []
  },
  space: { type: [Number, String], default: 0 },
  duration: { type: String, default: '' },
  people: { type: String, default: '' }
})

// Определение событий
const emit = defineEmits(['update:works', 'update:space', 'update:duration', 'update:people'])

// Реактивные геттеры и сеттеры
const works = computed({
  get: () => props.works,
  set: (value) => {
    emit('update:works', value)
  }
})

const space = computed({
  get: () => props.space,
  set: (value) => {
    emit('update:space', value)
  }
})

const duration = computed({
  get: () => props.duration,
  set: (value) => {
    emit('update:duration', value)
  }
})

const people = computed({
  get: () => props.people,
  set: (value) => {
    emit('update:people', value)
  }
})

// Список типов работ из enum
const workTypesEnum = [
  'Демонтаж',
  'Перегородки ГКЛ',
  'Перегородки',
  'Плитка',
  'Электромонтаж',
  'Стяжка',
  'Поддоконники',
  'Кладочные работы',
  'Бетонные работы',
  'Отделочные работы',
  'Черновые работы',
  'Покраска',
  'Штукатурка',
  'Шпаклёвка',
  'Кровля',
  'Фасадные работы',
  'Утепление',
  'Гидроизоляция',
  'Сантехника',
  'Полы',
  'Окна',
  'Двери',
  'Потолки',
  'Сверочные работы',
  'Покрытие полов',
  'Монтаж металлоконструкций',
  'Террасная доска'
]

// Добавление новой работы
const addWork = () => {
  const newWorks = [...props.works]
  newWorks.push({
    workType: '',
    progress: 100,
    customInput: false
  })
  emit('update:works', newWorks)
}

// Удаление работы
const removeWork = (index) => {
  const newWorks = [...props.works]
  newWorks.splice(index, 1)
  emit('update:works', newWorks)
}

// Обработчик выбора типа работы
const onWorkTypeSelect = (event, index) => {
  const value = event.target.value
  const newWorks = [...props.works]

  if (value === '__custom') {
    // Переключаем в режим ручного ввода
    newWorks[index].workType = ''
    newWorks[index].customInput = true
  } else {
    // Выбрали из списка
    newWorks[index].workType = value
    newWorks[index].customInput = false

    // Добавляем выбранный тип в enum, если его ещё нет
    if (!workTypesEnum.includes(value)) {
      workTypesEnum.push(value)
    }
  }

  emit('update:works', newWorks)
}
</script>

<style lang="scss" scoped>
.works-and-stats-section {
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
    input[type="number"] {
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
    }
  }

  // Виды работ
  .work-item {
    background: #f3f4f6;
    padding: 1rem;
    border-radius: 0.5rem;
    margin-bottom: 1rem;
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    align-items: start;

    &:last-child {
      margin-bottom: 0;
    }

    .work-type-selector {
      flex: 1 1 100%;
      min-width: 300px;

      .work-type-select {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #d1d5db;
        border-radius: 0.5rem;
        font-size: 1rem;
        background-color: white;
        cursor: pointer;
        transition: border-color 0.2s;

        &:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
        }
      }

      .custom-work-input {
        margin-top: 0.5rem;
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #d1d5db;
        border-radius: 0.5rem;
        font-size: 1rem;
        background-color: #f9fafb;
        transition: border-color 0.2s;

        &:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
        }
      }
    }

    .progress-input {
      flex: 0 0 auto;
      display: flex;
      flex-direction: column;
      min-width: 140px;

      label {
        font-weight: 600;
        font-size: 0.875rem;
        margin-bottom: 0.25rem;
        color: #4b5563;
      }

      input {
        text-align: center;
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
      align-self: flex-end;

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
  }

  // Кнопка добавления работы
  .btn.secondary {
    padding: 0.75rem 1rem;
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
    font-weight: 600;
    font-size: 0.95rem;
    background-color: #f3f4f6;
    color: #374151;
    border: 1px solid #d1d5db;
    transition: all 0.2s;

    &:hover {
      background-color: #e5e7eb;
    }
  }

  // Характеристики
  .form-row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1.5rem;

    @media (max-width: 768px) {
      grid-template-columns: 1fr;
    }
  }
}
</style>
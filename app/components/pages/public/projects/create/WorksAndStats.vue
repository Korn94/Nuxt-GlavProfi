<template>
  <div class="works-and-stats-section">
    <h2>Виды работ и характеристики</h2>
    <p class="section-description">
      Укажите виды выполненных работ и основные характеристики проекта.
    </p>

    <div class="form-group">
      <label>Виды работ</label>
      <div v-for="(work, index) in works" :key="index" class="work-item">
        <input v-model="works[index].workType" type="text" placeholder="Например: Плитка, Армстронг..."
          @input="emitWorks" />
        <input v-model="works[index].value" type="text" placeholder="Например: 200 м², 10 м.п." @input="emitWorks" />
        <button v-if="works.length > 1" type="button" @click="removeWork(index)" class="btn danger">
          Удалить
        </button>
      </div>

      <button type="button" @click="addWork" class="btn secondary">
        + Добавить работу
      </button>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label for="space">Площадь (м²)</label>
        <input id="space" v-model.number="space" type="number" min="0" placeholder="Например: 120" required />
      </div>
      <div class="form-group">
        <label for="duration">Срок выполнения</label>
        <input id="duration" v-model="duration" type="text" placeholder="Например: 3 мес." required />
        <small>Обязательно добавлять - "мес." или "дней"</small>
      </div>
      <div class="form-group">
        <label for="people">Количество людей</label>
        <input id="people" v-model="people" type="text" placeholder="Например: 25 чел." required />
        <small>Обязательно добавлять - "чел." или "бригад"</small>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  works: { type: Array, default: () => [] },
  space: { type: [Number, String], default: 0 },
  duration: { type: String, default: '' },
  people: { type: String, default: '' }
})

const emit = defineEmits(['update:works', 'update:space', 'update:duration', 'update:people'])

// Локальная копия works для редактирования
const localWorks = ref(props.works.map(w => ({ ...w })))

watch(() => props.works, (val) => {
  localWorks.value = val.map(w => ({ ...w }))
}, { deep: true })

const works = computed(() => localWorks.value)

const emitWorks = () => {
  emit('update:works', localWorks.value)
}

const addWork = () => {
  localWorks.value.push({ workType: '', value: '' })
  emitWorks()
}

const removeWork = (index) => {
  localWorks.value.splice(index, 1)
  emitWorks()
}

const space = computed({
  get: () => props.space,
  set: (val) => emit('update:space', val)
})

const duration = computed({
  get: () => props.duration,
  set: (val) => emit('update:duration', val)
})

const people = computed({
  get: () => props.people,
  set: (val) => emit('update:people', val)
})
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

    small {
      display: block;
      margin-top: 0.5rem;
      color: #6b7280;
      font-size: 0.875rem;
    }

    input[type="text"],
    input[type="number"] {
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

  .work-item {
    display: flex;
    gap: 1rem;
    align-items: center;
    margin-bottom: 0.75rem;

    input {
      flex: 1;
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

      &:last-of-type {
        flex: 0 0 150px;
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
    white-space: nowrap;

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
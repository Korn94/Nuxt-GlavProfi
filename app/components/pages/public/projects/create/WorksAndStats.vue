<!-- app/components/pages/public/projects/create/WorksAndStats.vue -->
<template>
  <div class="works-and-stats-section">
    <h2 class="section-title">Виды работ и характеристики</h2>
    <p class="section-description">
      Укажите виды выполненных работ и основные характеристики проекта.
    </p>

    <!-- Список работ -->
    <div class="works-list-section">
      <div class="works-list__header">
        <label class="works-list__label">Виды работ</label>
        <button type="button" class="crm-btn crm-btn--outline crm-btn--mini" @click="addWork">
          <Icon name="mdi:plus" size="12" />
          Добавить
        </button>
      </div>

      <div v-if="works.length === 0" class="works-empty">
        <Icon name="mdi:tools" size="16" />
        <span>Нет добавленных работ</span>
      </div>

      <div v-else class="works-list">
        <div v-for="(work, index) in works" :key="index" class="work-card">
          <div class="work-card__inputs">
            <input 
              v-model="work.workType" 
              type="text" 
              class="form-input"
              placeholder="Вид работы"
              @input="emitWorks"
            />
            <input 
              v-model="work.value" 
              type="text" 
              class="form-input"
              placeholder="Объём / Ед. изм."
              @input="emitWorks"
            />
          </div>
          <button 
            v-if="works.length > 1" 
            type="button" 
            class="crm-btn crm-btn--mini crm-btn--danger"
            @click="removeWork(index)"
            title="Удалить"
          >
            <Icon name="mdi:trash-can-outline" size="12" />
          </button>
        </div>
      </div>
    </div>

    <!-- Характеристики: сетка 3 колонки -->
    <div class="stats-grid">
      <!-- Площадь -->
      <div class="stat-field">
        <label for="space" class="form-label">
          Площадь
          <span class="required-mark">*</span>
        </label>
        <div class="input-with-suffix">
          <input 
            id="space" 
            v-model.number="space" 
            type="number" 
            min="0" 
            class="form-input"
            placeholder="120" 
            required 
          />
          <span class="input-suffix">м²</span>
        </div>
        <small class="field-hint">Общая площадь объекта</small>
      </div>

      <!-- Срок -->
      <div class="stat-field">
        <label for="duration" class="form-label">
          Срок выполнения
          <span class="required-mark">*</span>
        </label>
        <input 
          id="duration" 
          v-model="duration" 
          type="text" 
          class="form-input"
          placeholder="3 мес." 
          required 
        />
        <small class="field-hint">Указывайте с единицами: "мес.", "дней"</small>
      </div>

      <!-- Люди -->
      <div class="stat-field">
        <label for="people" class="form-label">
          Количество людей
          <span class="required-mark">*</span>
        </label>
        <input 
          id="people" 
          v-model="people" 
          type="text" 
          class="form-input"
          placeholder="25 чел." 
          required 
        />
        <small class="field-hint">Указывайте с единицами: "чел.", "бригад"</small>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

// ── Пропсы и события ─────────────────────────────────────────────
const props = defineProps({
  works: { type: Array, default: () => [] },
  space: { type: [Number, String], default: 0 },
  duration: { type: String, default: '' },
  people: { type: String, default: '' }
})

const emit = defineEmits([
  'update:works', 
  'update:space', 
  'update:duration', 
  'update:people'
])

// ── Локальная копия works для редактирования ─────────────────────
const localWorks = ref(props.works.map(w => ({ ...w })))

watch(() => props.works, (val) => {
  localWorks.value = val.map(w => ({ ...w }))
}, { deep: true })

const works = computed({
  get: () => localWorks.value,
  set: (value) => {
    localWorks.value = value
    emitWorks()
  }
})

const emitWorks = () => {
  emit('update:works', localWorks.value.map(w => ({
    workType: w.workType?.trim() || '',
    value: w.value?.trim() || ''
  })))
}

const addWork = () => {
  localWorks.value.push({ workType: '', value: '' })
  emitWorks()
}

const removeWork = (index) => {
  localWorks.value.splice(index, 1)
  emitWorks()
}

// ── Вычисляемые свойства для характеристик ───────────────────────
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

// ── Секция списка работ ─────────────────────────────────────────
.works-list-section {
  padding: 12px 0;
  border-bottom: 1px solid var(--crm-border);
  margin-bottom: 16px;
}

.works-list__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.works-list__label {
  font-size: var(--crm-text-xs);
  font-weight: 500;
  color: var(--crm-text-secondary);
}

.works-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 16px;
  background: var(--crm-bg-elevated);
  border: 1px dashed var(--crm-border);
  border-radius: var(--crm-radius-sm);
  color: var(--crm-text-disabled);
  font-size: var(--crm-text-xs);
}

.works-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

// ── Карточка работы ─────────────────────────────────────────────
.work-card {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: var(--crm-bg-elevated);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-sm);
}

.work-card__inputs {
  display: flex;
  gap: 8px;
  flex: 1;
}

// ── Поля формы ──────────────────────────────────────────────────
.form-input {
  flex: 1;
  padding: 6px 10px;
  background: var(--crm-bg-base);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-xs);
  color: var(--crm-text-primary);
  font-size: var(--crm-text-xs);
  font-family: var(--crm-font-sans);
  transition: var(--crm-transition);

  &::placeholder {
    color: var(--crm-text-disabled);
  }

  &:focus {
    outline: none;
    border-color: var(--crm-accent);
    box-shadow: 0 0 0 2px var(--crm-accent-dim);
  }
}

// ── Поле с суффиксом (м²) ───────────────────────────────────────
.input-with-suffix {
  position: relative;
  display: flex;
  align-items: center;
}

.input-suffix {
  position: absolute;
  right: 40px;
  font-size: var(--crm-text-xs);
  color: var(--crm-text-muted);
  font-weight: 500;
  pointer-events: none;
  background: var(--crm-bg-base);
  padding-left: 4px;
}

// ── Сетка характеристик ─────────────────────────────────────────
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;

  @media (max-width: 992px) {
    grid-template-columns: 1fr 1fr;
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.stat-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.form-label {
  font-size: var(--crm-text-xs);
  font-weight: 500;
  color: var(--crm-text-secondary);
  display: flex;
  align-items: center;
  gap: 4px;
}

.required-mark {
  color: var(--crm-danger);
  font-weight: 600;
}

.field-hint {
  font-size: 10px;
  color: var(--crm-text-disabled);
  line-height: 1.3;
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

    &:hover {
      background: var(--crm-accent-dim);
    }
  }

  &--mini {
    padding: 4px;
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
  .works-and-stats-section {
    padding: 12px 14px;
  }

  .work-card__inputs {
    flex-direction: column;
  }

  .stats-grid {
    gap: 10px;
  }

  .form-input {
    padding: 6px 8px;
    font-size: 10px;
  }
}
</style>

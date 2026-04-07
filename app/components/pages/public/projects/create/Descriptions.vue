<!-- app/components/pages/public/projects/create/Descriptions.vue -->
<template>
  <div class="descriptions-section">
    <h2 class="section-title">Описания и результат</h2>
    <p class="section-description">
      Заполните текстовые описания проекта. Поля с <span class="required-mark">*</span> обязательны.
    </p>

    <!-- Описание объекта -->
    <div class="form-field">
      <label for="objectDescription" class="form-label">
        Описание объекта
        <small class="form-hint">Будет отображаться после заголовка кейса</small>
      </label>
      <textarea
        id="objectDescription"
        v-model="objectDescription"
        class="form-textarea"
        placeholder="это современное фитнес-пространство с панорамными окнами и авторским дизайном..."
        rows="3"
      />
      <div class="field-footer">
        <small class="field-hint">Рекомендуемая длина: 100–300 символов</small>
        <span class="char-count">{{ objectDescription.length }}</span>
      </div>
    </div>

    <!-- Краткое описание (для карточки) -->
    <div class="form-field">
      <label for="shortObject" class="form-label">
        Краткое описание
        <span class="required-mark">*</span>
        <small class="form-hint">Для превью в карточке проекта</small>
      </label>
      <textarea
        id="shortObject"
        v-model="shortObject"
        class="form-textarea form-textarea--compact"
        placeholder="Федеральная сеть фитнес-клубов DDX Fitness"
        rows="2"
        required
      />
      <div class="field-footer">
        <small class="field-hint">Максимум 150 символов</small>
        <span class="char-count" :class="{ 'char-count--warning': shortObject.length > 150 }">
          {{ shortObject.length }}/150
        </span>
      </div>
    </div>

    <!-- Краткое описание для страницы кейса (ОБЯЗАТЕЛЬНОЕ) -->
    <div class="form-field">
      <label for="shortDescription" class="form-label">
        Описание для страницы кейса
        <span class="required-mark">*</span>
        <small class="form-hint">Будет использоваться в мета-тегах и превью</small>
      </label>
      <textarea
        id="shortDescription"
        v-model="shortDescription"
        class="form-textarea"
        placeholder="Торговый центр «Галерея» — современный шопинг-молл в центре Рязани..."
        rows="3"
        required
      />
      <div class="field-footer">
        <small class="field-hint">Оптимально для SEO: 150–160 символов</small>
        <span class="char-count" :class="{ 'char-count--warning': shortDescription.length > 160 }">
          {{ shortDescription.length }}/160
        </span>
      </div>
    </div>

    <!-- Полное описание -->
    <div class="form-field">
      <label for="fullDescription" class="form-label">
        Полное описание
        <small class="form-hint">Подробности проекта, этапы работ, материалы</small>
      </label>
      <textarea
        id="fullDescription"
        v-model="fullDescription"
        class="form-textarea"
        placeholder="Подробное описание хода работ, использованных материалов, технических решений и особенностей проекта. Можно использовать абзацы и списки."
        rows="5"
      />
      <div class="field-footer">
        <small class="field-hint">Поддерживается перенос строк</small>
        <span class="char-count">{{ fullDescription.length }}</span>
      </div>
    </div>

    <!-- Результат -->
    <div class="form-field">
      <label for="result" class="form-label">
        Результат
        <small class="form-hint">Что было достигнуто, преимущества для клиента</small>
      </label>
      <textarea
        id="result"
        v-model="result"
        class="form-textarea"
        placeholder="Объект сдан в срок, клиент доволен качеством работ. Были применены энергоэффективные решения, что снизило эксплуатационные расходы на 15%."
        rows="3"
      />
      <div class="field-footer">
        <small class="field-hint">Акцент на выгодах и итогах</small>
        <span class="char-count">{{ result.length }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

// ── Пропсы и события ─────────────────────────────────────────────
const props = defineProps({
  objectDescription: { type: String, default: '' },
  shortObject: { type: String, default: '' },
  shortDescription: { type: String, default: '' },
  fullDescription: { type: String, default: '' },
  result: { type: String, default: '' }
})

const emit = defineEmits([
  'update:objectDescription',
  'update:shortObject',
  'update:shortDescription',
  'update:fullDescription',
  'update:result'
])

// ── Реактивные геттеры/сеттеры ───────────────────────────────────
const objectDescription = computed({
  get: () => props.objectDescription,
  set: (value) => emit('update:objectDescription', value)
})

const shortObject = computed({
  get: () => props.shortObject,
  set: (value) => emit('update:shortObject', value)
})

const shortDescription = computed({
  get: () => props.shortDescription,
  set: (value) => emit('update:shortDescription', value)
})

const fullDescription = computed({
  get: () => props.fullDescription,
  set: (value) => emit('update:fullDescription', value)
})

const result = computed({
  get: () => props.result,
  set: (value) => emit('update:result', value)
})
</script>

<style lang="scss" scoped>
.descriptions-section {
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

  .required-mark {
    color: var(--crm-danger);
    font-weight: 600;
  }
}

// ── Поля формы ──────────────────────────────────────────────────
.form-field {
  padding: 12px 0;
  border-bottom: 1px solid var(--crm-border);
  
  &:last-child {
    border-bottom: none;
  }
}

.form-label {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 8px;
  
  font-size: var(--crm-text-xs);
  font-weight: 500;
  color: var(--crm-text-secondary);
}

.required-mark {
  color: var(--crm-danger);
  font-weight: 600;
  margin-left: 2px;
}

.form-hint {
  font-size: 10px;
  color: var(--crm-text-disabled);
  font-weight: 400;
  margin-left: 0;
}

// ── Текстовые поля ──────────────────────────────────────────────
.form-textarea {
  width: 100%;
  padding: 8px 12px;
  background: var(--crm-bg-elevated);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-md);
  color: var(--crm-text-primary);
  font-size: var(--crm-text-sm);
  font-family: var(--crm-font-sans);
  line-height: 1.4;
  resize: vertical;
  transition: var(--crm-transition);

  &::placeholder {
    color: var(--crm-text-disabled);
  }

  &:focus {
    outline: none;
    border-color: var(--crm-accent);
    box-shadow: 0 0 0 3px var(--crm-accent-dim);
  }

  &--compact {
    min-height: 60px;
    max-height: 100px;
  }
}

// ── Футер поля ──────────────────────────────────────────────────
.field-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 6px;
  gap: 10px;
}

.field-hint {
  font-size: 10px;
  color: var(--crm-text-disabled);
  flex: 1;
}

.char-count {
  font-size: 10px;
  color: var(--crm-text-muted);
  font-family: var(--crm-font-mono);
  background: var(--crm-bg-overlay);
  padding: 1px 6px;
  border-radius: 6px;
  font-weight: 500;
  white-space: nowrap;

  &--warning {
    color: var(--crm-warning);
    background: var(--crm-warning-dim);
  }
}

// ── Адаптив ─────────────────────────────────────────────────────
@media (max-width: 767.98px) {
  .descriptions-section {
    padding: 12px 14px;
  }
  
  .form-textarea {
    font-size: var(--crm-text-xs);
    padding: 7px 10px;
  }
  
  .field-footer {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}
</style>

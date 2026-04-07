<!-- app/components/pages/public/projects/create/Seo.vue -->
<template>
  <div class="seo-section">
    <h2 class="section-title">SEO-настройки</h2>
    <p class="section-description">
      Настройте мета-теги для улучшения поисковой оптимизации страницы кейса.
    </p>

    <!-- Preview сниппета (визуализация) -->
    <div class="snippet-preview">
      <div class="snippet-preview__title">
        {{ metaTitlePreview || 'Заголовок страницы будет здесь...' }}
      </div>
      <div class="snippet-preview__url">
        <Icon name="mdi:web" size="12" />
        <span>glavprofi.ru/projects/{{ slugPreview || 'slug' }}</span>
      </div>
      <div class="snippet-preview__description">
        {{ metaDescriptionPreview || 'Описание страницы будет отображаться здесь в результатах поиска...' }}
      </div>
    </div>

    <!-- Meta Title -->
    <div class="form-field">
      <label for="metaTitle" class="form-label">
        Meta Title
        <small class="form-hint">Заголовок вкладки браузера и сниппета</small>
      </label>
      <input
        id="metaTitle"
        v-model="metaTitle"
        type="text"
        class="form-input"
        placeholder="Ремонт кафе в Рязани под ключ | ГлавПрофи"
      />
      <div class="field-footer">
        <small class="field-hint">Оптимально: 50–60 символов</small>
        <div class="char-progress">
          <div 
            class="char-progress__bar" 
            :style="{ width: Math.min(metaTitle.length / 60 * 100, 100) + '%' }"
            :class="getCharProgressClass(metaTitle.length, 60)"
          />
          <span class="char-progress__text" :class="getCharProgressClass(metaTitle.length, 60)">
            {{ metaTitle.length }}/60
          </span>
        </div>
      </div>
    </div>

    <!-- Meta Description -->
    <div class="form-field">
      <label for="metaDescription" class="form-label">
        Meta Description
        <small class="form-hint">Описание для сниппета в поиске</small>
      </label>
      <textarea
        id="metaDescription"
        v-model="metaDescription"
        class="form-textarea"
        placeholder="Профессиональный ремонт кафе и ресторанов в Рязани. Дизайн-проект, строительство, отделка под ключ. Гарантия 3 года. Закажите расчёт стоимости!"
        rows="3"
      />
      <div class="field-footer">
        <small class="field-hint">Оптимально: 120–160 символов</small>
        <div class="char-progress">
          <div 
            class="char-progress__bar" 
            :style="{ width: Math.min(metaDescription.length / 160 * 100, 100) + '%' }"
            :class="getCharProgressClass(metaDescription.length, 160, 120)"
          />
          <span class="char-progress__text" :class="getCharProgressClass(metaDescription.length, 160, 120)">
            {{ metaDescription.length }}/160
          </span>
        </div>
      </div>
    </div>

    <!-- Meta Keywords -->
    <div class="form-field">
      <label for="metaKeywords" class="form-label">
        Meta Keywords
        <small class="form-hint">Ключевые слова через запятую</small>
      </label>
      <input
        id="metaKeywords"
        v-model="metaKeywords"
        type="text"
        class="form-input"
        placeholder="ремонт кафе, дизайн интерьера, строительство, Рязань"
      />
      <div class="field-footer">
        <small class="field-hint">
          <Icon name="mdi:information-outline" size="10" />
          Не влияет напрямую на ранжирование, но полезно для аналитики
        </small>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

// ── Пропсы и события ─────────────────────────────────────────────
const props = defineProps({
  metaTitle: { type: String, default: '' },
  metaDescription: { type: String, default: '' },
  metaKeywords: { type: String, default: '' }
})

const emit = defineEmits([
  'update:metaTitle', 
  'update:metaDescription', 
  'update:metaKeywords'
])

// ── Реактивные геттеры/сеттеры ───────────────────────────────────
const metaTitle = computed({
  get: () => props.metaTitle,
  set: (value) => emit('update:metaTitle', value)
})

const metaDescription = computed({
  get: () => props.metaDescription,
  set: (value) => emit('update:metaDescription', value)
})

const metaKeywords = computed({
  get: () => props.metaKeywords,
  set: (value) => emit('update:metaKeywords', value)
})

// ── Превью для сниппета (обрезаем для наглядности) ───────────────
const metaTitlePreview = computed(() => {
  const title = metaTitle.value.trim()
  return title.length > 60 ? title.slice(0, 57) + '...' : title || null
})

const metaDescriptionPreview = computed(() => {
  const desc = metaDescription.value.trim()
  return desc.length > 160 ? desc.slice(0, 157) + '...' : desc || null
})

const slugPreview = computed(() => {
  // Берём из пути или оставляем заглушку
  return typeof window !== 'undefined' 
    ? window.location.pathname.split('/').pop()?.replace('-edit', '') 
    : null
})

// ── Классы для прогресс-бара символов ────────────────────────────
const getCharProgressClass = (length, max, min = 0) => {
  if (length === 0) return ''
  if (min > 0 && length < min) return 'char-progress__text--short'
  if (length > max) return 'char-progress__text--over'
  if (length > max * 0.9) return 'char-progress__text--warning'
  return 'char-progress__text--ok'
}
</script>

<style lang="scss" scoped>
.seo-section {
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

// ── Превью сниппета ─────────────────────────────────────────────
.snippet-preview {
  margin: 0 0 20px 0;
  padding: 12px;
  background: var(--crm-bg-base);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-sm);
  font-family: Arial, sans-serif; // Как в поиске
}

.snippet-preview__title {
  font-size: 18px;
  font-weight: 400;
  color: #1a0dab; // Цвет заголовка в Google
  margin: 0 0 4px 0;
  line-height: 1.3;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
}

.snippet-preview__url {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #006621; // Цвет URL в Google
  margin: 0 0 6px 0;
}

.snippet-preview__description {
  font-size: 13px;
  color: #4d5156; // Цвет описания в Google
  line-height: 1.4;
  margin: 0;
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

.form-hint {
  font-size: 10px;
  color: var(--crm-text-disabled);
  font-weight: 400;
}

// ── Инпуты и текстареа ──────────────────────────────────────────
.form-input,
.form-textarea {
  width: 100%;
  padding: 8px 12px;
  background: var(--crm-bg-elevated);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-md);
  color: var(--crm-text-primary);
  font-size: var(--crm-text-sm);
  font-family: var(--crm-font-sans);
  transition: var(--crm-transition);

  &::placeholder {
    color: var(--crm-text-disabled);
  }

  &:focus {
    outline: none;
    border-color: var(--crm-accent);
    box-shadow: 0 0 0 3px var(--crm-accent-dim);
  }
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
  line-height: 1.4;
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
  display: flex;
  align-items: center;
  gap: 3px;
  flex: 1;
}

// ── Прогресс-бар символов ───────────────────────────────────────
.char-progress {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 100px;
}

.char-progress__bar {
  flex: 1;
  height: 4px;
  background: var(--crm-bg-overlay);
  border-radius: 2px;
  overflow: hidden;
  transition: width 0.2s ease, background 0.2s ease;

  &::after {
    content: '';
    display: block;
    height: 100%;
    background: var(--crm-success);
    transition: background 0.2s ease;
  }

  // Цвета в зависимости от состояния
  &.char-progress__bar--short::after { background: var(--crm-text-muted); }
  &.char-progress__bar--ok::after { background: var(--crm-success); }
  &.char-progress__bar--warning::after { background: var(--crm-warning); }
  &.char-progress__bar--over::after { background: var(--crm-danger); }
}

.char-progress__text {
  font-size: 10px;
  font-family: var(--crm-font-mono);
  font-weight: 500;
  white-space: nowrap;

  &--short { color: var(--crm-text-muted); }
  &--ok { color: var(--crm-success); }
  &--warning { color: var(--crm-warning); }
  &--over { color: var(--crm-danger); font-weight: 600; }
}

// ── Адаптив ─────────────────────────────────────────────────────
@media (max-width: 767.98px) {
  .seo-section {
    padding: 12px 14px;
  }
  
  .snippet-preview {
    padding: 10px;
  }
  
  .snippet-preview__title {
    font-size: 16px;
  }
  
  .field-footer {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
  
  .char-progress {
    width: 100%;
  }
}
</style>

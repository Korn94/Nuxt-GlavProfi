<!-- app/components/pages/public/projects/create/BasicInfo.vue -->
<template>
  <div class="basic-info-section">
    <h2 class="section-title">Основная информация</h2>
    
    <div class="form-grid">
      <!-- Название кейса -->
      <div class="form-field">
        <label for="title" class="form-label">
          Название кейса
          <span class="form-label__required">*</span>
        </label>
        <input
          id="title"
          v-model="title"
          type="text"
          class="form-input"
          placeholder="Введите название проекта"
          required
        />
      </div>

      <!-- Slug (URL) -->
      <div class="form-field">
        <label for="slug" class="form-label">Slug (URL)</label>
        <div class="slug-wrapper">
          <span class="slug-prefix">/projects/</span>
          <input
            id="slug"
            v-model="slug"
            type="text"
            class="form-input form-input--slug"
            placeholder="avtogeneriruyetsya"
            @input="slugTouched = true"
          />
        </div>
        <small class="form-hint">
          Используется в URL, должно быть уникальным. Разрешены латинские буквы, цифры, дефисы. 
          Например: <code>remont-cafe</code>
        </small>
      </div>

      <!-- Категория -->
      <div class="form-field">
        <label for="category" class="form-label">
          Категория
          <span class="form-label__required">*</span>
        </label>
        <select id="category" v-model="category" class="form-select" required>
          <option value="" disabled>Выберите категорию</option>
          <option v-for="cat in categories" :key="cat" :value="cat">
            {{ cat }}
          </option>
        </select>
      </div>

      <!-- Адрес объекта -->
      <div class="form-field form-field--full">
        <label for="address" class="form-label">
          Адрес объекта
          <span class="form-label__required">*</span>
        </label>
        <input
          id="address"
          v-model="address"
          type="text"
          class="form-input"
          placeholder="Введите адрес объекта, в том числе город"
          required
        />
        <small class="form-hint">Обязательное поле. Будет отображаться на странице кейса.</small>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

// Список категорий
const categories = [
  'Кафе',
  'Магазины',
  'Клиники',
  'Банки',
  'Фитнес',
  'Производственные',
  'Фасады и Кровля',
  'Прочее'
]

const slugTouched = ref(false)

// Определение пропсов
const props = defineProps({
  title: { type: String, default: '' },
  slug: { type: String, default: '' },
  category: { type: String, default: 'Кафе' },
  address: { type: String, default: '' }
})

// Определение событий
const emit = defineEmits(['update:title', 'update:slug', 'update:category', 'update:address'])

// Реактивные геттеры и сеттеры
const title = computed({
  get: () => props.title,
  set: (value) => {
    emit('update:title', value)
    if (!slugTouched.value) {
      const generatedSlug = transliterate(value)
        .toLowerCase()
        .trim()
        .replace(/[\s\W]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .replace(/-+/g, '-')
      emit('update:slug', generatedSlug)
    }
  }
})

const slug = computed({
  get: () => props.slug,
  set: (value) => {
    emit('update:slug', value)
  }
})

const category = computed({
  get: () => props.category,
  set: (value) => {
    emit('update:category', value)
  }
})

const address = computed({
  get: () => props.address,
  set: (value) => {
    emit('update:address', value)
  }
})

// Функция транслитерации кириллицы в латиницу
const transliterate = (text) => {
  const map = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'zh',
    з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o',
    п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts',
    ч: 'ch', ш: 'sh', щ: 'shch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
    А: 'A', Б: 'B', В: 'V', Г: 'G', Д: 'D', Е: 'E', Ё: 'Yo', Ж: 'Zh',
    З: 'Z', И: 'I', Й: 'Y', К: 'K', Л: 'L', М: 'M', Н: 'N', О: 'O',
    П: 'P', Р: 'R', С: 'S', Т: 'T', У: 'U', Ф: 'F', Х: 'H', Ц: 'Ts',
    Ч: 'Ch', Ш: 'Sh', Щ: 'Shch', Ъ: '', Ы: 'Y', Ь: '', Э: 'E', Ю: 'Yu', Я: 'Ya'
  }
  return text
    .split('')
    .map(char => map[char] || char)
    .join('')
}
</script>

<style lang="scss" scoped>
.basic-info-section {
  background: var(--crm-bg-surface);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-lg);
  padding: 20px 24px;
}

.section-title {
  font-size: var(--crm-text-lg);
  font-weight: 600;
  color: var(--crm-text-primary);
  margin: 0 0 20px 0;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--crm-border);
}

// ── Сетка формы ─────────────────────────────────────────────────
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px 20px;

  @media (max-width: 767.98px) {
    grid-template-columns: 1fr;
  }
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;

  &--full {
    grid-column: 1 / -1;
  }
}

// ── Лейблы ──────────────────────────────────────────────────────
.form-label {
  font-size: var(--crm-text-sm);
  font-weight: 500;
  color: var(--crm-text-secondary);
  display: flex;
  align-items: center;
  gap: 4px;

  &__required {
    color: var(--crm-danger);
    font-weight: 600;
  }
}

// ── Инпуты и селекты ────────────────────────────────────────────
.form-input,
.form-select {
  width: 100%;
  padding: 8px 12px;
  background: var(--crm-bg-elevated);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-md);
  color: var(--crm-text-primary);
  font-size: var(--crm-text-base);
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

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    background: var(--crm-bg-overlay);
  }
}

.form-select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%239aa0b8' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 32px;
}

// ── Slug с префиксом ────────────────────────────────────────────
.slug-wrapper {
  display: flex;
  align-items: center;
  gap: 0;
  background: var(--crm-bg-elevated);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-md);
  overflow: hidden;
  transition: var(--crm-transition);

  &:has(.form-input--slug:focus) {
    border-color: var(--crm-accent);
    box-shadow: 0 0 0 3px var(--crm-accent-dim);
  }
}

.slug-prefix {
  padding: 8px 12px;
  background: var(--crm-bg-overlay);
  border-right: 1px solid var(--crm-border);
  color: var(--crm-text-muted);
  font-size: var(--crm-text-sm);
  font-family: var(--crm-font-mono);
  white-space: nowrap;
  user-select: none;
}

.form-input--slug {
  border: none;
  border-radius: 0;
  background: transparent;

  &:focus {
    box-shadow: none;
  }
}

// ── Подсказки ───────────────────────────────────────────────────
.form-hint {
  font-size: var(--crm-text-xs);
  color: var(--crm-text-muted);
  line-height: 1.4;

  code {
    background: var(--crm-bg-overlay);
    padding: 1px 5px;
    border-radius: 3px;
    font-family: var(--crm-font-mono);
    font-size: 0.95em;
    color: var(--crm-text-secondary);
  }
}

// ── Адаптив ─────────────────────────────────────────────────────
@media (max-width: 767.98px) {
  .basic-info-section {
    padding: 16px;
  }

  .form-grid {
    gap: 14px;
  }

  .form-input,
  .form-select {
    padding: 7px 10px;
    font-size: var(--crm-text-sm);
  }
}
</style>

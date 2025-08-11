<template>
  <div class="basic-info-section">
    <h2>Основная информация</h2>
    <div class="form-group">
      <label for="title">Название кейса</label>
      <input
        id="title"
        v-model="title"
        type="text"
        placeholder="Введите название проекта"
        required
      />
    </div>

    <div class="form-group">
      <label for="slug">Slug (URL)</label>
      <input
        id="slug"
        v-model="slug"
        type="text"
        placeholder="Автогенерируется из названия"
        @input="slugTouched = true"
      />
      <small>Используется в URL, должно быть уникальным. Разрешены латинские буквы, цифры, дефисы. Например - <span>remont-cafe</span></small>
    </div>

    <div class="form-group">
      <label for="category">Категория</label>
      <select id="category" v-model="category" required>
        <option v-for="cat in categories" :key="cat" :value="cat">
          {{ cat }}
        </option>
      </select>
    </div>

    <div class="form-group">
      <label for="address">Адрес объекта</label>
      <input
        id="address"
        v-model="address"
        type="text"
        placeholder="Введите адрес объекта, в том числе город"
        required
      />
      <small>Обязательное поле. Будет отображаться на странице кейса.</small>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'

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
      const transliterated = transliterate(value)
      const generatedSlug = transliterated
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

// Обработчик ручного ввода slug
const onSlugInput = (event) => {
  const value = event.target.value
  emit('update:slug', value)
}
</script>

<style lang="scss" scoped>
.basic-info-section {
  background: #ffffff;
  padding: 1.5rem;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 1.5rem;

  h2 {
    font-size: 1.5rem;
    margin-bottom: 1.5rem;
    color: #1f2937;
    font-weight: 600;
  }

  .form-group {
    margin-bottom: 1.25rem;

    label {
      display: block;
      font-weight: 600;
      margin-bottom: 0.5rem;
      color: #4b5563;
    }

    input,
    select {
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

    small {
      display: block;
      margin-top: 0.5rem;
      color: #6b7280;
      font-size: 0.875rem;
    }
  }
}
</style>
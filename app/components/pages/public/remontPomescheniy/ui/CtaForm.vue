<!-- app/components/pages/public/remontPomescheniy/pageTypes/ui/CtaForm.vue -->
<template>
  <form class="cta-form" novalidate @submit.prevent="handleSubmit">
    <!-- ==================== ИМЯ ==================== -->
    <div class="form-field">
      <label class="form-field__label" :for="`${idPrefix}-name`">
        Ваше имя
      </label>
      <input
        :id="`${idPrefix}-name`"
        v-model="form.name"
        type="text"
        class="form-field__input"
        :class="{ 'form-field__input--error': errors.name }"
        placeholder="Как к вам обращаться"
        autocomplete="name"
      />
      <span v-if="errors.name" class="form-field__error">{{ errors.name }}</span>
    </div>

    <!-- ==================== ТЕЛЕФОН ==================== -->
    <div class="form-field">
      <label class="form-field__label" :for="`${idPrefix}-contact`">
        Телефон <span class="form-field__required">*</span>
      </label>
      <input
        :id="`${idPrefix}-contact`"
        v-model="form.contact"
        v-phone-format
        type="tel"
        class="form-field__input"
        :class="{ 'form-field__input--error': errors.contact }"
        placeholder="+7 (___) ___-__-__"
        autocomplete="tel"
        @focus="ensurePrefix"
      />
      <span v-if="errors.contact" class="form-field__error">{{ errors.contact }}</span>
    </div>

    <!-- ==================== КАСТОМНЫЕ ПОЛЯ (ТАЙЛЫ) ==================== -->
    <div
      v-for="field in customFields"
      :key="field.name"
      class="form-field"
    >
      <label class="form-field__label">{{ field.label }}</label>
      <div class="custom-tiles">
        <button
          v-for="option in field.options"
          :key="option.value"
          type="button"
          class="custom-tile"
          :class="{ 'custom-tile--active': form[field.name] === option.value }"
          @click="form[field.name] = option.value"
        >
          <Icon :name="option.icon" size="18" />
          <span>{{ option.label }}</span>
        </button>
      </div>
    </div>

    <!-- ==================== ФАЙЛЫ ==================== -->
    <div v-if="showFileUpload" class="form-field form-field--file">
      <label class="form-field__label">
        Прикрепить файлы
        <span class="form-field__hint">(план, фото, ТЗ — до {{ maxFiles }} шт.)</span>
      </label>
      <label
        class="file-upload"
        :class="{ 'file-upload--disabled': form.files.length >= maxFiles }"
      >
        <input
          type="file"
          class="file-upload__input"
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.zip,.rar"
          multiple
          :disabled="form.files.length >= maxFiles"
          @change="handleFiles"
        />
        <div class="file-upload__content">
          <Icon name="mdi:cloud-upload-outline" size="22" />
          <span v-if="form.files.length === 0">
            Выберите файлы или перетащите сюда
          </span>
          <span v-else>
            Добавить ещё ({{ form.files.length }}/{{ maxFiles }})
          </span>
        </div>
      </label>

      <!-- Список прикреплённых файлов -->
      <ul v-if="form.files.length > 0" class="files-list">
        <li
          v-for="(file, index) in form.files"
          :key="index"
          class="files-list__item"
        >
          <Icon name="mdi:file-document-outline" size="18" class="files-list__icon" />
          <span class="files-list__name" :title="file.name">{{ file.name }}</span>
          <span class="files-list__size">
            {{ (file.size / 1024 / 1024).toFixed(2) }} МБ
          </span>
          <button
            type="button"
            class="files-list__remove"
            :aria-label="`Удалить ${file.name}`"
            @click.prevent="removeFile(Number(index))"
          >
            <Icon name="mdi:close-circle" size="18" />
          </button>
        </li>
      </ul>
      <span class="form-field__hint-small">
        PDF, DOC, JPG, PNG, ZIP — до {{ maxFileSizeMb }} МБ каждый, всего до {{ maxFiles }} файлов
      </span>
      <span v-if="filesError" class="form-field__error">{{ filesError }}</span>
    </div>

    <!-- ==================== СОГЛАСИЕ ==================== -->
    <label class="form-consent">
      <input v-model="form.consent" type="checkbox" class="form-consent__input" />
      <span class="form-consent__box">
        <Icon v-if="form.consent" name="mdi:check" size="14" />
      </span>
      <span class="form-consent__text">
        Согласен на обработку персональных данных
      </span>
    </label>

    <!-- ==================== КНОПКА ОТПРАВКИ ==================== -->
    <button
      type="submit"
      class="cta-form__submit"
      :disabled="status === 'submitting'"
    >
      <span v-if="status === 'submitting'" class="cta-form__submit-loader">
        <span class="spinner" />
        Отправляем...
      </span>
      <span v-else class="cta-form__submit-default">
        <Icon name="mdi:send" size="18" />
        <span>{{ submitText }}</span>
      </span>
    </button>

    <!-- ==================== СООБЩЕНИЕ ОБ ОШИБКЕ ==================== -->
    <p v-if="status === 'error'" class="cta-form__error">
      <Icon name="mdi:alert-circle" size="18" />
      Не удалось отправить. Попробуйте позже или свяжитесь напрямую.
    </p>
  </form>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'

// === Типы ===
interface CustomField {
  name: string
  label: string
  type: 'tiles'
  options: Array<{ value: string; label: string; icon: string }>
  required?: boolean
}

interface MessageConfig {
  emoji: string
  title: string
  sourceLabel: string
  fieldLabels?: Record<string, string>
}

type FormStatus = 'idle' | 'submitting' | 'success' | 'error'

interface FormErrors {
  name?: string
  contact?: string
  consent?: string
}

// === Пропсы ===
const props = withDefaults(
  defineProps<{
    customFields?: CustomField[]
    messageConfig?: MessageConfig
    submitUrl?: string
    submitText?: string
    showFileUpload?: boolean
    maxFileSizeMb?: number
    maxFiles?: number
    idPrefix?: string
  }>(),
  {
    customFields: () => [],
    submitUrl: '/api/send-message',
    submitText: 'Получить расчёт',
    showFileUpload: true,
    maxFileSizeMb: 10,
    maxFiles: 5,
    idPrefix: 'cta-form',
  }
)

// === Эмиты ===
const emit = defineEmits<{
  (e: 'success', data: unknown): void
  (e: 'error', err: unknown): void
}>()

// === Состояние формы ===
const createInitialState = () => {
  const state: Record<string, unknown> = {
    name: '',
    contact: '+7 ',
    files: [] as File[],
    consent: false,
  }
  // Динамически добавляем ключи для customFields
  props.customFields?.forEach((field) => {
    state[field.name] = ''
  })
  return state
}

const form = reactive<Record<string, any>>(createInitialState())
const errors = reactive<FormErrors>({})
const status = ref<FormStatus>('idle')
const filesError = ref<string | null>(null)

// Следим за изменением customFields и добавляем новые ключи в form
// (на случай, если компонент переиспользуется с другими полями)
watch(
  () => props.customFields,
  (fields) => {
    fields?.forEach((field) => {
      if (!(field.name in form)) {
        form[field.name] = ''
      }
    })
  },
  { deep: true }
)

// === Префикс "+7 " при фокусе на пустом поле ===
const ensurePrefix = () => {
  if (!form.contact.trim() || form.contact === '+7') {
    form.contact = '+7 '
  }
}

// === Работа с файлами ===
const handleFiles = (e: Event) => {
  filesError.value = null
  const target = e.target as HTMLInputElement
  const selectedFiles = Array.from(target.files || [])
  if (selectedFiles.length === 0) return

  const maxBytes = props.maxFileSizeMb * 1024 * 1024

  // Лимит количества
  if (form.files.length + selectedFiles.length > props.maxFiles) {
    filesError.value = `Можно прикрепить не более ${props.maxFiles} файлов`
    target.value = ''
    return
  }

  // Лимит размера
  const oversized = selectedFiles.find((f) => f.size > maxBytes)
  if (oversized) {
    filesError.value = `Файл "${oversized.name}" больше ${props.maxFileSizeMb} МБ`
    target.value = ''
    return
  }

  form.files = [...form.files, ...selectedFiles]
  target.value = '' // сброс input, чтобы можно было выбрать те же файлы повторно
}

const removeFile = (index: number) => {
  form.files = form.files.filter((_: File, i: number) => i !== index)
}

// === Валидация ===
const validateForm = (): boolean => {
  (Object.keys(errors) as (keyof FormErrors)[]).forEach((k) => delete errors[k])
  filesError.value = null

  if (!form.contact.trim()) {
    errors.contact = 'Укажите номер телефона'
  } else {
    const digits = form.contact.replace(/\D/g, '')
    if (digits.length < 11) {
      errors.contact = 'Введите корректный номер телефона'
    }
  }

  if (!form.consent) {
    errors.consent = 'Необходимо согласие на обработку данных'
  }

  return Object.keys(errors).length === 0
}

// === Формирование HTML-сообщения для Telegram и Email ===
const buildMessage = (): string => {
  const now = new Date().toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
  const phoneDigits = form.contact.replace(/\D/g, '')
  const phoneLink = `<a href="tel:${phoneDigits}">${form.contact}</a>`

  // Кастомные блоки из customFields
  const customBlocks = (props.customFields || [])
    .map((field) => {
      const value = form[field.name]
      if (!value) return ''
      const label = props.messageConfig?.fieldLabels?.[field.name] || field.label
      const selectedOption = field.options.find((o) => o.value === value)
      return `<b>${label}:</b> ${selectedOption?.label || value}`
    })
    .filter(Boolean)

  const filesBlock =
    form.files.length > 0
      ? `<b>Файлы (${form.files.length}):</b>\n` +
        form.files
          .map(
            (f: File, i: number) =>
              `  ${i + 1}. ${f.name} (${(f.size / 1024 / 1024).toFixed(2)} МБ)`
          )
          .join('\n')
      : ''

  const emoji = props.messageConfig?.emoji || '🔥'
  const title = props.messageConfig?.title || 'Заявка на смету'
  const source = props.messageConfig?.sourceLabel || 'CTA-блок на сайте'

  return `
<b>${emoji} ${title}</b>
<b>Источник:</b> ${source}
<b>Дата:</b> ${now}
<b>Имя:</b> ${form.name || '—'}
<b>Телефон:</b> ${phoneLink}${customBlocks.length ? '\n' + customBlocks.join('\n') : ''}${filesBlock ? '\n' + filesBlock : ''}
<i>Заявка с сайта ГлавПрофи</i>`.trim()
}

// === Текстовый комментарий для email ===
const buildComment = (): string => {
  const source = props.messageConfig?.sourceLabel || 'CTA-блок на сайте'
  const parts: string[] = [`Источник: ${source}`]

  // Кастомные блоки
  props.customFields?.forEach((field) => {
    const value = form[field.name]
    if (value) {
      const label = props.messageConfig?.fieldLabels?.[field.name] || field.label
      const selectedOption = field.options.find((o) => o.value === value)
      parts.push(`${label}: ${selectedOption?.label || value}`)
    }
  })

  if (form.files.length > 0) {
    parts.push(`Файлы: ${form.files.map((f: File) => f.name).join(', ')}`)
  }

  return parts.join('\n')
}

// === Отправка ===
const handleSubmit = async () => {
  if (!validateForm()) return

  status.value = 'submitting'

  try {
    const formData = new FormData()
    formData.append('message', buildMessage())
    if (form.name) formData.append('name', form.name)
    if (form.contact) formData.append('phone', form.contact)
    formData.append('comment', buildComment())

    // Все файлы под одним именем 'files'
    form.files.forEach((file: File) => {
      formData.append('files', file, file.name)
    })

    const result = await $fetch(props.submitUrl, {
      method: 'POST',
      body: formData,
    })

    status.value = 'success'
    emit('success', result)
  } catch (err) {
    console.error('[CtaForm] Ошибка отправки:', err)
    status.value = 'error'
    emit('error', err)
  }
}
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;

span {
  color: unset;
}

.cta-form {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;

  // === Кнопка отправки ===
  &__submit {
    margin-top: 0.8rem;
    padding: 1.05rem 2rem;
    background: $blue-gradient;
    color: $background-dark;
    border: none;
    border-radius: 50px;
    font-family: 'Rubik', sans-serif;
    font-size: 1.05rem;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 8px 24px rgba(0, 195, 245, 0.35);
    transition: all 0.3s ease;

    &:hover:not(:disabled) {
      transform: translateY(-3px);
      box-shadow: 0 14px 32px rgba(0, 195, 245, 0.5);
    }

    &:active:not(:disabled) {
      transform: translateY(-1px);
    }

    &:disabled {
      cursor: not-allowed;
      opacity: 0.8;
    }
  }

  &__submit-default,
  &__submit-loader {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.6rem;
  }

  // === Сообщение об ошибке ===
  &__error {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.9rem 1.1rem;
    background: rgba($red, 0.1);
    border: 1px solid rgba($red, 0.3);
    border-radius: $border-radius;
    color: #ff8c8c;
    font-size: 0.92rem;
    margin: 0;
  }
}

.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba($background-dark, 0.3);
  border-top-color: $background-dark;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

// === Поля формы ===
.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;

  &__label {
    font-size: 0.92rem;
    font-weight: 500;
    color: rgba($text-light, 0.85);
  }

  &__required {
    color: $red;
  }

  &__hint {
    font-size: 0.82rem;
    color: rgba($text-light, 0.55);
    font-weight: 400;
    margin-left: 0.3rem;
  }

  &__hint-small {
    font-size: 0.78rem;
    color: rgba($text-light, 0.5);
    margin-top: 0.2rem;
  }

  &__input {
    padding: 0.9rem 1.1rem;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: $border-radius;
    color: $text-light;
    font-family: 'Rubik', sans-serif;
    font-size: 1rem;
    transition: all 0.25s ease;

    &::placeholder {
      color: rgba($text-light, 0.4);
    }

    &:hover {
      border-color: rgba(255, 255, 255, 0.22);
    }

    &:focus {
      outline: none;
      border-color: $blue;
      background: rgba(0, 195, 245, 0.04);
      box-shadow: 0 0 0 3px rgba(0, 195, 245, 0.12);
    }

    &--error {
      border-color: rgba($red, 0.6);

      &:focus {
        border-color: $red;
        box-shadow: 0 0 0 3px rgba($red, 0.12);
      }
    }
  }

  &__error {
    font-size: 0.82rem;
    color: #ff8c8c;
    margin-top: 0.2rem;
  }
}

// === Кастомные тайлы (универсальный стиль для всех customFields) ===
.custom-tiles {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.5rem;
}

.custom-tile {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.7rem 0.9rem;
  background: rgba(255, 255, 255, 0.04);
  border: 1.5px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  color: rgba($text-light, 0.85);
  cursor: pointer;
  transition: all 0.25s ease;
  font-family: 'Rubik', sans-serif;
  font-size: 0.88rem;
  font-weight: 500;

  &:hover {
    border-color: rgba(0, 195, 245, 0.4);
    background: rgba(0, 195, 245, 0.06);
  }

  &--active {
    border-color: $blue;
    background: rgba(0, 195, 245, 0.12);
    color: $blue-light;
    box-shadow: 0 0 0 3px rgba(0, 195, 245, 0.12);
  }
}

// === Загрузка файлов ===
.file-upload {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.1rem;
  background: rgba(255, 255, 255, 0.03);
  border: 2px dashed rgba(255, 255, 255, 0.15);
  border-radius: $border-radius;
  cursor: pointer;
  transition: all 0.25s ease;

  &:hover {
    border-color: $blue;
    background: rgba(0, 195, 245, 0.04);
  }

  &--disabled {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
  }

  &__input {
    position: absolute;
    inset: 0;
    opacity: 0;
    cursor: pointer;
  }

  &__content {
    display: flex;
    align-items: center;
    gap: 0.7rem;
    font-size: 0.95rem;
    color: rgba($text-light, 0.8);
    min-width: 0;
    flex: 1;

    :deep(.icon) {
      color: $blue;
      flex-shrink: 0;
    }
  }
}

// === Список прикреплённых файлов ===
.files-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin: 0.5rem 0 0;
  padding: 0;
  list-style: none;

  &__item {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.65rem 0.85rem;
    background: rgba(0, 195, 245, 0.06);
    border: 1px solid rgba(0, 195, 245, 0.2);
    border-radius: $border-radius;
    animation: fileSlideIn 0.25s ease;
  }

  &__icon {
    color: $blue;
    flex-shrink: 0;
  }

  &__name {
    flex: 1;
    font-size: 0.9rem;
    color: $text-light;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    min-width: 0;
  }

  &__size {
    font-size: 0.78rem;
    color: rgba($text-light, 0.6);
    flex-shrink: 0;
    white-space: nowrap;
  }

  &__remove {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    background: transparent;
    color: rgba($text-light, 0.5);
    border: none;
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.2s ease;
    flex-shrink: 0;

    &:hover {
      background: rgba($red, 0.15);
      color: #ff8c8c;
    }
  }
}

@keyframes fileSlideIn {
  from {
    opacity: 0;
    transform: translateY(-6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// === Согласие ===
.form-consent {
  display: flex;
  align-items: flex-start;
  gap: 0.7rem;
  cursor: pointer;
  user-select: none;
  margin-top: 0.3rem;

  &__input {
    position: absolute;
    opacity: 0;
    pointer-events: none;
  }

  &__box {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    border: 1.5px solid rgba($text-light, 0.3);
    border-radius: 5px;
    color: $background-dark;
    transition: all 0.2s ease;
    margin-top: 1px;
  }

  &__input:checked + &__box {
    background: $blue-gradient;
    border-color: transparent;
  }

  &__text {
    font-size: 0.85rem;
    line-height: 1.5;
    color: rgba($text-light, 0.7);

    a {
      color: $blue-light;
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }
  }
}

// === Адаптив ===
@media (max-width: 768px) {
  .cta-form {
    &__submit {
      width: 100%;
    }
  }
}
</style>
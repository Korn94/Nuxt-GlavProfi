<!-- app/components/pages/public/remontPomescheniy/pageTypes/kliniki/CtaForm.vue -->
<template>
  <form class="cta-form" novalidate @submit.prevent="handleSubmit">
    <!-- Имя -->
    <div class="form-field">
      <label class="form-field__label" :for="`${idPrefix}-name`">
        Ваше имя
      </label>
      <input
        :id="`${idPrefix}-name`"
        v-model="localForm.name"
        type="text"
        class="form-field__input"
        :class="{ 'form-field__input--error': localErrors.name }"
        placeholder="Как к вам обращаться"
        autocomplete="name"
      />
      <span v-if="localErrors.name" class="form-field__error">{{ localErrors.name }}</span>
    </div>

    <!-- Телефон (с автоформатом) -->
    <div class="form-field">
      <label class="form-field__label" :for="`${idPrefix}-contact`">
        Телефон <span class="form-field__required">*</span>
      </label>
      <input
        :id="`${idPrefix}-contact`"
        v-model="localForm.contact"
        v-phone-format
        type="tel"
        class="form-field__input"
        :class="{ 'form-field__input--error': localErrors.contact }"
        placeholder="+7 (___) ___-__-__"
        autocomplete="tel"
        @focus="ensurePrefix"
      />
      <span v-if="localErrors.contact" class="form-field__error">{{ localErrors.contact }}</span>
    </div>

    <!-- Профиль клиники (уникальное поле для клиник) -->
    <div class="form-field">
      <label class="form-field__label">Профиль клиники</label>
      <div class="clinic-profile-tiles">
        <button
          v-for="option in clinicProfiles"
          :key="option.value"
          type="button"
          :class="[
            'clinic-profile-tile',
            { 'clinic-profile-tile--active': localForm.clinicProfile === option.value }
          ]"
          @click="localForm.clinicProfile = option.value"
        >
          <Icon :name="option.icon" size="18" />
          <span>{{ option.label }}</span>
        </button>
      </div>
    </div>

    <!-- Прикрепить файлы (множественный выбор) -->
    <div class="form-field form-field--file">
      <label class="form-field__label">
        Прикрепить файлы
        <span class="form-field__hint">(план, фото, ТЗ, лицензионные требования — до 5 шт.)</span>
      </label>

      <label
        class="file-upload"
        :class="{ 'file-upload--disabled': localForm.files.length >= 5 }"
      >
        <input
          type="file"
          class="file-upload__input"
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.zip,.rar"
          multiple
          :disabled="localForm.files.length >= 5"
          @change="handleFiles"
        />
        <div class="file-upload__content">
          <Icon name="mdi:cloud-upload-outline" size="22" />
          <span v-if="localForm.files.length === 0">
            Выберите файлы или перетащите сюда
          </span>
          <span v-else>
            Добавить ещё ({{ localForm.files.length }}/5)
          </span>
        </div>
      </label>

      <!-- Список прикреплённых файлов -->
      <ul v-if="localForm.files.length > 0" class="files-list">
        <li v-for="(file, index) in localForm.files" :key="index" class="files-list__item">
          <Icon name="mdi:file-document-outline" size="18" class="files-list__icon" />
          <span class="files-list__name" :title="file.name">{{ file.name }}</span>
          <span class="files-list__size">
            {{ (file.size / 1024 / 1024).toFixed(2) }} МБ
          </span>
          <button
            type="button"
            class="files-list__remove"
            :aria-label="`Удалить ${file.name}`"
            @click.prevent="removeFile(index)"
          >
            <Icon name="mdi:close-circle" size="18" />
          </button>
        </li>
      </ul>

      <span class="form-field__hint-small">
        PDF, DOC, JPG, PNG, ZIP — до 10 МБ каждый, всего до 5 файлов
      </span>
      <span v-if="filesError" class="form-field__error">{{ filesError }}</span>
    </div>

    <!-- Согласие -->
    <label class="form-consent">
      <input v-model="localForm.consent" type="checkbox" class="form-consent__input" />
      <span class="form-consent__box">
        <Icon v-if="localForm.consent" name="mdi:check" size="14" />
      </span>
      <span class="form-consent__text">
        Согласен на обработку персональных данных
      </span>
    </label>

    <!-- Кнопка отправки -->
    <button
      type="submit"
      class="cta-form__submit"
      :disabled="localStatus === 'submitting'"
    >
      <span v-if="localStatus === 'submitting'" class="cta-form__submit-loader">
        <span class="spinner" />
        Отправляем...
      </span>
      <span v-else class="cta-form__submit-default">
        <Icon name="mdi:send" size="18" />
        <span>Получить расчёт</span>
      </span>
    </button>

    <!-- Сообщение об ошибке -->
    <p v-if="localStatus === 'error'" class="cta-form__error">
      <Icon name="mdi:alert-circle" size="18" />
      Не удалось отправить. Попробуйте позже или свяжитесь напрямую.
    </p>
  </form>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'

interface LocalFormState {
  name: string
  contact: string
  clinicProfile: string
  files: File[]
  consent: boolean
}

interface LocalErrors {
  name?: string
  contact?: string
  consent?: string
}

const props = withDefaults(
  defineProps<{
    submitUrl?: string
    idPrefix?: string
  }>(),
  {
    submitUrl: '/api/send-message',
    idPrefix: 'kliniki-cta-form',
  }
)

const localStatus = ref<'idle' | 'submitting' | 'success' | 'error'>('idle')
const filesError = ref<string | null>(null)

const localForm = reactive<LocalFormState>({
  name: '',
  contact: '+7 ',
  clinicProfile: '',
  files: [],
  consent: false,
})

const localErrors = reactive<LocalErrors>({})

// === Профили клиники ===
const clinicProfiles = [
  { value: 'stomatology', label: 'Стоматология', icon: 'mdi:tooth-outline' },
  { value: 'multidisciplinary', label: 'Многопрофильная', icon: 'mdi:hospital-building' },
  { value: 'cosmetology', label: 'Косметология', icon: 'mdi:face-woman-shimmer' },
  { value: 'laboratory', label: 'Лаборатория', icon: 'mdi:test-tube' },
  { value: 'other', label: 'Другое', icon: 'mdi:dots-horizontal' },
]

// === Префикс "+7 " при фокусе на пустом поле ===
const ensurePrefix = () => {
  if (!localForm.contact.trim() || localForm.contact === '+7') {
    localForm.contact = '+7 '
  }
}

// === Работа с файлами (множественная) ===
const handleFiles = (e: Event) => {
  filesError.value = null
  const target = e.target as HTMLInputElement
  const selectedFiles = Array.from(target.files || [])

  if (selectedFiles.length === 0) return

  const maxBytes = 10 * 1024 * 1024

  // Лимит количества
  if (localForm.files.length + selectedFiles.length > 5) {
    filesError.value = 'Можно прикрепить не более 5 файлов'
    target.value = ''
    return
  }

  // Лимит размера
  const oversized = selectedFiles.find((f) => f.size > maxBytes)
  if (oversized) {
    filesError.value = `Файл "${oversized.name}" больше 10 МБ`
    target.value = ''
    return
  }

  localForm.files = [...localForm.files, ...selectedFiles]
  target.value = ''
}

const removeFile = (index: number) => {
  localForm.files = localForm.files.filter((_, i) => i !== index)
}

// === Валидация ===
const validateForm = (): boolean => {
  ;(Object.keys(localErrors) as (keyof LocalErrors)[]).forEach((k) => delete localErrors[k])
  filesError.value = null

  if (!localForm.contact.trim()) {
    localErrors.contact = 'Укажите номер телефона'
  } else {
    const digits = localForm.contact.replace(/\D/g, '')
    if (digits.length < 11) {
      localErrors.contact = 'Введите корректный номер'
    }
  }

  if (!localForm.consent) {
    localErrors.consent = 'Необходимо согласие на обработку данных'
  }

  return Object.keys(localErrors).length === 0
}

// === Хелпер: человекочитаемое название профиля клиники ===
const getClinicProfileLabel = (value: string): string => {
  const map: Record<string, string> = {
    stomatology: 'Стоматология',
    multidisciplinary: 'Многопрофильная',
    cosmetology: 'Косметология',
    laboratory: 'Лаборатория',
    other: 'Другое',
  }
  return map[value] || value
}

// === Формирование сообщения для Telegram/Email ===
const buildMessage = (): string => {
  const now = new Date().toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const phoneDigits = localForm.contact.replace(/\D/g, '')
  const phoneLink = `<a href="tel:${phoneDigits}">${localForm.contact}</a>`

  const profileBlock = localForm.clinicProfile
    ? `<b>Профиль клиники:</b> ${getClinicProfileLabel(localForm.clinicProfile)}`
    : ''

  const filesBlock = localForm.files.length > 0
    ? `<b>Файлы (${localForm.files.length}):</b>\n` +
      localForm.files
        .map((f, i) => `  ${i + 1}. ${f.name} (${(f.size / 1024 / 1024).toFixed(2)} МБ)`)
        .join('\n')
    : ''

  return `
<b>🏥 Заявка на ремонт клиники</b>

<b>Источник:</b> Ремонт клиник в Рязани — CTA
<b>Дата:</b> ${now}

<b>Имя:</b> ${localForm.name || '—'}
<b>Телефон:</b> ${phoneLink}
${profileBlock ? `\n${profileBlock}` : ''}
${filesBlock ? `\n${filesBlock}` : ''}

<i>Заявка с сайта ГлавПрофи</i>`.trim()
}

// === Текстовый комментарий для email ===
const buildComment = (): string => {
  const parts: string[] = ['Источник: Ремонт клиник в Рязани — CTA']
  if (localForm.clinicProfile) {
    parts.push(`Профиль клиники: ${getClinicProfileLabel(localForm.clinicProfile)}`)
  }
  if (localForm.files.length > 0) {
    parts.push(`Файлы: ${localForm.files.map((f) => f.name).join(', ')}`)
  }
  return parts.join('\n')
}

// === Отправка ===
const handleSubmit = async () => {
  if (!validateForm()) return

  localStatus.value = 'submitting'

  try {
    const formData = new FormData()
    formData.append('message', buildMessage())
    if (localForm.name) formData.append('name', localForm.name)
    if (localForm.contact) formData.append('phone', localForm.contact)
    formData.append('comment', buildComment())

    // Все файлы под одним именем 'files'
    localForm.files.forEach((file) => {
      formData.append('files', file, file.name)
    })

    await $fetch(props.submitUrl, {
      method: 'POST',
      body: formData,
    })

    localStatus.value = 'success'

    // Сброс формы после успешной отправки (через 3 секунды)
    setTimeout(() => {
      localForm.name = ''
      localForm.contact = '+7 '
      localForm.clinicProfile = ''
      localForm.files = []
      localForm.consent = false
      localStatus.value = 'idle'
    }, 3000)
  } catch (err) {
    console.error('[KlinikiCtaForm] Ошибка отправки:', err)
    localStatus.value = 'error'
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
  to { transform: rotate(360deg); }
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

// === Профиль клиники: плитки ===
.clinic-profile-tiles {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 0.5rem;
}

.clinic-profile-tile {
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
      &:hover { text-decoration: underline; }
    }
  }
}
</style>
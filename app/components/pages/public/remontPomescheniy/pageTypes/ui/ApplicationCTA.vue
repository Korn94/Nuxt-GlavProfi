<!-- app/components/pages/public/remontPomescheniy/pageTypes/ui/ApplicationCTA.vue -->
<template>
  <section class="application-cta">
    <div class="container">
      <div class="application-cta__card">
        <!-- Заголовок -->
        <slot name="header">
          <header class="application-cta__header">
            <h2 class="application-cta__title" v-html="title" />
            <p v-if="subtitle" class="application-cta__subtitle">{{ subtitle }}</p>
          </header>
        </slot>

        <!-- Двухколоночный лэйаут: форма + альтернативные контакты -->
        <div class="application-cta__layout">
          <!-- Колонка 1: Форма -->
          <div class="application-cta__form-wrapper">
            <!-- Состояние успеха -->
            <div v-if="status === 'success'" class="application-cta__success">
              <div class="application-cta__success-icon">
                <Icon name="mdi:check-circle" size="56" />
              </div>
              <h3 class="application-cta__success-title">Заявка отправлена!</h3>
              <p class="application-cta__success-text">
                Инженер свяжется с вами в течение 24 часов.
              </p>
              <p class="application-cta__success-text">
                А пока — можете написать нам напрямую в
                <a v-if="telegram" :href="telegramLink" target="_blank" rel="noopener">Telegram</a>
                <span v-if="telegram && phone"> или </span>
                <span v-if="phone">позвонить по номеру
                  <a :href="`tel:${phone.replace(/[^+\d]/g, '')}`">{{ phone }}</a>
                </span>.
              </p>
              <button class="application-cta__reset" @click="resetForm">
                Отправить ещё одну заявку
              </button>
            </div>

            <!--
              Если передан слот #form — рендерим ТОЛЬКО его (без <form> обёртки).
              Это позволяет кастомным формам иметь свой <form> тег
              без создания невалидной вложенной структуры.
            -->
            <slot
              v-else-if="$slots.form"
              name="form"
              :form="form"
              :errors="errors"
              :status="status"
              :update-field="updateField"
              :submit="submitForm"
              :reset="resetForm"
            />

            <!-- Дефолтная форма -->
            <form
              v-else
              class="application-cta__form"
              novalidate
              @submit.prevent="submitForm"
            >
              <!-- Имя -->
              <div class="form-field">
                <label class="form-field__label" :for="nameId">
                  Ваше имя
                </label>
                <input
                  :id="nameId"
                  v-model="form.name"
                  type="text"
                  class="form-field__input"
                  :class="{ 'form-field__input--error': errors.name }"
                  placeholder="Как к вам обращаться"
                  autocomplete="name"
                  @blur="validateField('name')"
                />
                <span v-if="errors.name" class="form-field__error">{{ errors.name }}</span>
              </div>

              <!-- Телефон -->
              <div class="form-field">
                <label class="form-field__label" :for="contactId">
                  Телефон <span class="form-field__required">*</span>
                </label>
                <input
                  :id="contactId"
                  v-model="form.contact"
                  v-phone-format
                  type="tel"
                  class="form-field__input"
                  :class="{ 'form-field__input--error': errors.contact }"
                  placeholder="+7 (___) ___-__-__"
                  autocomplete="tel"
                  @focus="ensurePrefix"
                  @blur="validateField('contact')"
                />
                <span v-if="errors.contact" class="form-field__error">{{ errors.contact }}</span>
              </div>

              <!-- Прикрепить файлы (множественный выбор) -->
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
                  <li v-for="(file, index) in form.files" :key="index" class="files-list__item">
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
                  PDF, DOC, JPG, PNG, ZIP — до {{ maxFileSizeMb }} МБ каждый, всего до {{ maxFiles }} файлов
                </span>
                <span v-if="filesError" class="form-field__error">{{ filesError }}</span>
              </div>

              <!-- Согласие -->
              <label class="form-consent">
                <input v-model="form.consent" type="checkbox" class="form-consent__input" />
                <span class="form-consent__box">
                  <Icon v-if="form.consent" name="mdi:check" size="14" />
                </span>
                <span class="form-consent__text">
                  Согласен на обработку персональных данных
                </span>
              </label>

              <!-- Кнопка отправки -->
              <button
                type="submit"
                class="application-cta__submit"
                :disabled="status === 'submitting'"
              >
                <span v-if="status === 'submitting'" class="application-cta__submit-loader">
                  <span class="spinner" />
                  Отправляем...
                </span>
                <span v-else class="application-cta__submit-default">
                  <Icon name="mdi:send" size="18" />
                  <span>{{ submitText }}</span>
                </span>
              </button>

              <!-- Сообщение об ошибке -->
              <p v-if="status === 'error'" class="application-cta__error">
                <Icon name="mdi:alert-circle" size="18" />
                {{ errorMessage }}
              </p>
            </form>
          </div>

          <!-- Колонка 2: Альтернатива -->
          <aside class="application-cta__alternative">
            <slot name="alternative">
              <div class="alternative-card">
                <h3 class="alternative-card__title">
                  Или свяжитесь напрямую
                </h3>
                <p class="alternative-card__subtitle">
                  Для тех, кто не любит формы
                </p>

                <div class="alternative-card__list">
                  <!-- Телефон -->
                  <a
                    v-if="phone"
                    :href="`tel:${phone.replace(/[^+\d]/g, '')}`"
                    class="alternative-card__item"
                  >
                    <div class="alternative-card__icon alternative-card__icon--phone">
                      <Icon name="mdi:phone" size="22" />
                    </div>
                    <div class="alternative-card__info">
                      <span class="alternative-card__label">Позвонить</span>
                      <span class="alternative-card__value">{{ phone }}</span>
                    </div>
                  </a>

                  <!-- Telegram -->
                  <a
                    v-if="telegram"
                    :href="telegramLink"
                    target="_blank"
                    rel="noopener"
                    class="alternative-card__item"
                  >
                    <div class="alternative-card__icon alternative-card__icon--telegram">
                      <Icon name="mdi:telegram" size="22" />
                    </div>
                    <div class="alternative-card__info">
                      <span class="alternative-card__label">Telegram</span>
                      <span class="alternative-card__value">{{ telegram }}</span>
                    </div>
                  </a>

                  <!-- WhatsApp -->
                  <a
                    v-if="whatsapp"
                    :href="whatsappLink"
                    target="_blank"
                    rel="noopener"
                    class="alternative-card__item"
                  >
                    <div class="alternative-card__icon alternative-card__icon--whatsapp">
                      <Icon name="mdi:whatsapp" size="22" />
                    </div>
                    <div class="alternative-card__info">
                      <span class="alternative-card__label">WhatsApp</span>
                      <span class="alternative-card__value">{{ whatsapp }}</span>
                    </div>
                  </a>
                </div>

                <p class="alternative-card__schedule">
                  <Icon name="mdi:clock-outline" size="16" />
                  Отвечаем в рабочее время: пн–пт, 9:00–19:00
                </p>
              </div>
            </slot>
          </aside>
        </div>

        <!-- Футер (опциональный) -->
        <div v-if="$slots.footer" class="application-cta__footer">
          <slot name="footer" />
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'

type FormStatus = 'idle' | 'submitting' | 'success' | 'error'

interface FormState {
  name: string
  contact: string
  files: File[]
  consent: boolean
}

interface FormErrors {
  name?: string
  contact?: string
  consent?: string
}

interface SendResult {
  success: boolean
  channels: {
    email: 'sent' | 'failed'
    telegram: 'sent' | 'blocked'
  }
  filesAttached: number
}

const props = withDefaults(
  defineProps<{
    title?: string
    subtitle?: string
    submitText?: string
    phone?: string
    telegram?: string
    whatsapp?: string
    submitUrl?: string
    showFileUpload?: boolean
    maxFileSizeMb?: number
    maxFiles?: number
    idPrefix?: string
    sourceLabel?: string
    subjectTitle?: string
    defaultComment?: string
  }>(),
  {
    title: 'Получите смету и аудит рисков за 24 часа',
    subtitle: 'Загрузите план или опишите задачу. Инженер найдёт слабые места и подготовит детальный расчёт. Консультация бесплатна.',
    submitText: 'Получить расчёт',
    submitUrl: '/api/send-message',
    showFileUpload: true,
    maxFileSizeMb: 10,
    maxFiles: 5,
    idPrefix: 'application-cta',
    sourceLabel: 'CTA-блок на странице типа помещения',
    subjectTitle: 'Заявка на смету',
    defaultComment: '',
  }
)

// === Детерминированные ID ===
const nameId = computed(() => `${props.idPrefix}-name`)
const contactId = computed(() => `${props.idPrefix}-contact`)

// === Состояние формы ===
const form = reactive<FormState>({
  name: '',
  contact: '+7 ',
  files: [],
  consent: false,
})

const errors = reactive<FormErrors>({})
const status = ref<FormStatus>('idle')
const sendResult = ref<SendResult | null>(null)
const errorMessage = ref('Не удалось отправить заявку. Попробуйте позже или свяжитесь с нами напрямую.')
const filesError = ref<string | null>(null)

// === Ссылки ===
const telegramLink = computed(() => {
  if (!props.telegram) return '#'
  const handle = props.telegram.replace(/^@/, '').trim()
  return `https://t.me/${handle}`
})

const whatsappLink = computed(() => {
  if (!props.whatsapp) return '#'
  const phone = props.whatsapp.replace(/[^0-9]/g, '')
  return `https://wa.me/${phone}`
})

// === Обновление поля (для кастомных слотов) ===
const updateField = (field: keyof FormState, value: unknown) => {
  ;(form as any)[field] = value
}

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

  // Проверяем лимит количества
  if (form.files.length + selectedFiles.length > props.maxFiles) {
    filesError.value = `Можно прикрепить не более ${props.maxFiles} файлов`
    target.value = ''
    return
  }

  // Проверяем размер каждого файла
  const oversized = selectedFiles.find((f) => f.size > maxBytes)
  if (oversized) {
    filesError.value = `Файл "${oversized.name}" больше ${props.maxFileSizeMb} МБ`
    target.value = ''
    return
  }

  // Добавляем к существующим
  form.files = [...form.files, ...selectedFiles]
  target.value = '' // сброс input, чтобы можно было выбрать те же файлы повторно
}

const removeFile = (index: number) => {
  form.files = form.files.filter((_, i) => i !== index)
}

// === Валидация ===
const validateField = (field: 'name' | 'contact') => {
  delete errors[field]

  if (field === 'contact') {
    if (!form.contact.trim()) {
      errors.contact = 'Укажите номер телефона'
      return
    }
    const digits = form.contact.replace(/\D/g, '')
    if (digits.length < 11) {
      errors.contact = 'Введите корректный номер телефона'
    }
  }
}

const validateForm = (): boolean => {
  ;(Object.keys(errors) as (keyof FormErrors)[]).forEach((k) => delete errors[k])
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

  const digits = form.contact.replace(/\D/g, '')
  const contactLink = `<a href="tel:${digits}">${form.contact}</a>`

  const filesBlock = form.files.length > 0
    ? `<b>Файлы (${form.files.length}):</b>\n` +
      form.files
        .map((f, i) => `  ${i + 1}. ${f.name} (${(f.size / 1024 / 1024).toFixed(2)} МБ)`)
        .join('\n')
    : ''

  return `
<b>🔥 ${props.subjectTitle}</b>

<b>Источник:</b> ${props.sourceLabel}
<b>Дата:</b> ${now}

<b>Имя:</b> ${form.name || '—'}
<b>Телефон:</b> ${contactLink}
${filesBlock ? `\n${filesBlock}` : ''}
${props.defaultComment ? `\n<b>Комментарий:</b>\n${props.defaultComment}` : ''}

<i>Заявка с сайта ГлавПрофи</i>`.trim()
}

// === Текстовый комментарий для email ===
const buildComment = (): string => {
  const parts = [`Источник: ${props.sourceLabel}`]
  if (form.files.length > 0) {
    parts.push(`Файлы: ${form.files.map((f) => f.name).join(', ')}`)
  }
  if (props.defaultComment) parts.push(`\nКомментарий:\n${props.defaultComment}`)
  return parts.join('\n')
}

// === Отправка ===
const submitForm = async () => {
  if (!validateForm()) return

  status.value = 'submitting'
  sendResult.value = null

  try {
    const formData = new FormData()
    formData.append('message', buildMessage())
    if (form.name) formData.append('name', form.name)
    if (form.contact) formData.append('phone', form.contact)
    formData.append('comment', buildComment())

    // Все файлы под одним именем 'files'
    form.files.forEach((file) => {
      formData.append('files', file, file.name)
    })

    const result = await $fetch<SendResult>(props.submitUrl, {
      method: 'POST',
      body: formData,
    })

    sendResult.value = result

    if (result.success) {
      status.value = 'success'
    } else {
      status.value = 'error'
      errorMessage.value = 'Не удалось отправить заявку. Попробуйте позже или свяжитесь напрямую.'
    }
  } catch (err) {
    console.error('[ApplicationCTA] Ошибка отправки:', err)
    status.value = 'error'
  }
}

// === Сброс ===
const resetForm = () => {
  form.name = ''
  form.contact = '+7 '
  form.files = []
  form.consent = false
  status.value = 'idle'
  sendResult.value = null
  filesError.value = null
  ;(Object.keys(errors) as (keyof FormErrors)[]).forEach((k) => delete errors[k])
}
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;

span {
  color: unset;
}

.application-cta {
  padding: 5rem 0;
  background: $background-dark;
  position: relative;
  overflow: hidden;

  &::before,
  &::after {
    content: '';
    position: absolute;
    border-radius: 50%;
    pointer-events: none;
  }

  &::before {
    top: -15%;
    left: -8%;
    width: 500px;
    height: 500px;
    background: radial-gradient(circle, rgba(0, 195, 245, 0.1) 0%, transparent 65%);
  }

  &::after {
    bottom: -15%;
    right: -8%;
    width: 450px;
    height: 450px;
    background: radial-gradient(circle, rgba(250, 183, 2, 0.06) 0%, transparent 65%);
  }

  .container {
    max-width: 1100px;
    margin: 0 auto;
    padding: 0 2rem;
    position: relative;
    z-index: 1;

    @media (max-width: 768px) {
      padding: 0 1.2rem;
    }
  }

  // === Карточка-обёртка ===
  &__card {
    background: rgba(34, 34, 34, 0.65);
    backdrop-filter: blur(14px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    padding: 3.5rem;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.35);
    position: relative;
    overflow: hidden;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: $blue-gradient;
    }

    @media (max-width: 768px) {
      padding: 2rem 1.4rem;
    }
  }

  // === Заголовок ===
  &__header {
    text-align: center;
    max-width: 680px;
    margin: 0 auto 3rem;
  }

  &__title {
    font-family: 'Rubik', sans-serif;
    font-size: 2.3rem;
    font-weight: 700;
    color: $text-light;
    margin: 0 0 1rem;
    line-height: 1.2;

    @media (max-width: 768px) {
      font-size: 1.7rem;
    }

    :deep(span),
    :deep(.accent) {
      background: $blue-gradient;
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
    }
  }

  &__subtitle {
    font-size: 1.1rem;
    line-height: 1.65;
    color: rgba($text-light, 0.82);
    margin: 0;
  }

  // === Лэйаут ===
  &__layout {
    display: grid;
    grid-template-columns: 1fr 380px;
    gap: 2.5rem;
    align-items: start;

    @media (max-width: 960px) {
      grid-template-columns: 1fr;
      gap: 2rem;
    }
  }

  // === Форма ===
  &__form {
    display: flex;
    flex-direction: column;
    gap: 1.2rem;
  }

  // === Состояние успеха ===
  &__success {
    text-align: center;
    padding: 2rem 1rem;
  }

  &__success-icon {
    color: $green;
    margin-bottom: 1rem;
    animation: popIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  &__success-title {
    font-family: 'Rubik', sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
    color: $text-light;
    margin: 0 0 0.6rem;
  }

  &__success-text {
    font-size: 1rem;
    line-height: 1.6;
    color: rgba($text-light, 0.8);
    margin: 0 0 1rem;

    a {
      color: $blue-light;
      text-decoration: none;
      font-weight: 500;
      &:hover { color: $blue; }
    }
  }

  &__reset {
    margin-top: 0.5rem;
    padding: 0.6rem 1.4rem;
    background: transparent;
    border: 1px solid rgba($text-light, 0.25);
    color: rgba($text-light, 0.85);
    border-radius: 50px;
    font-family: 'Rubik', sans-serif;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.25s ease;

    &:hover {
      border-color: $blue;
      color: $blue-light;
    }
  }

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

  .spinner {
    width: 18px;
    height: 18px;
    border: 2px solid rgba($background-dark, 0.3);
    border-top-color: $background-dark;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
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

  // === Футер ===
  &__footer {
    margin-top: 2.5rem;
    padding-top: 2rem;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
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

// === Альтернатива (контакты) ===
.alternative-card {
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  padding: 2rem;

  @media (max-width: 960px) {
    padding: 1.8rem;
  }

  &__title {
    font-family: 'Rubik', sans-serif;
    font-size: 1.2rem;
    font-weight: 600;
    color: $text-light;
    margin: 0 0 0.3rem;
  }

  &__subtitle {
    font-size: 0.9rem;
    color: rgba($text-light, 0.6);
    margin: 0 0 1.5rem;
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  &__item {
    display: flex;
    align-items: center;
    gap: 0.9rem;
    padding: 0.9rem 1rem;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 10px;
    text-decoration: none;
    transition: all 0.25s ease;

    &:hover {
      transform: translateX(4px);
      border-color: $blue;
      background: rgba(0, 195, 245, 0.06);
    }
  }

  &__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 42px;
    height: 42px;
    border-radius: 10px;
    flex-shrink: 0;
    color: #fff;

    &--phone {
      background: linear-gradient(135deg, $green, #28c76f);
    }

    &--telegram {
      background: linear-gradient(135deg, #2AABEE, #229ED9);
    }

    &--whatsapp {
      background: linear-gradient(135deg, #25D366, #128C7E);
    }
  }

  &__info {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  &__label {
    font-size: 0.78rem;
    color: rgba($text-light, 0.55);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 500;
  }

  &__value {
    font-size: 1rem;
    color: $text-light;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__schedule {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.82rem;
    color: rgba($text-light, 0.55);
    margin: 1.5rem 0 0;
    padding-top: 1rem;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
  }
}

// === Анимации ===
@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes popIn {
  0% { transform: scale(0); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

// === Адаптив ===
@media (max-width: 768px) {
  .application-cta {
    padding: 3.5rem 0;

    &__card {
      padding: 1.8rem 1.3rem;
    }

    &__title {
      font-size: 1.5rem;
    }

    &__subtitle {
      font-size: 0.98rem;
    }

    &__submit {
      width: 100%;
    }
  }
}
</style>
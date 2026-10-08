<!-- app/components/pages/public/remontPomescheniy/workTypes/ui/InlineCta.vue -->
<template>
  <section class="inline-cta">
    <div class="container">
      <div class="inline-cta__wrapper">
        <!-- Левая часть: текст -->
        <div class="inline-cta__content">
          <div class="inline-cta__icon">
            <Icon name="mdi:help-circle-outline" size="32" />
          </div>
          <div class="inline-cta__text">
            <h3 class="inline-cta__title" v-html="title" />
            <p v-if="subtitle" class="inline-cta__subtitle">{{ subtitle }}</p>
          </div>
        </div>

        <!-- Правая часть: форма -->
        <form class="inline-cta__form" novalidate @submit.prevent="handleSubmit">
          <div class="form-row">
            <input
              :id="`${idPrefix}-name`"
              v-model="form.name"
              type="text"
              class="form-input"
              placeholder="Ваше имя"
              autocomplete="name"
            />
            <input
              :id="`${idPrefix}-contact`"
              v-model="form.contact"
              v-phone-format
              type="tel"
              class="form-input"
              placeholder="+7 (___) ___-__-__"
              autocomplete="tel"
              @focus="ensurePrefix"
            />
          </div>
          <button
            type="submit"
            class="form-submit"
            :disabled="status === 'submitting'"
          >
            <span v-if="status === 'submitting'" class="form-submit__loader">
              <span class="spinner" />
            </span>
            <span v-else-if="status === 'success'" class="form-submit__success">
              <Icon name="mdi:check" size="18" />
              Заявка отправлена!
            </span>
            <span v-else class="form-submit__default">
              <Icon name="mdi:send" size="16" />
              {{ submitText }}
            </span>
          </button>
          <p v-if="status === 'error'" class="form-error">
            Не удалось отправить. Попробуйте позже.
          </p>
          <label class="form-consent">
            <input v-model="form.consent" type="checkbox" class="form-consent__input" />
            <span class="form-consent__box">
              <Icon v-if="form.consent" name="mdi:check" size="12" />
            </span>
            <span class="form-consent__text">Согласен на обработку данных</span>
          </label>
        </form>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'

interface MessageConfig {
  emoji: string
  title: string
  sourceLabel: string
}

type FormStatus = 'idle' | 'submitting' | 'success' | 'error'

const props = withDefaults(
  defineProps<{
    title: string
    subtitle?: string
    submitText?: string
    submitUrl?: string
    messageConfig?: MessageConfig
    idPrefix?: string
  }>(),
  {
    submitText: 'Получить консультацию',
    submitUrl: '/api/send-message',
    idPrefix: 'inline-cta',
  }
)

const form = reactive({
  name: '',
  contact: '+7 ',
  consent: false,
})

const status = ref<FormStatus>('idle')

const ensurePrefix = () => {
  if (!form.contact.trim() || form.contact === '+7') {
    form.contact = '+7 '
  }
}

const validateForm = (): boolean => {
  if (!form.contact.trim()) return false
  const digits = form.contact.replace(/\D/g, '')
  if (digits.length < 11) return false
  if (!form.consent) return false
  return true
}

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

  const emoji = props.messageConfig?.emoji || '❓'
  const title = props.messageConfig?.title || 'Быстрая заявка'
  const source = props.messageConfig?.sourceLabel || 'Inline CTA'

  return `
<b>${emoji} ${title}</b>
<b>Источник:</b> ${source}
<b>Дата:</b> ${now}
<b>Имя:</b> ${form.name || '—'}
<b>Телефон:</b> ${phoneLink}
<i>Заявка с сайта ГлавПрофи</i>`.trim()
}

const handleSubmit = async () => {
  if (!validateForm()) return

  status.value = 'submitting'

  try {
    const formData = new FormData()
    formData.append('message', buildMessage())
    if (form.name) formData.append('name', form.name)
    if (form.contact) formData.append('phone', form.contact)

    await $fetch(props.submitUrl, {
      method: 'POST',
      body: formData,
    })

    status.value = 'success'
    
    // Сброс формы через 3 секунды
    setTimeout(() => {
      status.value = 'idle'
      form.name = ''
      form.contact = '+7 '
      form.consent = false
    }, 3000)
  } catch (err) {
    console.error('[InlineCta] Ошибка отправки:', err)
    status.value = 'error'
    setTimeout(() => {
      status.value = 'idle'
    }, 3000)
  }
}
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;
@use '@/assets/styles/mixins' as *;

.inline-cta {
  @include section-padding;
  background: $background-dark;
  color: $text-light;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -20%;
    width: 500px;
    height: 500px;
    background: radial-gradient(circle, rgba(0, 195, 245, 0.08) 0%, transparent 65%);
    border-radius: 50%;
    pointer-events: none;
  }

  .container {
    @include section-container;
    position: relative;
    z-index: 1;
  }

  &__wrapper {
    display: grid;
    grid-template-columns: 1fr 1.2fr;
    gap: 2.5rem;
    align-items: center;
    padding: 2rem 2.5rem;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 18px;

    @media (max-width: 900px) {
      grid-template-columns: 1fr;
      gap: 1.5rem;
      padding: 1.5rem;
    }
  }

  &__content {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
  }

  &__icon {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 56px;
    height: 56px;
    background: rgba(0, 195, 245, 0.12);
    border-radius: 14px;
    color: $blue;

    @media (max-width: 900px) {
      width: 48px;
      height: 48px;
    }
  }

  &__text {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }

  &__title {
    font-family: 'Rubik', sans-serif;
    font-size: 1.2rem;
    font-weight: 700;
    color: $text-light;
    margin: 0;
    line-height: 1.3;

    :deep(span) {
      color: $blue;
    }

    @media (max-width: 900px) {
      font-size: 1.1rem;
    }
  }

  &__subtitle {
    font-size: 0.92rem;
    color: rgba($text-light, 0.65);
    margin: 0;
    line-height: 1.5;
  }
}

// === Форма ===
.inline-cta__form {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.6rem;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
}

.form-input {
  padding: 0.85rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1.5px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  color: $text-light;
  font-family: 'Rubik', sans-serif;
  font-size: 0.95rem;
  transition: all 0.25s ease;
  width: 100%;

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
}

.form-submit {
  padding: 0.85rem 1.5rem;
  background: $blue-gradient;
  color: $background-dark;
  border: none;
  border-radius: 10px;
  font-family: 'Rubik', sans-serif;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 6px 20px rgba(0, 195, 245, 0.3);
  transition: all 0.3s ease;
  min-height: 48px;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 10px 28px rgba(0, 195, 245, 0.45);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.85;
  }

  &__default,
  &__loader,
  &__success {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }

  &__success {
    color: $background-dark;
  }
}

.spinner {
  width: 16px;
  height: 16px;
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

.form-error {
  font-size: 0.82rem;
  color: #ff8c8c;
  margin: 0;
  text-align: center;
}

.form-consent {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  user-select: none;
  margin-top: 0.2rem;

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
    width: 16px;
    height: 16px;
    border: 1.5px solid rgba($text-light, 0.3);
    border-radius: 4px;
    color: $background-dark;
    transition: all 0.2s ease;
  }

  &__input:checked + &__box {
    background: $blue-gradient;
    border-color: transparent;
  }

  &__text {
    font-size: 0.78rem;
    color: rgba($text-light, 0.55);
  }
}
</style>
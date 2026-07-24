<!-- app/components/pages/public/remontPomescheniy/pageTypes/ui/ApplicationCTA.vue -->
<template>
  <section class="application-cta">
    <div class="container">
      <div class="application-cta__card">
        <!-- ==================== ЗАГОЛОВОК ==================== -->
        <slot name="header">
          <header class="application-cta__header">
            <h2 class="application-cta__title" v-html="title" />
            <p v-if="subtitle" class="application-cta__subtitle">{{ subtitle }}</p>
          </header>
        </slot>

        <!-- ==================== ДВУХКОЛОНОЧНЫЙ ЛЭЙАУТ ==================== -->
        <div class="application-cta__layout">
          <!-- Колонка 1: Форма (универсальная) -->
          <div class="application-cta__form-wrapper">
            <!-- Состояние успеха -->
            <div v-if="showSuccess" class="application-cta__success">
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
                <span v-if="phone">
                  позвонить по номеру
                  <a :href="`tel:${phone.replace(/[^+\d]/g, '')}`">{{ phone }}</a>
                </span>.
              </p>
              <button class="application-cta__reset" @click="resetSuccess">
                Отправить ещё одну заявку
              </button>
            </div>

            <!-- Универсальная форма (рендерится из отдельного компонента) -->
            <CtaForm
              v-else
              :key="formKey"
              :custom-fields="customFields"
              :message-config="computedMessageConfig"
              :submit-url="submitUrl"
              :submit-text="submitText"
              :show-file-upload="showFileUpload"
              :max-file-size-mb="maxFileSizeMb"
              :max-files="maxFiles"
              :id-prefix="idPrefix"
              @success="onFormSuccess"
              @error="onFormError"
            />
          </div>

          <!-- Колонка 2: Альтернативные контакты -->
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
                  <!-- MAX -->
                  <a
                    v-if="max"
                    :href="maxLink"
                    target="_blank"
                    rel="noopener"
                    class="alternative-card__item"
                  >
                    <div class="alternative-card__icon alternative-card__icon--max">
                      <img src="https://maxicons.ru/icons/MAX.svg" alt="Иконка MAX" width="42" height="42">
                    </div>
                    <div class="alternative-card__info">
                      <span class="alternative-card__label">MAX</span>
                      <span class="alternative-card__value">{{ computedMaxLabel }}</span>
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

        <!-- ==================== ФУТЕР (ОПЦИОНАЛЬНЫЙ) ==================== -->
        <div v-if="$slots.footer" class="application-cta__footer">
          <slot name="footer" />
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import CtaForm from './CtaForm.vue'

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

// === Пропсы ===
const props = withDefaults(
  defineProps<{
    // Визуальные (обёртка)
    title?: string
    subtitle?: string
    phone?: string
    telegram?: string
    max?: string
    maxLabel?: string

    // Для универсальной формы
    customFields?: CustomField[]
    messageConfig?: MessageConfig
    submitUrl?: string
    submitText?: string
    showFileUpload?: boolean
    maxFileSizeMb?: number
    maxFiles?: number
    idPrefix?: string

    // Legacy: для страниц без messageConfig (например, ofisy)
    sourceLabel?: string
    subjectTitle?: string
  }>(),
  {
    title: 'Получите смету и аудит рисков <span>за 24 часа</span>',
    subtitle:
      'Загрузите план или опишите задачу. Инженер найдёт слабые места и подготовит детальный расчёт. Консультация бесплатна.',
    maxLabel: 'ГлавПрофи',
    submitUrl: '/api/send-message',
    submitText: 'Получить расчёт',
    showFileUpload: true,
    maxFileSizeMb: 10,
    maxFiles: 5,
    idPrefix: 'application-cta',
    sourceLabel: 'CTA-блок на странице типа помещения',
    subjectTitle: 'Заявка на смету',
  }
)

// === Эмиты (проброс событий формы наружу) ===
const emit = defineEmits<{
  (e: 'success', data: unknown): void
  (e: 'error', err: unknown): void
}>()

// === Локальное состояние успеха ===
const showSuccess = ref(false)
const formKey = ref(0) // ключ для принудительного ремаунта CtaForm после сброса

const onFormSuccess = (data: unknown) => {
  showSuccess.value = true
  emit('success', data)
}

const onFormError = (err: unknown) => {
  emit('error', err)
}

const resetSuccess = () => {
  showSuccess.value = false
  formKey.value++ // сбрасываем форму через изменение ключа
}

// === Ссылки на альтернативные контакты ===
const telegramLink = computed(() => {
  if (!props.telegram) return '#'
  const handle = props.telegram.replace(/^@/, '').trim()
  return `https://t.me/${handle}`
})

const maxLink = computed(() => {
  if (!props.max) return '#'
  const value = props.max.trim()
  if (value.startsWith('http://') || value.startsWith('https://')) return value
  if (value.startsWith('@')) return `https://max.ru/${value.replace('@', '')}`
  return `https://max.ru/u/${value}`
})

const computedMaxLabel = computed(() => {
  if (props.maxLabel && props.maxLabel !== 'ГлавПрофи') return props.maxLabel
  if (!props.max) return 'ГлавПрофи'
  const value = props.max.trim()
  if (value.startsWith('@')) return value.slice(1)
  if (value.startsWith('http')) {
    try {
      const url = new URL(value)
      const path = url.pathname
      if (path && !path.startsWith('/u/')) return path.replace(/^\//, '')
    } catch {
      /* игнор */
    }
  }
  return 'ГлавПрофи'
})

// === messageConfig: явный пропс ИЛИ legacy-fallback из sourceLabel/subjectTitle ===
const computedMessageConfig = computed<MessageConfig>(() => {
  if (props.messageConfig) return props.messageConfig
  return {
    emoji: '🔥',
    title: props.subjectTitle,
    sourceLabel: props.sourceLabel,
    fieldLabels: {},
  }
})
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

      &:hover {
        color: $blue;
      }
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

  // === Футер ===
  &__footer {
    margin-top: 2.5rem;
    padding-top: 2rem;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
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

    &--max img {
      display: block;
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
@keyframes popIn {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
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
  }
}
</style>
<!-- app/components/pages/public/remontPomescheniy/pageTypes/ui/MiniEstimateForm.vue -->
<template>
  <form class="mini-form" novalidate @submit.prevent="submitForm">
    <h3 class="mini-form__title">Быстрый расчёт стоимости</h3>
    <p class="mini-form__subtitle">Ответим в течение 24 часов</p>

    <!-- 1. Плитки-кнопки: тип ремонта -->
    <div class="mini-form__section">
      <label class="mini-form__label">Вид ремонта</label>
      <div class="mini-form__tiles">
        <button
          v-for="option in repairTypes"
          :key="option.value"
          type="button"
          :class="[
            'mini-form__tile',
            { 'mini-form__tile--active': form.type === option.value }
          ]"
          @click="form.type = option.value"
        >
          <Icon :name="option.icon" size="22" class="mini-form__tile-icon" />
          <span class="mini-form__tile-label">{{ option.label }}</span>
        </button>
      </div>
    </div>

    <!-- 2. Площадь помещения -->
    <div class="mini-form__section">
      <label class="mini-form__label" :for="areaId">
        Площадь помещения
      </label>
      <div class="mini-form__area">
        <button
          type="button"
          class="mini-form__area-btn"
          :disabled="form.area <= minArea"
          aria-label="Уменьшить площадь"
          @click="decreaseArea"
        >
          <Icon name="mdi:minus" size="18" />
        </button>

        <div class="mini-form__area-input-wrap">
          <input
            :id="areaId"
            v-model.number="form.area"
            type="number"
            :min="minArea"
            :max="maxArea"
            class="mini-form__area-input"
            @input="clampArea"
          />
          <span class="mini-form__area-unit">м²</span>
        </div>

        <button
          type="button"
          class="mini-form__area-btn"
          :disabled="form.area >= maxArea"
          aria-label="Увеличить площадь"
          @click="increaseArea"
        >
          <Icon name="mdi:plus" size="18" />
        </button>
      </div>
      <p class="mini-form__hint">Шаг: {{ step }} м²</p>
    </div>

    <!-- 3. Телефон (с автоформатом) -->
    <div class="mini-form__section">
      <label class="mini-form__label" :for="phoneId">
        Телефон <span class="mini-form__required">*</span>
      </label>
      <input
        :id="phoneId"
        v-model="form.phone"
        v-phone-format
        type="tel"
        :class="[
          'mini-form__input',
          { 'mini-form__input--error': errors.phone }
        ]"
        placeholder="+7 (___) ___-__-__"
        autocomplete="tel"
        @focus="ensurePrefix"
        @blur="validatePhone"
      />
      <span v-if="errors.phone" class="mini-form__error">{{ errors.phone }}</span>
    </div>

    <!-- Кнопка отправки -->
    <button
      type="submit"
      class="mini-form__submit"
      :disabled="status === 'submitting'"
    >
      <span v-if="status === 'submitting'" class="mini-form__submit-loader">
        <span class="spinner" />
        Отправляем...
      </span>
      <span v-else class="mini-form__submit-default">
        <Icon name="mdi:calculator" size="18" />
        <span>Рассчитать стоимость</span>
      </span>
    </button>

    <!-- Состояния -->
    <p v-if="status === 'success'" class="mini-form__status mini-form__status--success">
      <Icon name="mdi:check-circle" size="18" />
      Заявка отправлена! Скоро свяжемся.
    </p>
    <p v-else-if="status === 'error'" class="mini-form__status mini-form__status--error">
      <Icon name="mdi:alert-circle" size="18" />
      Не удалось отправить. Попробуйте позже.
    </p>

    <p class="mini-form__privacy">
      Нажимая кнопку, вы соглашаетесь с обработкой персональных данных
    </p>
  </form>
</template>

<script setup lang="ts">
import { reactive, ref, computed } from 'vue'

type FormStatus = 'idle' | 'submitting' | 'success' | 'error'

interface RepairTypeOption {
  value: string
  label: string
  icon: string
}

interface FormErrors {
  phone?: string
}

const props = withDefaults(
  defineProps<{
    /** URL API для отправки */
    submitUrl?: string
    /** Тип помещения (slug) — передаётся в форме */
    roomType?: string
    /** Начальная площадь */
    defaultArea?: number
    /** Мин./макс. площадь */
    minArea?: number
    maxArea?: number
    /** Шаг изменения площади */
    step?: number
    /** Уникальный префикс для ID полей */
    idPrefix?: string
    /** Кастомные варианты ремонта */
    repairTypes?: RepairTypeOption[]
  }>(),
  {
    submitUrl: '/api/send-message',
    roomType: 'ofisy',
    defaultArea: 100,
    minArea: 10,
    maxArea: 10000,
    step: 10,
    idPrefix: 'mini-estimate',
  }
)

const emit = defineEmits<{
  (e: 'submit', data: { type: string; area: number; phone: string; roomType: string }): void
}>()

// === Детерминированные ID ===
const areaId = computed(() => `${props.idPrefix}-area`)
const phoneId = computed(() => `${props.idPrefix}-phone`)

// === Варианты ремонта (дефолтные или кастомные) ===
const defaultRepairTypes: RepairTypeOption[] = [
  { value: 'capital', label: 'Капитальный', icon: 'mdi:hammer-wrench' },
  { value: 'cosmetic', label: 'Косметический', icon: 'mdi:format-paint' },
  // { value: 'rough', label: 'Черновая', icon: 'mdi:layers-outline' },
  { value: 'design', label: 'Дизайнерский', icon: 'mdi:palette-outline' },
]

const repairTypes = computed<RepairTypeOption[]>(
  () => props.repairTypes ?? defaultRepairTypes
)

// === Состояние формы ===
const form = reactive({
  type: 'capital',
  area: props.defaultArea,
  phone: '+7 ',
})

const errors = reactive<FormErrors>({})
const status = ref<FormStatus>('idle')

// === Префикс "+7 " при фокусе на пустом поле ===
const ensurePrefix = () => {
  if (!form.phone.trim() || form.phone === '+7') {
    form.phone = '+7 '
  }
}

// === Работа с площадью ===
const clampArea = () => {
  if (form.area < props.minArea) form.area = props.minArea
  if (form.area > props.maxArea) form.area = props.maxArea
  if (!form.area || isNaN(form.area)) form.area = props.minArea
}

const increaseArea = () => {
  const next = Math.min(props.maxArea, form.area + props.step)
  form.area = next
}

const decreaseArea = () => {
  const next = Math.max(props.minArea, form.area - props.step)
  form.area = next
}

// === Валидация телефона ===
const validatePhone = () => {
  delete errors.phone

  if (!form.phone.trim()) {
    errors.phone = 'Укажите номер телефона'
    return
  }

  const digits = form.phone.replace(/\D/g, '')
  if (digits.length < 11) {
    errors.phone = 'Введите корректный номер'
  }
}

// === Хелпер: человекочитаемое название типа ремонта ===
const getRepairTypeLabel = (value: string): string => {
  const found = repairTypes.value.find((r) => r.value === value)
  return found?.label || value
}

// === Хелпер: человекочитаемое название типа помещения ===
const getRoomTypeLabel = (slug: string): string => {
  const map: Record<string, string> = {
    ofisy: 'Офисы',
    kliniki: 'Клиники',
    magaziny: 'Магазины',
    sklady: 'Склады',
    restorany: 'Рестораны',
  }
  return map[slug] || slug
}

// === Формирование HTML-сообщения для Telegram/Email ===
const buildMessage = (): string => {
  const now = new Date().toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const phoneDigits = form.phone.replace(/\D/g, '')
  const phoneLink = `<a href="tel:${phoneDigits}">${form.phone}</a>`

  return `
<b>⚡ Быстрый расчёт стоимости</b>

<b>Источник:</b> ${getRoomTypeLabel(props.roomType)} — Hero-форма
<b>Дата:</b> ${now}

<b>Телефон:</b> ${phoneLink}
<b>Тип ремонта:</b> ${getRepairTypeLabel(form.type)}
<b>Площадь:</b> ${form.area} м²

<i>Заявка с сайта ГлавПрофи</i>`.trim()
}

// === Текстовый комментарий для email ===
const buildComment = (): string => {
  return [
    `Источник: ${getRoomTypeLabel(props.roomType)} — Hero-форма`,
    `Тип ремонта: ${getRepairTypeLabel(form.type)}`,
    `Площадь: ${form.area} м²`,
  ].join('\n')
}

// === Отправка ===
const submitForm = async () => {
  validatePhone()
  if (errors.phone) return

  status.value = 'submitting'

  try {
    const formData = new FormData()
    formData.append('message', buildMessage())
    if (form.phone) formData.append('phone', form.phone)
    formData.append('comment', buildComment())

    await $fetch(props.submitUrl, {
      method: 'POST',
      body: formData,
    })

    status.value = 'success'

    const payload = {
      type: form.type,
      area: form.area,
      phone: form.phone,
      roomType: props.roomType,
    }
    emit('submit', payload)

    // Сброс формы через 4 секунды
    setTimeout(() => {
      if (status.value === 'success') {
        form.phone = '+7 '
        form.area = props.defaultArea
        form.type = 'capital'
        status.value = 'idle'
      }
    }, 4000)
  } catch (err) {
    console.error('[MiniEstimateForm] Ошибка отправки:', err)
    status.value = 'error'
  }
}
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;

span {
  color: unset;
}

.mini-form {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  color: $text-light;

  &__title {
    font-family: 'Rubik', sans-serif;
    font-size: 1.35rem;
    font-weight: 700;
    margin: 0;
    color: $text-light;
    line-height: 1.25;
  }

  &__subtitle {
    font-size: 0.88rem;
    color: rgba($text-light, 0.65);
    margin: -0.4rem 0 0.2rem;
  }

  // === Секция ===
  &__section {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  &__label {
    font-size: 0.88rem;
    font-weight: 500;
    color: rgba($text-light, 0.88);
    display: flex;
    align-items: center;
    gap: 0.3rem;
  }

  &__required {
    color: #ff6b6b;
  }

  &__hint {
    font-size: 0.78rem;
    color: rgba($text-light, 0.5);
    margin: 0.2rem 0 0;
  }

  // === Плитки ===
  &__tiles {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
  }

  &__tile {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.35rem;
    padding: 0.75rem 0.5rem;
    background: rgba(255, 255, 255, 0.04);
    border: 1.5px solid rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    color: rgba($text-light, 0.85);
    cursor: pointer;
    transition: all 0.25s ease;
    font-family: 'Rubik', sans-serif;

    &:hover {
      border-color: rgba(0, 195, 245, 0.4);
      background: rgba(0, 195, 245, 0.06);
      color: $text-light;
    }

    &--active {
      border-color: $blue;
      background: rgba(0, 195, 245, 0.12);
      color: $blue-light;
      box-shadow: 0 0 0 3px rgba(0, 195, 245, 0.12);
    }

    &-icon {
      transition: transform 0.25s ease;
    }

    &--active &-icon {
      transform: scale(1.1);
    }

    &-label {
      font-size: 0.82rem;
      font-weight: 500;
      text-align: center;
      line-height: 1.2;
    }
  }

  // === Площадь ===
  &__area {
    display: flex;
    align-items: stretch;
    gap: 0.4rem;
    background: rgba(255, 255, 255, 0.04);
    border: 1.5px solid rgba(255, 255, 255, 0.12);
    border-radius: 10px;
    padding: 0.25rem;

    &:focus-within {
      border-color: $blue;
      background: rgba(0, 195, 245, 0.04);
      box-shadow: 0 0 0 3px rgba(0, 195, 245, 0.12);
    }
  }

  &__area-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 38px;
    flex-shrink: 0;
    background: rgba(255, 255, 255, 0.06);
    border: none;
    border-radius: 8px;
    color: $text-light;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover:not(:disabled) {
      background: rgba(0, 195, 245, 0.15);
      color: $blue-light;
    }

    &:disabled {
      opacity: 0.35;
      cursor: not-allowed;
    }
  }

  &__area-input-wrap {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.3rem;
    min-width: 0;
    padding: 0 0.3rem;
  }

  &__area-input {
    width: 100%;
    max-width: 90px;
    background: transparent;
    border: none;
    outline: none;
    color: $text-light;
    font-family: 'Rubik', sans-serif;
    font-size: 1.15rem;
    font-weight: 600;
    text-align: center;
    padding: 0.4rem 0;
    -moz-appearance: textfield;

    &::-webkit-outer-spin-button,
    &::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }

    &:focus {
      box-shadow: none;
      border: none;
    }
  }

  &__area-unit {
    font-size: 0.95rem;
    color: rgba($text-light, 0.6);
    font-weight: 500;
  }

  // === Поле телефона ===
  &__input {
    padding: 0.8rem 1rem;
    background: rgba(255, 255, 255, 0.04);
    border: 1.5px solid rgba(255, 255, 255, 0.12);
    border-radius: 10px;
    color: $text-light;
    font-family: 'Rubik', sans-serif;
    font-size: 0.95rem;
    transition: all 0.25s ease;

    &::placeholder {
      color: rgba($text-light, 0.4);
    }

    &:focus {
      outline: none;
      border-color: $blue;
      background: rgba(0, 195, 245, 0.04);
      box-shadow: 0 0 0 3px rgba(0, 195, 245, 0.12);
    }

    &--error {
      border-color: rgba(#ff6b6b, 0.6);
      &:focus {
        border-color: #ff6b6b;
        box-shadow: 0 0 0 3px rgba(#ff6b6b, 0.12);
      }
    }
  }

  &__error {
    font-size: 0.8rem;
    color: #ff8c8c;
    margin-top: -0.2rem;
  }

  // === Кнопка отправки ===
  &__submit {
    margin-top: 0.3rem;
    padding: 0.95rem 1.5rem;
    background: $blue-gradient;
    color: $background-dark;
    border: none;
    border-radius: 10px;
    font-family: 'Rubik', sans-serif;
    font-size: 1rem;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 6px 20px rgba(0, 195, 245, 0.35);
    transition: all 0.3s ease;

    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 10px 28px rgba(0, 195, 245, 0.5);
    }

    &:active:not(:disabled) {
      transform: translateY(-1px);
    }

    &:disabled {
      cursor: not-allowed;
      opacity: 0.85;
    }
  }

  &__submit-default,
  &__submit-loader {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }

  .spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba($background-dark, 0.3);
    border-top-color: $background-dark;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  // === Статусы ===
  &__status {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.7rem 0.9rem;
    border-radius: 8px;
    font-size: 0.88rem;
    margin: 0;

    &--success {
      background: rgba($green, 0.12);
      color: #4ade80;
      border: 1px solid rgba($green, 0.3);
    }

    &--error {
      background: rgba(#ff6b6b, 0.12);
      color: #ff8c8c;
      border: 1px solid rgba(#ff6b6b, 0.3);
    }
  }

  // === Политика ===
  &__privacy {
    font-size: 0.72rem;
    line-height: 1.5;
    color: rgba($text-light, 0.45);
    text-align: center;
    margin: 0;
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

// === Адаптив ===
@media (max-width: 480px) {
  .mini-form {
    &__title {
      font-size: 1.2rem;
    }

    &__tiles {
      grid-template-columns: repeat(2, 1fr);
      gap: 0.4rem;
    }

    &__tile {
      padding: 0.65rem 0.4rem;

      &-label {
        font-size: 0.78rem;
      }
    }

    &__submit {
      padding: 0.85rem 1rem;
      font-size: 0.95rem;
    }
  }
}
</style>
<!-- app/components/ui/calculator/modals/LeadModal.vue -->
 <template>
  <Transition name="modal-fade">
    <div
      v-if="isOpen"
      class="lead-modal-overlay"
      @click.self="close"
    >
      <div class="lead-modal" role="dialog" aria-modal="true" aria-labelledby="lead-modal-title">
          <!-- Кнопка закрытия -->
          <button
            type="button"
            class="lead-modal__close"
            aria-label="Закрыть"
            @click="close"
          >
            <Icon name="mdi:close" size="24" />
          </button>

          <div class="lead-modal__content">
            <!-- Экран успеха -->
            <div v-if="status === 'success'" class="lead-modal__success">
              <div class="success-icon">
                <Icon name="mdi:check-circle" size="64" />
              </div>
              <h3 class="success-title">Заявка отправлена!</h3>
              <p class="success-text">
                Инженер свяжется с вами в течение 24 часов для уточнения деталей и подготовки точной сметы.
              </p>
              <button class="btn-secondary" @click="close">
                Закрыть
              </button>
            </div>

            <!-- Форма -->
            <template v-else>
              <header class="lead-modal__header">
                <h2 id="lead-modal-title" class="lead-modal__title">
                  Получить точную смету
                </h2>
                <p class="lead-modal__subtitle">
                  Заполните форму — инженер подготовит детальную смету и свяжется с вами в течение 24 часов.
                </p>

                <!-- Превью расчёта -->
                <div v-if="total > 0" class="calc-preview">
                  <div class="calc-preview__row">
                    <span>Площадь:</span>
                    <strong>{{ area }} м²</strong>
                  </div>
                  <div class="calc-preview__row calc-preview__row--main">
                    <span>Предварительный итог:</span>
                    <strong>{{ formatPrice(total) }} ₽</strong>
                  </div>
                </div>
              </header>

              <form class="lead-modal__form" novalidate @submit.prevent="submitForm">
                <!-- Имя -->
                <div class="form-field">
                  <label class="form-label" :for="`${idPrefix}-name`">
                    Ваше имя
                  </label>
                  <input
                    :id="`${idPrefix}-name`"
                    v-model="form.name"
                    type="text"
                    class="form-input"
                    placeholder="Как к вам обращаться"
                    autocomplete="name"
                  />
                </div>

                <!-- Телефон -->
                <div class="form-field">
                  <label class="form-label" :for="`${idPrefix}-phone`">
                    Телефон <span class="required">*</span>
                  </label>
                  <input
                    :id="`${idPrefix}-phone`"
                    v-model="form.phone"
                    v-phone-format
                    type="tel"
                    class="form-input"
                    :class="{ 'is-error': errors.phone }"
                    placeholder="+7 (___) ___-__-__"
                    autocomplete="tel"
                    @focus="ensurePrefix"
                  />
                  <span v-if="errors.phone" class="form-error">{{ errors.phone }}</span>
                </div>

                <!-- Комментарий -->
                <div class="form-field">
                  <label class="form-label" :for="`${idPrefix}-comment`">
                    Комментарий
                    <span class="hint">(необязательно)</span>
                  </label>
                  <textarea
                    :id="`${idPrefix}-comment`"
                    v-model="form.comment"
                    class="form-input form-textarea"
                    placeholder="Удобное время для звонка, особые пожелания..."
                    rows="3"
                  />
                </div>

                <!-- Согласие -->
                <label class="form-consent">
                  <input v-model="form.consent" type="checkbox" class="form-consent__input" />
                  <span class="form-consent__box">
                    <Icon v-if="form.consent" name="mdi:check" size="14" />
                  </span>
                  <p class="form-consent__text">
                    Согласен на обработку персональных данных
                  </p>
                </label>
                <span v-if="errors.consent" class="form-error">{{ errors.consent }}</span>

                <!-- Кнопка -->
                <button
                  type="submit"
                  class="btn-submit"
                  :disabled="status === 'submitting'"
                >
                  <span v-if="status === 'submitting'" class="btn-loader">
                    <span class="spinner" />
                    Отправляем...
                  </span>
                  <span v-else class="btn-default">
                    <Icon name="mdi:send" size="18" />
                    <span>Отправить заявку</span>
                  </span>
                </button>

                <!-- Ошибка -->
                <p v-if="status === 'error'" class="form-error-msg">
                  <Icon name="mdi:alert-circle" size="18" />
                  Не удалось отправить. Попробуйте позже.
                </p>
              </form>
            </template>
          </div>
        </div>
      </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted, onBeforeUnmount, nextTick, computed } from 'vue'
import type { CalculationResult, CalculatorState, WorkUnit } from '~/types/calculator'

// -----------------------------------------------------------------------------
// 1. Props & Emits
// -----------------------------------------------------------------------------
const props = withDefaults(
  defineProps<{
    isOpen: boolean
    result: CalculationResult
    area: number
    calculatorState: CalculatorState
    allWorks: Array<{ id: number; name: string; pricePerUnit: number; normalizedUnit: WorkUnit }>
    sourceLabel?: string
  }>(),
  {
    sourceLabel: 'Калькулятор ремонта',
  }
)

const emit = defineEmits<{
  'update:isOpen': [value: boolean]
  'success': []
}>()

// -----------------------------------------------------------------------------
// 2. Состояние
// -----------------------------------------------------------------------------
type FormStatus = 'idle' | 'submitting' | 'success' | 'error'

const idPrefix = 'lead-modal'
const status = ref<FormStatus>('idle')

const form = reactive({
  name: '',
  phone: '+7 ',
  comment: '',
  consent: false,
})

const errors = reactive<{ phone?: string; consent?: string }>({})

// -----------------------------------------------------------------------------
// 3. Хелперы
// -----------------------------------------------------------------------------
const total = computed(() => {
  const val = props.result?.summary?.grandTotal
  return typeof val === 'number' ? val : 0
})

function formatPrice(price: number): string {
  return new Intl.NumberFormat('ru-RU').format(Math.round(price))
}

function getUnitLabel(unit: WorkUnit): string {
  switch (unit) {
    case 'm2': return 'м²'
    case 'linear': return 'м.п.'
    default: return 'шт'
  }
}

function ensurePrefix() {
  if (!form.phone.trim() || form.phone === '+7') {
    form.phone = '+7 '
  }
}

function findWork(id: number) {
  return props.allWorks.find((w) => w.id === id)
}

// -----------------------------------------------------------------------------
// 4. Управление открытием/закрытием
// -----------------------------------------------------------------------------
function close() {
  emit('update:isOpen', false)
}

function handleEscape(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.isOpen) {
    close()
  }
}

// Блокируем скролл body при открытой модалке
watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      document.body.style.overflow = 'hidden'
      // Фокус на первое поле после открытия
      nextTick(() => {
        const firstInput = document.querySelector<HTMLInputElement>(
          `#${idPrefix}-name`
        )
        firstInput?.focus()
      })
    } else {
      document.body.style.overflow = ''
      // Сбрасываем форму при закрытии (если не успех — чтобы можно было отправить ещё)
      if (status.value !== 'success') {
        resetForm()
      }
    }
  }
)

// -----------------------------------------------------------------------------
// 5. Формирование сообщения
// -----------------------------------------------------------------------------
function buildMessage(): string {
  const now = new Date().toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const phoneDigits = form.phone.replace(/\D/g, '')
  const phoneLink = `<a href="tel:${phoneDigits}">${form.phone}</a>`
  const s = props.calculatorState

  const lines: string[] = [
    `<b>🧮 Заявка из калькулятора ремонта</b>`,
    ``,
    `<b>Источник:</b> ${props.sourceLabel}`,
    `<b>Дата:</b> ${now}`,
    ``,
    `<b>Имя:</b> ${form.name || '—'}`,
    `<b>Телефон:</b> ${phoneLink}`,
  ]

  if (form.comment.trim()) {
    lines.push(``, `<b>Комментарий:</b>`, form.comment.trim())
  }

  lines.push(``, `<b>📐 Параметры помещения:</b>`)
  lines.push(`  • Площадь пола: <b>${s.dimensions.floorArea} м²</b>`)
  lines.push(`  • Высота потолков: <b>${s.dimensions.height} м</b>`)
  if (s.dimensions.perimeter !== null) {
    lines.push(`  • Периметр стен: <b>${s.dimensions.perimeter} м.п.</b>`)
  }
  if (s.dimensions.wallArea !== null) {
    lines.push(`  • Площадь стен: <b>${s.dimensions.wallArea} м²</b>`)
  }

  if (s.demolitionWorks.length > 0) {
    lines.push(``, `<b>🔨 Демонтаж (${s.demolitionWorks.length}):</b>`)
    let demoTotal = 0
    for (const w of s.demolitionWorks) {
      const work = findWork(w.itemId)
      if (!work) continue
      const subtotal = work.pricePerUnit * w.quantity
      demoTotal += subtotal
      lines.push(
        `  • ${work.name}: ${w.quantity} ${getUnitLabel(work.normalizedUnit)} — <b>${formatPrice(subtotal)} ₽</b>`
      )
    }
    lines.push(`  <i>Итого демонтаж: ${formatPrice(demoTotal)} ₽</i>`)
  }

  if (s.surfaceInstances.length > 0) {
    lines.push(``, `<b>🎨 Чистовые покрытия (${s.surfaceInstances.length}):</b>`)
    for (const inst of s.surfaceInstances) {
      lines.push(`  • <b>${inst.finishGroupId}</b> — ${inst.area} м²`)

      if (inst.options && Object.keys(inst.options).length > 0) {
        for (const [key, val] of Object.entries(inst.options)) {
          lines.push(`    — ${key}: ${val}`)
        }
      }

      if (inst.excludedItemIds?.length) {
        const names = inst.excludedItemIds
          .map((id) => findWork(id)?.name)
          .filter(Boolean)
          .join(', ')
        if (names) {
          lines.push(`    — <i>Исключено: ${names}</i>`)
        }
      }

      if (inst.extras?.length) {
        for (const extra of inst.extras) {
          const work = findWork(extra.itemId)
          if (!work) continue
          const subtotal = work.pricePerUnit * extra.qty
          lines.push(
            `    — + ${work.name}: ${extra.qty} ${getUnitLabel(work.normalizedUnit)} (${formatPrice(subtotal)} ₽)`
          )
        }
      }
    }
  }

  if (s.pieceWorks.length > 0) {
    lines.push(``, `<b>🛠 Доп. работы (${s.pieceWorks.length}):</b>`)
    let pieceTotal = 0
    for (const w of s.pieceWorks) {
      const work = findWork(w.itemId)
      if (!work) continue
      const subtotal = work.pricePerUnit * w.quantity
      pieceTotal += subtotal
      lines.push(
        `  • ${work.name}: ${w.quantity} ${getUnitLabel(work.normalizedUnit)} — <b>${formatPrice(subtotal)} ₽</b>`
      )
    }
    lines.push(`  <i>Итого доп. работы: ${formatPrice(pieceTotal)} ₽</i>`)
  }

  lines.push(``, `━━━━━━━━━━━━━━━━`)
  lines.push(`<b>💰 ИТОГО: ${formatPrice(total.value)} ₽</b>`)
  if (props.area > 0 && total.value > 0) {
    lines.push(`<i>(≈ ${formatPrice(Math.round(total.value / props.area))} ₽/м²)</i>`)
  }
  lines.push(``, `<i>Заявка с сайта ГлавПрофи</i>`)

  return lines.join('\n')
}

function buildComment(): string {
  const lines: string[] = []
  const s = props.calculatorState

  // === 1. Базовая информация ===
  lines.push(`Источник: ${props.sourceLabel}`)
  const area = typeof props.area === 'number' ? props.area : 0
  lines.push(`Площадь: ${area} м²`)
  lines.push(`Итого по калькулятору: ${formatPrice(total.value)} ₽`)
  const pricePerM2 = area > 0 && total.value > 0 ? Math.round(total.value / area) : 0
  if (pricePerM2 > 0) {
    lines.push(`Цена за м²: ≈ ${formatPrice(pricePerM2)} ₽`)
  }

  // === 2. Комментарий пользователя (если есть) ===
  if (form.comment.trim()) {
    lines.push('')
    lines.push('Комментарий клиента:')
    lines.push(form.comment.trim())
  }

  // === 3. Параметры помещения ===
  lines.push('')
  lines.push('════════════════════════════════')
  lines.push('📐 ПАРАМЕТРЫ ПОМЕЩЕНИЯ')
  lines.push('════════════════════════════════')
  lines.push(`Площадь пола: ${s.dimensions.floorArea} м²`)
  lines.push(`Высота потолков: ${s.dimensions.height} м`)
  if (s.dimensions.perimeter !== null) {
    lines.push(`Периметр стен: ${s.dimensions.perimeter} м.п.`)
  }
  if (s.dimensions.wallArea !== null) {
    lines.push(`Площадь стен: ${s.dimensions.wallArea} м²`)
  }

  // === 4. Демонтажные работы ===
  if (s.demolitionWorks.length > 0) {
    lines.push('')
    lines.push('════════════════════════════════')
    lines.push(`🔨 ДЕМОНТАЖ (${s.demolitionWorks.length} поз.)`)
    lines.push('════════════════════════════════')
    
    let demoTotal = 0
    for (const w of s.demolitionWorks) {
      const work = findWork(w.itemId)
      if (!work) continue
      const subtotal = work.pricePerUnit * w.quantity
      demoTotal += subtotal
      lines.push(`• ${work.name}`)
      lines.push(`  ${w.quantity} ${getUnitLabel(work.normalizedUnit)} × ${formatPrice(work.pricePerUnit)} ₽ = ${formatPrice(subtotal)} ₽`)
    }
    lines.push('')
    lines.push(`Итого демонтаж: ${formatPrice(demoTotal)} ₽`)
  }

  // === 5. Чистовые покрытия ===
  if (s.surfaceInstances.length > 0) {
    lines.push('')
    lines.push('════════════════════════════════')
    lines.push(`🎨 ЧИСТОВЫЕ ПОКРЫТИЯ (${s.surfaceInstances.length} поз.)`)
    lines.push('════════════════════════════════')
    
    for (const inst of s.surfaceInstances) {
      lines.push('')
      lines.push(`▸ ${inst.finishGroupId} — ${inst.area} м²`)
      
      // Выбранные опции
      if (inst.options && Object.keys(inst.options).length > 0) {
        for (const [key, val] of Object.entries(inst.options)) {
          lines.push(`  • ${key}: ${val}`)
        }
      }
      
      // Исключённые работы
      if (inst.excludedItemIds?.length) {
        const excludedNames = inst.excludedItemIds
          .map((id) => findWork(id)?.name)
          .filter(Boolean)
        if (excludedNames.length) {
          lines.push(`  ⚠ Исключено: ${excludedNames.join(', ')}`)
        }
      }
      
      // Доп. работы
      if (inst.extras?.length) {
        lines.push('  Дополнительные работы:')
        for (const extra of inst.extras) {
          const work = findWork(extra.itemId)
          if (!work) continue
          const subtotal = work.pricePerUnit * extra.qty
          lines.push(`    + ${work.name}: ${extra.qty} ${getUnitLabel(work.normalizedUnit)} (${formatPrice(subtotal)} ₽)`)
        }
      }
    }
  }

  // === 6. Штучные/погонные работы ===
  if (s.pieceWorks.length > 0) {
    lines.push('')
    lines.push('════════════════════════════════')
    lines.push(`🛠 ДОП. РАБОТЫ (${s.pieceWorks.length} поз.)`)
    lines.push('════════════════════════════════')
    
    let pieceTotal = 0
    for (const w of s.pieceWorks) {
      const work = findWork(w.itemId)
      if (!work) continue
      const subtotal = work.pricePerUnit * w.quantity
      pieceTotal += subtotal
      lines.push(`• ${work.name}`)
      lines.push(`  ${w.quantity} ${getUnitLabel(work.normalizedUnit)} × ${formatPrice(work.pricePerUnit)} ₽ = ${formatPrice(subtotal)} ₽`)
    }
    lines.push('')
    lines.push(`Итого доп. работы: ${formatPrice(pieceTotal)} ₽`)
  }

  // === 7. Финальный итог ===
  lines.push('')
  lines.push('════════════════════════════════')
  lines.push(`💰 ИТОГО: ${formatPrice(total.value)} ₽`)
  lines.push('════════════════════════════════')

  return lines.join('\n')
}

// -----------------------------------------------------------------------------
// 6. Валидация и отправка
// -----------------------------------------------------------------------------
function validate(): boolean {
  ;(Object.keys(errors) as (keyof typeof errors)[]).forEach((k) => delete errors[k])

  if (!form.phone.trim()) {
    errors.phone = 'Укажите номер телефона'
  } else {
    const digits = form.phone.replace(/\D/g, '')
    if (digits.length < 11) {
      errors.phone = 'Введите корректный номер'
    }
  }

  if (!form.consent) {
    errors.consent = 'Необходимо согласие на обработку данных'
  }

  return Object.keys(errors).length === 0
}

async function submitForm() {
  if (!validate()) return

  status.value = 'submitting'

  try {
    const formData = new FormData()
    formData.append('message', buildMessage())
    if (form.name) formData.append('name', form.name)
    if (form.phone) formData.append('phone', form.phone)
    formData.append('comment', buildComment())

    await $fetch('/api/send-message', {
      method: 'POST',
      body: formData,
    })

    status.value = 'success'
    emit('success')

    // Автозакрытие через 5 секунд после успеха
    setTimeout(() => {
      if (status.value === 'success') {
        close()
      }
    }, 5000)
  } catch (err) {
    console.error('[LeadModal] Ошибка отправки:', err)
    status.value = 'error'
  }
}

// -----------------------------------------------------------------------------
// 7. Сброс формы
// -----------------------------------------------------------------------------
function resetForm() {
  form.name = ''
  form.phone = '+7 '
  form.comment = ''
  form.consent = false
  status.value = 'idle'
  ;(Object.keys(errors) as (keyof typeof errors)[]).forEach((k) => delete errors[k])
}

// -----------------------------------------------------------------------------
// 8. Жизненный цикл
// -----------------------------------------------------------------------------
onMounted(() => {
  document.addEventListener('keydown', handleEscape)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleEscape)
  document.body.style.overflow = ''
})
</script>

<style lang="scss" scoped>
@use "@/assets/styles/variables" as *;

span {
  color: unset;
}

// === Оверлей (backdrop) ===
.lead-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
}

// === Модалка ===
.lead-modal {
  position: relative;
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  overflow-y: auto;
  background: $background-dark;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.5);

  // Градиентная линия сверху
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: $blue-gradient;
    border-radius: 16px 16px 0 0;
  }

  // Кастомный скроллбар
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.15) transparent;

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.15);
    border-radius: 3px;
  }
}

// === Кнопка закрытия ===
.lead-modal__close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba($text-light, 0.7);
  border-radius: 50%;
  cursor: pointer;
  z-index: 2;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 107, 107, 0.15);
    border-color: rgba(255, 107, 107, 0.3);
    color: #ff8c8c;
  }
}

// === Контент ===
.lead-modal__content {
  padding: 2.5rem 2rem;
}

.lead-modal__header {
  margin-bottom: 1.8rem;
  text-align: center;
}

.lead-modal__title {
  font-family: 'Rubik', sans-serif;
  font-size: 1.6rem;
  font-weight: 700;
  color: $text-light;
  margin: 0 0 0.5rem;
  line-height: 1.25;

  @media (max-width: 480px) {
    font-size: 1.35rem;
  }
}

.lead-modal__subtitle {
  font-size: 0.92rem;
  line-height: 1.5;
  color: rgba($text-light, 0.65);
  margin: 0 0 1.2rem;
}

// === Превью расчёта ===
.calc-preview {
  background: rgba(0, 195, 245, 0.06);
  border: 1px solid rgba(0, 195, 245, 0.2);
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;

  &__row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.9rem;
    color: rgba($text-light, 0.75);
    font-family: 'Rubik', sans-serif;

    strong {
      color: $text-light;
      font-weight: 600;
    }

    &--main {
      padding-top: 0.5rem;
      margin-top: 0.3rem;
      border-top: 1px dashed rgba(0, 195, 245, 0.2);
      font-size: 1rem;

      strong {
        color: $blue-light;
        font-weight: 700;
        font-size: 1.1rem;
      }
    }
  }
}

// === Форма ===
.lead-modal__form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.form-label {
  font-size: 0.88rem;
  font-weight: 500;
  color: rgba($text-light, 0.85);
  font-family: 'Rubik', sans-serif;

  .required { color: #ff6b6b; }
  .hint {
    font-weight: 400;
    color: rgba($text-light, 0.5);
    font-size: 0.78rem;
    margin-left: 0.3rem;
  }
}

.form-input {
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.04);
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

  &:focus {
    outline: none;
    border-color: $blue;
    background: rgba(0, 195, 245, 0.06);
    box-shadow: 0 0 0 3px rgba(0, 195, 245, 0.12);
  }

  &.is-error {
    border-color: rgba(#ff6b6b, 0.6);
    &:focus {
      border-color: #ff6b6b;
      box-shadow: 0 0 0 3px rgba(#ff6b6b, 0.12);
    }
  }
}

.form-textarea {
  resize: vertical;
  min-height: 70px;
  max-height: 140px;
}

.form-error {
  font-size: 0.8rem;
  color: #ff8c8c;
  margin-top: 0.1rem;
}

// === Согласие ===
.form-consent {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  cursor: pointer;
  user-select: none;

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
    width: 18px;
    height: 18px;
    border: 1.5px solid rgba($text-light, 0.3);
    border-radius: 4px;
    color: $background-dark;
    transition: all 0.2s ease;
    margin-top: 2px;
  }

  &__input:checked + &__box {
    background: $blue-gradient;
    border-color: transparent;
  }

  &__text {
    font-size: 0.82rem;
    line-height: 1.5;
    color: rgba($text-light, 0.65);
  }
}

// === Кнопки ===
.btn-submit {
  margin-top: 0.5rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  background: $blue-gradient;
  color: $background-dark;
  border: none;
  padding: 1rem 2rem;
  border-radius: 50px;
  font-size: 1rem;
  font-weight: 700;
  font-family: 'Rubik', sans-serif;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 100%;
  box-shadow: 0 8px 24px rgba(0, 195, 245, 0.35);

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 14px 32px rgba(0, 195, 245, 0.5);
  }

  &:disabled {
    opacity: 0.75;
    cursor: not-allowed;
  }
}

.btn-default,
.btn-loader {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-secondary {
  padding: 0.6rem 1.4rem;
  background: transparent;
  border: 1px solid rgba($text-light, 0.25);
  color: rgba($text-light, 0.85);
  border-radius: 50px;
  font-family: 'Rubik', sans-serif;
  font-size: 0.88rem;
  cursor: pointer;
  transition: all 0.25s ease;

  &:hover {
    border-color: $blue;
    color: $blue-light;
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

// === Ошибка ===
.form-error-msg {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: rgba(#ff6b6b, 0.1);
  border: 1px solid rgba(#ff6b6b, 0.3);
  border-radius: 10px;
  color: #ff8c8c;
  font-size: 0.88rem;
  margin: 0;
}

// === Экран успеха ===
.lead-modal__success {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 1rem 0;
  gap: 0.8rem;
}

.success-icon {
  color: $green;
  animation: popIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.success-title {
  font-family: 'Rubik', sans-serif;
  font-size: 1.5rem;
  font-weight: 700;
  color: $text-light;
  margin: 0;
}

.success-text {
  font-size: 0.95rem;
  line-height: 1.6;
  color: $text-light;
  margin: 0;
  max-width: 360px;
}

// === Анимации ===
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.25s ease;

  .lead-modal {
    transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.25s ease;
  }
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;

  .lead-modal {
    transform: scale(0.95) translateY(-10px);
    opacity: 0;
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes popIn {
  0% { transform: scale(0); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

// === Адаптив ===
@media (max-width: 480px) {
  .lead-modal-overlay {
    padding: 0.8rem;
  }

  .lead-modal__content {
    padding: 2rem 1.3rem;
  }

  .lead-modal__close {
    top: 0.7rem;
    right: 0.7rem;
    width: 32px;
    height: 32px;
  }
}
</style>
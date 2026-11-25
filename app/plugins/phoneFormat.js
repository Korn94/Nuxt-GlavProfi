// app/plugins/phoneFormat.js
/**
 * Директива v-phone-format: живое форматирование РФ-телефона в любом поле ввода.
 *
 * Логика нормализации — в shared/utils/phone.ts (единая для клиента и сервера).
 * Директива отвечает только за DOM: форматирование по мере ввода, вставку из буфера
 * и сохранение позиции курсора.
 *
 * ⚠️ Плагин универсальный (НЕ .client): при SSR Vue должен найти директиву,
 * иначе в консоли появляется «Failed to resolve directive: phone-format».
 */
import { defineNuxtPlugin } from '#app'
import {
  caretPositionAfterNationalDigits,
  countNationalDigitsBefore,
  formatRuPhone,
  getRuNationalDigits,
} from 'shared/utils/phone'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.directive('phone-format', {
    mounted(el) {
      // Флаг от рекурсии: синтетический input не должен запускать наш же обработчик
      let formatting = false

      /**
       * Записать отформатированное значение в поле и синхронизировать v-model.
       * @param {string} nextValue
       * @param {{ keepCaret?: boolean, bubbles?: boolean }} [options]
       */
      const apply = (nextValue, options = {}) => {
        const { keepCaret = true, bubbles = true } = options
        if (el.value === nextValue) return

        const caret = el.selectionStart ?? el.value.length
        // Считаем цифры национальной части (без кода страны «+7») — иначе курсор
        // после первой набранной цифры встаёт сразу после префикса.
        const bodyBefore = keepCaret ? countNationalDigitsBefore(el.value, caret) : 0

        el.value = nextValue

        if (keepCaret) {
          const position = getRuNationalDigits(nextValue)
            ? caretPositionAfterNationalDigits(nextValue, bodyBefore)
            : nextValue.length

          try {
            el.setSelectionRange(position, position)
          } catch {
            // Некоторые браузеры/типы input не поддерживают setSelectionRange — не критично
          }
        }

        // v-model слушает input на самом элементе. Всплытие нужно только микро-трекингу
        // формы (form_typing), поэтому при инициализации/программной синхронизации его нет.
        el.dispatchEvent(new Event('input', { bubbles }))
      }

      const onInput = (event) => {
        if (formatting) return

        formatting = true
        try {
          const formatted = formatRuPhone(el.value)

          // Backspace по «застрявшему» префиксу «+7 » очищает поле целиком:
          // иначе стереть номер до конца было бы невозможно.
          if (event?.inputType === 'deleteContentBackward' && formatted === '+7 ') {
            apply('')
            return
          }

          apply(formatted)
        } finally {
          formatting = false
        }
      }

      const onPaste = (event) => {
        const text = event.clipboardData?.getData('text') ?? ''

        // Короткую вставку (пара цифр) отдаём обычному input-сценарию.
        // Полный номер заменяем целиком — так вставка «+7910…» не склеивается
        // с уже введёнными цифрами.
        if (getRuNationalDigits(text).length < 10) return

        event.preventDefault()
        apply(formatRuPhone(text), { keepCaret: false })

        // При вставке полного номера курсор логично поставить в конец поля
        const end = el.value.length
        try {
          el.setSelectionRange(end, end)
        } catch {
          // ignore
        }
      }

      // Значение могло прийти из БД/стора в «сыром» виде — нормализуем один раз
      const initial = formatRuPhone(el.value)
      if (initial !== el.value) apply(initial, { keepCaret: false, bubbles: false })

      el.__phoneFormatHandlers = { onInput, onPaste }
      el.addEventListener('input', onInput)
      el.addEventListener('paste', onPaste)
    },

    updated(el) {
      // Программное изменение модели (сброс формы, автозаполнение) — нормализуем.
      // Пользовательский ввод уже отформатирован в onInput, поэтому здесь no-op.
      const formatted = formatRuPhone(el.value)
      if (formatted === el.value) return

      el.value = formatted
      el.dispatchEvent(new Event('input', { bubbles: false }))
    },

    unmounted(el) {
      const handlers = el.__phoneFormatHandlers
      if (!handlers) return

      el.removeEventListener('input', handlers.onInput)
      el.removeEventListener('paste', handlers.onPaste)
      delete el.__phoneFormatHandlers
    },
  })
})

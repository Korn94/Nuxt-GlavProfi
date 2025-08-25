import { defineNuxtPlugin } from '#app'

// Функция formatPhoneNumber принимает строку value и форматирует ее в соответствии с требуемым форматом
function formatPhoneNumber(value) {
  // Оставляем только цифры в строке value
  let cleaned = value.replace(/\D/g, '')
  let formattedValue = ''

  // Проверяем, начинается ли строка с кода +7 или +8
  if (cleaned.startsWith('7') || cleaned.startsWith('8')) {
    // Определяем код страны: +7 или +8
    const countryCode = cleaned.startsWith('8') ? '+8' : '+7'
    cleaned = cleaned.slice(1) // Удаляем первую цифру (7 или 8)

    formattedValue = countryCode // Начинаем форматирование с кода страны

    // Добавляем скобки и пробелы после кода страны в зависимости от длины cleaned
    if (cleaned.length > 0) {
      formattedValue += ' (' + cleaned.slice(0, 3)
    }
    if (cleaned.length > 3) {
      formattedValue += ') ' + cleaned.slice(3, 6)
    }
    if (cleaned.length > 6) {
      formattedValue += '-' + cleaned.slice(6, 8)
    }
    if (cleaned.length > 8) {
      formattedValue += '-' + cleaned.slice(8, 10)
    }
  } else if (cleaned.startsWith('373')) {
    cleaned = cleaned.slice(3) // Удаляем "373"
    formattedValue = '+373' // Начинаем форматирование с кода страны

    // Добавляем скобки и пробелы после кода страны в зависимости от длины cleaned
    if (cleaned.length > 0) {
      formattedValue += ' (' + cleaned.slice(0, 3)
    }
    if (cleaned.length > 3) {
      formattedValue += ') ' + cleaned.slice(3, 5)
    }
    if (cleaned.length > 5) {
      formattedValue += '-' + cleaned.slice(5, 8)
    }
  } else {
    // В случае, если код страны не соответствует ожидаемым, удаляем все символы, кроме цифр и "+"
    formattedValue = value.replace(/[^\d+]/g, '')
    // Ограничиваем количество символов до 16
    if (formattedValue.length > 16) {
      formattedValue = formattedValue.slice(0, 16)
    }
  }

  return formattedValue
}

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.directive('phone-format', {
    mounted(el) {
      let isFormatting = false // Флаг для предотвращения рекурсивного вызова

      el.addEventListener('input', function (e) {
        if (isFormatting) return

        isFormatting = true

        const formattedValue = formatPhoneNumber(e.target.value)

        if (e.target.value !== formattedValue) {
          e.target.value = formattedValue
          e.target.dispatchEvent(new Event('input'))
        }

        isFormatting = false
      })
    },
    // Обновляем при изменении привязки (если нужно)
    updated(el) {
      let isFormatting = false
      const value = el.value
      const formattedValue = formatPhoneNumber(value)

      if (value !== formattedValue && !isFormatting) {
        isFormatting = true
        el.value = formattedValue
        el.dispatchEvent(new Event('input'))
        isFormatting = false
      }
    }
  })
})
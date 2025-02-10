// Функция formatPhoneNumber принимает строку value и форматирует ее в соответствии с требуемым форматом
function formatPhoneNumber(value) {
  // Оставляем только цифры в строке value
  let cleaned = value.replace(/\D/g, ''); 
  let formattedValue = '';

  // Проверяем, начинается ли строка с кода +7 или +8
  if (cleaned.startsWith('7') || cleaned.startsWith('8')) {
    // Определяем код страны: +7 или +8
    const countryCode = cleaned.startsWith('8') ? '+8' : '+7';
    cleaned = cleaned.slice(1); // Удаляем первую цифру (7 или 8)

    formattedValue = countryCode; // Начинаем форматирование с кода страны

    // Добавляем скобки и пробелы после кода страны в зависимости от длины cleaned
    if (cleaned.length > 0) {
      formattedValue += ' (' + cleaned.slice(0, 3);
    }
    if (cleaned.length > 3) {
      formattedValue += ') ' + cleaned.slice(3, 6);
    }
    if (cleaned.length > 6) {
      formattedValue += '-' + cleaned.slice(6, 8);
    }
    if (cleaned.length > 8) {
      formattedValue += '-' + cleaned.slice(8, 10);
    }
  } else if (cleaned.startsWith('373')) {
    cleaned = cleaned.slice(3); // Удаляем "373"
    formattedValue = '+373'; // Начинаем форматирование с кода страны

    // Добавляем скобки и пробелы после кода страны в зависимости от длины cleaned
    if (cleaned.length > 0) {
      formattedValue += ' (' + cleaned.slice(0, 3);
    }
    if (cleaned.length > 3) {
      formattedValue += ') ' + cleaned.slice(3, 5);
    }
    if (cleaned.length > 5) {
      formattedValue += '-' + cleaned.slice(5, 8);
    }
  } else {
    // В случае, если код страны не соответствует ожидаемым, удаляем все символы, кроме цифр и "+"
    formattedValue = value.replace(/[^\d+]/g, '');
    // Ограничиваем количество символов до 16
    if (formattedValue.length > 16) {
      formattedValue = formattedValue.slice(0, 16);
    }
  }

  return formattedValue; // Возвращаем отформатированное значение
}

// Экспортируем объект с директивой phone-format
export default {
  // Метод mounted вызывается после того, как виртуальный DOM компонента смонтирован в реальный DOM
  mounted(el) {
    let isFormatting = false; // Флаг для предотвращения рекурсивного вызова

    // Добавляем обработчик события input к элементу el
    el.addEventListener('input', function(e) {
      if (isFormatting) return; // Если уже в процессе форматирования, выходим

      isFormatting = true; // Устанавливаем флаг

      // Форматируем значение элемента input, используя функцию formatPhoneNumber
      const formattedValue = formatPhoneNumber(e.target.value);
      
      // Устанавливаем отформатированное значение в элемент input, если оно изменилось
      if (e.target.value !== formattedValue) {
        e.target.value = formattedValue;
        // Диспатчим событие input, чтобы обновить v-model
        e.target.dispatchEvent(new Event('input'));
      }

      isFormatting = false; // Сбрасываем флаг
    });
  }
}

<!-- app\components\ui\forms\index.vue -->
<template>
<div>
  <form @submit.prevent="submitForm">
    <!-- Блок с именем и телефоном на одной строке -->
    <div class="input-group">
      <input type="text" v-model="name" @input="textFilter" placeholder="Имя (не обязательно)" class="inline-input"/>
      <input type="text" v-phone-format id="phone" v-model="phoneNumber" required placeholder="Телефон" class="inline-input" :class="{ 'error-border': phoneError }"/>
    </div>
    <div>
      <textarea id="comment" v-model="comment" placeholder="Комментарий (не обязательно)"></textarea>
    </div>
    <UiButtonsPrimary buttonText="Отправить" variant="blue" type="submit">Отправить</UiButtonsPrimary>
    <div class="consent">
      <input type="checkbox" id="agree" v-model="agreed" required />
      <label for="agree">
        Я соглашаюсь на обработку персональных данных в соответствии с 
        <NuxtLink to="/privacy-policy">политикой конфиденциальности</NuxtLink>
      </label>
    </div>
  </form>
</div>
</template>

<script setup>
import { ref } from 'vue'
import { useNotifications } from '~/composables/useNotifications'

const notifications = useNotifications()

// Реактивные данные
const name = ref('')
const phoneNumber = ref('+7 ')
const comment = ref('')
const agreed = ref(false)
const phoneError = ref(false)

// Форматирование имени
function textFilter() {
  name.value = name.value
    .replace(/\d/g, '')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
    .slice(0, 40)
}

// Отправка формы через API
async function submitForm() {
  const phoneCleaned = phoneNumber.value.replace(/\D/g, '')
  
  // Проверка телефона
  if (phoneCleaned.length < 11) {
    phoneError.value = true
    notifications.error('Введите корректный номер телефона')
    return
  }
  phoneError.value = false

  // ✅ Формируем структурированные данные для отправки
  const formData = {
    name: name.value.trim(),
    phone: phoneNumber.value,
    comment: comment.value.trim(),
    // Дублируем message для обратной совместимости
    message: `Заявка: ${name.value || 'Аноним'}, тел: ${phoneNumber.value}\n${comment.value ? 'Комментарий: ' + comment.value : ''}`
  }

  try {
    // Отправляем через API (токены хранятся на сервере, клиент их не видит)
    const response = await fetch('/api/send-message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.statusMessage || result.description || 'Ошибка отправки формы')
    }

    // Успех
    notifications.success('Форма успешно отправлена!')
    triggerYandexGoal('FORM_SUBMITTED')
    
    // Очистка формы после успешной отправки
    name.value = ''
    phoneNumber.value = '+7 '
    comment.value = ''
    agreed.value = false
    
  } catch (error) {
    console.error('Ошибка при отправке формы:', error)
    let errorMessage = 'Ошибка при отправке формы'
    
    if (error.response?.status === 401) {
      errorMessage = 'Неверный токен Telegram'
    } else if (error.response?.status === 403) {
      errorMessage = 'Бот заблокирован или недоступен'
    } else if (error.request) {
      errorMessage = 'Нет ответа от сервера'
    }
    notifications.error(errorMessage)
    triggerYandexGoal('FORM_ERROR')
  }
}

function triggerYandexGoal(goal) {
  if (typeof window.$ym === 'function') {
    window.$ym('reachGoal', goal)
  }
}
</script>

<style lang="scss" scoped>
$primary-color: #00c3f5;
$highlight-color: #ff9800;
$border-color: #ddd;
$background-light: #f7f7f7;
$sub-item-bg: #f0f0f0;
$text-color: #18191b;
$shadow-color: rgba(0, 0, 0, 0.05);

form {
  display: flex;
  flex-direction: column;
  gap: 10px;

  .input-group {
    display: flex;
    gap: 10px;
    align-items: center;
    margin: 0;

    .inline-input {
      flex: 1;
      padding: 12px 15px;
      border: 1px solid $border-color;
      width: 100%;
      border-radius: 5px;
      outline: none;
      transition: all 0.3s ease;
      box-shadow: inset 0 2px 5px rgba(0, 0, 0, 0.05);
      font-size: 1rem;
      color: $text-color;
      background: $background-light;

      &::placeholder {
        color: #aaa;
        font-size: 0.9rem;
      }

      &:focus {
        border-color: $primary-color;
        box-shadow: 0 0 5px rgba(0, 195, 245, 0.5);
      }
    }
  }
  
  .error-border {
    border-color: red !important;
  }

  textarea {
    width: 100%;
    resize: none;
    height: 60px;
    padding: 12px 15px;
    border: 1px solid $border-color;
    border-radius: 5px;
    outline: none;
    transition: all 0.3s ease;
    box-shadow: inset 0 2px 5px rgba(0, 0, 0, 0.05);
    font-size: 1rem;
    color: $text-color;
    background: $background-light;

    &::placeholder {
      color: #aaa;
      font-size: 0.9rem;
    }

    &:focus {
      border-color: $primary-color;
      box-shadow: 0 0 5px rgba(0, 195, 245, 0.5);
    }
  }

  .error-message {
    color: red;
    font-size: 0.9rem;
    margin-top: -10px;
    margin-bottom: 10px;
    text-align: center;
  }

  .success-message {
    color: green;
    font-size: 0.9rem;
    margin-top: -10px;
    margin-bottom: 10px;
    text-align: center;
  }

  .consent {
    font-size: 14px;

    input[type="checkbox"] {
      margin-right: 8px;
    }

    a {
      color: #00c3f5;
      text-decoration: underline;
    }
  }
}
</style>
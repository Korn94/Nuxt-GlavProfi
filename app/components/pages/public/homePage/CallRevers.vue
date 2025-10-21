<template>
  <div class="container">
    <div class="content">
      <div class="textbox">
        <p class="title">
          <span>Заказать</span><br> обратный звонок
        </p>
        <p>
          Оставьте заявку, на консультацию или для выезда на замеры
        </p>
        <p class="dop">Консультация и замер - бесплатно</p>
      </div>
      <form class="form" @submit.prevent="openConsentModal">
        <input type="text" class="input" placeholder="Имя" v-model="name" v-on:input="textFilter" required />
        <input type="tel" class="input" placeholder="Телефон" v-phone-format v-model="phoneNumber" required :class="{ 'error-border': phoneError }"/>
        <!-- <button type="submit">Отправить</button> -->
        <UiButtonsSecondary type="submit">Отправить</UiButtonsSecondary>
      </form>
    </div>

    <!-- Компонент уведомления -->
    <UiAlerts
      :visible="isNotificationVisible"
      :message="notificationMessage"
      :color="notificationColor"
      @update:visible="isNotificationVisible = false"
    />

    <!-- Модальное окно согласия -->
    <UiFormsConsentModal v-model="showConsentModal" @accept="acceptConsent" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRuntimeConfig } from '#imports'

// Получаем конфиг с токеном и ID чата
const config = useRuntimeConfig()

// Данные формы
const name = ref('')
const phoneNumber = ref('+7 ')
const notificationMessage = ref('')
const isNotificationVisible = ref(false)
const phoneError = ref(false)
const notificationColor = ref('green')
const showConsentModal = ref(false)

function textFilter() {
  name.value = name.value
    .replace(/\d/g, '')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
    .slice(0, 40)
}

// Открытие модального окна после валидации
function openConsentModal() {
  const phoneCleaned = phoneNumber.value.replace(/\D/g, '')
  phoneError.value = phoneCleaned.length < 11
  if (phoneError.value) {
    notificationMessage.value = 'Введите корректный номер телефона'
    notificationColor.value = 'red'
    isNotificationVisible.value = true
    return
  }
  showConsentModal.value = true
}

// Отправка формы через безопасный API-эндпоинт
async function acceptConsent() {
  showConsentModal.value = false

  const message = `
    Сообщение с Главной (центр):
    ФИО: ${name.value}
    Номер телефона: ${phoneNumber.value}
  `

  try {
    const response = await fetch('/api/send-message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message })
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.description || 'Ошибка отправки формы')
    }

    // Успех
    notificationMessage.value = 'Форма успешно отправлена!'
    notificationColor.value = 'green'
    isNotificationVisible.value = true
  } catch (error) {
    console.error('Ошибка при отправке формы:', error)
    notificationMessage.value = 'Ошибка при отправке формы'
    notificationColor.value = 'red'
    isNotificationVisible.value = true
  }
}
</script>

<style lang="scss" scoped>
.error-border {
  border-color: red !important;
}

.container {
  padding: 6em 1em;
  background: #18191b;
  position: relative;

  p {
    color: #fff;
  }

  p + p {
    margin: 2em 0;

    &:last-child {
      margin: 0;
    }
  }

  .content {
    max-width: 1200px;
    margin: auto;
    display: flex;
    align-items: center;

    .textbox {
      flex: 1;

      .title {
        font-size: 2.5rem;
        font-weight: 700;
        line-height: 1.2;

        span {
          color: #00c3f5;
        }
      }

      .dop {
        color: #00c3f5;
      }
    }

    .form {
      display: flex;
      flex-direction: column;
      align-items: stretch;
      gap: 1em;

      .input {
        width: 100%;
        padding: 10px 15px;
        border: 1px solid #ddd;
        border-radius: 5px;
        outline: none;
        color: #fff;
        transition: all 0.3s ease;
        box-shadow: inset 0 2px 5px rgba(0, 0, 0, 0.05);
        background-color: #18191b;

        &:focus {
          border-color: #00c3f5;
          box-shadow: 0 0 5px rgba(0, 195, 245, 0.5);
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .container .content {
    display: flex;
    flex-direction: column;
    align-items: center;

    .form {
      width: 100%;
      max-width: 400px;
      margin-top: 2em;
    }
  }
}
</style>
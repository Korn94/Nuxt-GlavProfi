<template>
  <footer class="footer">
    <div class="footer-container">
      <!-- Левая часть: информация о компании -->
      <div class="footer-info">
        <h2 class="footer-title">ГлавПрофи - Рязань и область</h2>
        <p class="footer-text">
          Отделка и ремонт помещений любой сложности<br>
          От косметического ремонта до полной реконструкции
        </p>
        <ul class="footer-details">
          <li @click="copyToClipboard('622907683792')">
            <strong>ИНН: </strong> 
            <span>622907683792</span>
          </li>
          <li @click="openEmail">
            <strong>Электронная почта: </strong> 
            <span>glavprofi@yandex.ru</span>
          </li>
          <li @click="handlePhoneClick('+7 (910) 909-69-47')">
            <strong>Телефон: </strong> 
            <span>+7 (910) 909-69-47</span>
          </li>
        </ul>
      </div>

      <!-- Центральная часть: навигация -->
      <div class="footer-links">
        <h3 class="footer-title">Полезные ссылки</h3>
        <ul class="footer-nav">
          <li><NuxtLink href="/about">О компании</NuxtLink></li>
          <li><NuxtLink href="#portfolio">Портфолио</NuxtLink></li>
          <li><NuxtLink href="/contacts">Контакты</NuxtLink></li>
          <li><NuxtLink href="/privacy-policy">Политика конфиденциальности</NuxtLink></li>
          <li><NuxtLink href="/terms-of-service">Условия использования</NuxtLink></li>
          <li><NuxtLink href="/login">Вход</NuxtLink></li>
        </ul>
      </div>

      <!-- Правая часть: социальные сети и форма связи -->
      <div class="footer-social">
        <h3 class="footer-title">Обратный звонок</h3>
        <!-- Форма связи -->
        <form class="footer-contact-form" @submit.prevent="submitForm">
          <input
            type="tel"
            v-model="phoneNumber"
            v-phone-format 
            placeholder="Обратный звонок"
            required
            :class="{ 'error-border': phoneError }"
          />
          <button type="button" @click="openConsentModal">Отправить</button>
        </form>

        <!-- <h3 class="footer-title">Свяжитесь с нами</h3> -->
        <div class="social-icons">
          <NuxtLink href="tg://resolve?domain=glavprofii" target="_blank">
            <Icon name="bxl:telegram" class="ico" size="28px" />
          </NuxtLink>
          <NuxtLink href="https://api.whatsapp.com/send?phone=79109096947" target="_blank">
            <Icon name="bxl:whatsapp" class="ico" size="28px" />
          </NuxtLink>
          <NuxtLink href=" https://vk.com/glavprofi " target="_blank">
            <Icon name="bxl:vk" class="ico" size="28px" />
          </NuxtLink>
          <NuxtLink href="https://instagram.com/glavprofi " target="_blank">
            <Icon name="bxl:instagram" class="ico" size="28px" />
          </NuxtLink>
          <NuxtLink href="https://youtube.com/ @glavstroy62" target="_blank">
            <Icon name="bxl:youtube" class="ico" size="28px" />
          </NuxtLink>
        </div>
        
      </div>
    </div>

    <!-- Нижняя часть: копирайт -->
    <div class="footer-bottom">
      <p class="footer-copyright">
        &copy; 2014–{{ currentYear }} <span>Глав Профи.</span> Все права защищены.
      </p>
    </div>

    <UIFormsConsentModal v-model="showConsentModal" @accept="acceptConsent"/>

    <!-- Компонент уведомлений -->
    <UIPopupsNotification
      :visible="isNotificationVisible"
      :message="notificationMessage"
      :color="notificationColor"
      @update:visible="isNotificationVisible = false"
    />
  </footer>
</template>

<script setup>
import { ref } from 'vue'
import { useRuntimeConfig } from '#imports'

// Получаем конфиг с токеном и ID чата
const config = useRuntimeConfig()

// Данные
const currentYear = new Date().getFullYear()
const isNotificationVisible = ref(false)
const notificationMessage = ref('')
const phoneNumber = ref('+7 ')
const showConsentModal = ref(false)
const phoneError = ref(false)
const notificationColor = ref('green')

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    notificationMessage.value = 'Скопировано'
    isNotificationVisible.value = true
  }).catch(() => {
    notificationMessage.value = 'Ошибка при копировании'
    isNotificationVisible.value = true
  })
}

function openEmail() {
  window.location.href = 'mailto:glavprofi@yandex.ru'
}

function handlePhoneClick(phoneNumber) {
  if (/Mobi|Android/i.test(navigator.userAgent)) {
    window.location.href = `tel:${phoneNumber.replace(/\D/g, '')}`
  } else {
    copyToClipboard(phoneNumber)
  }
}

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

function acceptConsent() {
  showConsentModal.value = false
  submitForm()
}

async function submitForm() {
  const message = `
    Сообщение с футера:
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
// Переменные цветов
$primary-color: #00c3f5;
$background-color: #18191b;
$text-color: #ffffff;
$subtext-color: #bdc3c7;

.footer {
  background-color: $background-color;
  color: $text-color;
  padding: 40px 20px 20px;
  font-family: Arial, sans-serif;

  .footer-container {
    display: flex;
    flex-wrap: wrap; // Разрешаем перенос блоков на новую строку
    justify-content: space-between;
    max-width: 1200px;
    margin: 0 auto;
    gap: 20px;

    // Адаптация для маленьких экранов
    @media (max-width: 768px) {
      flex-direction: column; // Все блоки в колонку
    }
  }

  .footer-title {
    font-size: 1.2rem;
    font-weight: bold;
    margin-bottom: 15px;
    color: $primary-color;

    // Уменьшаем размер заголовков на маленьких экранах
    @media (max-width: 768px) {
      font-size: 1rem;
      text-align: center;
    }
  }

  .footer-text {
    font-size: 0.9rem;
    line-height: 1.5;
    margin-bottom: 15px;
    color: $subtext-color;

    // Центрирование текста на маленьких экранах
    @media (max-width: 768px) {
      text-align: center;
    }
  }

  .footer-details {
    list-style: none;
    padding: 0;
    margin: 0;

    li {
      font-size: 0.9rem;
      margin-bottom: 8px;
      color: $subtext-color;
    }
    
    strong {
      color: $text-color;
    }
    
    span {
      color: $subtext-color;
      cursor: pointer;

      &:hover {
        color: $primary-color;
      }
    }
  }

  .footer-nav {
    list-style: none;
    padding: 0;
    margin: 0;

    li {
      margin-bottom: 10px;
    }

    a {
      color: $text-color;
      text-decoration: none;
      font-size: 0.9rem;
      transition: color 0.3s ease;

      &:hover {
        color: $primary-color;
      }
    }

    // Центрирование ссылок на маленьких экранах
    @media (max-width: 768px) {
      li {
        margin-bottom: 5px;
      }
    }
  }

  .social-icons {
    display: flex;
    gap: 1em;
    margin-top: 2em;

    .ico {
      color: $text-color;
      transition: color 0.3s ease;

      &:hover {
        color: $primary-color;
      }
    }

    // Изменяем расположение иконок на маленьких экранах
    @media (max-width: 768px) {
      justify-content: center;
    }
  }

  .footer-contact-form {
    display: flex;
    gap: 10px;
    max-width: 400px;
    margin: auto;

    input {
      flex: 1;
      padding: 5px 10px;
      border: 1px solid $subtext-color;
      border-radius: 5px;
      font-size: 0.9rem;
      outline: none;
      color: $text-color;
      background-color: $background-color;

      &::placeholder {
        color: $subtext-color;
      }

      &:focus {
          border-color: #00c3f5;
          box-shadow: 0 0 5px rgba(0, 195, 245, 0.5);
        }
    }

    button {
      padding: 10px 15px;
      margin: 0;
      background-color: $primary-color;
      color: $text-color;
      border: none;
      border-radius: 5px;
      font-size: 0.9rem;
      cursor: pointer;
      transition: background-color 0.3s ease;

      &:hover {
        background-color: #00a3d3;
      }

      &:active {
        transform: scale(0.98);
      }
    }

    .error-border {
      border-color: red !important;
    }

    // Адаптация формы на маленьких экранах
    @media (max-width: 768px) {
      flex-direction: column;
      width: 100%;

      input {
        width: 100%;
      }

      button {
        width: 100%;
      }
    }
  }

  .footer-bottom {
    text-align: center;
    margin-top: 4em;
    font-size: 0.8rem;
    color: $subtext-color;

    .footer-copyright {
      color: $text-color;
    }

    a {
      color: $primary-color;
      text-decoration: none;
      transition: color 0.3s ease;

      &:hover {
        color: #00c3f5;
      }
    }
  }
}
</style>
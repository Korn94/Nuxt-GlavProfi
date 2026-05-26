<!-- app\components\Layout\Footer\index.vue -->
<template>
  <footer class="footer">
    <div class="footer-container">
      <!-- Левая часть: информация о компании -->
      <div class="footer-info">
        <h2 class="footer-title">Рязань и область</h2>
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
          <li>
            <strong>Наш офис: </strong> 
            <span>г. Рязань, Право-Лыбедская ул., 40</span>
          </li>
        </ul>
      </div>

      <!-- Центральная часть: навигация -->
      <div class="footer-links">
        <h3 class="footer-title">Полезные ссылки</h3>
        <ul class="footer-nav">
          <li><NuxtLink href="/about">О компании</NuxtLink></li>
          <li><NuxtLink href="/projects">Портфолио</NuxtLink></li>
          <li><NuxtLink href="/contacts">Контакты</NuxtLink></li>
          <li><NuxtLink href="/privacy-policy">Политика конфиденциальности</NuxtLink></li>
          <li><NuxtLink href="/terms-of-service">Условия использования</NuxtLink></li>
          <li><NuxtLink href="/login">Войти</NuxtLink></li>
          <li><NuxtLink href="/telegram">Вход через ТГ</NuxtLink></li>
        </ul>
      </div>

      <!-- Правая часть: социальные сети и форма связи -->
      <div class="footer-social">
        <h3 class="footer-title">Обратный звонок</h3>
        <!-- Форма связи -->
        <form class="footer-contact-form" @submit.prevent="openConsentModal">
          <input
            type="tel"
            v-model="phoneNumber"
            v-phone-format 
            placeholder="Обратный звонок"
            required
            :class="{ 'error-border': phoneError }"
            :disabled="isSubmitting"
          />
          <UiButtonsSecondary type="button" @click="openConsentModal" :disabled="isSubmitting">
            {{ isSubmitting ? '...' : 'Отправить' }}
          </UiButtonsSecondary>
        </form>

        <div class="social-icons">
          <NuxtLink href="https://max.ru/u/f9LHodD0cOLfbBSpAeCwHBcJ83SJtKVj9mVKY7K8OLd6OwYB0gH6g3XE_Cs" target="_blank"><img src="https://maxicons.ru/icons/Max_logo.svg" alt="MAX" width="22" height="22" class="ico" /></NuxtLink>
          <NuxtLink href="tg://resolve?domain=glavprofii" target="_blank">
            <Icon name="mdi:telegram" class="ico" size="28px" />
          </NuxtLink>
          <!-- <NuxtLink href=" https://vk.com/glavprofi " target="_blank">
            <Icon name="mdi:vk" class="ico" size="28px" />
          </NuxtLink>
          <NuxtLink href="https://instagram.com/glavprofi " target="_blank">
            <Icon name="mdi:instagram" class="ico" size="28px" />
          </NuxtLink>
          <NuxtLink href="https://youtube.com/ @glavstroy62" target="_blank">
            <Icon name="mdi:youtube" class="ico" size="28px" />
          </NuxtLink> -->
        </div>
        
      </div>
    </div>
    <LayoutFooterLabel />

    <!-- Нижняя часть: копирайт -->
    <div class="footer-bottom">
      <p class="footer-copyright">
        &copy; 2014–{{ currentYear }} <span>Глав Профи.</span> Все права защищены.
      </p>
    </div>

    <UiFormsConsentModal v-model="showConsentModal" @accept="acceptConsent"/>

    <!-- Компонент уведомлений -->
    <UiNotificationsContainer />
  </footer>
</template>

<script setup>
import { ref } from 'vue'
import { useNotifications } from '~/composables/useNotifications'

// Данные
const currentYear = new Date().getFullYear()
const phoneNumber = ref('+7 ')
const showConsentModal = ref(false)
const phoneError = ref(false)
const isSubmitting = ref(false)

// Композабл для уведомлений
const notifications = useNotifications()

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    notifications.success('ИНН скопирован', 'Готово')
  }).catch(() => {
    notifications.error('Не удалось скопировать', 'Ошибка')
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
    notifications.error('Введите корректный номер телефона', 'Ошибка')
    return
  }

  showConsentModal.value = true
}

function acceptConsent() {
  showConsentModal.value = false
  submitForm()
}

async function submitForm() {
  isSubmitting.value = true

  // ✅ Формируем структурированные данные для бэкенда
  const formData = {
    name: '', // В футере нет поля имени
    phone: phoneNumber.value,
    comment: '',
    source: 'footer', // 👈 Источник заявки для аналитики
    // Дублируем message для логов и обратной совместимости
    message: `📞 Заявка с футера:\n📱 Телефон: ${phoneNumber.value}`
  }

  try {
    const response = await fetch('/api/send-message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData) // 👈 Отправляем объект
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.statusMessage || result.description || 'Ошибка отправки')
    }

    // ✅ Успех
    notifications.success('Заявка отправлена! Мы перезвоним.', 'Успех')
    
    // Очистка поля
    phoneNumber.value = '+7 '
    
    // Логируем статус каналов
    if (result.channels) {
      console.log('📊 Footer form status:', result.channels)
    }
    
  } catch (error) {
    console.error('Ошибка при отправке формы:', error)
    notifications.error('Не удалось отправить. Попробуйте позже.', 'Ошибка')
  } finally {
    isSubmitting.value = false
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
    flex-wrap: wrap;
    justify-content: space-between;
    max-width: 1200px;
    margin: 0 auto;
    gap: 20px;

    @media (max-width: 768px) {
      flex-direction: column;
    }
  }

  .footer-title {
    font-size: 1.2rem;
    font-weight: bold;
    margin-bottom: 15px;
    color: $primary-color;

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
      cursor: pointer;
      
      &:hover span {
        color: $primary-color;
      }
    }
    
    strong {
      color: $text-color;
    }
    
    span {
      color: $subtext-color;
      transition: color 0.3s ease;
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

    @media (max-width: 768px) {
      li {
        margin-bottom: 5px;
      }
    }
  }

  .social-icons {
    display: flex;
    align-items: center;
    gap: 1em;
    margin-top: 2em;

    .ico {
      color: $text-color;
      transition: color 0.3s ease;

      &:hover {
        color: $primary-color;
      }
    }

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
      transition: all 0.3s ease;

      &::placeholder {
        color: $subtext-color;
      }

      &:focus {
        border-color: #00c3f5;
        box-shadow: 0 0 5px rgba(0, 195, 245, 0.5);
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }

    button {
      padding: 10px 15px;
      
      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }

    .error-border {
      border-color: red !important;
    }

    @media (max-width: 768px) {
      flex-direction: column;
      width: 100%;

      input {
        width: 100%;
        padding: 8px;
      }

      button {
        width: 100%;
      }
    }
  }

  .footer-bottom {
    text-align: center;
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
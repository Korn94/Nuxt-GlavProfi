<template>
<div>
  <form @submit.prevent="submitForm">
    <!-- Блок с именем и телефоном на одной строке -->
    <div class="input-group">
      <input type="text" v-model="name" v-on:input="textFilter" required placeholder="Имя" class="inline-input"/>
      <input type="text" v-phone-format id="phone" v-model="phoneNumber" required placeholder="Телефон" class="inline-input" :class="{ 'error-border': phoneError }"/>
    </div>
    <div>
      <textarea id="comment" v-model="comment" placeholder="Комментарий (не обязательно)"></textarea>
    </div>
    <button buttonText="Отправить" width="100%" type="submit">Отправить</button>
    <div class="consent">
      <input type="checkbox" id="agree" v-model="agreed" required />
      <label for="agree">
        Я соглашаюсь на обработку персональных данных в соответствии с 
        <NuxtLink to="/privacy-policy">политикой конфиденциальности</NuxtLink>
      </label>
    </div>
  </form>

  <!-- Компонент уведомления -->
  <UIPopupsNotification
    :visible="isNotificationVisible"
    :message="notificationMessage"
    :color="notificationColor"
    @update:visible="isNotificationVisible = false"
  />
</div>
</template>

<script>
import axios from "axios";
import { telegramToken, telegramChatId } from "~/config/config.js";

export default {
  data() {
    return {
      name: "",
      phoneNumber: "+7 ",
      comment: "",
      agreed: false,
      phoneError: false,
      isNotificationVisible: false,
      notificationMessage: '',
      notificationColor: 'green'
    };
  },
  methods: {
    textFilter() {
      // Разделяем строку на слова и преобразуем первую букву каждого слова в верхний регистр
      this.name = this.name.replace(/\d/g, "").split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
      // Ограничение количества символов до 40
      if (this.name.length > 40) {
        this.name = this.name.slice(0, 40);
      }
    },
    submitForm() {
      const phoneCleaned = this.phoneNumber.replace(/\D/g, '');

      // Проверка длины номера
      if (phoneCleaned.length < 11) {
        this.phoneError = true;
        this.notificationMessage = 'Введите корректный номер телефона';
        this.notificationColor = 'red';
        this.isNotificationVisible = true;
        return;
      }

      this.phoneError = false;

      const token = telegramToken;
      const url = `https://api.telegram.org/bot${token}/sendMessage`;
      const message = `
        Сообщение с формы:
        ФИО: ${this.name}
        Номер телефона: ${this.phoneNumber}
        Комментарий: ${this.comment}`;

      axios.post(url, {
        chat_id: telegramChatId,
        text: message,
      })
      .then(() => {
        this.$emit('formSubmitted', true);
        this.notificationMessage = 'Форма успешно отправлена!';
        this.notificationColor = 'green';
        this.isNotificationVisible = true;
        
        // Безопасный вызов $ym — только если он определён
        if (typeof this.$ym === 'function') {
          this.$ym('reachGoal', 'FORM_SUBMITTED');
        }
      })
      .catch((error) => {
        console.error("Ошибка при отправке формы:", error);

        // Более точное сообщение об ошибке
        let errorMessage = 'Ошибка при отправке формы';
        if (error.response && error.response.status === 401) {
          errorMessage = 'Неверный токен Telegram';
        } else if (error.response && error.response.status === 403) {
          errorMessage = 'Бот заблокирован или недоступен';
        } else if (error.request) {
          errorMessage = 'Нет ответа от сервера Telegram';
        }

        this.$emit('formSubmitted', false);
        this.notificationMessage = errorMessage;
        this.notificationColor = 'red';
        this.isNotificationVisible = true;
        
        // Также безопасно вызываем $ym в случае ошибки
        if (typeof this.$ym === 'function') {
          this.$ym('reachGoal', 'FORM_ERROR');
        }
      });
    },
  },
};
</script>

<style lang="scss" scoped>
$primary-color: #00c3f5;
$highlight-color: #ff9800;  // Цвет подсветки
$border-color: #ddd;
$background-light: #f7f7f7;
$sub-item-bg: #f0f0f0; // Цвет фона для расшифровок
$text-color: #18191b;
$shadow-color: rgba(0, 0, 0, 0.05);

form {
  display: flex;
  flex-direction: column;
  gap: 10px;

  .input-group {
    display: flex;
    gap: 10px; /* Расстояние между полями */
    align-items: center; /* Выравнивание по центру */
    margin: 0;

    .inline-input {
      flex: 1; /* Поля занимают равное пространство */
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

  button {
    padding: 12px;
    background: linear-gradient(to right, #00c3f5, #00a3d3);
    color: white;
    border: none;
    border-radius: 5px;
    font-weight: bold;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.3s ease;
    margin: 0;

    &:hover {
      opacity: 0.9;
    }

    &:active {
      transform: scale(0.98);
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
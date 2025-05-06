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
      <form class="form" @submit.prevent="submitForm">
        <input type="text" class="input" placeholder="Имя" v-model="name" v-on:input="textFilter" required />
        <input type="tel" class="input" placeholder="Телефон" v-phone-format v-model="phoneNumber" required />
        <button type="submit" class="btn">Отправить</button>
      </form>
    </div>
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
      const token = telegramToken;
      const url = `https://api.telegram.org/bot${token}/sendMessage`;
      const message = `
        Сообщение с Главной (центр):
        ФИО: ${this.name}
        Номер телефона: ${this.phoneNumber}`;

      axios.post(url, {
        chat_id: telegramChatId,
        text: message,
      })
      .then(() => {
        this.$emit('formSubmitted', true); // Сообщаем об успешной отправке формы
      })
      .catch(() => {
        this.$emit('formSubmitted', false); // Сообщаем о неудачной отправке формы
      });
    },
  },
};
</script>

<style lang="scss" scoped>
.container {
  padding: 3em 1em;
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
      // text-align: center;
      // margin-bottom: 2em;
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
      align-items: center;
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
        // max-width: 400px;

        &:focus {
          border-color: #00c3f5;
          box-shadow: 0 0 5px rgba(0, 195, 245, 0.5);
        }
      }

      .btn {
        width: 100%;
        padding: 0.8em;
        background: #00c3f5;
        color: #111;
        font-size: 16px;
        font-weight: 600;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        transition: 0.3s;

        &:hover {
          background: #008bbf;
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

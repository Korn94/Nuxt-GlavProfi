<template>
  <div class="contacts-page">
    <header class="page-header">
      <h1>Контакты</h1>
    </header>

    <main class="page-content">
      <!-- Контейнер для контактной информации и формы -->
      <div class="contact-container">
        <!-- Блок с контактной информацией -->
        <section class="contact-info">
          <h2>Свяжитесь с нами</h2>
          <ul>
            <li><strong>Телефон:</strong> +7 (910) 909-69-47</li>
            <li><strong>Email:</strong> info@glavprofi.ru</li>
            <li><strong>Адрес:</strong> г. Рязань, ул. Примерная, д. 10</li>
            <li><strong>Режим работы:</strong> Пн–Пт: 9:00–18:00, Сб: 10:00–15:00, Вс: выходной</li>
          </ul>
          <p><strong>Ремонтируем коммерческую недвижимость в Рязани и области</strong></p>

          <!-- Социальные сети -->
          <div class="social-icons">
            <NuxtLink href="tg://resolve?domain=glavprofii" target="_blank">
              <Icon name="bxl:telegram" size="28px" />
            </NuxtLink>
            <NuxtLink href="https://api.whatsapp.com/send?phone=79109096947" target="_blank">
              <Icon name="bxl:whatsapp" size="28px" />
            </NuxtLink>
            <NuxtLink href="https://vk.com/glavprofi" target="_blank">
              <Icon name="bxl:vk" size="28px" />
            </NuxtLink>
            <NuxtLink href="https://instagram.com/glavprofi" target="_blank">
              <Icon name="bxl:instagram" size="28px" />
            </NuxtLink>
            <NuxtLink href="https://youtube.com/@glavstroy62" target="_blank">
              <Icon name="bxl:youtube" size="28px" />
            </NuxtLink>
          </div>
        </section>

        <!-- Форма обратной связи -->
        <section class="contact-form">
          <UIForms @formSubmitted="handleFormSubmission" />
          <!-- <Notification
            :visible="notificationVisible"
            :message="notificationMessage"
            :color="notificationColor"
            @update:visible="notificationVisible = false"
          /> -->
        </section>
      </div>

      <!-- Карта -->
      <section class="contact-map">
        <h2>Мы на карте</h2>
        <iframe src="https://yandex.ru/map-widget/v1/?z=12&ol=biz&oid=187227784297" width="100%" height="400" frameborder="0"></iframe>
      </section>
    </main>
  </div>
</template>


<script setup>
import { ref } from 'vue';

const notificationVisible = ref(false);
const notificationMessage = ref('');
const notificationColor = ref('green');

const handleFormSubmission = (isSuccess) => {
  if (isSuccess) {
    notificationMessage.value = 'Сообщение успешно отправлено!';
    notificationColor.value = 'green';
  } else {
    notificationMessage.value = 'Ошибка при отправке сообщения. Попробуйте позже.';
    notificationColor.value = 'red';
  }
  notificationVisible.value = true;
};
</script>

<style lang="scss" scoped>
.contacts-page {
  margin-top: 5em;
  padding: 40px 20px;
  font-family: Arial, sans-serif;
  line-height: 1.6;
  color: #333;

  @media (max-width: 768px) {
    margin-top: 2em;
  }

  .page-header {
    text-align: center;
    margin-bottom: 40px;

    h1 {
      font-size: 2rem;
      color: #18191b;
    }
  }

  .page-content {
    max-width: 1200px;
    margin: 0 auto;

    section {
      margin-bottom: 40px;

      h2 {
        font-size: 1.5rem;
        margin-bottom: 15px;
      }

      ul {
        list-style: none;
        padding: 0;
        margin: 0;

        li {
          margin-bottom: 10px;
          font-size: 1rem;
        }
      }

      .social-icons {
        display: flex;
        gap: 15px;
        margin-top: 15px;
        justify-content: center;

        a {
          color: #00c3f5;
          font-size: 1.5rem;
          transition: color 0.3s ease;

          &:hover {
            color:#00c3f5;
          }
        }
      }

      form {
        display: flex;
        flex-direction: column;
        gap: 15px;

        input,
        textarea {
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 5px;
          font-size: 1rem;
          color: #333;
          background-color: #f9f9f9;

          &::placeholder {
            color: #aaa;
          }

          &:focus {
            border-color: #00c3f5;
            outline: none;
          }
        }

        textarea {
          resize: none;
          height: 120px;
        }

        button {
          padding: 10px;
          background-color: #00c3f5;
          color: #fff;
          border: none;
          border-radius: 5px;
          font-size: 1rem;
          cursor: pointer;
          transition: background-color 0.3s ease;

          &:hover {
            background-color:#00c3f5;
          }

          &:active {
            transform: scale(0.98);
          }
        }
      }

      iframe {
        border-radius: 10px;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
      }
    }
  }

  // Новый контейнер для контактной информации и формы
  .contact-container {
    display: flex;
    flex-wrap: wrap;
    gap: 40px;

    @media (max-width: 768px) {
      flex-direction: column;
    }

    .contact-info,
    .contact-form {
      flex: 1;
      min-width: 300px;

      h2 {
        color: #00c3f5;
      }

      p {
        text-align: center;
      }

      // Общий стиль для обоих блоков
      border: 1px solid #ddd;
      border-radius: 5px;
      padding: 20px;
      background: #f7f7f7;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
      transition: all 0.3s ease;

      &:hover {
        box-shadow: 0 6px 15px rgba(0, 0, 0, 0.1);
      }
    }
  }

  // Стиль для карты
  .contact-map {
    h2 {
      text-align: center;
      color: #18191b;
    }

    iframe {
      border-radius: 10px;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
    }
  }
}
</style>
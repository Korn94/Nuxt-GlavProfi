<template>
  <div class="container">
    <div class="content">
      <div class="textbox">
        <p class="title">
          Давайте <span>обсудим</span> ваш проект
        </p>
        <p>
          Консультация с экспертом поможет вам<br/> определиться со всеми важными аспектами будущего ремонта
        </p>
        <p class="dop" @click="handleButtonClick">Консультация бесплатна</p>
      </div>
      <UIButtonsMainButton 
        class="btn"
        text="Позвонить"
        color="#fff"
        textColor="#111"
        @click="handleButtonClick"
      />
      <teleport to="body">
        <UIFormsContactForm 
        v-if="showModal" 
        @close="closeModal" 
        @formSubmitted="handleFormSubmitted" 
        />
      </teleport>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const showModal = ref(false)

// Метод для обработки клика на кнопку
const handleButtonClick = () => {
  if (isMobileDevice()) {
    // Для мобильных устройств открываем телефонный номер
    window.location.href = "tel:+79109096947"
  } else {
    // Для десктопа открываем модальное окно
    openModal()
  }
}

// Метод для открытия модального окна
const openModal = () => {
  showModal.value = true
}

// Метод для закрытия модального окна
const closeModal = () => {
  showModal.value = false
}

// Метод для обработки отправки формы
const handleFormSubmitted = (formData) => {
  console.log("Форма отправлена:", formData)
  // Здесь можно добавить логику отправки данных на сервер
  closeModal() // Закрываем форму после отправки
}

// Функция для определения мобильного устройства
const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}
</script>

<style lang="scss" scoped>
.container {
  padding: 6em 1em;
  background: #18191b;
  position: relative;

  img {
    position: absolute;
    width: 500px;
    height: auto;
    right: 205px;
  }

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
    align-items: end;

    .textbox {
      flex: 2;
      // max-width: 500px;

      .title {
        font-size: 2.5rem;
        font-weight: 700;
        line-height: 1.2;
      }

      .dop {
      cursor: pointer;
        color: #00c3f5;
      }
    }

    .btn {
      margin: 0 .5em;
    }
  }
}

@media (max-width: 768px) {
  .container .content {
    display: flex;
    flex-direction: column;
    align-items: center;

    .btn {
      margin-top: 2em;
    }
  }
}
</style>
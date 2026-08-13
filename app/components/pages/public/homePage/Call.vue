<!-- app\components\pages\public\homePage\Call.vue -->
<template>
  <div class="container">
    <h2 class="visually-hidden">Обсудить проект</h2>
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
      <UiButtonsPrimary 
        class="btn"
        text="Позвонить"
        @click="handleButtonClick"
      />
      <teleport to="body">
        <UiFormsContactForm 
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
@use '@/assets/styles/variables' as *;
@use '@/assets/styles/mixins' as *;

.container {
  @include section-padding;
  background: $background-dark;
  color: $text-light;
  position: relative;

  .content {
    @include section-container;
    display: flex;
    align-items: end;
    gap: 2rem;

    .textbox {
      flex: 2;

      .title {
        font-family: 'Rubik', sans-serif;
        font-size: 2.5rem;
        font-weight: 700;
        line-height: 1.2;
        margin: 0 0 1rem;
        color: $text-light;

        span {
          color: $blue;
        }
      }

      p {
        margin: 0 0 1rem;
        line-height: 1.6;
        color: rgba($text-light, 0.8);

        &:last-child {
          margin: 0;
        }
      }

      .dop {
        cursor: pointer;
        color: $blue;
        font-weight: 500;
        transition: color 0.2s ease;

        &:hover {
          color: $blue-light;
        }
      }
    }

    .btn {
      margin: 0 .5em;
    }
  }
}

@media (max-width: 768px) {
  .container .content {
    flex-direction: column;
    align-items: center;

    .btn {
      margin-top: 2em;
    }
  }
}
</style>
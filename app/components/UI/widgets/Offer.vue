<template>
  <section class="offer">
    <p class="title">{{ title }}</p>
    <p>{{ description }}</p>
    <button class="gradient-button large-button" @click="openModal">
      {{ buttonText }}
    </button>
    <teleport to="body">
        <UiFormsContactForm 
          v-if="showModal" 
          @close="closeModal" 
          @formSubmitted="handleFormSubmitted" 
        />
      </teleport>
  </section>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  buttonText: {
    type: String,
    default: 'Связаться',
  },
});

const showModal = ref(false);

// Метод для открытия модального окна
const openModal = () => {
  showModal.value = true;
};

// Метод для закрытия модального окна
const closeModal = () => {
  showModal.value = false;
};

// Метод для обработки отправки формы
const handleFormSubmitted = (formData) => {
  console.log("Форма отправлена:", formData);
  // Здесь можно добавить логику отправки данных на сервер
  closeModal(); // Закрываем форму после отправки
};

// Функция для определения мобильного устройства
const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};
</script>

<style lang="scss" scoped>


.offer {
  text-align: center;
  max-width: 800px;
  margin: 3em auto;
  padding: 20px;
  border: 1px solid #00c3f5;
  border-radius: 8px;
  background: linear-gradient(135deg, #f0fdff, #b8f3ff);

  .title {
    font-size: 20px;
    margin-bottom: 1em;
    font-weight: 700;
  }

  button {
    padding: 10px 20px;
    min-width: 150px;
    margin: 1.5em auto 0;
    background: linear-gradient(to right, #00c3f5, #00a3d3);
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    transition: background 0.3s ease;

    &:hover {
      background: #00a3d3;
    }
  }
}
</style>
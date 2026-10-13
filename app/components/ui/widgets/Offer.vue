<!-- app\components\ui\widgets\Offer.vue -->
<template>
  <section class="offer">
    <p class="title">{{ title }}</p>
    <p>{{ description }}</p>
    <UiButtonsPrimary variant="blue" @click="openModal">
      {{ buttonText }}
    </UiButtonsPrimary>

    <!-- v-if на самом Teleport: когда showModal=false, Teleport не создаётся вообще.
         Это гарантирует идентичную DOM-структуру на сервере и клиенте. -->
    <Teleport v-if="showModal" to="body">
      <UiFormsContactForm
        @close="closeModal"
        @formSubmitted="handleFormSubmitted"
      />
    </Teleport>
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
    margin: 1.5em auto 0;
  }
}
</style>
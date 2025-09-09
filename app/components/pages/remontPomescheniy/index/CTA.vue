<template>
  <section class="cta">
    <div class="container">
      <div class="cta-content" data-aos="fade-up">
        <h2 class="cta-title">
          Готовы превратить ваш ремонт в инвестицию, а не в расходы?
        </h2>
        <p class="cta-subtitle">
          Оставьте заявку — и в течение дня <span class="highlight">получите индивидуальное предложение</span> с расчётом срока, бюджета и графиком работ, адаптированным под ваш тип помещения и бизнес-задачи
        </p>

        <!-- Кнопка с функционалом -->
        <a href="#" class="btn btn-primary btn-lg" @click.prevent="handleButtonClick">
          Получить индивидуальное предложение
        </a>

        <p class="cta-note">
          <Icon name="lucide:lightbulb" size="32px" />
          Нажмите и начнём с чёткого плана
        </p>
      </div>
    </div>

    <!-- Телепорт для формы (в body) -->
    <teleport to="body">
      <UIFormsContactForm 
        v-if="showModal" 
        @close="closeModal" 
        @formSubmitted="handleFormSubmitted" 
      />
    </teleport>
  </section>
</template>

<script setup>
import { ref } from 'vue'

const showModal = ref(false)

// Функция определения мобильного устройства
const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

// Обработка клика по кнопке
const handleButtonClick = () => {
  if (isMobileDevice()) {
    window.location.href = "tel:+79109096947"
  } else {
    openModal()
  }
}

// Открытие модального окна
const openModal = () => {
  showModal.value = true
}

// Закрытие модального окна
const closeModal = () => {
  showModal.value = false
}

// Обработка успешной отправки формы
const handleFormSubmitted = (formData) => {
  console.log("Форма отправлена:", formData)
  closeModal()
}
</script>

<style scoped lang="scss">
.cta {
  padding: 6rem 0;
  background: $background-dark;
  color: $text-light;
  text-align: center;

  .container {
    max-width: 1000px;
    margin: 0 auto;
    padding: 0 1.5rem;
  }

  .cta-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.8rem;
  }

  .cta-title {
    font-size: 2.8rem;
    font-weight: 700;
    margin: 0 0 1rem;
    line-height: 1.2;
    color: $text-light;

    @media (max-width: 768px) {
      font-size: 2.2rem;
    }
  }

  .cta-subtitle {
    font-size: 1.25rem;
    line-height: 1.7;
    color: $text-gray;
    max-width: 750px;
    margin: 0 auto;

    .highlight {
      color: #00c3f5;
      font-weight: 600;
    }

    @media (max-width: 768px) {
      font-size: 1.15rem;
    }
  }

  .btn-primary {
    margin: 0.5rem 0;
    background: $blue-gradient;
    color: $background-dark;
    font-weight: 600;
    font-size: 1.2rem;
    padding: 1.2rem 3rem;
    border-radius: 12px;
    box-shadow: 0 8px 20px rgba(0, 195, 245, 0.35);
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 14px 30px rgba(0, 195, 245, 0.45);
    }

    &:active {
      transform: translateY(-1px);
    }
  }

  .cta-note {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    font-size: 1rem;
    color: $text-gray;
    font-style: italic;
    line-height: 1.6;
    max-width: 600px;
    margin-top: 2rem;
  }
}
</style>
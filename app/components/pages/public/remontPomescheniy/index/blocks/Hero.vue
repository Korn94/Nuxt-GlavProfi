<!-- app\components\pages\public\remontPomescheniy\index\blocks\Hero.vue -->
<template>
  <section class="hero" ref="heroSection">
    <div class="container">
      <div class="hero__content fade-in-up">
        
        <!-- Заголовок с декоративной линией -->
        <h1 class="hero__title">
          Ремонт и отделка коммерческих помещений под ключ
        </h1>
        
        <!-- УТП в виде стеклянной плашки -->
        <div class="hero__badge fade-in-up">
          <p class="hero__badge-text">
            Работаем по ТЗ, проектной документации или помогаем сформировать технически грамотное решение. Проводим аудит объекта: если видим риски в проекте или технологии — аргументированно сообщаем до начала работ, чтобы вы не переплачивали. Сдаем объекты в срок, сроки и смету фиксируем в договоре. Минимизируем простой вашего бизнеса. Соблюдаем ГОСТ и СНиП.
          </p>
        </div>
        
        <!-- Карточки преимуществ -->
        <div class="hero__benefits fade-in-up">
          <div 
            v-for="(benefit, index) in benefits" 
            :key="index" 
            class="hero__benefit-card"
          >
            <div class="hero__row">
              <div class="hero__benefit-icon">
                <Icon :name="benefit.icon" size="24" />
              </div>
              <h3 class="hero__benefit-title">{{ benefit.title }}</h3>
            </div>
            <p class="hero__benefit-desc">{{ benefit.description }}</p>
          </div>
        </div>
        
        <!-- CTA блок -->
        <div class="hero__actions fade-in-up">
          <!-- 👇 Кнопка теперь открывает модальное окно -->
          <button class="hero__btn" @click="openModal">
            Получить коммерческое предложение
          </button>
          <p class="hero__disclaimer">
            Расчет стоимости в течение 24 часов. Не является публичной офертой.
          </p>
          <a :href="telegramLink" class="hero__link" target="_blank" rel="noopener">
            Обсудить детали в телеграме →
          </a>
        </div>
        
      </div>
    </div>

    <!-- 👇 Модальная форма (условный рендеринг) -->
    <UiFormsContactForm
      v-if="showModal"
      @close="closeModal"
      @formSubmitted="handleFormSubmitted"
    />
  </section>
</template>

<script setup>
import { onMounted, ref } from 'vue';

const heroSection = ref(null);
const telegramLink = 'https://t.me/glavprofii'

// 👇 Управление модальным окном
const showModal = ref(false)

const openModal = () => {
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
}

const handleFormSubmitted = (formData) => {
  console.log('📩 Форма отправлена:', formData)
  closeModal()
  // Можно добавить аналитику:
  // triggerYandexGoal('KP_REQUESTED')
}

// Анимация появления при скролле
onMounted(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    },
    { threshold: 0.1 }
  );

  const elements = heroSection.value?.querySelectorAll('.fade-in-up');
  elements?.forEach((el) => {
    el.classList.remove('visible');
    observer.observe(el);
  });
});

// Данные преимуществ
const benefits = [
  {
    title: 'Собственные бригады',
    description: 'Профессиональные бригады для выполнения любых задач. ',
    icon: 'lucide:users',
  },
  {
    title: 'Любой формат',
    description: 'Работаем как с частными заказчиками напрямую, так и в рамках субподряда.',
    icon: 'lucide:handshake',
  },
  {
    title: 'Условия',
    description: 'Работаем с НДС и без. Фиксируем смету, сроки, штрафы за просрочку.',
    icon: 'lucide:file-check',
  },
]
</script>

<style scoped lang="scss">
@use '@/assets/styles/variables' as *;

// === Базовые настройки секции ===
.hero {
  padding: 4rem 0;
  overflow: hidden;
  position: relative;

  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 2rem;
    position: relative;
    z-index: 1;
  }

  // === Стеклянная карточка контента ===
  &__content {
    background: rgba(34, 34, 34, 0.6);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: $border-radius;
    padding: 3.5rem;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    position: relative;

    @media (max-width: 768px) {
      padding: 2.5rem 1.5rem;
    }
  }

  // === Заголовок с градиентной линией ===
  &__title {
    font-family: 'Rubik', sans-serif;
    font-size: 2.3rem;
    font-weight: 700;
    margin-bottom: 1.8rem;
    color: $text-light;
    line-height: 1.3;
    position: relative;
    padding-bottom: 1rem;

    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      width: 80px;
      height: 4px;
      background: $blue-gradient;
      border-radius: 2px;
      box-shadow: 0 0 10px $blue50;
    }

    @media (max-width: 768px) {
      font-size: 1.8rem;
    }
  }

  // === Плашка с УТП ===
  &__badge {
    background: rgba($green, 0.08);
    border: 1px solid rgba($green, 0.25);
    border-left: 3px solid $green;
    border-radius: $border-radius;
    padding: 1rem 1.25rem;
    margin-bottom: 2.5rem;

    @media (max-width: 768px) {
      padding: 0.875rem 1rem;
    }
  }

  &__badge-text {
    font-size: 0.95rem;
    line-height: 1.6;
    color: rgba($text-light, 0.95);
    margin: 0;
  }

  // === Сетка преимуществ ===
  &__benefits {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 1.4rem;
    margin-bottom: 2.5rem;
  }

  // === Карточка преимущества ===
  &__benefit-card {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: $border-radius;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.9rem;
    transition: all 0.35s ease;
    position: relative;

    &:hover {
      transform: translateY(-6px);
      box-shadow: 0 12px 25px rgba(0, 0, 0, 0.25);
      border-color: $blue;
      background: rgba(0, 195, 245, 0.08);
    }
  }

  &__benefit-icon {
    color: $blue;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    background: rgba(0, 195, 245, 0.1);
    border-radius: 10px;
    transition: color 0.3s ease, background 0.3s ease;

    .hero__benefit-card:hover & {
      color: #00e0ff;
      background: rgba(0, 195, 245, 0.15);
    }
  }

  &__row {
    display: flex;
    align-items: center;
    gap: 1em;
  }

  &__benefit-title {
    font-size: 1.1rem;
    font-weight: 600;
    color: $text-light;
    margin: 0;
  }

  &__benefit-desc {
    font-size: 0.95rem;
    line-height: 1.6;
    color: rgba($text-light, 0.75);
    margin: 0;
  }

  // === Блок действий (CTA) ===
  &__actions {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
    padding-top: 1rem;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
  }

  // === Кнопка ===
  &__btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 12px 28px;
    background: $blue-gradient;
    color: $text-dark;
    font-family: 'Rubik', sans-serif;
    font-weight: 600;
    font-size: 1rem;
    border-radius: 50px;
    border: none;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(0, 195, 245, 0.3);

    &:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 25px rgba(0, 195, 245, 0.45);
    }

    &:active {
      transform: translateY(-1px);
    }
  }

  // === Подпись под кнопкой ===
  &__disclaimer {
    font-size: 0.8rem;
    color: rgba($text-light, 0.5);
    margin: 0;
    line-height: 1.4;
  }

  // === Ссылка на Телеграм ===
  &__link {
    color: $blue;
    font-weight: 500;
    font-size: 0.95rem;
    transition: color 0.3s ease;

    &:hover {
      color: $blue-light;
    }
  }
}

// === Анимация появления ===
.fade-in-up {
  opacity: 0;
  transform: translateY(24px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}

.fade-in-up.visible {
  opacity: 1;
  transform: translateY(0);
}

// === Адаптив ===
@media (max-width: 768px) {
  .hero {
    padding: 3rem 0;

    &__content {
      padding: 2rem 1.25rem;
    }

    &__title {
      font-size: 1.75rem;
    }

    &__benefits {
      grid-template-columns: 1fr;
      gap: 1.2rem;
    }

    &__benefit-card {
      padding: 1.25rem;
      flex-direction: row;
      align-items: center;
      gap: 1rem;
    }

    &__benefit-icon {
      width: 36px;
      height: 36px;
    }

    &__benefit-title {
      font-size: 1rem;
    }

    &__benefit-desc {
      font-size: 0.9rem;
    }

    &__actions {
      align-items: stretch;
    }

    &__btn {
      width: 100%;
      justify-content: center;
    }
  }
}
</style>
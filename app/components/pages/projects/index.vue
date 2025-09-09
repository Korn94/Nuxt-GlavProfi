<template>
  <div class="portfolio-page">
    <!-- Параллакс фон -->
    <div ref="parallaxRef" class="parallax-background"></div>

    <h1>Ремонт и отделка коммерческих помещений</h1>

    <!-- Блюровый текстовый блок -->
    <div class="text-block">
      <div class="blur-container">
        <div class="header-section">
          <h2 class="title">
            Ваш бизнес заслуживает идеального пространства. Посмотрите, как мы это воплощаем
          </h2>
          <div class="divider"></div>
        </div>

        <div class="main-content">
          <div class="content">
            <div class="content-item">
              <div class="text">
                <div class="box">
                  <Icon name="iconamoon:number-1-circle" size="24px" />
                  <h3>Полный цикл работ</h3>
                </div>
                <p class="description">
                  От уютного кафе до крупного производства — работаем с помещениями любого назначения и сложности.
                </p>
              </div>
            </div>

            <div class="content-item">
              <div class="text">
                <div class="box">
                  <Icon name="iconamoon:number-2-circle" size="24px" />
                  <h3>Специализированные бригады</h3>
                </div>
                <p class="description">
                  Каждый этап ремонта — зона ответственности узких экспертов: электрики, отделочники, инженеры.
                </p>
              </div>
            </div>
          </div>

          <div class="cta-section">
            <p class="call-to-action">
              <span class="bold">Готовы начать?</span> Выберите проект ниже или свяжитесь с нами.
            </p>
            <div class="contact-buttons">
              <!-- Кнопка "Связаться" -->
              <button class="btn primary" @click.prevent="handleButtonClick">
                Связаться
              </button>
              <!-- Кнопка "Рассчитать проект" -->
              <button class="btn secondary" @click.prevent="handleButtonClick">
                Рассчитать проект
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Блок для кейсов -->
    <div v-if="loading" class="loading">Загрузка проектов...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <PagesProjectsCards 
      v-else 
      :cards="filteredCards" 
      :tabs="tabs" 
      @update:tab="setActiveTab"
    />

    <!-- Модальное окно (телепорт в body) -->
    <teleport to="body">
      <UIFormsContactForm 
        v-if="showModal" 
        @close="closeModal" 
        @formSubmitted="handleFormSubmitted" 
      />
    </teleport>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import PagesProjectsCards from './cards.vue'

// Состояние загрузки и данных
const loading = ref(true)
const error = ref(null)
const cards = ref([])
const activeTab = ref('Все')

// Категории
const tabs = ref([
  'Все',
  'Кафе', 
  'Магазины', 
  'Клиники', 
  'Банки', 
  'Фитнес', 
  'Производственные', 
  'Фасады и Кровля', 
  'Прочее'
])

// Фильтрация проектов
const filteredCards = computed(() => {
  if (activeTab.value === 'Все') return cards.value
  return cards.value.filter(card => card.category === activeTab.value)
})

// Установка активной вкладки
const setActiveTab = (tab) => {
  activeTab.value = tab
}

// Загрузка данных
const fetchData = async () => {
  try {
    const data = await $fetch('/api/portfolio').catch(err => {
      throw err
    })
    cards.value = data?.data || []
  } catch (err) {
    error.value = 'Не удалось загрузить проекты. Попробуйте позже.'
    console.error('Ошибка загрузки кейсов:', err)
  } finally {
    loading.value = false
  }
}

// --- Функционал для кнопок "Связаться" и "Рассчитать проект" ---

const showModal = ref(false)

// Определение мобильного устройства
const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

// Обработка клика по любой из кнопок
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

// Обработка отправки формы
const handleFormSubmitted = (formData) => {
  console.log("Форма отправлена:", formData)
  closeModal()
}

// Загрузка данных при монтировании
onMounted(() => {
  fetchData()
})
</script>

<script>
// Параллакс-эффект
export default {
  mounted() {
    this.$nextTick(() => {
      window.addEventListener('scroll', this.handleScroll)
      this.handleScroll()
    })
  },
  beforeUnmount() {
    window.removeEventListener('scroll', this.handleScroll)
  },
  methods: {
    handleScroll() {
      const parallaxRef = this.$refs.parallaxRef
      if (parallaxRef) {
        const scrollPosition = window.scrollY
        parallaxRef.style.transform = `translateY(${scrollPosition * -0.3}px)`
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.portfolio-page {
  position: relative;
  min-height: 100vh;
  overflow-x: hidden;

  h1 {
    margin: unset;
    font-size: 5px;
  }

  .parallax-background {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 90vh;
    background: url(/main/projects.webp) center/cover no-repeat;
    z-index: 0;
    transform: translateY(0);
    transition: transform 0.1s ease-out;

    @media (max-width: 768px) {
      height: 120vh;
    }
  }

  .text-block {
    position: relative;
    z-index: 1;
    padding: 4rem 2rem 0;
    max-width: 1200px;
    margin: 0 auto;

    @media (max-width: 768px) {
      padding: 2em 5px 2em;
    }

    .blur-container {
      background: rgba(0, 0, 0, 0.2);
      backdrop-filter: blur(10px);
      border-radius: 1rem;
      padding: 2.5rem;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
      margin: 4rem 0;

      @media (max-width: 992px) {
        padding: 2em 1em;
        margin: unset;
      }

      .header-section {
        position: relative;
        margin-bottom: 2.5rem;

        .divider {
          position: absolute;
          bottom: -0.75rem;
          left: 0;
          width: 80px;
          height: 4px;
          background: linear-gradient(90deg, #fff, rgba(255, 255, 255, 0.5));
        }

        .title {
          font-size: 2rem;
          line-height: 1.4;
          color: white;
          margin-bottom: 1.5rem;
          padding-right: 20%;

          @media (max-width: 768px) {
            font-size: 1.2rem;
            padding-right: 0;
          }
        }
      }

      .main-content {
        .content {
          display: flex;
          flex-wrap: wrap;
          gap: 2rem;
          margin-bottom: 3rem;

          @media (max-width: 768px) {
            flex-direction: column;
            align-items: center;
          }

          .content-item {
            flex: 1 1 calc(33% - 1.5rem);
            display: flex;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 1rem;
            padding: 1.5rem;
            backdrop-filter: blur(5px);
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
            transition: transform 0.3s ease;

            &:hover {
              transform: translateY(-5px);
            }

            @media (max-width: 992px) {
              flex: 1 1 calc(50% - 1.5rem);
            }

            @media (max-width: 768px) {
              flex: 1 1 100%;
            }

            .text {
              display: flex;
              flex-direction: column;
                  
              .box {
                display: flex;
                align-items: center;
                gap: 1em;
                margin-bottom: 1em;
                
                h3 {
                  color: white;
                  font-size: 1.25rem;
                  margin-bottom: unset;

                  @media (max-width: 768px) {
                    font-size: 1rem;
                  }
                }
              }

              .description {
                color: rgba(255, 255, 255, 0.9);
                font-size: 1rem;
                line-height: 1.6;
                margin-bottom: 0;

                @media (max-width: 768px) {
                  font-size: .9rem;
                }
              }
            }
          }
        }

        .cta-section {
          padding-top: 2rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);

          .call-to-action {
            font-size: 1.1rem;
            color: white;
            margin-bottom: 1.5rem;
            text-align: center;
            font-weight: 500;
          }

          .contact-buttons {
            display: flex;
            justify-content: center;
            gap: 1.5rem;

            @media (max-width: 576px) {
              flex-direction: column;
              align-items: center;
            }

            .btn {
              padding: 0.75rem 1.5rem;
              border-radius: 0.5rem;
              font-weight: 600;
              transition: all 0.3s ease;
              text-decoration: none;
              display: inline-block;
              text-align: center;

              &.primary {
                background: white;
                color: #111827;

                &:hover {
                  background: #f3f4f6;
                }
              }

              &.secondary {
                background: transparent;
                color: white;
                border: 2px solid white;

                &:hover {
                  background: rgba(255, 255, 255, 0.1);
                }
              }
            }
          }
        }
      }
    }
  }

  .loading,
  .error {
    padding: 2rem;
    text-align: center;
    color: #666;
  }

  .error {
    color: #ef4444;
  }
}
</style>
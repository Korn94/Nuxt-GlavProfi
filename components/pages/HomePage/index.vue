<template>
  <div class="container">
    <div class="background" v-if="isDesktop">
      <div class="dark-overlay"></div>
      <video v-if="isDesktop" class="background-video" autoplay muted loop playsinline preload="auto">
        <source src="/main/video/main-pk.mp4" type="video/mp4" />
      </video>
    </div>
    <div class="background" v-if="!isDesktop">
      <div class="dark-overlay"></div>
      <video v-if="!isDesktop" class="background-video" autoplay muted loop playsinline preload="auto">
        <source src="/main/video/main-pk.mp4" type="video/mp4" />
      </video>
    </div>

    <div class="image-container">
      <div class="content">
        <h1>
          <span>Ремонт</span> и <span>отделка</span><br />
          коммерческих помещений<br />
          под <span>любые</span> задачи и масштабы
        </h1>
        <div class="buttons">
          <UIButtonsMainButton text="Связаться" color="#fff" textColor="#111" @click="openModal" />
          <NuxtLink to="/prices/floor"><UIButtonsMainButton text="Прайс-лист" color="#fff" textColor="#111" :reverseEffect="true" /></NuxtLink>
        </div>
        <UIFormsContactForm v-if="showModal" @close="closeModal" @formSubmitted="handleFormSubmitted" />
        <div class="exp">
          <!-- <p style="color: #fff;">Ремонтируем коммерческую <br class="mobile-only">недвижимость<br class="desktop-only"> в <span class="bold">Рязани и области с 2008 г.</span></p> -->
          <p style="color: #fff;"><span class="bold">Рязань</span> и <span class="bold">Область</span></p>
        </div>
        <!-- <div class="items">
          <div class="item">
            <p>Гарантия от 12 мес.</p>
          </div>
          <div class="item">
            <p>Бесплатный выезд замерщика</p>
          </div>
          <div class="item">
            <p>Работаем с юридическими лицами</p>
          </div>
        </div> -->
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onBeforeUnmount } from "vue";
export default {
  setup() {
    const isDesktop = ref(false); // Изначально предполагаем, что это мобильная версия
    const showModal = ref(false); // Состояние для показа формы

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

    // Проверка размера экрана при монтировании компонента
    onMounted(() => {
      isDesktop.value = window.innerWidth > 768;
      window.addEventListener("resize", handleResize);
    });

    // Удаление слушателя события при размонтировании компонента
    onBeforeUnmount(() => {
      window.removeEventListener("resize", handleResize);
    });

    // Обработчик изменения размера окна
    const handleResize = () => {
      isDesktop.value = window.innerWidth > 768; // Обновляем состояние при изменении размера окна
    };

    return {
      isDesktop,
      showModal,
      openModal,
      closeModal,
      handleFormSubmitted,
    };
  },
};
</script>

<style lang="scss" scoped>
.container {
  position: relative;
  width: 100%;
  overflow: hidden;
  
  .background {
    background: #111;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-size: cover;
    background-position: center;
    z-index: -1;
  }

  .dark-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(110deg, rgba(0, 0, 0, 0.7) 100%, rgba(0, 0, 0, 0) 80%);
    clip-path: polygon(70% 0%, 30% 100%, 0% 100%, 0% 0%);
    z-index: 1;
  }

  .background-video {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    z-index: 0;
    pointer-events: none; // Отключает взаимодействие с видео
    user-select: none;    // Запрещает выделение элементов
  }

  .image-container {
    .content {
      display: flex;
      flex-direction: column;
      justify-content: center;
      height: 100vh;
      padding: 0 10%;
      z-index: 2;
      position: relative;

      .exp {
        position: absolute;
        display: flex;
        width: 100%;
        left: 2em;
        bottom: 2em;

        @media (max-width: 768px) {
          .desktop-only { display: none; }
          .mobile-only { display: inline; }
        }
        @media (min-width: 769px) {
          .desktop-only { display: inline; }
          .mobile-only { display: none; }
        }

        .box {
          border-left: 3px solid #00c3f5;
          height: 100%;
          padding: 0.5em 1em;
          background: linear-gradient(to right, #33333394, #33333321, #33333300);

          p {
            color: #fff;
          }
        }
      }

      .buttons {
        display: flex;
        gap: 1em;
      }

      // .items {
      //   margin-top: 1em;
      //   display: flex;
      //   flex-direction: column;
      //   gap: 1em; // Отступ между элементами
      //   max-width: 420px;

      //   .item {
      //     display: flex;
      //     align-items: center;
      //     background: rgba(255, 255, 255, 0.1); // Полупрозрачный фон
      //     border-radius: 8px; // Закругленные углы
      //     padding: 0.5em 1em; // Внутренние отступы
      //     color: #fff;

      //     p {
      //       font-size: 14px;
      //       color: #fff;
      //       margin: 0; // Убираем стандартные отступы
      //     }
      //   }
      // }

      // Адаптивность для мобильных устройств
      @media (max-width: 768px) {
        .items {
          .item {
            font-size: 12px; // Уменьшаем размер текста
            padding: 0.5em 0.8em; // Сокращаем внутренние отступы
          }
        }
      }
    }

    h1 {
      color: white;
      font-size: 2.5rem;
    }
  }

    @media (max-width: 768px) {
    .dark-overlay {
      background: rgba(0, 0, 0, 0.5); // Убираем градиент и делаем однородный цвет
      clip-path: none; // Убираем clip-path
    }

    .image-container .content {
      height: calc(100vh - 65px);
      padding: 0;
      align-items: center;

      .exp {
        justify-content: center;
        text-align: center;
        left: 0;
        top: 3em;
      }
      
      h1 {
        font-size: 2rem;
        text-align: center;

        @media (max-width: 515px) {
          font-size: 1.8rem;
      }
        @media (max-width: 460px) {
          font-size: 1.6rem;
      }
    }
  }

  }
}
</style>

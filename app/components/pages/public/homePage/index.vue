<!-- app\components\pages\public\homePage\index.vue -->
<template>
  <div class="container">
    <!-- Фон с видео -->
    <div class="background">
      <div class="dark-overlay"></div>
      <video
        ref="videoRef"
        class="background-video"
        autoplay
        muted
        loop
        playsinline
        preload="none"
        poster="/main/video/main-poster.jpg"
      >
        <source :src="videoSrc" type="video/mp4" />
        Ваш браузер не поддерживает видео.
      </video>
    </div>

    <!-- Основной контент -->
    <div class="image-container">
      <div class="content">
        <h1>
          <span>Ремонт</span> и <span>отделка</span><br />
          коммерческих помещений<br />
          под <span>любые</span> задачи и масштабы
        </h1>

        <div class="buttons">
          <UiButtonsPrimary text="Получить КП / Смету" @click="openModal" />
          <NuxtLink to="/prices/otdelochnye-raboty">
            <UiButtonsPrimary text="Прайс-лист" variant="outline" />
          </NuxtLink>
        </div>

        <!-- Модальная форма -->
        <UiFormsContactForm
          v-if="showModal"
          @close="closeModal"
          @formSubmitted="handleFormSubmitted"
        />

        <!-- Блок с информацией -->
        <div class="exp">
          <p style="color: #fff;">
            <span class="bold">Рязань</span> и <span class="bold">Область</span>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';

export default {
  setup() {
    const isDesktop = ref(false);
    const showModal = ref(false);
    const videoRef = ref(null);
    const shouldLoadVideo = ref(false);

    // На мобильных видео не показываем — только poster
    const videoSrc = computed(() => {
      return isDesktop.value
        ? '/main/video/main-pk.mp4'
        : null;
    });

    const openModal = () => {
      showModal.value = true;
    };

    const closeModal = () => {
      showModal.value = false;
    };

    const handleFormSubmitted = (formData) => {
      console.log('Форма отправлена:', formData);
      closeModal();
    };

    const checkScreenSize = () => {
      isDesktop.value = window.innerWidth > 768;
    };

    onMounted(() => {
      checkScreenSize();
      window.addEventListener('resize', checkScreenSize);

      // Lazy-load видео только на desktop: начинаем загрузку, когда секция попадает в viewport
      if (isDesktop.value && videoRef.value) {
        const observer = new IntersectionObserver(
          ([entry]) => {
            if (entry.isIntersecting) {
              shouldLoadVideo.value = true;
              const videoEl = videoRef.value;
              if (videoEl) {
                videoEl.preload = 'auto';
                videoEl.load();
              }
              observer.disconnect();
            }
          },
          { rootMargin: '200px' }
        );
        observer.observe(videoRef.value);
      }
    });

    onBeforeUnmount(() => {
      window.removeEventListener('resize', checkScreenSize);
    });

    return {
      isDesktop,
      showModal,
      videoSrc,
      videoRef,
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
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: #111; /* Фолбэк, если видео не загрузилось */
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
    pointer-events: none;
    user-select: none;

    /* Оптимизация для мобильных */
    @media (max-width: 768px) {
      object-position: center;
    }
  }

  .image-container {
    .content {
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: center;
      height: 100vh;
      padding: 0 10%;
      z-index: 2;

      h1 {
        color: white;
        font-size: 2.5rem;
      }

      .buttons {
        display: flex;
        gap: 1em;
        margin-bottom: 2em;
      }

      .exp {
        position: absolute;
        bottom: 2em;
        left: 2em;
        display: flex;
        align-items: center;

        p {
          margin: 0;
          font-size: 1rem;
        }

        .bold {
          font-weight: 600;
        }
      }
    }
  }

  /* Адаптив для мобильных */
  @media (max-width: 768px) {
    .dark-overlay {
      background: rgba(0, 0, 0, 0.5);
      clip-path: none;
    }

    .image-container .content {
      height: calc(100vh - 59px);
      padding: 0 5%;
      align-items: center;
      text-align: center;

      h1 {
        font-size: 2rem;
        line-height: 1.3;
      }

      .exp {
        position: static;
        margin-top: 1.5em;
        justify-content: center;
      }
    }
  }

  @media (max-width: 480px) {
    .image-container .content h1 {
      font-size: 1.7rem;
    }
  }
}
</style>
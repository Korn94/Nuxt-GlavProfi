<template>
<div>
    <div class="portfolio-page">
      <!-- Project Details -->
      <section v-if="project" class="project-details">
        <h1>{{ project.title }}</h1>
  
        <!-- First Image Full Width -->
        <div class="first-image-container">
          <img
            :src="project.gallery[mainImageIndex].src"
            :alt="project.gallery[mainImageIndex].alt"
            class="first-image"
            @click="openModal()"
          />
        </div>
  
        <!-- Gallery -->
        <div class="gallery">
          <img
            v-for="(image, index) in project.gallery.slice(1)"
            :key="index"
            :src="image.src"
            :alt="image.alt"
            class="gallery-image"
            @click="setMainImage(index + 1)"
          />
        </div>
        <p class="description">{{ project.description }}</p>
      </section>
  
      <!-- Modal for Fullscreen Image -->
      <div v-if="isModalOpen" class="modal" @click="closeModal">
        <div class="modal-content" @click.stop>
          <img
            :src="project.gallery[currentImageIndex].src"
            :alt="project.gallery[currentImageIndex].alt"
            class="fullscreen-image"
          />
          <div class="thumbnail-navigation">
            <img
              v-for="(image, index) in project.gallery"
              :key="index"
              :src="image.src"
              :alt="image.alt"
              class="thumbnail"
              :class="{ active: index === currentImageIndex }"
              @click="setCurrentImage(index)"
            />
          </div>
          <button class="arrow left" @click="navigateImage(-1)">&#10094;</button>
          <button class="arrow right" @click="navigateImage(1)">&#10095;</button>
        </div>
      </div>
      
      <!-- Navigation Buttons -->
      <div class="navigation">
        <button @click="navigateToPrevious" :disabled="!hasPrevious">Предыдущий проект</button>
        <button @click="navigateToNext" :disabled="!hasNext">Следующий проект</button>
      </div>
    </div>
  
      <PagesHomePageCall />
      <PagesHomePageWorks />
</div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

// Загрузка данных из JSON-файла
const projects = ref([]);
onMounted(async () => {
  const response = await fetch('/portfolio/projects.json');
  projects.value = await response.json();
});

// Получение текущего проекта
const projectId = computed(() => parseInt(route.params.id));
const project = computed(() =>
  projects.value.find((p) => p.id === projectId.value)
);

// Navigation logic
const currentIndex = computed(() =>
  projects.value.findIndex((p) => p.id === projectId.value)
);
const hasPrevious = computed(() => currentIndex.value > 0);
const hasNext = computed(() => currentIndex.value < projects.value.length - 1);

const navigateToPrevious = () => {
  if (hasPrevious.value) {
    router.push(`/projects/${projects.value[currentIndex.value - 1].id}`);
  }
};

const navigateToNext = () => {
  if (hasNext.value) {
    router.push(`/projects/${projects.value[currentIndex.value + 1].id}`);
  }
};

// Modal logic
const isModalOpen = ref(false);
const currentImageIndex = ref(0);
const mainImageIndex = ref(0); // Индекс главного изображения

const openModal = () => {
  currentImageIndex.value = mainImageIndex.value;
  isModalOpen.value = true;
};

const closeModal = () => {
  isModalOpen.value = false;
};

const setCurrentImage = (index) => {
  currentImageIndex.value = index;
  mainImageIndex.value = index;
};

const navigateImage = (direction) => {
  const newIndex = currentImageIndex.value + direction;
  if (newIndex >= 0 && newIndex < project.value.gallery.length) {
    currentImageIndex.value = newIndex;
    mainImageIndex.value = newIndex;
  }
};

const setMainImage = (index) => {
  mainImageIndex.value = index;
};
</script>

<style lang="scss" scoped>
.portfolio-page {
  max-width: 1200px;
  margin: 5em auto 0;
  padding: 2em;

  @media (max-width: 768px) {
    margin-top: 2em;
    padding: 1em; // Уменьшаем отступы для мобильных устройств
  }

  .project-details {
    margin-bottom: 2em;

    h1 {
      font-size: 2em;
      margin-bottom: 0.5em;
      text-align: center;
      color: #444;

      @media (max-width: 768px) {
        font-size: 1.5em; // Уменьшаем размер заголовка
      }
    }

    .description {
      font-size: 1em;
      line-height: 1.6;
      color: #555;
      margin: 2em 0;

      @media (max-width: 768px) {
        font-size: 0.9em; // Уменьшаем размер текста
        margin: 1em 0; // Уменьшаем отступы
      }
    }

    .first-image-container {
      width: 100%;
      overflow: hidden;
      margin-bottom: 1em;

      .first-image {
        width: 100%;
        height: 550px;
        object-fit: cover;
        cursor: pointer;
        border-radius: 10px;
        transition: transform 0.3s ease;

        @media (max-width: 768px) {
          height: 300px; // Уменьшаем высоту изображения для мобильных устройств
        }

        &:hover {
          transform: scale(1.05);
        }
      }
    }

    .gallery {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 1em;
      margin-top: 1em;

      @media (max-width: 768px) {
        grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); // Уменьшаем размер миниатюр
        gap: 0.5em; // Уменьшаем отступы между миниатюрами
      }

      .gallery-image {
        width: 100%;
        max-height: 100px;
        border-radius: 10px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        transition: transform 0.3s ease;
        object-fit: cover;
        cursor: pointer;

        @media (max-width: 768px) {
          max-height: 80px; // Уменьшаем максимальную высоту миниатюр
        }

        &:hover {
          transform: scale(1.05);
        }
      }
    }
  }

  .modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;

    .modal-content {
      position: relative;
      max-width: 90%;
      max-height: 90%;
      display: flex;
      flex-direction: column;
      align-items: center;

      @media (max-width: 768px) {
        max-width: 95%; // Увеличиваем ширину для мобильных устройств
      }

      .fullscreen-image {
        max-width: 100%;
        max-height: 80vh; // Ограничиваем высоту изображения
        object-fit: contain;
        margin-bottom: 1em; // Отступ для миниатюр

        @media (max-width: 768px) {
          max-height: 50vh; // Уменьшаем высоту изображения для мобильных устройств
        }
      }

      .thumbnail-navigation {
        display: flex;
        flex-wrap: wrap; // Добавляем перенос строк
        gap: 1em; // Отступ между миниатюрами
        margin-top: 1em;

        @media (max-width: 768px) {
          gap: 0.5em; // Уменьшаем отступы между миниатюрами для мобильных устройств
        }

        .thumbnail {
          width: 50px;
          height: 50px;
          border-radius: 5px;
          object-fit: cover;
          border: 2px solid transparent;
          cursor: pointer;

          &.active {
            border-color: #00c3f5;
          }
        }
      }
    }

    .arrow {
      position: fixed; // Привязка к экрану
      top: 50%;
      transform: translateY(-50%);
      background: rgba(0, 0, 0, 0.5);
      border: none;
      color: white;
      font-size: 2em;
      padding: 0.5em;
      cursor: pointer;
      z-index: 10;

      @media (max-width: 768px) {
        font-size: 1.5em; // Уменьшаем размер стрелок
        padding: 0.3em; // Уменьшаем отступы
      }

      &.left {
        left: 10px;
      }

      &.right {
        right: 10px;
      }
    }
  }

  .navigation {
    display: flex;
    justify-content: space-between;
    margin-bottom: 2em;

    button {
      padding: 10px 15px;
      cursor: pointer;
      border: none;
      border-radius: 5px;
      font-weight: 600;
      transition: all 0.3s ease;

      @media (max-width: 768px) {
        padding: 0.5em 1em; // Уменьшаем отступы
        font-size: 0.9em; // Уменьшаем размер текста
      }

      &:disabled {
        background-color: #ccc;
        cursor: not-allowed;
      }

      &:not(:disabled) {
        background: linear-gradient(to right, #00c3f5, #00a3d3);
        box-shadow: 0 4px 10px rgba(0, 195, 245, 0.3);
        color: white;

        &:hover {
          background-color: #0056b3;
        }
      }
    }
  }

  .about-us {
    text-align: center;

    h3 {
      font-size: 1.8em;
      margin-bottom: 0.5em;
      color: #00c3f5; // Цвет заголовков

      @media (max-width: 768px) {
        font-size: 1.5em; // Уменьшаем размер заголовка
      }
    }

    p {
      font-size: 1em;
      line-height: 1.6;
      color: #555;

      @media (max-width: 768px) {
        font-size: 0.9em; // Уменьшаем размер текста
      }
    }
  }
}
</style>
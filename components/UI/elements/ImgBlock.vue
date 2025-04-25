<template>
  <div class="portfolio-block">
    <slot></slot>

    <div class="toggle-buttons" v-if="shouldShowToggleButtons">
      <UIButtonsSecondButton v-for="(tab, index) in tabsWithLabels" :key="index" :text="tab.label" :class="{ active: activeTab === tab.key }" :reverseEffect="activeTab !== tab.key" @click="setActiveTab(tab.key)"/>
    </div>

    <!-- <hr class="line" /> -->

    <div class="navigation" v-if="activeCategories.length > 0">
      <div class="inner">
        <button v-for="(category, index) in activeCategories" :key="index" :text="category" :class="{ active: activeCategory === category }" :reverseEffect="activeCategory !== category" @click="setActiveCategory(category)">{{ category }}</button>
      </div>
    </div>
    <transition-group name="fade-slide" tag="div" class="image-grid" :style="{ height: containerHeight }">
      <div class="image" v-for="(image, index) in visibleImages" :key="index" :style="{ backgroundImage: `url(${image.src})` }" @click="navigateToProject(image)">
        <Icon name="ion:arrow-redo" class="icon" />
        <div class="info-overlay">{{ image.info }}</div>
        <div class="content"></div>
      </div>
    </transition-group>

    <UIButtonsMainButton class="openbtn" text="Показать еще" v-if="filteredImages.length > 9 && !showAll" @click="showAllImages"></UIButtonsMainButton>
  </div>
</template>

<script>
export default {
  props: {
    title: String,
    subtitle: String,
    tabs: Array,
  },
  data() {
    return {
      activeTab: "projects",
      activeCategory: "Все проекты",
      showAll: false,
    };
  },
  computed: {
    tabsWithLabels() {
      return this.tabs.filter((tab) => tab.label);
    },
    shouldShowToggleButtons() {
      return this.tabsWithLabels.length > 1;
    },
    activeCategories() {
      const currentTab = this.tabs.find((tab) => tab.key === this.activeTab);
      return currentTab ? currentTab.categories : [];
    },
    filteredImages() {
      const currentTab = this.tabs.find((tab) => tab.key === this.activeTab);
      if (!currentTab) return [];

      const images = currentTab.images || [];
      if (
        this.activeCategory === "Все услуги" ||
        this.activeCategory === "Все проекты"
      ) {
        return images;
      }

      return images.filter((img) => img.category === this.activeCategory);
    },
    visibleImages() {
      return this.showAll
        ? this.filteredImages
        : this.filteredImages.slice(0, 9);
    },
    containerHeight() {
      if (process.client) {
        const rows = Math.ceil(
          this.visibleImages.length / (window.innerWidth < 768 ? 1 : 3)
        );
        const imageHeight = window.innerWidth < 768 ? 150 : 200; // Динамическая высота изображения
        const gap = 10; // Отступ между изображениями (grid-gap)
        return `${rows * (imageHeight + gap) - gap}px`; // Учитываем отступы между строками
      }
      return "auto"; // Возвращаем значение по умолчанию при серверном рендеринге
    },
  },
  methods: {
    setActiveTab(tabKey) {
      this.activeTab = tabKey;
      if (tabKey === "projects") {
        this.activeCategory = "Все проекты";
      } else if (tabKey === "services") {
        this.activeCategory = "Все услуги";
      }
    },
    setActiveCategory(category) {
      this.activeCategory = category;
    },
    showAllImages() {
      this.showAll = true;
    },
    navigateToProject(image) {
      const projectId = this.tabs[0].images.indexOf(image) + 1; // Генерация ID на основе индекса
      this.$router.push(`/projects/${projectId}`);
    },
  },
  mounted() {
    const firstTab = this.tabs.find((tab) => tab.key);
    if (firstTab) {
      this.setActiveTab(firstTab.key);
    }
  },
};
</script>

<style lang="scss" scoped>
.portfolio-block {
  background: #fff;
  padding-top: 2em;
  max-width: 1200px;
  margin: auto auto 2em;

  .toggle-buttons,
  .navigation {
    width: 100%;
  overflow-x: auto; // Включаем горизонтальную прокрутку
  -webkit-overflow-scrolling: touch; // Плавная прокрутка на мобильных устройствах
  margin-bottom: 20px;
  white-space: nowrap; // Запрещаем перенос строк
  position: relative;

  /* Стилизация для WebKit (Chrome, Safari) */
  &::-webkit-scrollbar {
    height: 6px; // Высота полосы прокрутки
  }

  &::-webkit-scrollbar-thumb {
    background: #ccc; // Цвет ползунка
    border-radius: 3px;
  }

  &::-webkit-scrollbar-track {
    background: transparent; // Фон полосы прокрутки
  }

  /* Стилизация для Firefox */
  scrollbar-width: thin; // Устанавливаем тонкую полосу прокрутки
  scrollbar-color: #ccc transparent; // Цвет ползунка и фона

  .inner {
    display: inline-flex; // Размещаем кнопки в одну линию
    gap: 10px; // Расстояние между кнопками
    padding: 10px 0 10px 10px; // Отступы внутри контейнера

    
    button {
      padding: 10px 15px;
      cursor: pointer;
      border: none;
      background: #f0f0f0;
      // color: $sub-item-bg;
      border-radius: 5px;
      font-weight: 600;
      transition: all 0.3s ease;
      
      &.active {
        color: #f0f0f0;
        background: linear-gradient(to right, #00c3f5, #00a3d3);
        box-shadow: 0 4px 10px rgba(0, 195, 245, 0.3);
      }
      
      &:hover {
        background: linear-gradient(to right, #00c3f5, #00a3d3);
        box-shadow: 0 4px 10px rgba(0, 195, 245, 0.3);
      }
    }
  }
  }

  h2 {
    text-align: center;
  }

  .image-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-gap: 10px;
    overflow: hidden;
    margin-top: 2em;
    transition: height 0.5s ease; // Плавная анимация высоты
  }

  .image {
    height: 200px;
    background-size: cover;
    background-position: center;
    border-radius: 10px;
    transition: transform 0.3s ease, opacity 0.5s ease;
    opacity: 1;
    transform: scale(0.95);
    cursor: pointer;

    &:hover {
      transform: scale(1);

      .info-overlay {
        opacity: 1;
      }
    }

    /* Анимация появления */
    &.fade-slide-enter-active,
    &.fade-slide-leave-active {
      transition: transform 0.5s ease-in-out, opacity 0.5s ease;
    }

    &.fade-slide-enter,
    &.fade-slide-leave-to {
      opacity: 0;
      transform: scale(0.9);
    }

    .info-overlay {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: rgba(0, 0, 0, 0.5);
      border-bottom-right-radius: 10px;
      border-bottom-left-radius: 10px;
      color: white;
      padding: 10px;
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    .icon {
      position: absolute;
      color: #fff;
      width: 24px;
      height: 24px;
      right: 2%;
      top: 2%;
    }

    .content {
      background: linear-gradient(to bottom left, rgba(0, 0, 0, 0.6) 0%, rgba(0, 0, 0, 0) 20%), #00000000;
      // padding-top: 2em;
      width: 100%;
      height: 100%;
      // margin: auto auto 2em;
    }
  }

  .openbtn {
    margin: 2em auto auto;
    display: block;
  }
}

// Адаптация для планшетов
@media (max-width: 1024px) {
  .portfolio-block {
    .image-grid {
      grid-template-columns: repeat(2, 1fr); // 2 колонки для планшетов
    }

    .image {
      height: 180px; // Уменьшенная высота изображений
    }
  }
}

// Адаптация для мобильных устройств
@media (max-width: 768px) {
  .portfolio-block {
    .image-grid {
      grid-template-columns: 1fr; // 1 колонка для мобильных устройств
    }

    .image {
      height: 150px; // Уменьшенная высота изображений
    }
  }
}
</style>
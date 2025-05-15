<template>
  <div class="navigation-wrapper">
    <!-- Placeholder -->
    <div v-if="isFixed" class="placeholder"></div>

    <div 
      class="navigation" 
      :class="{ 'fixed': isFixed }"
      ref="nav"
    >
      <div class="inner">
        <button
          v-for="category in categories"
          :key="category.id"
          :class="{ active: activeCategory === category.id }"
          @click="setCategory(category.id)"
        >
          {{ category.name }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";

const props = defineProps({
  categories: {
    type: Array,
    required: true,
  },
  activeCategory: {
    type: String,
    required: true,
  }
});

const emit = defineEmits(['update:active-category']);
const setCategory = (categoryId) => {
  emit('update:active-category', categoryId);
};

// Фиксация при скролле
const nav = ref(null);
const isFixed = ref(false);
const initialOffsetTop = ref(0); // <-- Здесь будем хранить начальную позицию

onMounted(() => {
  if (nav.value) {
    const headerHeight = document.querySelector('header')?.offsetHeight || 0;
    initialOffsetTop.value = nav.value.getBoundingClientRect().top + window.scrollY;

    const handleScroll = () => {
      if (!nav.value) return;

      if (window.scrollY >= initialOffsetTop.value - headerHeight - 10) {
        isFixed.value = true;
      } else {
        isFixed.value = false;
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // вызов для инициализации

    onUnmounted(() => {
      window.removeEventListener('scroll', handleScroll);
    });
  }
});
</script>

<style lang="scss" scoped>
$primary-color: #00c3f5;
$background-light: #f7f7f7;

.navigation-wrapper {
  position: relative;
}

.placeholder {
  // height: 60px; // высота вашего меню
  width: 100%;
  display: block;
}

.navigation {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  margin-bottom: 10px;
  white-space: nowrap;
  position: relative;
  z-index: 999;
  text-align: center;
  background: transparent;
  transition: all 0.3s ease;

  &.fixed {
    position: fixed;
    top: 80px; // Высота хедера
    left: 0;
    right: 0;
    border-top: 1px solid #555555;
    background: rgba(54, 54, 54, 0.8);
    backdrop-filter: blur(5px);
    padding: 10px 0;
    z-index: 1000;
    transform: translateY(0);
    .inner {
      justify-content: center;
    }
  }

  /* Стилизация полосы прокрутки */
  &::-webkit-scrollbar {
    height: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: #ccc;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  scrollbar-width: thin;
  scrollbar-color: #ccc transparent;

  .inner {
    display: inline-flex;
    gap: 10px;
    padding: 0;
    transition: all 0.3s ease;

    @media (max-width: 768px) {
      padding: 10px;
    }

    button {
      padding: 10px 15px 8px;
      cursor: pointer;
      border: none;
      background: $background-light;
      border-radius: 5px;
      font-weight: 600;
      transition: all 0.3s ease;
      border-bottom: 2px solid $primary-color;

      &.active {
        background: linear-gradient(to right, #00c3f5, #00a3d3);
        color: #fff;
        box-shadow: 0 4px 10px rgba(0, 195, 245, 0.3);
      }

      &:hover {
        background: linear-gradient(to right, #00c3f5, #00a3d3);
        color: #fff;
        box-shadow: 0 4px 10px rgba(0, 195, 245, 0.3);
      }
    }
  }
}

@media (max-width: 839px) {
  .navigation.fixed {
    top: 0 !important;
    border-top: none; // можно убрать лишние бордеры, если нужно
  }
}
</style>
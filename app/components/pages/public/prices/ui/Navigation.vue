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
        <!-- Отображаем динамические категории -->
        <button
          v-for="category in categories"
          :key="category.id"
          :class="{ active: activeCategory === category.slug }"
          @click="setCategory(category.slug)"
        >
          {{ category.name }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watchEffect } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const categories = ref([])
const activeCategory = ref('floor') // Дефолтное значение
const isFixed = ref(false)
const nav = ref(null)

// Обработчик скролла
let scrollHandler = () => {}

// Получение данных с сервера
const loadPages = async () => {
  try {
    const data = await $fetch('/api/price/pages')
    categories.value = data.map(page => ({
      id: page.id,
      name: page.title,
      slug: page.slug
    }))
  } catch (error) {
    console.error('Ошибка загрузки страниц:', error)
  }
}

// Установка активной категории
const setCategory = (categoryId) => {
  activeCategory.value = categoryId
  emit('update:active-category', categoryId)
}

// Пропсы и эмит
const props = defineProps({
  activeCategory: {
    type: String,
    required: true
  }
})
const emit = defineEmits(['update:active-category'])

// Реактивное обновление activeCategory при изменении маршрута
watchEffect(() => {
  if (route.params.category) {
    activeCategory.value = route.params.category
  }
})

// Регистрация обработчика скролла и других хуков до асинхронных вызовов
onMounted(() => {
  if (nav.value) {
    const headerHeight = document.querySelector('header')?.offsetHeight || 0
    const initialOffsetTop = nav.value.getBoundingClientRect().top + window.scrollY

    scrollHandler = () => {
      isFixed.value = window.scrollY >= initialOffsetTop - headerHeight - 10
    }

    window.addEventListener('scroll', scrollHandler)
    scrollHandler()

    // Регистрация onUnmounted внутри onMounted — безопасно!
    onUnmounted(() => {
      window.removeEventListener('scroll', scrollHandler)
    })
  }

  // Загрузка данных после регистрации хуков
  loadPages()
})
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
  z-index: 1;
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
    z-index: 1;
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
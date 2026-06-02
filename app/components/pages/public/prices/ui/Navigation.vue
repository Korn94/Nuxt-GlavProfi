<!-- app\components\pages\public\prices\ui\Navigation.vue -->
<template>
  <div class="navigation-wrapper">
    <!-- Placeholder для сохранения высоты при fixed-позиционировании -->
    <div v-if="isFixed" class="placeholder"></div>
    
    <div 
      class="navigation" 
      :class="{ 'fixed': isFixed }"
      ref="navRef"
    >
      <div class="inner">
        <!-- Используем категории из пропсов (НЕ делаем отдельный запрос) -->
        <button
          v-for="category in props.categories"
          :key="category.id"
          :class="{ active: props.activeCategory === category.slug }"
          @click="emit('update:active-category', category.slug)"
        >
          {{ category.name }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'

// ========================================
// 📥 ПРОПСЫ
// ========================================

const props = defineProps<{
  categories: Array<{ id: number; name: string; slug: string }>
  activeCategory: string
}>()

const emit = defineEmits<{
  (e: 'update:active-category', value: string): void
}>()

// ========================================
// 📊 ЛОКАЛЬНОЕ СОСТОЯНИЕ
// ========================================

const navRef = ref<HTMLElement | null>(null)
const isFixed = ref(false)

// Сохраняем начальную позицию для расчёта fixed
let initialOffsetTop = 0
let headerHeight = 0

// ========================================
// 🎯 ОБРАБОТЧИК СКРОЛЛА
// ========================================

const handleScroll = () => {
  if (!navRef.value) return
  
  const currentScrollY = window.scrollY
  isFixed.value = currentScrollY >= initialOffsetTop - headerHeight - 10
}

// ========================================
// 🔄 LIFECYCLE HOOKS
// ========================================

// ✅ ИСПРАВЛЕНО: onUnmounted вынесен на верхний уровень (не внутри onMounted)
// Это гарантирует, что listener всегда будет удалён при размонтировании компонента
onMounted(() => {
  if (navRef.value) {
    // Вычисляем начальную позицию навигации
    const rect = navRef.value.getBoundingClientRect()
    initialOffsetTop = rect.top + window.scrollY
    
    // Получаем высоту хедера (если есть)
    const header = document.querySelector('header')
    headerHeight = header ? header.offsetHeight : 0
    
    // Регистрируем scroll listener
    window.addEventListener('scroll', handleScroll, { passive: true })
    
    // Сразу проверяем текущее положение
    handleScroll()
  }
})

onUnmounted(() => {
  // ✅ Всегда удаляем listener при размонтировании
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style lang="scss" scoped>
.navigation-wrapper {
  position: relative;
}

.placeholder {
  width: 100%;
  display: block;
}

.navigation {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  margin-bottom: 5px;
  white-space: nowrap;
  position: relative;
  z-index: 1;
  background: transparent;
  transition: all 0.3s ease;

  &.fixed {
    position: fixed;
    top: 60px; // Высота хедера
    left: 0;
    right: 0;
    background: $background-light;
    padding: 5px;
    z-index: 1;
    transform: translateY(0);
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
    
    .inner {
      justify-content: center;
      width: 100%;
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
    display: flex;
    padding: 0;
    transition: all 0.3s ease;
    width: 100%;
    gap: 5px;
    
    @media (max-width: 450px) {
      padding: 0px;
      background: $background-light;
    }

    button {
      flex: 1;
      padding: 10px 15px;
      cursor: pointer;
      border: none;
      background: #f7f7f7;
      border-radius: 5px;
      font-weight: 600;
      font-size: .8em;
      transition: all 0.3s ease;
      border: 1px solid $border-color;

      &.active {
        background: $blue;
        color: $text-light;
      }

      &:hover {
        background: $blue;
        color: $text-light;
      }
    }
  }
}

@media (max-width: 839px) {
  .navigation.fixed {
    top: 0 !important;
  }
}
</style>
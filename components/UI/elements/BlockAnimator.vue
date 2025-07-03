<!-- components/elements/BlockAnimator.vue -->
<template>
  <div 
    :class="{'animate__animated': isVisible, 'animate__fadeIn': isVisible, 'invisible': !isVisible}" 
    ref="element"
  >
    <slot></slot>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

// Добавляем props с дефолтным значением
const props = defineProps({
  offset: {
    type: String,
    default: '-30%' // Стандартное значение rootMargin
  }
});

const element = ref(null);
const isVisible = ref(false);

onMounted(() => {
  if (typeof IntersectionObserver !== 'undefined') {
    const callback = (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          isVisible.value = true;
        }
      });
    };

    // Используем переданный offset или стандартное значение
    const observer = new IntersectionObserver(callback, {
      threshold: 0.1,
      rootMargin: `0px 0px ${props.offset} 0px`,
    });

    if (element.value) {
      observer.observe(element.value);
    }

    onUnmounted(() => {
      if (element.value) {
        observer.unobserve(element.value);
      }
    });
  } else {
    // Если IntersectionObserver недоступен, сразу показываем элементы
    isVisible.value = true;
  }
});
</script>

<style scoped>
.animate__animated {
  visibility: visible !important;
}
.invisible {
  visibility: hidden;
}
</style>
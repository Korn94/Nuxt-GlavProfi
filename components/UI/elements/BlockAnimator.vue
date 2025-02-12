<!-- components/elements/BlockAnimator.vue -->
<template>
  <div :class="{'animate__animated': isVisible, 'animate__fadeIn': isVisible, 'invisible': !isVisible}" ref="element">
    <slot></slot>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

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

    const observer = new IntersectionObserver(callback, {
      threshold: 0.1,
      rootMargin: '0px 0px -30% 0px', // Элементы начинают быть видны после 20% от нижней границы
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

<style>
.animate__animated {
  visibility: visible !important;
}
.invisible {
  visibility: hidden;
}
</style>

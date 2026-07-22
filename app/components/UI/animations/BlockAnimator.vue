<!-- components/elements/BlockAnimator.vue -->
<template>
  <div
    :class="{ 'animate__animated': isVisible, 'animate__fadeIn': isVisible, 'before-enter': !isVisible }"
    ref="element"
  >
    <slot></slot>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  offset: {
    type: String,
    default: '-30%'
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
    isVisible.value = true;
  }
});
</script>

<style scoped>
/* Начальное состояние — прозрачно, но занимает место (не visibility: hidden) */
.before-enter {
  opacity: 0;
  /* Не анимируем при SSR — на сервере opacity не применяется,
     а на клиенте плавно проявится, когда попадёт в viewport */
}

.animate__animated {
  opacity: 1;
}
</style>

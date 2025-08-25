<template>
  <div>
    <component :is="currentComponent" />
  </div>
</template>

<script>
import { shallowRef, onMounted, onUnmounted } from 'vue';

export default {
  name: 'App',
  setup() {
    const currentComponent = shallowRef(null);

    const loadComponent = () => {
      if (window.innerWidth > 840) {
        import('./desktop/index.vue').then(module => {
          currentComponent.value = module.default;
        });
      } else {
        import('./mobile/index.vue').then(module => {
          currentComponent.value = module.default;
        });
      }
    };

    const handleResize = () => {
      loadComponent();
    };

    onMounted(() => {
      loadComponent();
      window.addEventListener('resize', handleResize);
    });

    onUnmounted(() => {
      window.removeEventListener('resize', handleResize);
    });

    return {
      currentComponent
    };
  }
}
</script>

<template>
  <div class="header-container" :class="{ 'client-rendered': isClient }">
    <component :is="currentComponent" />
  </div>
</template>

<script setup>
import { shallowRef, onMounted, ref } from 'vue'

// Определяем компоненты
const MobileHeader = defineAsyncComponent(() => import('./mobile/index.vue'))
const DesktopHeader = defineAsyncComponent(() => import('./desktop/index.vue'))

// Флаг для отслеживания клиентского рендеринга
const isClient = ref(false)
const currentComponent = shallowRef(null) // ⚠️ Ключевое изменение!

onMounted(() => {
  isClient.value = true
  
  const updateHeader = () => {
    const isMobile = window.innerWidth <= 840
    currentComponent.value = isMobile ? MobileHeader : DesktopHeader
  }
  
  updateHeader()
  
  window.addEventListener('resize', updateHeader)
  
  onUnmounted(() => {
    window.removeEventListener('resize', updateHeader)
  })
})
</script>

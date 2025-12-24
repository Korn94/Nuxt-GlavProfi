<template>
  <PagesCabinet />
</template>

<script setup>
definePageMeta({
  layout: 'cabinet'
})

useHead({
  meta: [
    { name: 'robots', content: 'noindex, nofollow' },
  ],
  title: 'CRM — Главная'
})
</script>

<style lang="scss">
.cabinet-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem;
  
  &__grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 20px;
    margin-top: 1.5rem;
    
    // Секция с финансовой сводкой и последними операциями
    .top-section {
      display: grid;
      grid-column: span 3;
      grid-template-columns: 2fr 1fr;
      gap: 20px;
      
      // Ключевая настройка: оба блока будут иметь одинаковую высоту
      .finance-summary,
      .recent-operations {
        display: flex;
        flex-direction: column;
      }
      
      // Для мобильных устройств
      @media (max-width: 992px) {
        grid-template-columns: 1fr;
      }
    }
    
    // Секция со статусами объектов
    .bottom-section {
      grid-column: span 3;
      display: grid;
      grid-template-columns: 1fr;
      gap: 20px;
    }
    
    // Общие стили для карточек
    .card {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    
    .card__body {
      display: flex;
      flex-direction: column;
      flex-grow: 1;
    }
  }
}
</style>
<!-- app\pages\cabinet\index.vue -->
<template>
  <!-- Показываем контент только после проверки роли (защита от мелькания) -->
  <PagesCabinet v-if="isAdmin" />
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { navigateTo } from '#app'

definePageMeta({
  layout: 'cabinet',
  middleware: ['require-auth'] // Сначала проверяем авторизацию
})

useHead({
  meta: [
    { name: 'robots', content: 'noindex, nofollow' },
  ],
  title: 'CRM — Главная'
})

// 🔐 Флаг: показываем контент только если пользователь — админ
const isAdmin = ref(false)

onMounted(async () => {
  try {
    // Получаем данные текущего пользователя
    const { user } = await $fetch('/api/me', {
      method: 'GET',
      credentials: 'include'
    })
    
    // ✅ Если роль НЕ 'admin' — перенаправляем на ежедневную работу
    if (user?.role !== 'admin') {
      console.log(`[cabinet/index] 🔐 Доступ запрещён для роли "${user?.role}". Редирект на /cabinet/daily-work`)
      return navigateTo('/cabinet/daily-work', { redirectCode: 302 })
    }
    
    // ✅ Админ — показываем дашборд
    isAdmin.value = true
    
  } catch (error) {
    // Если ошибка авторизации — редирект на логин (дублирует middleware, но на всякий случай)
    console.error('[cabinet/index] Ошибка проверки доступа:', error)
    navigateTo('/login')
  }
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
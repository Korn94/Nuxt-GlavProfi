<template>
  <div class="access-denied-container">
    <div class="card">
      <div class="icon">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      </div>
      <h1>Доступ запрещён</h1>
      <p class="message">
        У вас нет прав для просмотра этой страницы.
      </p>
      <p class="role-info" v-if="user">
        Ваша роль: <strong>{{ user.role }}</strong>
      </p>
      <div class="actions">
        <button class="btn primary" @click="goBack">
          Назад
        </button>
        <NuxtLink to="/cabinet" class="btn outline">
          В кабинет
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useCookie } from '#app'
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

// Получаем токен
const token = useCookie('token')
const user = ref(null)
const router = useRouter()

// Загружаем данные пользователя
onMounted(async () => {
  if (token.value) {
    try {
      const data = await $fetch('/api/me')
      user.value = data.user
    } catch (error) {
      console.error('Не удалось загрузить данные пользователя')
    }
  }
})

// Функция "назад"
function goBack() {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/cabinet')
  }
}
</script>

<style scoped lang="scss">
.access-denied-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f8f9fa;
  padding: 20px;

  .card {
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    padding: 40px;
    text-align: center;
    max-width: 400px;
    width: 100%;

    .icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 60px;
      height: 60px;
      background: #f0f4ff;
      border-radius: 50%;
      color: #4c6ef5;
      margin-bottom: 20px;

      svg {
        width: 32px;
        height: 32px;
      }
    }

    h1 {
      font-size: 24px;
      color: #333;
      margin-bottom: 12px;
    }

    .message {
      color: #666;
      margin-bottom: 16px;
      font-size: 15px;
    }

    .role-info {
      font-size: 14px;
      color: #555;
      margin-bottom: 24px;
      padding: 8px 16px;
      background: #f8f9fa;
      border-radius: 6px;
      display: inline-block;
    }

    .actions {
      display: flex;
      gap: 12px;
      justify-content: center;

      .btn {
        padding: 10px 20px;
        border: none;
        border-radius: 6px;
        font-size: 15px;
        cursor: pointer;
        transition: all 0.2s ease;
        text-decoration: none;
        display: inline-block;

        &.primary {
          background: #4c6ef5;
          color: white;

          &:hover {
            background: #3b5bdb;
          }
        }

        &.outline {
          background: transparent;
          color: #4c6ef5;
          border: 1px solid #4c6ef5;

          &:hover {
            background: #f0f4ff;
          }
        }
      }
    }
  }
}
</style>
<!-- app\components\pages\Cabinet\login.vue -->
<template>
  <div class="background">
    <img src="/main/login2.jpg" alt="Фон для входа" class="background-image" />
    <div class="container">
      <h1>Вход в систему</h1>

      <!-- Поле логина -->
      <div class="input-container">
        <Icon name="mdi:account" class="icon" />
        <input v-model="login" placeholder="Логин" />
      </div>

      <!-- Поле пароля -->
      <div class="input-container">
        <Icon
          :name="showPassword ? 'mdi:lock-open-variant' : 'mdi:password'"
          class="icon hover"
          @click="togglePasswordVisibility"
        />
        <input
          :type="showPassword ? 'text' : 'password'"
          v-model="password"
          placeholder="Пароль"
        />
      </div>

      <!-- Сообщение об ошибке -->
      <p v-if="authStore.error" class="error">{{ authStore.error }}</p>

      <!-- Кнопка входа -->
      <button @click="handleLogin" :disabled="authStore.isChecking">
        <span v-if="authStore.isChecking">Вход...</span>
        <span v-else>Войти</span>
      </button>

      <!-- Кнопка возврата на главную -->
      <button @click="goToHome" class="secondary-btn">
        <Icon name="mdi:arrow-left" class="btn-icon" size="16px" />
        На главную
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '~~/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const login = ref('')
const password = ref('')
const showPassword = ref(false)

// Инициализируем хранилище при монтировании компонента
authStore.init()

async function handleLogin() {
  try {
    await authStore.login({
      login: login.value,
      password: password.value
    })
  } catch (error) {
    console.error('Ошибка при входе:', error)
  }
}

function togglePasswordVisibility() {
  showPassword.value = !showPassword.value
}

function goToHome() {
  router.push('/')
}
</script>

<style lang="scss" scoped>
.background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 0;

  .background-image {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    z-index: -1;
  }

  .container {
    position: relative;
    width: 400px;
    padding: 20px;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(5px);
    border-radius: 5px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    text-align: center;
    z-index: 1;

    h1 {
      color: white;
      font-size: 2rem;
      margin-bottom: 20px;
    }

    input {
      width: 100%;
      padding: 10px;
      margin-bottom: 10px;
      color: #34495e;
    }

    .input-container {
      position: relative;
      .icon {
        position: absolute;
        top: 25%;
        right: 10px;
        color: #34495e;
        cursor: pointer;
      }
    }

    button {
      width: 100%;
      padding: 12px;
      background-color: #00c3f5;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      transition: background-color 0.3s ease;
      margin-top: 10px;
      font-weight: 500;

      &:hover {
        background-color: #34495e;
      }

      &:disabled {
        opacity: 0.7;
        cursor: not-allowed;
      }
    }

    .secondary-btn {
      background-color: transparent;
      border: 1px solid rgba(255, 255, 255, 0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      color: white;
      
      &:hover {
        background-color: #34495e;
      }

      .btn-icon {
        font-size: 1.1rem;
      }
    }

    .error {
      color: #e74c3c;
      margin-top: 10px;
    }
  }
}

span {
  color: unset;
}
</style>
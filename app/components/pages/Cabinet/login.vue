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
      <p v-if="errorMessage" class="error">{{ errorMessage }}</p>

      <!-- Кнопка входа -->
      <button @click="handleLogin">Войти</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const login = ref('')
const password = ref('')
const showPassword = ref(false)
const errorMessage = ref(null)

async function handleLogin() {
  errorMessage.value = null
  const loading = ref(true)

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login: login.value, password: password.value }),
      credentials: 'include'
    })

    if (!response.ok) {
      const errorData = await response.json()
      errorMessage.value = errorData.statusMessage || errorData.message || 'Неверный логин или пароль'
      return
    }

    const data = await response.json()
    const token = useCookie('token')
    token.value = data.token

    router.push('/cabinet')
  } catch (error) {
    console.error('Ошибка при входе:', error)
    errorMessage.value = 'Произошла ошибка при входе'
  } finally {
    loading.value = false
  }
}

function togglePasswordVisibility() {
  showPassword.value = !showPassword.value
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

      &:hover {
        background-color: #34495e;
      }
    }

    .error {
      color: #e74c3c;
      margin-top: 10px;
    }
  }
}
</style>
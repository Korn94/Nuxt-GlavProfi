<template>
  <div v-if="loading" class="loading">
    <p>Авторизация через Telegram...</p>
    <div class="spinner"></div>
  </div>

  <div v-else-if="error" class="error">
    <p><strong>❌ Ошибка:</strong> {{ error }}</p>
    <button @click="retry">Попробовать снова</button>
  </div>

  <div v-else>
    <p>✅ Вы успешно вошли в систему!</p>
    <button @click="goToCabinet">Перейти в кабинет</button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const loading = ref(true);
const error = ref(null);
const router = useRouter();

onMounted(async () => {
  try {
    // Проверяем наличие Telegram SDK
    if (!window.Telegram) {
      throw new Error('Telegram WebApp SDK недоступен');
    }

    // Получаем данные пользователя
    const { initDataUnsafe } = window.Telegram;
    
    if (!initDataUnsafe || !initDataUnsafe.user) {
      throw new Error('Данные пользователя не получены');
    }

    // Отправляем запрос на авторизацию
    const response = await fetch('/api/auth/telegram', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        telegramId: Number(initDataUnsafe.user.id),
        hash: initDataUnsafe.hash
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.statusMessage || 'Ошибка авторизации');
    }

    // Сохраняем токен и перенаправляем
    const { token } = await response.json();
    useCookie('token').value = token;
    
    router.push('/cabinet');
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
});

function retry() {
  location.reload();
}

function goToCabinet() {
  router.push('/cabinet');
}
</script>

<style scoped>
.loading, .error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  text-align: center;
  padding: 20px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(0, 123, 255, 0.3);
  border-top: 4px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-top: 15px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error {
  background: #fff8f8;
  color: #d9534f;
}

.error button {
  margin-top: 15px;
  padding: 10px 20px;
  background: #d9534f;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.error button:hover {
  background: #c9302c;
}

button {
  padding: 10px 20px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  margin-top: 15px;
}

button:hover {
  background: #0069d9;
}
</style>
<!-- app\pages\telegram\index.vue -->
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
import { useAuthStore } from 'stores/auth';

const loading = ref(true);
const error = ref(null);
const router = useRouter();
const authStore = useAuthStore();

// Функция для получения данных из URL хеша
function parseInitDataFromHash() {
  const hash = window.location.hash.substring(1);
  if (!hash) return null;

  const params = new URLSearchParams(hash);
  const tgWebAppData = params.get('tgWebAppData');

  if (!tgWebAppData) return null;

  const dataParams = new URLSearchParams(tgWebAppData);
  const userStr = dataParams.get('user');
  const hashValue = dataParams.get('hash');

  if (!userStr || !hashValue) return null;

  try {
    const decodedUser = decodeURIComponent(userStr);
    const cleanUser = decodedUser.replace(/\\/g, '');
    const user = JSON.parse(cleanUser);

    // Собираем ТОЛЬКО поля, участвующие в хеше
    const initData = {
      id: String(user.id),
      first_name: user.first_name || '',
      username: user.username || '',
      auth_date: String(dataParams.get('auth_date') || ''),
      hash: hashValue
    };

    return initData;
  } catch (e) {
    console.error('Не удалось распарсить данные из хеша:', e);
    return null;
  }
}

onMounted(async () => {
  try {
    // Ждем немного, чтобы плагин успел инициализироваться
    await new Promise(resolve => setTimeout(resolve, 100));

    let initData = null;

    // Сначала пробуем получить данные из window.Telegram
    if (window.Telegram && window.Telegram.initDataUnsafe && window.Telegram.initDataUnsafe.user) {
      const { initDataUnsafe } = window.Telegram;
      // Отправляем ТОЛЬКО те поля, которые участвуют в формировании хеша
      initData = {
        id: String(initDataUnsafe.user.id),
        first_name: initDataUnsafe.user.first_name || '',
        username: initDataUnsafe.user.username || '',
        auth_date: String(initDataUnsafe.auth_date),
        hash: initDataUnsafe.hash
      };
    }

    // Если не получилось, пробуем распарсить из хеша
    if (!initData || !initData.hash) {
      initData = parseInitDataFromHash();
    }

    if (!initData || !initData.hash || !initData.id) {
      throw new Error('Данные пользователя не получены. Убедитесь, что вы открыли приложение через Telegram бота.');
    }

    // Используем store для авторизации
    await authStore.login({ telegramData: initData });

  } catch (err) {
    console.error('Ошибка авторизации:', err);
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
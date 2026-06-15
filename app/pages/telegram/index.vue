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

  // Получаем ВСЕ поля, которые участвуют в формировании хеша
  const queryId = dataParams.get('query_id');
  const userStr = dataParams.get('user');
  const hashValue = dataParams.get('hash');
  const authDate = dataParams.get('auth_date');

  if (!hashValue || !authDate) return null;

  // Собираем объект с оригинальными данными от Telegram
  const initData = {};

  if (queryId) initData.query_id = queryId;
  if (userStr) initData.user = userStr;
  if (authDate) initData.auth_date = authDate;
  initData.hash = hashValue;

  // Добавляем остальные поля если они есть
  const extraFields = ['start_param', 'chat_type', 'chat_instance'];
  extraFields.forEach(field => {
    const value = dataParams.get(field);
    if (value) initData[field] = value;
  });

  return initData;
}

onMounted(async () => {
  try {
    // Ждем немного, чтобы плагин успел инициализироваться
    await new Promise(resolve => setTimeout(resolve, 100));

    let initData = null;

    // Сначала пробуем получить данные из window.Telegram
    if (window.Telegram && window.Telegram.initDataUnsafe && window.Telegram.initDataUnsafe.user) {
      const { initDataUnsafe } = window.Telegram;

      // Собираем ВСЕ поля из initDataUnsafe, которые участвуют в хеше
      initData = {};

      if (initDataUnsafe.query_id) initData.query_id = initDataUnsafe.query_id;
      if (initDataUnsafe.user) {
        // Важно: отправляем user как JSON строку, а не объект
        initData.user = typeof initDataUnsafe.user === 'string'
          ? initDataUnsafe.user
          : JSON.stringify(initDataUnsafe.user);
      }
      if (initDataUnsafe.auth_date) initData.auth_date = String(initDataUnsafe.auth_date);
      if (initDataUnsafe.hash) initData.hash = initDataUnsafe.hash;
      if (initDataUnsafe.start_param) initData.start_param = initDataUnsafe.start_param;
      if (initDataUnsafe.chat_type) initData.chat_type = initDataUnsafe.chat_type;
      if (initDataUnsafe.chat_instance) initData.chat_instance = initDataUnsafe.chat_instance;

      console.log('📦 Данные из window.Telegram:', initData);
    }

    // Если не получилось, пробуем распарсить из хеша
    if (!initData || !initData.hash) {
      initData = parseInitDataFromHash();
    }

    if (!initData || !initData.hash) {
      throw new Error('Данные пользователя не получены. Убедитесь, что вы открыли приложение через Telegram бота.');
    }

    console.log('📤 Отправляем на сервер:', initData);

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

useHead({
  title: 'Авторизация телеграма | ГлавПрофи',
  meta: [
    { name: 'description', content: 'Вход через приложение телеграма' },
    { property: 'og:title', content: 'Вход через приложение телеграма' },
    { property: 'og:description', content: 'Вход через приложение телеграма' },
  ]
})
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
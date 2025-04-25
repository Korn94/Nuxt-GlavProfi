import axios from 'axios';

export default defineNuxtPlugin((nuxtApp) => {
  const apiClient = axios.create({
    baseURL: 'http://192.168.31.244:3001/api', // URL вашего сервера
    // baseURL: 'http://192.168.1.62:3001/api', // URL вашего сервера
  });

  // Перехватчик запросов
  apiClient.interceptors.request.use((config) => {
    console.log('Отправка запроса:', config);
    return config;
  });

  // Перехватчик ответов
  apiClient.interceptors.response.use(
    (response) => {
      console.log('Получен успешный ответ:', response);
      return response;
    },
    (error) => {
      console.error('Ошибка запроса:');
      console.error('URL:', error.config?.url);
      console.error('Метод:', error.config?.method);
      console.error('Статус код:', error.response?.status);
      console.error('Данные ответа:', error.response?.data);
      console.error('Ошибка:', error.message);
      return Promise.reject(error);
    }
  );

  return {
    provide: {
      axios: apiClient,
    },
  };
});
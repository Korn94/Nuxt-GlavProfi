// plugins/router.scrollBehavior.ts
import type { RouterScrollBehavior } from 'vue-router';

export default defineNuxtPlugin((nuxtApp) => {
  const router = nuxtApp.$router as {
    options: {
      scrollBehavior: RouterScrollBehavior;
    };
  };

  router.options.scrollBehavior = async (to, from, savedPosition) => {
    // Если есть savedPosition (например, при навигации "назад"), используем его
    if (savedPosition) {
      return savedPosition;
    }

    // Если есть хэш в URL (например, #walls-2)
    if (to.hash) {
      // Ждем, пока страница полностью загрузится и отрендерится
      await new Promise((resolve) => setTimeout(resolve, 500)); // Задержка для асинхронных данных

      // Пытаемся найти элемент с указанным id
      const element = document.querySelector(to.hash);
      if (element) {
        // Прокручиваем страницу до элемента
        return {
          el: to.hash,
          behavior: 'smooth', // Плавная прокрутка
        };
      }
    }

    // По умолчанию прокручиваем страницу вверх
    // return { top: 0 };
  };
});
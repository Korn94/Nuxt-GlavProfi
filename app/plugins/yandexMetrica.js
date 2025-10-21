// ~/plugins/yandexMetrica.js
export default defineNuxtPlugin((nuxtApp) => {
  if (process.env.NODE_ENV === 'production' && process.client) {
    const metricaId = useRuntimeConfig().public.yandexMetricaId;

    if (!metricaId) {
      console.warn('ID счётчика Яндекс.Метрики не указан в переменных окружения.');
      return;
    }

    // Проверяем, не инициализирована ли метрика ранее
    if (window.ym && window.ym.initialized) {
      return;
    }

    // Добавляем флаг инициализации
    window.ym = function() {
      (window.ym.a = window.ym.a || []).push(arguments);
    };
    window.ym.initialized = true;
    window.ym.a = [];

    // Загружаем скрипт метрики после полной загрузки страницы
    if (document.readyState === 'complete') {
      loadMetricaScript();
    } else {
      window.addEventListener('load', loadMetricaScript);
    }

    // Функция для загрузки скрипта метрики
    function loadMetricaScript() {
      const script = document.createElement('script');
      script.async = true; // Асинхронная загрузка - КЛЮЧЕВОЙ ПАРАМЕТР
      script.defer = true;  // Также используем defer для дополнительной оптимизации
      script.src = `https://mc.yandex.ru/metrika/tag.js?id=${metricaId}`; // Убраны пробелы в URL
      
      // Добавляем обработчик ошибок
      script.onerror = () => {
        console.error('Ошибка загрузки Яндекс.Метрики');
        window.ym.initialized = false;
      };
      
      document.head.appendChild(script);
      
      // Инициализация после загрузки скрипта
      script.onload = () => {
        try {
          ym(metricaId, "init", {
            clickmap: true,
            trackLinks: true,
            accurateTrackBounce: true,
            webvisor: true,
            trackHash: true,
            ecommerce: "dataLayer"
          });
          
          // Отправляем первый хит
          ym(metricaId, "hit", window.location.href);
          
          // Глобальный метод $ym
          nuxtApp.vueApp.config.globalProperties.$ym = ym;
          
          // Отправка hit при изменении страницы
          nuxtApp.hook('page:finish', () => {
            if (typeof ym === 'function') {
              ym(metricaId, 'hit', window.location.href);
            }
          });
          
          // Логируем успешную загрузку
          console.log('Яндекс.Метрика успешно инициализирована');
        } catch (e) {
          console.error('Ошибка инициализации Яндекс.Метрики:', e);
          window.ym.initialized = false;
        }
      };
    }
  }
});
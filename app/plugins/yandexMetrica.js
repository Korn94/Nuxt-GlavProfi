// ~/plugins/yandexMetrica.js
export default defineNuxtPlugin((nuxtApp) => {
  if (process.env.NODE_ENV === 'production' && process.client) {
    const metricaId = useRuntimeConfig().public.yandexMetricaId;

    if (!metricaId) {
      console.warn('ID счётчика Яндекс.Метрики не указан в переменных окружения.');
      return;
    }

    // Защита от повторной инициализации
    if (!window.ym) {
      window.ym = function () {
        (ym.a = ym.a || []).push(arguments);
      };
      window.ym.l = new Date().getTime();
    }

    // Подключение скрипта
    (function (m, e, t, r, i, k, a) {
      m[i] = m[i] || function () {
        (m[i].a = m[i].a || []).push(arguments);
      };
      m[i].l = 1 * new Date();
      k = e.createElement(t);
      a = e.getElementsByTagName(t)[0];
      k.async = 1;
      k.src = r;
      a.parentNode.insertBefore(k, a);
    })(window, document, "script", "https://mc.yandex.ru/metrika/tag.js ", "ym");

    // Инициализация счётчика
    ym(metricaId, "init", {
      clickmap: true,
      trackLinks: true,
      accurateTrackBounce: true,
      webvisor: true,
    });

    // Глобальный метод $ym
    nuxtApp.vueApp.config.globalProperties.$ym = ym;

    // Отправка hit при изменении страницы
    nuxtApp.hook('page:finish', () => {
      if (typeof ym === 'function') {
        ym(metricaId, 'hit', window.location.href);
      }
    });
  }
});
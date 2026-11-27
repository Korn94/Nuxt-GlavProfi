// ~/plugins/yandexMetrica.client.js
//
// Яндекс.Метрика (счётчик 93400187).
//
// ⚠️ Вебвизор, карта скроллинга и аналитика форм включаются НЕ этим кодом, а
// опцией «Вебвизор, карта скроллинга, аналитика форм» на вкладке «Счётчик»
// в настройках счётчика Метрики (детальные настройки — на вкладке «Вебвизор»).
// Опция `webvisor: true` в ym('init') — legacy: текущий tag.js (контейнер 1.58.1)
// её уже не читает (в маппинге опций тега поля webvisor нет), поэтому передавать
// её бессмысленно. По той же причине строка «Webvisor option» в панели
// `?_ym_debug=2` ВСЕГДА показывает off — это не индикатор состояния записи.
//
// ⚠️ Тег грузится ПОСЛЕ window.load — сделано осознанно (сайт должен отрисоваться
// моментально), не «оптимизировать» обратно на раннюю загрузку.
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

    // Штатная заглушка-очередь Метрики: до загрузки tag.js вызовы копятся
    // в ym.a и разбираются тегом при его инициализации.
    window.ym = function() {
      (window.ym.a = window.ym.a || []).push(arguments);
    };
    window.ym.initialized = true;
    window.ym.a = [];

    /**
     * Обёртка с уже подставленным номером счётчика.
     * Нативный ym требует id первым аргументом: ym(id, 'reachGoal', 'name'),
     * поэтому из компонентов зовём коротко: $ym('reachGoal', 'name').
     * Пишем и в window.$ym (его читают формы), и в globalProperties (для шаблонов).
     * Создаём ДО загрузки тега: цели, отправленные раньше, попадут в очередь.
     */
    const $ym = (method, ...args) => window.ym(metricaId, method, ...args);
    window.$ym = $ym;
    nuxtApp.vueApp.config.globalProperties.$ym = $ym;

    // Последний отправленный адрес (path + query) — защита от двойного hit.
    // Hash-переходы отдельно ловит сам тег (trackHash), их не дублируем.
    let lastSentPage = null;
    const currentPage = () => window.location.pathname + window.location.search;

    function sendHit() {
      const page = currentPage();
      if (page === lastSentPage) return;
      lastSentPage = page;
      window.ym(metricaId, 'hit', window.location.href);
    }

    // Загружаем скрипт метрики после полной загрузки страницы
    if (document.readyState === 'complete') {
      loadMetricaScript();
    } else {
      window.addEventListener('load', loadMetricaScript, { once: true });
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
            trackHash: true
          });

          // ⚠️ ym('init') сам отправляет первый pageview. Отдельный hit здесь
          // раньше давал два просмотра на первую страницу — не возвращать.
          lastSentPage = currentPage();

          // SPA-переходы: pushState тег не видит, поэтому hit шлём сами
          // (sendHit не дублирует уже отправленный адрес).
          nuxtApp.hook('page:finish', sendHit);
          
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
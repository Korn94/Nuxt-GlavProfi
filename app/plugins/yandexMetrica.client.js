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
// ⏱️ КОГДА грузится тег (не «оптимизировать» обратно на статический <head>):
//   • обычный случай — сразу после гидратации (app:mounted) + requestIdleCallback:
//     основной контент отрисован, main thread свободен, hero-видео (6.4 МБ)
//     стартует позже — за канал тег не конкурирует;
//   • saveData / 2g / 3g — ждём window.load, как раньше: на медленной сети каждый
//     КБ важнее аналитики, контент должен появиться как можно раньше;
//   • window.load остаётся страховкой (хук не сработал из-за ошибки гидратации),
//     а потолок HARD_CAP_MS гарантирует, что тег не потеряется совсем;
//   • запрос идёт с fetchPriority="low"; defer динамическому скрипту не нужен —
//     он действует только на скрипты, вставленные парсером.
//
//   • внутренние страницы (/cabinet/**, /login, /access-denied) не трекаем вовсе —
//     тот же список, что у GA и у собственного трекера посетителей;
//
// ⚠️ Почему не «просто async в <head>», как в штатном сниппете Метрики: tag.js —
// 208 754 байта несжатого (≈60–65 КБ gzip) + ресурсы Вебвизора после init, это
// сопоставимо с третью критического JS сайта (180 КБ gzip на главной).
import { isExcludedPath } from '~/composables/visitor/trackerCore';

export default defineNuxtPlugin((nuxtApp) => {
  if (process.env.NODE_ENV === 'production' && process.client) {
    const metricaId = useRuntimeConfig().public.yandexMetricaId;

    if (!metricaId) {
      console.warn('ID счётчика Яндекс.Метрики не указан в переменных окружения.');
      return;
    }

    // 🚫 Внутренние страницы не трекаем: /cabinet/**, /login, /access-denied —
    // тот же список, что у GA (app/plugins/analytics.client.ts) и у собственного
    // трекера посетителей (app/composables/visitor/trackerCore.ts).
    // Здесь выходим ДО создания заглушки ym и $ym: на внутренних страницах тега
    // нет вовсе (ни запросов, ни записи Вебвизора, ни целей).
    if (isExcludedPath(window.location.pathname)) {
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
      // Переходы внутри кабинета/логина не считаем. Схема «публичная → кабинет →
      // публичная» работает: на публичной странице hit снова отправится.
      if (isExcludedPath(window.location.pathname)) return;
      const page = currentPage();
      if (page === lastSentPage) return;
      lastSentPage = page;
      window.ym(metricaId, 'hit', window.location.href);
    }

    /** Сколько максимум ждём окно простоя main thread (мс) */
    const IDLE_TIMEOUT_MS = 2000;
    /** Fallback для браузеров без requestIdleCallback (Safari < 16.4), мс */
    const IDLE_FALLBACK_MS = 800;
    /** Потолок: тег обязан уйти не позже N мс от старта, даже если load не случился */
    const HARD_CAP_MS = 6000;

    /**
     * Стоит ли стартовать раньше window.load.
     * На экономии трафика и медленных сетях — НЕТ: там каждый КБ важнее
     * аналитики, контент должен появиться как можно раньше (поведение как раньше).
     */
    function canStartEarly() {
      // NetworkInformation есть не во всех браузерах (тип не в lib.dom)
      const connection = navigator.connection;
      if (connection?.saveData) return false;
      if (connection?.effectiveType && ['slow-2g', '2g', '3g'].includes(connection.effectiveType)) {
        return false;
      }
      return true;
    }

    /** Уже начали загрузку тега (защита от двойного инжекта) */
    let started = false;
    /** Тег загружен в DOM */
    let tagLoaded = false;
    /** ym('init') уже выполнен — до этого тег не отправляет ни хитов, ни записи Вебвизора */
    let inited = false;

    /**
     * Инициализация счётчика — один раз и только на публичной странице.
     * Нужна отдельной функцией, потому что тег может догрузиться, когда
     * пользователь уже ушёл в /cabinet: тогда init откладывается до возвращения
     * на публичную страницу (иначе первый pageview и Вебвизор пришлись бы на кабинет).
     */
    function tryInitCounter() {
      if (inited || !tagLoaded) return;
      if (isExcludedPath(window.location.pathname)) return;

      try {
        ym(metricaId, "init", {
          clickmap: true,
          trackLinks: true,
          accurateTrackBounce: true,
          trackHash: true
        });

        inited = true;

        // ⚠️ ym('init') сам отправляет первый pageview. Отдельный hit здесь
        // раньше давал два просмотра на первую страницу — не возвращать.
        lastSentPage = currentPage();

        // Логируем успешную загрузку: мс от начала навигации — для диагностики
        // (по консоли видно, сколько тег выиграл у window.load).
        console.log(`Яндекс.Метрика успешно инициализирована (${Math.round(performance.now())} мс)`);
      } catch (e) {
        console.error('Ошибка инициализации Яндекс.Метрики:', e);
        window.ym.initialized = false;
      }
    }

    /** Загрузка и инициализация tag.js — ровно один раз за страницу */
    function injectMetrica() {
      if (started) return;
      started = true;

      const script = document.createElement('script');
      script.async = true; // Асинхронная загрузка - КЛЮЧЕВОЙ ПАРАМЕТР
      // Низший приоритет запроса: тег не отбирает канал у постера, картинок
      // первого экрана и шрифтов (учитывает Chrome, остальные игнорируют).
      if ('fetchPriority' in script) script.fetchPriority = 'low';
      script.src = `https://mc.yandex.ru/metrika/tag.js?id=${metricaId}`;

      // Добавляем обработчик ошибок
      script.onerror = () => {
        console.error('Ошибка загрузки Яндекс.Метрики');
        window.ym.initialized = false;
      };

      // Тег загрузился: инициализируем счётчик (если не ушли во внутренние
      // страницы) и подписываемся на SPA-переходы.
      script.onload = () => {
        tagLoaded = true;
        tryInitCounter();

        nuxtApp.hook('page:finish', () => {
          // Тег догрузился, пока пользователь был в кабинете/на логине:
          // стартуем на первой же публичной странице.
          if (!inited) {
            tryInitCounter();
            return;
          }
          sendHit();
        });
      };

      document.head.appendChild(script);
    }

    /** Запуск в ближайший простой main thread (иначе — с короткой задержкой) */
    function runInIdle() {
      if (typeof window.requestIdleCallback === 'function') {
        window.requestIdleCallback(injectMetrica, { timeout: IDLE_TIMEOUT_MS });
      } else {
        window.setTimeout(injectMetrica, IDLE_FALLBACK_MS);
      }
    }

    /**
     * ⏱️ Когда стартуем:
     *   1. Страница уже загружена целиком — грузим сразу, ждать нечего.
     *   2. Медленная сеть / saveData — как раньше, после window.load.
     *   3. Обычный случай — после гидратации (app:mounted), когда основной контент
     *      отрисован и main thread свободен; window.load — страховка,
     *      HARD_CAP_MS — потолок.
     */
    if (document.readyState === 'complete') {
      injectMetrica();
    } else if (!canStartEarly()) {
      window.addEventListener('load', injectMetrica, { once: true });
    } else {
      nuxtApp.hook('app:mounted', runInIdle);
      window.addEventListener('load', runInIdle, { once: true });
      window.setTimeout(injectMetrica, HARD_CAP_MS);
    }
  }
});

// app/plugins/analytics.client.ts
/**
 * Ленивая загрузка Google Analytics 4 (gtag.js).
 *
 * ⚠️ gtag.js — самый тяжёлый сторонний скрипт сайта: 545 КБ (532 КиБ) без сжатия,
 * ~183 КБ gzip. Поэтому он НЕ ставится в <head> (см. app/config/meta.config.ts):
 *   • только production — dev/локальные стенды не шлют данные в боевой поток;
 *   • только публичные страницы — /cabinet, /login, /access-denied не трекаем
 *     (тот же список, что у собственного трекера посетителей);
 *   • только после window.load + requestIdleCallback — вне критического пути (LCP/TBT).
 *
 * Счёт page_view НЕ дублируем: первый отправляет сам gtag('config'),
 * SPA-переходы ловит enhanced measurement «Page changes based on browser history events».
 */
import { defineNuxtPlugin } from 'nuxt/app';
import { isExcludedPath } from '~/composables/visitor/trackerCore';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const GTAG_URL = 'https://www.googletagmanager.com/gtag/js';
/** Сколько максимум ждать простоя, если браузер не даёт idle-окно */
const IDLE_TIMEOUT_MS = 4000;
/** Fallback для браузеров без requestIdleCallback (Safari < 16.4) */
const IDLE_FALLBACK_MS = 1500;

export default defineNuxtPlugin((nuxtApp) => {
  // В dev/preview не грузим вообще: тег нужен только на боевом домене.
  if (process.env.NODE_ENV !== 'production') return;

  const gaId = useRuntimeConfig().public.googleAnalyticsId;
  if (!gaId) return;

  // $router в плагине нетипизирован (unknown), а для проверки путей хватает location:
  // history уже обновлён к моменту page:finish.
  const currentPath = () => window.location.pathname;
  if (isExcludedPath(currentPath())) return;

  // Уважаем отказ пользователя от трекинга
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
  if (nav.doNotTrack === '1' || nav.doNotTrack === 'yes' || nav.globalPrivacyControl === true) return;

  // Штатная заглушка Google: вызовы копятся в dataLayer до загрузки gtag.js
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag() {
    window.dataLayer!.push(arguments);
  };

  /**
   * Внутренние страницы отключаем и после загрузки скрипта:
   * window['ga-disable-<ID>'] — официальный флаг отключения измерения для потока.
   */
  function syncTrackingAllowed(path: string) {
    (window as unknown as Record<string, unknown>)[`ga-disable-${gaId}`] = isExcludedPath(path);
  }

  let injected = false;

  function inject() {
    if (injected) return;
    injected = true;

    // Защита от повторной вставки (HMR, повторный вызов плагина)
    if (!document.querySelector('script[src^="https://www.googletagmanager.com/gtag/js"]')) {
      const script = document.createElement('script');
      script.async = true;
      script.src = `${GTAG_URL}?id=${gaId}`;
      document.head.appendChild(script);
    }

    syncTrackingAllowed(currentPath());
    window.gtag!('js', new Date());
    window.gtag!('config', gaId);

    nuxtApp.hook('page:finish', () => syncTrackingAllowed(currentPath()));
  }

  function schedule() {
    if (typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(inject, { timeout: IDLE_TIMEOUT_MS });
    } else {
      window.setTimeout(inject, IDLE_FALLBACK_MS);
    }
  }

  if (document.readyState === 'complete') schedule();
  else window.addEventListener('load', schedule, { once: true });
});

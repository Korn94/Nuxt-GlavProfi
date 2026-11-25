// plugins/telegram.client.ts

import { defineNuxtPlugin } from 'nuxt/app';

// ⚡ @telegram-apps/sdk (~22.5 КБ gzip) не должен попадать в первую загрузку: он нужен
// только внутри Telegram Mini App. Поэтому здесь три правила:
//   1) сначала дешёвая проверка БЕЗ импорта SDK (window.Telegram.WebApp.initData /
//      параметры запуска tgWebApp* в hash) — обычный браузер её не проходит;
//   2) SDK грузится динамическим import() только если проверка прошла;
//   3) плагин НЕ async: Nuxt ждёт async-плагины перед монтированием приложения,
//      поэтому `await import()` внутри плагина задерживал гидратацию на лишний RTT
//      у ВСЕХ посетителей, а не только у пользователей Telegram.

// Добавляем типизацию для Telegram WebApp SDK
declare global {
  interface Window {
    Telegram: {
      initDataUnsafe?: {
        user?: string | { id: number; };
        hash?: string;
        auth_date?: number;
        query_id?: string;
        start_param?: string;
        chat_type?: string;
        chat_instance?: string;
      };
      isReady?: boolean;
    };
  }
}

/**
 * Дешёвый детект Telegram Mini App — БЕЗ импорта SDK.
 *
 * Признаки запуска внутри Telegram:
 * - `window.Telegram.WebApp.initData` — непустая строка (клиент Telegram уже внедрил WebApp);
 * - параметры запуска `tgWebAppData` / `tgWebAppPlatform` / … в hash или search: так Telegram
 *   открывает Mini App даже когда объект `window.Telegram` ещё не создан.
 *
 * Проверка намеренно нестрогая (дешёвая): окончательное решение принимает `isTMA()` из SDK,
 * который загружается только после неё. Ложное срабатывание стоит одного лишнего чанка,
 * пропуск настоящего Mini App сломал бы интеграцию.
 */
function isLikelyTelegramMiniApp(): boolean {
  if (typeof window === 'undefined') return false;

  const webApp = (window as any)?.Telegram?.WebApp as { initData?: string } | undefined;
  if (typeof webApp?.initData === 'string' && webApp.initData.length > 0) return true;

  const launchParams = `${window.location.hash} ${window.location.search}`;
  return /tgWebApp(Data|Platform|Version|StartParam)/i.test(launchParams);
}

export default defineNuxtPlugin(() => {
  if (!isLikelyTelegramMiniApp()) {
    console.log('ℹ️ Приложение запущено не в Telegram. SDK не загружается.');
    return;
  }

  // ⚡ Не блокируем гидратацию: загрузка SDK и его инициализация — фоновая задача.
  // (Раньше это был `await import()` прямо в плагине → Nuxt ждал его перед mount.)
  // `finally` гарантирует, что ждущие страницы (например /telegram) узнают о завершении
  // и не полагаются на фиксированную паузу.
  void initTelegramSdk().finally(markTelegramReady);
});

/**
 * Сообщает страницам, что инициализация Telegram завершена (успешно или нет).
 * Слушатель — `app/pages/telegram/index.vue` (`waitForTelegramReady`).
 */
function markTelegramReady(): void {
  if (typeof window === 'undefined') return;
  (window as any).__telegramReady = true;
  window.dispatchEvent(new Event('telegram:ready'));
}

/**
 * Загружает и инициализирует Telegram SDK.
 * Вызывается только после дешёвой проверки `isLikelyTelegramMiniApp()`.
 */
async function initTelegramSdk(): Promise<void> {
  if (process.client) {
    // Проверяем, что мы в Telegram Mini App
    let isInTelegram = false;

    let sdk: typeof import('@telegram-apps/sdk') | null = null;
    try {
      sdk = await import('@telegram-apps/sdk');
      isInTelegram = await sdk.isTMA();
    } catch (e) {
      console.warn('⚠️ Не удалось проверить, что мы в Telegram:', e);
    }

    if (!isInTelegram || !sdk) {
      console.log('ℹ️ Приложение запущено не в Telegram. SDK не будет инициализирован.');
      return;
    }

    // Инициализируем SDK
    let tg: any;
    try {
      tg = sdk.init();
    } catch (e) {
      console.error('❌ Ошибка инициализации SDK:', e);
    }

    // Если SDK не дал данных, пытаемся получить их из хеша
    if (!tg || !tg.initDataUnsafe) {
      console.warn('⚠️ SDK не получил данные из хеша. Пытаемся получить вручную...');

      try {
        // Получаем хеш и удаляем #
        const hash = window.location.hash.substring(1);

        // Парсим все параметры из хеша
        const params = new URLSearchParams(hash);

        // Извлекаем tgWebAppData
        const tgWebAppData = params.get('tgWebAppData');

        if (tgWebAppData) {
          // Парсим строку как query string
          const dataParams = new URLSearchParams(tgWebAppData);

          // Получаем user
          const userStr = dataParams.get('user');
          let user = null;

          if (userStr) {
            try {
              // Используем decodeURIComponent только один раз
              const decodedUser = decodeURIComponent(userStr);

              // Убираем экранирование обратных слэшей
              const cleanUser = decodedUser.replace(/\\/g, '');

              // Парсим JSON
              user = JSON.parse(cleanUser);
            } catch (e) {
              console.error('❌ Не удалось распарсить user:', e);
              console.error('Raw user string:', userStr);
            }
          }

          // Получаем ВСЕ поля из tgWebAppData
          const hashValue = dataParams.get('hash') || undefined;
          const authDate = dataParams.get('auth_date') || undefined;
          const queryId = dataParams.get('query_id') || undefined;
          const startParam = dataParams.get('start_param') || undefined;
          const chatType = dataParams.get('chat_type') || undefined;
          const chatInstance = dataParams.get('chat_instance') || undefined;

          // Создаем объект с данными - сохраняем user как строку!
          const initDataUnsafe = {
            // ✅ Тип Telegram-объекта допускает string | { id } | undefined (null нельзя),
            // а в хеше отсутствующий user приходит как null — нормализуем в undefined
            user: userStr ?? undefined,
            hash: hashValue,
            auth_date: authDate ? parseInt(authDate) : undefined,
            query_id: queryId,
            start_param: startParam,
            chat_type: chatType,
            chat_instance: chatInstance
          };

          // Сохраняем в глобальную переменную
          window.Telegram = {
            initDataUnsafe,
            isReady: true
          };

          console.log('✅ Данные получены из хеша:', initDataUnsafe);
        }
      } catch (e) {
        console.error('❌ Не удалось обработать хеш:', e);
      }
    } else {
      // Если SDK работает — сохраняем его и добавляем все необходимые поля
      window.Telegram = tg;

      // Убеждаемся, что user остается строкой для корректной проверки хеша
      if (tg.initDataUnsafe && typeof tg.initDataUnsafe.user === 'object') {
        tg.initDataUnsafe.user = JSON.stringify(tg.initDataUnsafe.user);
      }

      console.log('✅ Данные получены через SDK:', tg.initDataUnsafe);
    }
  }
}
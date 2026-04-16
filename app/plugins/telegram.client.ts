// plugins/telegram.client.ts

import { defineNuxtPlugin } from 'nuxt/app';
import { init, isTMA } from '@telegram-apps/sdk';

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

export default defineNuxtPlugin(async () => {
  if (process.client) {
    // Проверяем, что мы в Telegram Mini App
    let isInTelegram = false;

    try {
      isInTelegram = await isTMA();
    } catch (e) {
      console.warn('⚠️ Не удалось проверить, что мы в Telegram:', e);
    }

    if (!isInTelegram) {
      console.log('ℹ️ Приложение запущено не в Telegram. SDK не будет инициализирован.');
      return;
    }

    // Инициализируем SDK
    let tg: any;
    try {
      tg = init();
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
            user: userStr,  // Важно: оставляем как строку, не парсим в JSON
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
});
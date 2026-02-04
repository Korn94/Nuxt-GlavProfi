// plugins/telegram.client.ts

import { defineNuxtPlugin } from 'nuxt/app';
import { init, isTMA } from '@telegram-apps/sdk';

// Добавляем типизацию для Telegram WebApp SDK
declare global {
  interface Window {
    Telegram: {
      initDataUnsafe?: {
        user?: {
          id: number;
        };
        hash?: string;
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
          
          // Получаем hash
          const hashValue = dataParams.get('hash') || undefined;
          
          // Создаем объект с данными
          const initDataUnsafe = {
            user,
            hash: hashValue
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
      // Если SDK работает — сохраняем его
      window.Telegram = tg;
      console.log('✅ Данные получены через SDK:', tg.initDataUnsafe);
    }
  }
});

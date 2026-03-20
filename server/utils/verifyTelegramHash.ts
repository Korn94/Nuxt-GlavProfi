// server/utils/verifyTelegramHash.ts

import crypto from 'crypto';

/**
 * Проверяет подлинность хеша, сгенерированного Telegram
 * 
 * @param data - Данные, переданные от Telegram
 * @param botToken - Токен вашего Telegram бота
 * @returns boolean - Истинно, если хеш валиден
 */
export function verifyTelegramHash(data: Record<string, any>, botToken: string): boolean {
  // Убираем хеш из данных
  const { hash, ...dataWithoutHash } = data;
  
  // Сортируем ключи
  const sortedKeys = Object.keys(dataWithoutHash).sort();
  
  // Формируем строку для подписи
  const dataString = sortedKeys
    .map(key => `${key}=${dataWithoutHash[key]}`)
    .join('\n');
  
  // Генерируем секретный ключ на основе токена бота
  const secretKey = crypto.createHash('sha256').update(botToken).digest();
  
  // Вычисляем хеш
  const computedHash = crypto
    .createHmac('sha256', secretKey)
    .update(dataString)
    .digest('hex');
  
  return computedHash === hash;
}

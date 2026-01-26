// server/api/auth/telegram.post.ts

import { db } from '../../db';
import { users } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { generateToken } from '../../utils/jwt';
import { eventHandler, readBody, createError } from 'h3';

export default eventHandler(async (event) => {
  const body = await readBody<{ telegramId: number; hash?: string }>(event);

  if (!body.telegramId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing telegramId'
    });
  }

  // Проверяем хеш (обязательно для безопасности!)
  if (!body.hash) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing hash'
    });
  }

  // Ищем пользователя в БД по telegram_id
  const [user] = await db.select().from(users).where(eq(users.telegramId, body.telegramId));

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Вас нет в базе данных для авторизации'
    });
  }

  // Генерируем токен
  const token = await generateToken({ id: user.id, login: user.login });

  return { token };
});
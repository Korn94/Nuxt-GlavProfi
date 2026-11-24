// server/routes/llms-full.txt.ts
/**
 * 🤖 /llms-full.txt — полная документация для ИИ-агентов: все позиции прайса
 * из БД (без ручного хардкода цен). Кэш на 5 минут; принудительно: ?refresh=1.
 *
 * ⚠️ Имя файла без суффикса .get.ts — роут принимает и GET, и HEAD.
 * ⚠️ Нельзя держать копию в public/: public-ассеты отдаются Nitro раньше
 *    серверных роутов и перекрыли бы этот обработчик.
 */
import { defineEventHandler } from 'h3'
import { sendLlmsDocument } from '../utils/llmsHttp'

export default defineEventHandler(event => sendLlmsDocument(event, content => content.llmsFull))

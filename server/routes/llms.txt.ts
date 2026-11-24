// server/routes/llms.txt.ts
/**
 * 🤖 /llms.txt — краткая документация для ИИ-агентов.
 *
 * Структура файла — в server/assets/llms/llms.txt, блок цен собирается из БД
 * (см. server/utils/llmsPrice.ts). Кэш на 5 минут; принудительно: ?refresh=1.
 *
 * ⚠️ Файл называется БЕЗ суффикса .get.ts — тогда роут обрабатывает и GET, и HEAD.
 * ⚠️ Нельзя держать копию в public/: public-ассеты отдаются middleware Nitro
 *    раньше серверных роутов и перекрыли бы этот обработчик.
 */
import { defineEventHandler } from 'h3'
import { sendLlmsDocument } from '../utils/llmsHttp'

export default defineEventHandler(event => sendLlmsDocument(event, content => content.llmsTxt))

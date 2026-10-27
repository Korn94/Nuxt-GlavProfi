// server/socket/handlers/index.ts
/**
 * Баррель обработчиков Socket.IO.
 *
 * Реэкспортирует модули, чьи регистраторы вызываются из setupSocketServer():
 * - user     — setupUserHandlers()
 * - activity — setupActivityHandlers()
 * - status   — setupStatusHandlers()
 * - tasks    — registerTaskHandlers()
 *
 * Вспомогательные эмиттеры (columns/subtasks) используются из API-эндпоинтов
 * и импортируются напрямую из своих файлов — в баррель не выносятся.
 */
export * from './user'
export * from './activity'
export * from './status'
export * from './tasks'

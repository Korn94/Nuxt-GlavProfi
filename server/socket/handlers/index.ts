// server/socket/handlers/index.ts
/**
 * Баррель обработчиков Socket.IO.
 *
 * Реэкспортирует модули, чьи регистраторы вызываются из setupSocketServer():
 * - user     — setupUserHandlers()
 * - activity — setupActivityHandlers()
 * - tasks    — только broadcast-эмиттеры задач (registerTaskHandlers удалён, P8)
 *
 * status — экспортирует broadcastStatus() (используется activity/user-обработчиками);
 * собственного регистратора нет: 'status:update' удалён в P7 (клиент его не отправлял).
 *
 * Вспомогательные эмиттеры (columns/subtasks) используются из API-эндпоинтов
 * и импортируются напрямую из своих файлов — в баррель не выносятся.
 */
export * from './user'
export * from './activity'
export * from './status'
export * from './tasks'

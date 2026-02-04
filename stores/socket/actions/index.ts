// stores/socket/actions/index.ts
// Экспортируем только публичные действия стора
export { connect } from './connect'
export { disconnect } from './disconnect'
export { emit } from './emit'
export { on, off, once } from './listeners'
export { sendQueuedMessages } from './queue'
export { resetState } from './reset'

// setupConnectionHandlers НЕ экспортируется - это внутренняя функция

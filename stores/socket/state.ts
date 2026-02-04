// stores/socket/state.ts
import type { SocketState } from './types'

export const socketState = (): SocketState => ({
  socket: null,
  isConnected: false,
  isConnecting: false,
  error: null,
  userId: null,
  reconnectAttempts: 0,
  maxReconnectAttempts: 5,
  reconnectDelay: 2000,
  messageQueue: []
})

// stores/socket/types.ts
import type { Socket } from 'socket.io-client'
import type { ClientToServerEvents, ServerToClientEvents } from '~/types/socket'

export type TypedClientSocket = Socket<ServerToClientEvents, ClientToServerEvents>

export interface QueuedMessage<K extends keyof ClientToServerEvents = keyof ClientToServerEvents> {
  event: K
  payload: Parameters<ClientToServerEvents[K]>[0]
  timestamp: number
}

export interface SocketState {
  socket: TypedClientSocket | null
  isConnected: boolean
  isConnecting: boolean
  error: string | null
  userId: number | null
  reconnectAttempts: number
  maxReconnectAttempts: number
  reconnectDelay: number
  messageQueue: QueuedMessage[]
}

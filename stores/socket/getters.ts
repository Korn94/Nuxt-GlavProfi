// stores/socket/getters.ts
import type { TypedClientSocket } from './types'

export const socketGetters = {
  getSocket(state: any): TypedClientSocket | null {
    return state.socket
  },
  getIsConnected(state: any): boolean {
    return state.isConnected
  },
  getError(state: any): string | null {
    return state.error
  },
  getIsConnecting(state: any): boolean {
    return state.isConnecting
  },
  getReconnectAttempts(state: any): number {
    return state.reconnectAttempts
  }
}

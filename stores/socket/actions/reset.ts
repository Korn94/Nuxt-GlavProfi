// stores/socket/actions/reset.ts
export function resetState(this: any) {
  this.socket = null
  this.isConnected = false
  this.isConnecting = false
  this.error = null
  this.userId = null
  this.reconnectAttempts = 0
  this.messageQueue = []
  console.log('[SocketStore] State reset')
}

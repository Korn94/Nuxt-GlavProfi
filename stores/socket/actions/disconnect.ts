// stores/socket/actions/disconnect.ts
export async function disconnect(this: any) {
  if (process.server || !this.socket) {
    console.warn('[SocketStore] Cannot disconnect: no socket instance')
    return
  }

  try {
    console.log('[SocketStore] Disconnecting...')
    this.socket.disconnect()
    this.socket = null
    this.isConnected = false
    this.isConnecting = false
    this.error = null
    this.reconnectAttempts = 0
    this.messageQueue = []
    console.log('[SocketStore] ✅ Disconnected')
  } catch (error) {
    console.error('[SocketStore] Disconnection error:', error)
  }
}

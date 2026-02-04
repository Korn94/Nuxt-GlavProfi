// stores/socket/actions/listeners.ts
export function on<K extends keyof any>(
  this: any,
  event: K,
  callback: (...args: any[]) => void
): void {
  if (!this.socket) {
    console.warn(`[SocketStore] Cannot subscribe to "${String(event)}": no socket instance`)
    return
  }

  // @ts-ignore - Socket.IO имеет сложную типизацию для on
  this.socket.on(event, callback)
  console.log(`[SocketStore] 📡 Subscribed to "${String(event)}"`)
}

export function off<K extends keyof any>(
  this: any,
  event: K,
  callback?: (...args: any[]) => void
): void {
  if (!this.socket) {
    console.warn(`[SocketStore] Cannot unsubscribe from "${String(event)}": no socket instance`)
    return
  }

  if (callback) {
    // @ts-ignore
    this.socket.off(event, callback)
  } else {
    this.socket.off(event)
  }

  console.log(`[SocketStore] 📴 Unsubscribed from "${String(event)}"`)
}

export function once<K extends keyof any>(
  this: any,
  event: K,
  callback: (...args: any[]) => void
): void {
  if (!this.socket) {
    console.warn(`[SocketStore] Cannot subscribe to "${String(event)}": no socket instance`)
    return
  }

  // @ts-ignore
  this.socket.once(event, callback)
  console.log(`[SocketStore] 📡 Subscribed once to "${String(event)}"`)
}

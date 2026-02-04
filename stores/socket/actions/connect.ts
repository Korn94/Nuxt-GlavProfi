// stores/socket/actions/connect.ts
import { io } from 'socket.io-client'
import { useCookie } from "nuxt/app"
import type { TypedClientSocket } from '../types'

export async function connect(this: any) {
  if (process.server) {
    console.warn('[SocketStore] Cannot connect on server side')
    return
  }

  if (this.isConnected || this.isConnecting) {
    console.log('[SocketStore] Connection in progress or already connected')
    return
  }

  try {
    this.isConnecting = true
    this.error = null

    const token = useCookie('auth_token').value
    if (!token) {
      throw new Error('No authentication token found')
    }

    console.log('[SocketStore] Connecting to Socket.IO server...')

    // ✅ В dev-режиме используем отдельный порт
    const isDev = process.env.NODE_ENV !== 'production'
    const socketUrl = isDev
      ? 'http://localhost:3001' // ✅ Новый порт для dev
      : useRuntimeConfig().public.siteUrl

    const socket = io(socketUrl, {
      auth: { token },
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      upgrade: true,
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
      timeout: 30000,
      withCredentials: true,
      debug: true,
      rejectUnauthorized: false,
      secure: false
    }) as TypedClientSocket

    this.socket = socket
    this.setupConnectionHandlers(socket)

    console.log('[SocketStore] Socket instance created')
  } catch (error) {
    this.isConnecting = false
    this.error = error instanceof Error ? error.message : 'Unknown connection error'
    console.error('[SocketStore] Connection error:', error)
    throw error
  }
}

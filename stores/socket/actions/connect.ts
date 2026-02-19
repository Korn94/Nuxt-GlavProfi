// stores/socket/actions/connect.ts
import { io } from 'socket.io-client'
import { useCookie, useRuntimeConfig } from "nuxt/app"
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
    
    // ✅ ИСПРАВЛЕНО: Явное указание типа для siteUrl
    const runtimeConfig = useRuntimeConfig()
    const siteUrl = runtimeConfig.public.siteUrl as string
    
    // ✅ В dev-режиме используем отдельный порт
    const isDev = process.env.NODE_ENV !== 'production'
    const socketUrl = isDev
      ? `http://${window.location.hostname}:3001` // ✅ Используем текущий хост
      : siteUrl
    
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

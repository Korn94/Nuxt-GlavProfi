// stores/websocket.ts
import { defineStore } from 'pinia'
import type { Ref } from 'vue'
import { usePresenceStore } from './presence'
import { useTaskStore } from './tasks'
import { useNotificationsStore } from './notifications'

interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

interface WebSocketState {
  socket: WebSocket | null;
  status: 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';
  reconnectAttempts: number;
  maxReconnectAttempts: number;
  reconnectTimer: number | null;
  subscriptions: Set<string>;
  connectionUrl: string;
}

export const useWebSocketStore = defineStore('websocket', {
  state: (): WebSocketState => ({
    socket: null,
    status: 'disconnected',
    reconnectAttempts: 0,
    maxReconnectAttempts: 5,
    reconnectTimer: null,
    subscriptions: new Set(),
    connectionUrl: `${process.env.NUXT_PUBLIC_WS_URL}/ws`
  }),
  
  getters: {
    isConnected: (state) => state.status === 'connected',
    isConnecting: (state) => state.status === 'connecting' || state.status === 'reconnecting'
  },
  
  actions: {
    connect() {
      if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
        return;
      }
      
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
      
      this.status = this.reconnectAttempts > 0 ? 'reconnecting' : 'connecting';
      
      try {
        this.socket = new WebSocket(this.connectionUrl);
        
        this.socket.onopen = () => this.handleConnection();
        this.socket.onmessage = (event) => this.handleMessage(event);
        this.socket.onerror = (error) => this.handleError(error);
        this.socket.onclose = () => this.handleClose();
      } catch (error) {
        this.handleError(error);
      }
    },
    
    disconnect() {
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
      
      if (this.socket) {
        this.socket.close();
        this.socket = null;
      }
      
      this.status = 'disconnected';
      this.subscriptions.clear();
    },
    
    subscribe(channel: string) {
      if (!this.subscriptions.has(channel)) {
        this.subscriptions.add(channel);
        
        if (this.isConnected) {
          this.send({ type: 'subscribe', channel });
        }
      }
    },
    
    unsubscribe(channel: string) {
      if (this.subscriptions.has(channel)) {
        this.subscriptions.delete(channel);
        
        if (this.isConnected) {
          this.send({ type: 'unsubscribe', channel });
        }
      }
    },
    
    send(data: any) {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        try {
          this.socket.send(JSON.stringify(data));
        } catch (error) {
          console.error('Failed to send message:', error);
        }
      }
    },
    
    handleConnection() {
      this.status = 'connected';
      this.reconnectAttempts = 0;
      
      // Восстановить все подписки после переподключения
      if (this.subscriptions.size > 0) {
        this.subscriptions.forEach(channel => {
          this.send({ type: 'subscribe', channel });
        });
      }
    },
    
    handleMessage(event: MessageEvent) {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        
        // Обработка системных сообщений
        if (message.type === 'connection-status') {
          console.log('Connection status:', message.status);
          return;
        }
        
        // Передача данных в соответствующие хранилища
        if (message.type.startsWith('presence:')) {
          const presenceStore = usePresenceStore();
          presenceStore.processMessage(message);
        } else if (message.type.startsWith('tasks:')) {
          const tasksStore = useTaskStore();
          // Используем handleWebSocketUpdate вместо processMessage
          tasksStore.handleWebSocketUpdate({
            type: 'task-updated',
            task: message.task
          });
        } else if (message.type.startsWith('notifications:')) {
          const notificationsStore = useNotificationsStore();
          notificationsStore.processMessage(message);
        }
      } catch (error) {
        console.error('Failed to process message:', error);
      }
    },
    
    handleError(error: any) {
      console.error('WebSocket error:', error);
      this.status = 'error';
      this.scheduleReconnect();
    },
    
    handleClose() {
      if (this.status !== 'disconnected') {
        this.scheduleReconnect();
      }
    },
    
    scheduleReconnect() {
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnect attempts reached');
        this.status = 'disconnected';
        return;
      }
      
      this.reconnectAttempts++;
      this.status = 'reconnecting';
      
      // Экспоненциальная задержка (1, 2, 4, 8, 16 секунд)
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 16000);
      
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
      }
      
      this.reconnectTimer = window.setTimeout(() => {
        this.connect();
      }, delay);
    },
    
    reset() {
      this.disconnect();
      this.reconnectAttempts = 0;
    }
  }
})

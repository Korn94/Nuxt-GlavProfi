// stores/websocket.types.ts
/**
 * Состояние WebSocket соединения
 */
export interface WebSocketState {
  socket: WebSocket | null;
  status: WebSocketStatus;
  reconnectAttempts: number;
  maxReconnectAttempts: number;
  reconnectTimer: number | null;
  subscriptions: Set<string>;
  connectionUrl: string;
}

/**
 * Статус подключения WebSocket
 */
export type WebSocketStatus = 
  | 'disconnected' 
  | 'connecting' 
  | 'connected' 
  | 'reconnecting' 
  | 'error';

/**
 * События WebSocket
 */
export interface WebSocketEvents {
  open: () => void;
  message: (event: MessageEvent) => void;
  error: (error: Event) => void;
  close: () => void;
}

/**
 * Параметры для отправки сообщений
 */
export interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

/**
 * Типы действий для WebSocket хранилища
 */
export interface WebSocketActions {
  connect: () => void;
  disconnect: () => void;
  subscribe: (channel: string) => void;
  unsubscribe: (channel: string) => void;
  send: (data: WebSocketMessage) => void;
  reset: () => void;
}

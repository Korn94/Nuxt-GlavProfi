// app/types/websocket.d.ts
/**
 * Интерфейс для типов сообщений WebSocket
 */
interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

/**
 * Типы сообщений присутствия
 */
interface PresenceUpdateMessage extends WebSocketMessage {
  type: 'presence:update';
  users: PresenceUser[];
}

interface PresenceActivityMessage extends WebSocketMessage {
  type: 'presence:activity';
}

interface PresenceIdleMessage extends WebSocketMessage {
  type: 'presence:idle';
}

interface PresencePageUpdateMessage extends WebSocketMessage {
  type: 'presence:page-update';
  currentPage: string;
}

interface PresenceDeviceInfoMessage extends WebSocketMessage {
  type: 'presence:device-info';
  deviceType?: string;
  tabCount?: number;
}

/**
 * Типы сообщений задач
 */
interface TasksSubscribeMessage extends WebSocketMessage {
  type: 'tasks:subscribe';
  objectId: number;
}

interface TasksUnsubscribeMessage extends WebSocketMessage {
  type: 'tasks:unsubscribe';
  objectId: number;
}

interface TasksUpdateMessage extends WebSocketMessage {
  type: 'tasks:update';
  objectId: number;
  task: any;
}

/**
 * Интерфейс пользователя для присутствия
 */
interface PresenceUser {
  id: number;
  login: string;
  name: string;
  roles: string[];
  status: 'online' | 'idle';
  lastActivityAt: number;
  deviceType?: string;
  tabCount?: number;
  currentPage?: string;
  onlineSince?: number;
  ip?: string;
}

/**
 * Типы событий WebSocket
 */
type WebSocketEventMap = {
  'presence:update': PresenceUpdateMessage;
  'presence:activity': PresenceActivityMessage;
  'presence:idle': PresenceIdleMessage;
  'presence:page-update': PresencePageUpdateMessage;
  'presence:device-info': PresenceDeviceInfoMessage;
  'tasks:subscribe': TasksSubscribeMessage;
  'tasks:unsubscribe': TasksUnsubscribeMessage;
  'tasks:update': TasksUpdateMessage;
};

/**
 * Тип для обработки сообщений
 */
type WebSocketMessageHandler = (message: WebSocketMessage) => void;

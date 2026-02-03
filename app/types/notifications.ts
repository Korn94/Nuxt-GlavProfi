// types/notifications.ts
export type NotificationType = 'success' | 'error' | 'warning' | 'info'

export interface NotificationAction {
  text: string
  class?: string
  closeOnAction?: boolean
  onClick?: () => void
}

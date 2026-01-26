// server/ws/types.ts
export interface WSUser {
  id: number
  login: string
  name: string
  roles: string[]
  objects: number[]
}

export interface WSContext {
  user?: WSUser
  ready: boolean
}

export type WSPeer = any // Добавлено определение WSPeer

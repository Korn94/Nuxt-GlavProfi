// server/ws/context.ts
import type { WSContext } from './types'

const contexts = new WeakMap<any, WSContext>()

export function setContext(peer: any, ctx: WSContext) {
  contexts.set(peer, ctx)
}

export function getContext(peer: any): WSContext | undefined {
  return contexts.get(peer)
}

export function clearContext(peer: any) {
  contexts.delete(peer)
}

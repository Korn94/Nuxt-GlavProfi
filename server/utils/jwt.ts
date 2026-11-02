// server/utils/jwt.ts
import type { SignOptions } from 'jsonwebtoken'

export interface TokenPayload {
  id: number
  login: string
  role: string
  objects?: { id: number }[]
  /** ID реального администратора при имперсонации («просмотр от имени пользователя») */
  impersonatorId?: number
  /** Флаг: токен выдан для имперсонации (read-only просмотр) */
  imp?: boolean
}

// Ленивая загрузка jwt только на сервере
async function getJwt() {
  if (import.meta.client) {
    throw new Error('jwt utils are server-only')
  }
  const { createRequire } = await import('node:module')
  const require = createRequire(import.meta.url)
  return require('jsonwebtoken') as typeof import('jsonwebtoken')
}

export async function generateToken(payload: TokenPayload, expiresIn: SignOptions['expiresIn'] = '90d') {
  const jwt = await getJwt()
  const secret = process.env.NUXT_JWT_SECRET || 'fallback-secret-key'
  return jwt.sign(payload, secret, { expiresIn })
}

export async function verifyToken(token: string): Promise<TokenPayload> {
  const jwt = await getJwt()
  const secret = process.env.NUXT_JWT_SECRET || 'fallback-secret-key'
  try {
    return jwt.verify(token, secret) as TokenPayload
  } catch {
    throw new Error('Invalid token')
  }
}

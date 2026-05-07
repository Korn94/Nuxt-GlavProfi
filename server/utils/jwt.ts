// server/utils/jwt.ts
export interface TokenPayload {
  id: number
  login: string
  role: string
  objects?: { id: number }[]
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

export async function generateToken(payload: TokenPayload) {
  const jwt = await getJwt()
  const secret = process.env.NUXT_JWT_SECRET || 'fallback-secret-key'
  return jwt.sign(payload, secret, { expiresIn: '90d' })
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

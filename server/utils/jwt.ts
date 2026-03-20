// server/utils/jwt.ts
import jwt from 'jsonwebtoken'

export interface TokenPayload {
  id: number
  login: string
  role: string
  objects?: { id: number }[]
}

export async function generateToken(payload: TokenPayload) {
  const secret = process.env.JWT_SECRET || 'fallback-secret-key'
  return jwt.sign(payload, secret, { expiresIn: '90d' })
}

export async function verifyToken(token: string): Promise<TokenPayload> {
  const secret = process.env.JWT_SECRET || 'fallback-secret-key'
  try {
    return jwt.verify(token, secret) as TokenPayload
  } catch (e) {
    throw new Error('Invalid token')
  }
}

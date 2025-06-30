// types/jwt.d.ts

export interface JwtPayload {
  id: number
  login: string
  iat?: number
  exp?: number
}
// stores/socket/helpers/sessionId.ts
import { useCookie } from '#app'

export function setSessionId(sessionId: string) {
  const cookie = useCookie('session_id', {
    maxAge: 60 * 60 * 24 * 90,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/'
  })
  cookie.value = sessionId
}

// services/helpers/sessionId.ts
/**
 * Хелперы для работы с session_id в cookie
 * 
 * Используется для сохранения и получения session_id
 * после инициализации сокет-сессии
 */

import { useCookie } from '#app'

/**
 * Ключ cookie для хранения session_id
 */
const SESSION_ID_COOKIE_NAME = 'session_id'

/**
 * Срок жизни cookie (90 дней)
 */
const SESSION_ID_COOKIE_MAX_AGE = 60 * 60 * 24 * 90

/**
 * Установить session_id в cookie
 * @param sessionId - ID сессии
 */
export function setSessionId(sessionId: string): void {
  if (!process.client) {
    console.warn('[SessionId] Cannot set cookie on server side')
    return
  }
  
  try {
    const sessionCookie = useCookie<string>(SESSION_ID_COOKIE_NAME, {
      maxAge: SESSION_ID_COOKIE_MAX_AGE,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/'
    })
    
    sessionCookie.value = sessionId
    console.log('[SessionId] ✅ Session ID saved to cookie:', sessionId.substring(0, 8) + '...')
  } catch (error) {
    console.error('[SessionId] ❌ Failed to set session cookie:', error)
  }
}

/**
 * Получить session_id из cookie
 * @returns Session ID или null
 */
export function getSessionId(): string | null {
  if (!process.client) {
    console.warn('[SessionId] Cannot get cookie on server side')
    return null
  }
  
  try {
    const sessionCookie = useCookie<string>(SESSION_ID_COOKIE_NAME, {
      maxAge: SESSION_ID_COOKIE_MAX_AGE,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/'
    })
    
    return sessionCookie.value || null
  } catch (error) {
    console.error('[SessionId] ❌ Failed to get session cookie:', error)
    return null
  }
}

/**
 * Удалить session_id из cookie
 */
export function removeSessionId(): void {
  if (!process.client) {
    console.warn('[SessionId] Cannot remove cookie on server side')
    return
  }
  
  try {
    const sessionCookie = useCookie<string>(SESSION_ID_COOKIE_NAME, {
      maxAge: SESSION_ID_COOKIE_MAX_AGE,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/'
    })
    
    sessionCookie.value = null
    console.log('[SessionId] 🗑️ Session ID removed from cookie')
  } catch (error) {
    console.error('[SessionId] ❌ Failed to remove session cookie:', error)
  }
}

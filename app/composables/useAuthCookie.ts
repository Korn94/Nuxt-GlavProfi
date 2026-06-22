// app/composables/useAuthCookie.ts
/**
 * 🍪 Composable для проверки наличия валидного auth_token в cookie
 * 
 * Единый источник логики парсинга cookie. Используется в:
 * - app/middleware/auth.ts
 * - app/pages/login.vue  
 * - app/layouts/login.vue
 * - app/layouts/cabinet.vue
 * 
 * Поддерживает два формата:
 * - Новый: plain JWT-строка
 * - Старый (обратная совместимость): JSON { token, userId, role }
 */
import { computed } from 'vue'

export function useAuthCookie() {
  /**
   * Реактивный флаг: есть ли валидный auth_token в cookie.
   * 
   * Логика:
   * - На SSR всегда false (cookie читается через useCookie отдельно)
   * - На клиенте: ищем 'auth_token' в document.cookie
   * - Пробуем распарсить как JSON (старый формат)
   * - Если JSON невалидный — считаем длину строки (новый plain JWT)
   */
  const hasCookie = computed(() => {
    if (!process.client) return false
    
    const raw = document.cookie
      .split('; ')
      .find(row => row.startsWith('auth_token='))
      ?.split('=')[1]
    
    if (!raw) return false
    
    try {
      const parsed = JSON.parse(decodeURIComponent(raw))
      return !!(parsed.token && parsed.userId)
    } catch {
      // Новый формат: plain JWT (валидируем минимальную длину)
      return raw.length > 20
    }
  })
  
  /**
   * Нерективная версия (для middleware, где computed не нужен)
   */
  function checkCookie(): boolean {
    if (!process.client) return false
    
    const raw = document.cookie
      .split('; ')
      .find(row => row.startsWith('auth_token='))
      ?.split('=')[1]
    
    if (!raw) return false
    
    try {
      const parsed = JSON.parse(decodeURIComponent(raw))
      return !!(parsed.token && parsed.userId)
    } catch {
      return raw.length > 20
    }
  }
  
  return { hasCookie, checkCookie }
}

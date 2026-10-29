// server/utils/userAgent.ts
/**
 * Определение типа устройства по user-agent.
 *
 * Вынесено в отдельный модуль, т.к. используется в двух независимых потоках:
 * - server/utils/sessions.ts — сессии авторизованных пользователей (user_sessions);
 * - server/utils/visitorRegistry.ts — посетители публичного сайта (in-memory).
 */

export type DeviceType = 'desktop' | 'mobile' | 'unknown'

/**
 * Определить тип устройства по строке user-agent.
 *
 * @param userAgent — сырая строка User-Agent (может отсутствовать)
 * @returns 'mobile' | 'desktop' | 'unknown'
 */
export function getDeviceType(userAgent?: string | null): DeviceType {
  if (!userAgent) return 'unknown'

  const ua = userAgent.toLowerCase()

  // Мобильные устройства
  if (/mobile|android|iphone|ipad|ipod|blackberry|iemobile|opera mini|fennec|webos/i.test(ua)) {
    return 'mobile'
  }

  // Планшеты (iPad, Android планшеты)
  if (/tablet|ipad|playbook|silk/i.test(ua)) {
    return 'mobile'
  }

  // Десктоп
  return 'desktop'
}

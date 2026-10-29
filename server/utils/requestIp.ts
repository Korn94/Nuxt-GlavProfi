// server/utils/requestIp.ts
/**
 * ✅ Реальный IP клиента для h3-запросов (API-эндпоинты).
 *
 * Зеркалит логику getSocketIp() из server/socket/utils.ts, но работает с H3Event,
 * а не с socket.io-сокетом: посетители публичного сайта приходят обычными
 * HTTP-запросами (POST /api/visitors/ping), сокет у них не подключён.
 *
 * За прокси (nginx прокидывает X-Real-IP / X-Forwarded-For, см. .devops/nginx)
 * remoteAddress — это адрес самого прокси (127.0.0.1), поэтому сначала берём
 * заголовки, но доверяем им ТОЛЬКО если peer выглядит как прокси/локальный.
 */

import type { H3Event } from 'h3'

/**
 * Похоже ли, что соединение пришло от прокси (loopback или приватная сеть).
 * Только в этом случае заголовкам X-Real-IP / X-Forwarded-For можно доверять.
 */
function isProxyPeer(ip: string): boolean {
  const addr = ip.replace(/^::ffff:/, '')
  if (addr === '127.0.0.1' || addr === '::1' || addr === 'localhost') return true
  if (addr.startsWith('10.')) return true
  if (addr.startsWith('192.168.')) return true
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(addr)) return true
  if (/^f[cd][0-9a-f]{2}:/i.test(addr)) return true
  return false
}

/**
 * Извлечь IP клиента из h3-запроса.
 *
 * @param event — h3-событие запроса
 * @returns IP-адрес или 'unknown', если определить не удалось
 */
export function getRequestIp(event: H3Event): string {
  const headers = event.headers

  const remoteAddr = (event.node?.req?.socket?.remoteAddress) || ''
  const peer = typeof remoteAddr === 'string' && remoteAddr.length > 0
    ? remoteAddr.replace(/^::ffff:/, '')
    : ''

  // ✅ За прокси реальный адрес клиента — в заголовках, иначе получим 127.0.0.1
  if (!peer || isProxyPeer(peer)) {
    const realIp = headers.get('x-real-ip')
    if (realIp && realIp.trim().length > 0) {
      return realIp.trim().replace(/^::ffff:/, '')
    }

    const forwarded = headers.get('x-forwarded-for')
    if (forwarded && forwarded.trim().length > 0) {
      // Из X-Forwarded-For берём первый адрес — он ближе всего к клиенту
      const first = forwarded.split(',')[0]?.trim()
      if (first) return first.replace(/^::ffff:/, '')
    }
  }

  return peer || 'unknown'
}

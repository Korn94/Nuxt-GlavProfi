// server/utils/requestGeo.ts
/**
 * География посетителя из заголовков, которые может проставить nginx/CDN.
 *
 * Своей GeoIP-базы в проекте нет, поэтому сервер берёт гео из заголовков, если
 * они настроены (nginx + ngx_http_geoip2_module):
 *   proxy_set_header X-Geo-Country $geoip2_country_name;
 *   proxy_set_header X-Geo-Region  $geoip2_region_name;
 *   proxy_set_header X-Geo-City    $geoip2_city_name;
 * Cloudflare-заголовок CF-IPCountry тоже учитывается. Нет заголовков — поля остаются пустыми.
 */

import type { H3Event } from 'h3'

export interface RequestGeo {
  country: string | null
  region: string | null
  city: string | null
}

function readHeader(event: H3Event, name: string, max: number): string | null {
  const raw = event.headers.get(name)
  if (!raw) return null
  let value = raw.trim()
  try { value = decodeURIComponent(value) } catch { /* оставляем как есть */ }
  if (!value || value === '-' || value.toLowerCase() === 'xx') return null
  return value.slice(0, max)
}

export function getRequestGeo(event: H3Event): RequestGeo {
  return {
    country: readHeader(event, 'x-geo-country', 60) || readHeader(event, 'cf-ipcountry', 60),
    region: readHeader(event, 'x-geo-region', 100),
    city: readHeader(event, 'x-geo-city', 100)
  }
}

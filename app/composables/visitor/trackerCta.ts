// app/composables/visitor/trackerCta.ts
/**
 * Фиксация клика по CTA-кнопке (событие cta_click).
 *
 * Семантика:
 * - cta_click — вовлечение: пользователь нажал кнопку, ведущую к форме/расчёту,
 *   но заявки ещё нет. Дальше в том же визите ожидаются form_open и form_submit.
 * - На tel:/mailto:/мессенджеры CTA не вешаем: это уже конверсии
 *   (click_phone / click_email / click_messenger).
 *
 * meta:
 * - cta    — стабильная подпись кнопки «Раздел — действие» (попадает в таблицу событий);
 * - target — та же подпись формы, что уходит в /api/send-message как source;
 *            по ней цепочка CTA → form_open → form_submit сходится;
 * - href   — адрес/секция, куда ведёт кнопка (для навигационных CTA).
 */

import { trackVisitorEvent } from './trackerEvents'

export interface CtaDetails {
  /** Подпись формы (source в /api/send-message и meta.source у form_open) */
  target?: string
  /** Куда ведёт кнопка: якорь, ссылка или идентификатор секции */
  href?: string
}

/**
 * Отправить cta_click. Безопасно на сервере (SSR) — вызов игнорируется.
 *
 * @param cta Человекочитаемое название кнопки («Главная — Получить смету»)
 */
export function trackCtaClick(cta: string, details: CtaDetails = {}): void {
  if (typeof window === 'undefined') return

  const label = (cta || '').trim()
  if (!label) return

  trackVisitorEvent('cta_click', {
    cta: label,
    ...(details.target ? { target: details.target } : {}),
    ...(details.href ? { href: details.href } : {})
  })
}

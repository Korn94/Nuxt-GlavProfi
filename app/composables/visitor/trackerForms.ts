// app/composables/visitor/trackerForms.ts
/**
 * Фиксация открытия/начала работы с формой (событие form_open).
 *
 * Семантика:
 * - модальные формы — событие на каждое открытие (opts.once = false);
 * - встроенные формы — одно событие на страницу (в рамках вкладки) при первом
 *   взаимодействии (фокус/клик внутри формы), чтобы не спамить на каждый focus.
 *
 * Подпись формы передаётся в meta.source и должна совпадать с source, который
 * форма отправляет в /api/send-message (тогда form_open и form_submit сходятся).
 */

import { trackVisitorEvent } from './trackerEvents'

/** Ключи form_open, уже отправленные в рамках текущего просмотра страницы */
const sentOnPage = new Set<string>()

/**
 * Отправить form_open. Безопасно на сервере (SSR) — вызов игнорируется.
 *
 * @param source Человекочитаемое название формы («Футер — обратный звонок»)
 * @param opts.once true — не повторять для этой формы на этой странице
 */
export function trackFormOpen(
  source: string,
  opts: { once?: boolean } = {}
): void {
  if (typeof window === 'undefined') return

  const normalized = (source || '').trim() || 'Форма на сайте'

  if (opts.once) {
    const key = `${window.location.pathname}|${normalized}`
    if (sentOnPage.has(key)) return
    sentOnPage.add(key)
  }

  trackVisitorEvent('form_open', { source: normalized })
}

/**
 * Обработчик первого взаимодействия со встроенной формой:
 * вешается на @focusin/@click формы и срабатывает один раз за просмотр страницы.
 */
export function onFormInteraction(source: string): () => void {
  return () => trackFormOpen(source, { once: true })
}

// shared/constants/visitorEvents.ts
/**
 * События аналитики посетителей сайта.
 * Единый источник истины для сервера (валидация, расчёт конверсий) и клиента
 * (подписи, фильтры, бейджи).
 *
 * Термины:
 * - заявка (lead)         — отправка формы (form_submit), пишется сервером в /api/send-message;
 * - обращение (conversion) — контактное действие: звонок, мессенджер, email, заявка;
 * - вовлечение (engagement) — форма открыта / CTA нажат, но заявки нет.
 *
 * Цепочка вовлечения: cta_click → form_open → form_submit.
 * meta у cta_click: { cta: 'Раздел — кнопка', target: 'подпись формы (= source)', href? },
 * где target совпадает с meta.source у form_open и source в /api/send-message.
 */

export const VISITOR_EVENT_TYPES = [
  'click_phone',
  'copy_phone',
  'click_messenger',
  'click_email',
  'form_open',
  'form_submit',
  'cta_click'
] as const

export type VisitorEventType = (typeof VISITOR_EVENT_TYPES)[number]

/** События, которые считаются обращением (конверсией визита) */
export const CONVERSION_EVENT_TYPES: readonly VisitorEventType[] = [
  'click_phone',
  'copy_phone',
  'click_messenger',
  'click_email',
  'form_submit'
]

/** События-вовлечения: действие было, но обращения/заявки нет */
export const ENGAGEMENT_EVENT_TYPES: readonly VisitorEventType[] = [
  'form_open',
  'cta_click'
]

/** Заявка: форма успешно отправлена (фиксируется сервером) */
export const LEAD_EVENT_TYPE: VisitorEventType = 'form_submit'

/** Форма открыта / пользователь начал с ней взаимодействовать */
export const FORM_OPEN_EVENT_TYPE: VisitorEventType = 'form_open'

/** Клик по CTA-кнопке: вовлечение до открытия формы */
export const CTA_CLICK_EVENT_TYPE: VisitorEventType = 'cta_click'

export const VISITOR_EVENT_LABELS: Record<VisitorEventType, string> = {
  click_phone: 'Клик по телефону',
  copy_phone: 'Копирование телефона',
  click_messenger: 'Мессенджер',
  click_email: 'Email',
  form_open: 'Открытие формы',
  form_submit: 'Отправка формы',
  cta_click: 'Клик по CTA'
}

/** Группы событий для фильтров в интерфейсе аналитики */
export type VisitorEventGroup = 'lead' | 'conversion' | 'engagement'

export function isVisitorEventType(value: string): value is VisitorEventType {
  return (VISITOR_EVENT_TYPES as readonly string[]).includes(value)
}

export function isConversionEvent(type: string): boolean {
  return (CONVERSION_EVENT_TYPES as readonly string[]).includes(type)
}

export function isLeadEvent(type: string): boolean {
  return type === LEAD_EVENT_TYPE
}

export function eventGroupOf(type: string): VisitorEventGroup {
  if (isLeadEvent(type)) return 'lead'
  return isConversionEvent(type) ? 'conversion' : 'engagement'
}

export function visitorEventLabel(type: string): string {
  return isVisitorEventType(type) ? VISITOR_EVENT_LABELS[type] : type
}

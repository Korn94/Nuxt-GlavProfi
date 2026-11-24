// shared/constants/visitorEvents.ts
/**
 * События аналитики посетителей сайта.
 * Единый источник истины для сервера (валидация, расчёт конверсий) и клиента
 * (подписи, фильтры, бейджи).
 *
 * Термины:
 * - заявка (lead)         — отправка формы (form_submit), пишется сервером в /api/send-message;
 * - обращение (conversion) — контактное действие: звонок, мессенджер, email, заявка;
 * - вовлечение (engagement) — форма открыта / CTA нажат, но заявки нет;
 * - показ (impression)    — форма попала в кадр. Действием пользователя НЕ является:
 *   в вовлечение не входит, «отказ» не снимает, в ленте событий помечается отдельно.
 *
 * Цепочка вовлечения: cta_click → form_open → form_submit.
 * meta у cta_click: { cta: 'Раздел — кнопка', target: 'подпись формы (= source)', href? },
 * где target совпадает с meta.source у form_open и source в /api/send-message.
 *
 * Микро-события формы:
 * form_view (показ/impression — форма пробыла в кадре достаточно долго) →
 * form_focus (фокус в поле) → form_typing (первый ввод) — детализация «застревания»
 * между form_open и form_submit. form_view в воронке используется как база «показ»,
 * но событием-действием не считается.
 */

export const VISITOR_EVENT_TYPES = [
  'click_phone',
  'copy_phone',
  'click_messenger',
  'click_email',
  'form_open',
  'form_submit',
  'cta_click',
  'form_view',
  'form_focus',
  'form_typing'
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

/**
 * События-вовлечения: пользователь что-то СДЕЛАЛ, но обращения/заявки нет.
 * form_view сюда не входит: показ формы в кадре действием не является (см. IMPRESSION_EVENT_TYPES).
 */
export const ENGAGEMENT_EVENT_TYPES: readonly VisitorEventType[] = [
  'form_open',
  'cta_click',
  'form_focus',
  'form_typing'
]

/** Заявка: форма успешно отправлена (фиксируется сервером) */
export const LEAD_EVENT_TYPE: VisitorEventType = 'form_submit'

/** Форма открыта / пользователь начал с ней взаимодействовать */
export const FORM_OPEN_EVENT_TYPE: VisitorEventType = 'form_open'

/** Клик по CTA-кнопке: вовлечение до открытия формы */
export const CTA_CLICK_EVENT_TYPE: VisitorEventType = 'cta_click'

/** Форма попала в поле зрения пользователя (встроенные формы, Intersection Observer) */
export const FORM_VIEW_EVENT_TYPE: VisitorEventType = 'form_view'

/** Первый фокус на поле формы */
export const FORM_FOCUS_EVENT_TYPE: VisitorEventType = 'form_focus'

/** Первый ввод в поле формы */
export const FORM_TYPING_EVENT_TYPE: VisitorEventType = 'form_typing'

/** Микро-события формы: детализация воронки между form_open и form_submit */
export const FORM_MICRO_EVENT_TYPES: readonly VisitorEventType[] = [
  'form_view',
  'form_focus',
  'form_typing'
]

/**
 * Показы (impressions): форма попала в кадр. Это метрика, а не действие пользователя:
 * не считается вовлечением, не снимает «отказ» и в ленте событий идёт отдельной группой.
 */
export const IMPRESSION_EVENT_TYPES: readonly VisitorEventType[] = [
  'form_view'
]

export const VISITOR_EVENT_LABELS: Record<VisitorEventType, string> = {
  click_phone: 'Клик по телефону',
  copy_phone: 'Копирование телефона',
  click_messenger: 'Мессенджер',
  click_email: 'Email',
  form_open: 'Открытие формы',
  form_submit: 'Отправка формы',
  cta_click: 'Клик по CTA',
  form_view: 'Показ формы',
  form_focus: 'Фокус на поле',
  form_typing: 'Ввод в форму'
}

/** Группы событий для фильтров в интерфейсе аналитики */
export type VisitorEventGroup = 'lead' | 'conversion' | 'engagement' | 'impression'

export function isVisitorEventType(value: string): value is VisitorEventType {
  return (VISITOR_EVENT_TYPES as readonly string[]).includes(value)
}

export function isConversionEvent(type: string): boolean {
  return (CONVERSION_EVENT_TYPES as readonly string[]).includes(type)
}

export function isLeadEvent(type: string): boolean {
  return type === LEAD_EVENT_TYPE
}

/** Микро-событие формы (form_view / form_focus / form_typing) */
export function isFormMicroEvent(type: string): boolean {
  return (FORM_MICRO_EVENT_TYPES as readonly string[]).includes(type)
}

/** Показ (impression): форма попала в кадр — действие пользователя не подразумевается */
export function isImpressionEvent(type: string): boolean {
  return (IMPRESSION_EVENT_TYPES as readonly string[]).includes(type)
}

export function eventGroupOf(type: string): VisitorEventGroup {
  if (isLeadEvent(type)) return 'lead'
  if (isConversionEvent(type)) return 'conversion'
  return isImpressionEvent(type) ? 'impression' : 'engagement'
}

export function visitorEventLabel(type: string): string {
  return isVisitorEventType(type) ? VISITOR_EVENT_LABELS[type] : type
}

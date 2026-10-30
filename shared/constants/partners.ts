// shared/constants/partners.ts
/**
 * Этапы сделки (лида) партнёрской программы.
 * Единый источник истины для сервера (валидация статуса) и клиента (бейджи, подписи).
 *
 * Порядок в массиве соответствует воронке сделки от регистрации до выплаты вознаграждения.
 */

export const PARTNER_LEAD_STATUSES = [
  'new',             // Лид зарегистрирован
  'contacted',       // Связались с клиентом
  'visit_scheduled', // Выезд на объект (запланирован)
  'visit_done',      // Выезд состоялся
  'contract_signed', // Договор подписан
  'first_payment',   // Первый платёж получен
  'reward_paid',     // Вознаграждение выплачено
  'rejected',        // Отклонён
  'cancelled'        // Отменён
] as const

export type PartnerLeadStatus = (typeof PARTNER_LEAD_STATUSES)[number]

export const PARTNER_LEAD_STATUS_LABELS: Record<PartnerLeadStatus, string> = {
  new: 'Новый',
  contacted: 'Связались с клиентом',
  visit_scheduled: 'Назначен выезд',
  visit_done: 'Выезд состоялся',
  contract_signed: 'Договор подписан',
  first_payment: 'Первый платёж',
  reward_paid: 'Вознаграждение выплачено',
  rejected: 'Отклонён',
  cancelled: 'Отменён'
}

export const PARTNER_LEAD_STATUS_COLORS: Record<PartnerLeadStatus, string> = {
  new: '#6c757d',             // серый
  contacted: '#5b8def',       // синий
  visit_scheduled: '#00c3f5', // голубой
  visit_done: '#17a2b8',      // бирюзовый
  contract_signed: '#8e44ad', // фиолетовый
  first_payment: '#f5a623',   // оранжевый
  reward_paid: '#28a745',     // зелёный
  rejected: '#dc3545',        // красный
  cancelled: '#495057'        // тёмно-серый
}

export function isPartnerLeadStatus(value: string): value is PartnerLeadStatus {
  return (PARTNER_LEAD_STATUSES as readonly string[]).includes(value)
}
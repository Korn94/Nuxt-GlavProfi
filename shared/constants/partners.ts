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

// ── Сетка партнёрского вознаграждения ────────────────────────────────
// Единая логика расчёта: используется на лендинге (/partner, калькулятор),
// на сервере (авторасчёт вознаграждения из суммы договора) и в кабинетах.
// Сетка фиксированная — без процентов и «индивидуальных условий».

export interface PartnerRewardCategory {
  /** Название категории */
  name: string
  /** Диапазон суммы договора (для отображения) */
  range: string
  /** Базовое вознаграждение, ₽ */
  base: number
  /** Доплата за каждый полный млн ₽ сверх 5 млн (только верхняя категория) */
  extraPerMillion?: number
}

export const PARTNER_REWARD_CATEGORIES: PartnerRewardCategory[] = [
  { name: 'Базовая', range: 'до 1 млн ₽', base: 30_000 },
  { name: 'Стандарт', range: '1 – 2 млн ₽', base: 40_000 },
  { name: 'Плюс', range: '2 – 3 млн ₽', base: 50_000 },
  { name: 'Крупная', range: '3 – 5 млн ₽', base: 70_000 },
  { name: 'Максимум', range: 'свыше 5 млн ₽', base: 100_000, extraPerMillion: 15_000 },
]

export function getPartnerRewardCategory(cost: number): PartnerRewardCategory {
  const c = Number.isFinite(cost) ? Math.max(0, cost) : 0
  if (c < 1_000_000) return PARTNER_REWARD_CATEGORIES[0]!
  if (c < 2_000_000) return PARTNER_REWARD_CATEGORIES[1]!
  if (c < 3_000_000) return PARTNER_REWARD_CATEGORIES[2]!
  if (c < 5_000_000) return PARTNER_REWARD_CATEGORIES[3]!
  return PARTNER_REWARD_CATEGORIES[4]!
}

export function getPartnerRewardCategoryIndex(cost: number): number {
  return PARTNER_REWARD_CATEGORIES.indexOf(getPartnerRewardCategory(cost))
}

export function getPartnerReward(cost: number): number {
  const c = Number.isFinite(cost) ? Math.max(0, cost) : 0
  const category = getPartnerRewardCategory(c)
  if (category.extraPerMillion) {
    const millionsAbove5 = Math.floor((c - 5_000_000) / 1_000_000)
    if (millionsAbove5 > 0) return category.base + millionsAbove5 * category.extraPerMillion
  }
  return category.base
}
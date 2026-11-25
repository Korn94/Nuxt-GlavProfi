// shared/utils/phone.ts
/**
 * Единая нормализация телефонных номеров РФ для форм сайта и серверных проверок.
 *
 * Что принимаем на входе (все варианты дают один и тот же номер):
 *   +7 (910) 909-69-47 · +79109096947 · 79109096947 · 89109096947 · 9109096947
 *   «+7 +79109096947» (вставка в поле, где уже стоит префикс «+7 ») · «+7 8 910…»
 *   8 (800) 555-35-35 · 88005553535 · 8005553535
 *
 * РФ-номер = код страны 7 + 10 цифр. Всё лишнее (добавочные, дубли кода страны,
 * лишние цифры сверх 11) отбрасывается. Иностранные номера в РФ-поле не принимаются,
 * кроме молдавского формата +373 (совместимость с прежней версией директивы).
 *
 * ⚠️ Модуль чистый (без DOM и Nuxt), поэтому используется и в app/, и в server/.
 */

/** Код страны РФ для отображения */
const RU_COUNTRY_CODE = '+7'
/** Код страны РФ в цифровом виде (канонический номер: 7XXXXXXXXXX) */
const RU_COUNTRY_DIGIT = '7'
/** Длина национальной части номера (без кода страны) */
const RU_NATIONAL_LENGTH = 10

/** Все цифры строки: «+7 (910) …» → «7910…» */
export function toPhoneDigits(value: unknown): string {
  return String(value ?? '').replace(/\D/g, '')
}

/**
 * Явный иностранный код: строка начинается с «+X», где X ≠ 7/8.
 * Нужен, чтобы «+1 202…» не превращался в случайный РФ-номер.
 */
function isExplicitForeign(raw: string): boolean {
  const match = /^\s*\+(\d)/.exec(raw)
  return !!match && match[1] !== '7' && match[1] !== '8'
}

/**
 * Национальная часть РФ-номера: 0…10 цифр.
 * Возвращает столько цифр, сколько уже введено, — удобно для живого форматирования.
 */
export function getRuNationalDigits(value: unknown): string {
  const raw = String(value ?? '')
  if (isExplicitForeign(raw)) return ''

  let digits = toPhoneDigits(raw)
  if (!digits) return ''

  // «+7 +7 910…», «+7 8 910…», «+7 7910…»: гасим повторные/смешанные коды страны,
  // пока цифр больше, чем полный номер (11).
  while (digits.length > 11 && (digits[0] === '7' || digits[0] === '8')) {
    digits = digits.slice(1)
  }

  // Полный номер: код страны (7/8) + 10 цифр. Добавочные/лишние цифры отбрасываем.
  if (digits.length >= 11) {
    const rest = digits[0] === '7' || digits[0] === '8' ? digits.slice(1) : digits
    return rest.slice(0, RU_NATIONAL_LENGTH)
  }

  // 10 цифр без кода страны. 7XXXXXXXXX — это недобранный номер с кодом:
  // национальные номера РФ не начинаются с 7.
  if (digits.length === RU_NATIONAL_LENGTH) {
    return digits[0] === '7' ? digits.slice(1) : digits
  }

  // Ввод с нуля: одиночные 7/8 — это код страны, он уже показан префиксом «+7 ».
  if (digits.length === 1 && (digits === '7' || digits === '8')) return ''

  return digits[0] === '7' ? digits.slice(1) : digits
}

/** Молдавская нумерация: совместимость с прежней версией директивы */
function formatMoldova(raw: string): string {
  const digits = toPhoneDigits(raw).slice(3)
  let out = '+373'
  if (digits.length > 0) out += ` (${digits.slice(0, 3)}`
  if (digits.length > 3) out += `) ${digits.slice(3, 5)}`
  if (digits.length > 5) out += `-${digits.slice(5, 8)}`
  return out
}

/**
 * Значение для поля ввода: прогрессивный формат «+7 (910) 909-69-47».
 * - пустая строка → пусто (в поле виден placeholder);
 * - введён только код страны → «+7 »;
 * - иначе — формат с маской по уже введённым цифрам.
 */
export function formatRuPhone(value: unknown): string {
  const raw = String(value ?? '')

  if (/^\s*\+373/.test(raw)) return formatMoldova(raw)

  // Прочие страны не форматируем: оставляем «+» и цифры (прежний fallback).
  if (isExplicitForeign(raw)) return `+${toPhoneDigits(raw).slice(0, 16)}`

  if (!toPhoneDigits(raw)) return ''

  const body = getRuNationalDigits(raw)
  if (!body) return `${RU_COUNTRY_CODE} `

  let out = `${RU_COUNTRY_CODE} (${body.slice(0, 3)}`
  if (body.length > 3) out += `) ${body.slice(3, 6)}`
  if (body.length > 6) out += `-${body.slice(6, 8)}`
  if (body.length > 8) out += `-${body.slice(8, 10)}`
  return out
}

/**
 * Канонический номер для отправки/сравнения: «7XXXXXXXXXX».
 * Пустая строка, если номер неполный или иностранный.
 */
export function normalizeRuPhone(value: unknown): string {
  const body = getRuNationalDigits(value)
  return body.length === RU_NATIONAL_LENGTH ? `${RU_COUNTRY_DIGIT}${body}` : ''
}

/** Введён ли полный РФ-номер (10 цифр национальной части) */
export function isCompleteRuPhone(value: unknown): boolean {
  return getRuNationalDigits(value).length === RU_NATIONAL_LENGTH
}

// ============================================
// Позиционирование курсора (для директивы v-phone-format)
// ============================================

/**
 * Сколько цифр национальной части набрано до курсора.
 * В отличие от простого подсчёта цифр, не учитывает код страны «+7»,
 * иначе курсор после первой набранной цифры встаёт сразу после префикса.
 */
export function countNationalDigitsBefore(value: string, caret: number): number {
  return getRuNationalDigits(String(value ?? '').slice(0, caret)).length
}

/**
 * Позиция в отформатированной строке сразу после N-й цифры национальной части.
 * Например: («+7 (910», 2) → сразу после «1»; («+7 (», 0) → сразу после «(».
 */
export function caretPositionAfterNationalDigits(formatted: string, digitCount: number): number {
  if (!formatted) return 0

  // Тело номера начинается сразу после «(»: «+7 (910) …», «+373 (601) …».
  const bodyStart = formatted.indexOf('(')
  if (bodyStart === -1) return formatted.length // иностранный fallback — курсор в конец
  if (digitCount <= 0) return bodyStart + 1

  let seen = 0
  for (let i = bodyStart + 1; i < formatted.length; i += 1) {
    if (/\d/.test(formatted.charAt(i))) {
      seen += 1
      if (seen === digitCount) return i + 1
    }
  }

  return formatted.length
}

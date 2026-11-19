// app/components/pages/Cabinet/Online/composables/useEchartsTheme.ts
/**
 * Общая тема графиков ECharts для страницы «Онлайн» и детализации аналитики.
 * Цвета берутся из CSS-переменных CRM-темы, поэтому графики совпадают
 * с оформлением кабинета и переключаются вместе с темой.
 */

export interface ChartThemeColors {
  accent: string
  success: string
  info: string
  warning: string
  danger: string
  textPrimary: string
  textSecondary: string
  textMuted: string
  border: string
  tooltipBg: string
}

/** Палитра и цвета текста для опций ECharts */
export function chartThemeColors(): ChartThemeColors {
  const fallback: ChartThemeColors = {
    accent: '#00c3f5', success: '#3dd68c', info: '#5b8def', warning: '#f5a623', danger: '#f25f5c',
    textPrimary: '#e2e4ec', textSecondary: '#9aa0b8', textMuted: '#7a7f96',
    border: 'rgba(255,255,255,0.07)', tooltipBg: '#1a1e28'
  }
  if (typeof window === 'undefined') return fallback

  const s = getComputedStyle(document.documentElement)
  const get = (prop: string, fb: string) => s.getPropertyValue(prop).trim() || fb
  return {
    accent: get('--crm-accent', fallback.accent),
    success: get('--crm-success', fallback.success),
    info: get('--crm-info', fallback.info),
    warning: get('--crm-warning', fallback.warning),
    danger: get('--crm-danger', fallback.danger),
    textPrimary: get('--crm-text-primary', fallback.textPrimary),
    textSecondary: get('--crm-text-secondary', fallback.textSecondary),
    textMuted: get('--crm-text-muted', fallback.textMuted),
    border: get('--crm-border', fallback.border),
    tooltipBg: get('--crm-bg-elevated', fallback.tooltipBg)
  }
}

function toDayKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export interface DailySeriesResult {
  labels: string[]
  series: Record<string, number[]>
}

/**
 * Строит непрерывный дневной ряд: пропущенные дни заполняются нулями,
 * подписи — «12 ноя». `rows` должны содержать поле `day` в формате 'YYYY-MM-DD'.
 */
export function buildDailySeries<T extends { day: string }>(
  rows: T[],
  keys: Array<keyof T & string>
): DailySeriesResult {
  const series: Record<string, number[]> = {}
  for (const key of keys) series[key] = []

  const byDay = new Map<string, T>()
  for (const row of rows) {
    if (row.day) byDay.set(row.day, row)
  }

  const days = [...byDay.keys()].sort()
  const labels: string[] = []
  if (!days.length) return { labels, series }

  const start = new Date(`${days[0]}T00:00:00`)
  const end = new Date(`${days[days.length - 1]}T00:00:00`)
  const fmt = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' })

  for (const d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const row = byDay.get(toDayKey(d))
    labels.push(fmt.format(d))
    for (const key of keys) {
      series[key]!.push(Number((row as Record<string, unknown> | undefined)?.[key] ?? 0))
    }
  }

  return { labels, series }
}

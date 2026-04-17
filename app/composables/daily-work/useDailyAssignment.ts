// app/composables/daily-work/useDailyAssignment.ts

/**
 * Утилиты для работы с распределением подневки
 * Чистые функции, без реактивности — для переиспользования в компонентах и сторах
 */

/** Округление до ближайших 50 рублей */
export function roundTo50(value: number): number {
  return Math.round(value / 50) * 50
}

/**
 * Расчёт сумм по долям с гарантией, что итог строго равен dailyRate
 * @param dailyRate — ставка за день (например, 3500)
 * @param splits — массив объектов с процентами [{ percentage: 70 }, { percentage: 30 }]
 * @returns массив сумм, округлённых до 50₽, сумма которых === dailyRate
 */
export function calculateSplit(dailyRate: number, splits: { percentage: number }[]): number[] {
  if (splits.length === 0) return []
  
  // 1. Считаем "сырые" суммы
  const raw = splits.map(s => (dailyRate * s.percentage) / 100)
  
  // 2. Округляем каждую до 50₽
  let rounded = raw.map(r => roundTo50(r))
  
  // 3. Считаем разницу между желаемым и фактическим итогом
  const currentTotal = rounded.reduce((sum, val) => sum + val, 0)
  const diff = dailyRate - currentTotal
  
  // 4. Если есть разница — добавляем/вычитаем её к объекту с наибольшей долей
  if (diff !== 0 && rounded.length > 0) {
    let maxIdx = 0
    let maxPerc = splits[0]?.percentage ?? 0
    
    for (let i = 1; i < splits.length; i++) {
      const perc = splits[i]?.percentage ?? 0
      if (perc > maxPerc) {
        maxPerc = perc
        maxIdx = i
      }
    }
    
    // Безопасное обновление через не-null утверждение (длина массива проверена выше)
    rounded[maxIdx]! += diff
  }
  
  return rounded
}

/**
 * Проверка, что сумма массива равна dailyRate с допустимой погрешностью
 */
export function validateTotal(amounts: number[], dailyRate: number): boolean {
  const sum = amounts.reduce((acc, val) => acc + val, 0)
  return Math.abs(sum - dailyRate) < 0.01
}

/**
 * Форматирование суммы в читаемый вид: 3500 → "3 500 ₽"
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}

/**
 * Composable-обёртка (для совместимости с паттерном Nuxt)
 * Возвращает те же утилиты, но в виде объекта
 */
export function useDailyAssignment() {
  return {
    roundTo50,
    calculateSplit,
    validateTotal,
    formatCurrency
  }
}

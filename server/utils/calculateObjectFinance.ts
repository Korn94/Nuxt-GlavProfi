// server/utils/calculateObjectFinance.ts

export function calculateObjectFinance(data: {
  totalIncome: number      // Основной приход (счёта)
  totalWorks: number       // Расходы на работы
  materialIncoming: number // Поступления от клиента на материалы
  materialOutgoing: number // Наши расходы на материалы
}) {
  const totalIncome = data.totalIncome || 0
  const totalWorks = data.totalWorks || 0
  const materialIncoming = data.materialIncoming || 0
  const materialOutgoing = data.materialOutgoing || 0

  // Чистый баланс по материалам: клиент привёз − мы купили
  const materialBalance = materialIncoming - materialOutgoing

  // Общий баланс объекта
  const totalBalance = totalIncome + materialBalance - totalWorks

  return {
    totalIncome,
    totalWorks,
    materialIncoming,
    materialOutgoing,
    materialBalance,     // Полезно для отображения
    expenses: totalWorks + materialOutgoing, // Только реальные расходы
    profit: totalBalance,                   // Финальная прибыль
    totalBalance
  }
}

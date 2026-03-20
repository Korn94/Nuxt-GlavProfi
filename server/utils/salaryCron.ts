// server/utils/salaryCron.ts
import cron from 'node-cron'
import { db } from '../db'
import { 
  masters, 
  workers, 
  foremans, 
  offices, 
  salaryDeductions 
} from '../db/schema'
import { eq, and } from 'drizzle-orm'

// Определяем типы данных для контрагентов
interface Contractor {
  id: number
  name: string
  phone: string | null // Используем `null`, как в БД
  balance: string
  salaryAmount: string | null
  salaryDay: number | null
  isOnSalary: boolean | null
}

// Типы контрагентов
type ContractorType = 'master' | 'worker' | 'foreman' | 'office'

// Функция для получения модели контрагента
function getContractorModel(type: ContractorType) {
  switch (type) {
    case 'master': return masters
    case 'worker': return workers
    case 'foreman': return foremans
    case 'office': return offices
    default:
      throw new Error(`Неизвестный тип контрагента: ${type}`)
  }
}

cron.schedule('0 0 10 * * *', async () => {
  const today = new Date()
  const currentDay = today.getDate()
  const currentMonth = today.getMonth() + 1
  const currentYear = today.getFullYear()

  const contractorTypes: ContractorType[] = ['master', 'worker', 'foreman', 'office']

  for (const type of contractorTypes) {
    try {
      const ContractorModel = getContractorModel(type)
      
      // Получаем контрагентов с включенной зарплатой и совпадающим днем списания
      const contractorsToPay: Contractor[] = await db.select().from(ContractorModel)
        .where(and(
          eq(ContractorModel.isOnSalary, true),
          eq(ContractorModel.salaryDay, currentDay)
        ))

      for (const contractor of contractorsToPay) {
        try {
          // Проверяем, было ли уже списание в этом месяце
          const existingDeduction = await db.select().from(salaryDeductions)
            .where(and(
              eq(salaryDeductions.contractorId, contractor.id),
              eq(salaryDeductions.contractorType, type),
              eq(salaryDeductions.month, currentMonth),
              eq(salaryDeductions.year, currentYear)
            )).limit(1)

          if (existingDeduction.length > 0) {
            // Списание уже выполнено
            await db.update(salaryDeductions)
              .set({ status: 'skipped' })
              .where(eq(salaryDeductions.id, existingDeduction[0].id))
            continue
          }

          // Проверяем сумму зарплаты
          const amount = parseFloat(contractor.salaryAmount ?? '0')
          if (isNaN(amount) || amount <= 0) {
            throw new Error('Сумма зарплаты должна быть положительной')
          }

          // Обновляем баланс контрагента
          const currentBalance = parseFloat(contractor.balance)
          const updatedBalance = currentBalance + amount

          await db.update(ContractorModel)
            .set({ balance: updatedBalance.toFixed(2) })
            .where(eq(ContractorModel.id, contractor.id))

          // Записываем историю списания
          await db.insert(salaryDeductions).values({
            contractorId: contractor.id,
            contractorType: type,
            amount: amount.toFixed(2),
            deductionDate: today,
            status: 'completed',
            month: currentMonth,
            year: currentYear
          })
        } catch (error) {
          console.error(`Ошибка списания зарплаты для ${type} ${contractor.id}:`, error)
          
          // Логируем ошибку в БД
          await db.insert(salaryDeductions).values({
            contractorId: contractor.id,
            contractorType: type,
            amount: contractor.salaryAmount || '0.00',
            deductionDate: today,
            status: 'failed',
            month: currentMonth,
            year: currentYear
          })
        }
      }
    } catch (error) {
      console.error(`Ошибка обработки контрагентов типа ${type}:`, error)
    }
  }
})

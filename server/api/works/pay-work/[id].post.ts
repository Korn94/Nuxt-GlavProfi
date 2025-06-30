// server/api/works/pay-work/[id].post.ts
import { defineEventHandler, getRouterParam, createError } from 'h3'
import { db } from '../../../db'
import { works, masters, workers, objects } from '../../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ID работы обязателен' })

  try {
    // Получаем работу
    const [work] = await db.select().from(works).where(eq(works.id, parseInt(id)))
    if (!work) throw createError({ statusCode: 404, message: 'Работа не найдена' })

    // Обновляем баланс контрагента
    const ContractorModel =
      work.contractorType === 'master' ? masters :
        work.contractorType === 'worker' ? workers : null

    if (ContractorModel && work.contractorId) {
      const [contractor] = await db.select().from(ContractorModel)
        .where(eq(ContractorModel.id, work.contractorId))

      if (contractor) {
        const contractorBalance = Number(contractor.balance)
        const workAmount = Number(work.workerAmount)
        const updatedBalance = contractorBalance - workAmount

        await db.update(ContractorModel)
          .set({ balance: updatedBalance.toString() })
          .where(eq(ContractorModel.id, work.contractorId))
      }
    }

    // Обновляем статус оплаты
    await db.update(works)
      .set({
        paid: true,
        paymentDate: new Date()
      })
      .where(eq(works.id, parseInt(id)))

    // Возвращаем обновлённую запись
    // Получаем обновлённую работу
    const [updatedWork] = await db.select().from(works).where(eq(works.id, parseInt(id)))

    // Получаем связанный объект
    const [object] = await db.select().from(objects).where(eq(objects.id, updatedWork.objectId))

    // Обновляем totalWorks и totalBalance
    const newTotalWorks = Number(object.totalWorks) + Number(updatedWork.workerAmount)
    const newTotalBalance = Number(object.totalIncome) - newTotalWorks

    // Обновляем объект
    await db.update(objects)
      .set({
        totalWorks: newTotalWorks.toFixed(2),
        totalBalance: newTotalBalance.toFixed(2)
      })
      .where(eq(objects.id, updatedWork.objectId))
    return updatedWork
  } catch (error) {
    console.error('Ошибка оплаты работы:', error)
    throw createError({
      statusCode: 500,
      message: 'Ошибка сервера при оплате работы'
    })
  }
})

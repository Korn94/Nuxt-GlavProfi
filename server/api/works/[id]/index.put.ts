// server/api/works/[id].put.ts
import { defineEventHandler, readBody, getRouterParam, createError } from 'h3'
import { db } from '../../../db'
import { works, masters, workers } from '../../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ID работы обязателен' })

  try {
    const body = await readBody(event)
    const updates: any = {}

    // Собираем обновления
    if (body.workerAmount !== undefined) updates.workerAmount = body.workerAmount
    if (body.comment !== undefined) updates.comment = body.comment
    if (body.contractorId !== undefined) updates.contractorId = body.contractorId
    if (body.contractorType !== undefined) updates.contractorType = body.contractorType
    if (body.workTypes !== undefined) updates.workTypes = body.workTypes
    if (body.foremanId !== undefined) updates.foremanId = body.foremanId
    if (body.paid !== undefined) updates.paid = body.paid
    if (body.paymentDate !== undefined) updates.paymentDate = body.paymentDate
    if (body.operationDate !== undefined) updates.operationDate = body.operationDate
    if (body.objectId !== undefined) updates.objectId = body.objectId

    // Проверяем наличие данных для обновления
    if (Object.keys(updates).length === 0) {
      throw createError({ statusCode: 400, message: 'Нет данных для обновления' })
    }

    // Получаем текущую работу
    const [currentWork] = await db.select().from(works).where(eq(works.id, parseInt(id)))
    if (!currentWork) throw createError({ statusCode: 404, message: 'Работа не найдена' })

    // Объединяем текущие данные с обновлениями
    const updatedWorkData = { ...currentWork, ...updates }

    // Обновляем запись
    await db.update(works).set(updates).where(eq(works.id, parseInt(id)))

    // Получаем обновлённую работу
    const [updatedWork] = await db.select().from(works).where(eq(works.id, parseInt(id)))

    // Если работа оплачена — обновляем баланс контрагента
    if (updatedWork && updatedWork.paid && updatedWork.contractorType && updatedWork.contractorId) {
      const ContractorModel = 
        updatedWork.contractorType === 'master' ? masters : 
        updatedWork.contractorType === 'worker' ? workers : null

      if (ContractorModel) {
        const [contractor] = await db.select().from(ContractorModel)
          .where(eq(ContractorModel.id, updatedWork.contractorId))

        if (contractor) {
          // Расчёт разницы между старым и новым workerAmount
          const previousWorkerAmount = Number(currentWork.workerAmount)
          const newWorkerAmount = Number(updatedWork.workerAmount)
          const amountDifference = newWorkerAmount - previousWorkerAmount

          const contractorBalance = Number(contractor.balance)
          const updatedBalance = contractorBalance - amountDifference

          // Обновляем баланс контрагента
          await db.update(ContractorModel)
            .set({ balance: updatedBalance.toFixed(2) })
            .where(eq(ContractorModel.id, updatedWork.contractorId))
        }
      }
    }

    return updatedWork
  } catch (error) {
    console.error('Ошибка обновления работы:', error)
    throw createError({ 
      statusCode: 500,
      message: 'Ошибка сервера при обновлении работы' 
    })
  }
})

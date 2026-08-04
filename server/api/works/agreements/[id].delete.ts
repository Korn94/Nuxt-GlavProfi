// server/api/works/agreements/[id].delete.ts
import { defineEventHandler, createError, getRouterParam } from 'h3'
import { eq } from 'drizzle-orm'
import { db } from '../../../db'
import {
  workAgreements,
  workAgreementAcceptances
} from '../../../db/schema'
import { canManageWorkAgreements } from '../../../utils/workAgreements'

export default defineEventHandler(async (event) => {
  if (!await canManageWorkAgreements(event)) {
    throw createError({
      statusCode: 403,
      message: 'Недостаточно прав для удаления договорённости'
    })
  }

  const id = Number(getRouterParam(event, 'id'))

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Некорректный ID договорённости'
    })
  }

  const [agreement] = await db
    .select()
    .from(workAgreements)
    .where(eq(workAgreements.id, id))

  if (!agreement) {
    throw createError({
      statusCode: 404,
      message: 'Договорённость не найдена'
    })
  }

  const [acceptance] = await db
    .select()
    .from(workAgreementAcceptances)
    .where(eq(workAgreementAcceptances.agreementId, id))

  if (acceptance) {
    throw createError({
      statusCode: 400,
      message: 'Нельзя удалить договорённость, по которой уже были приёмки'
    })
  }

  await db
    .delete(workAgreements)
    .where(eq(workAgreements.id, id))

  return {
    success: true
  }
})

// server/api/portfolio/[slug]/index.delete.ts
import { eventHandler, createError } from 'h3'
import { db } from '../../../db'
import { portfolioCases } from '../../../db/schema'
import { eq } from 'drizzle-orm'
import { verifyAuth } from '../../../utils/auth'

export default eventHandler(async (event) => {
  const user = await verifyAuth(event)
  if (!['admin', 'manager'].includes(user.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const params = event.context.params
  if (!params || !params.id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing case ID' })
  }

  const caseId = parseInt(params.id)
  if (isNaN(caseId)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid case ID' })
  }

  // Проверяем, существует ли кейс
  const [existingCase] = await db
    .select()
    .from(portfolioCases)
    .where(eq(portfolioCases.id, caseId))

  if (!existingCase) {
    throw createError({ statusCode: 404, statusMessage: 'Case not found' })
  }

  // Удаляем кейс
  await db
    .delete(portfolioCases)
    .where(eq(portfolioCases.id, caseId))

  return { message: 'Case deleted successfully' }
})

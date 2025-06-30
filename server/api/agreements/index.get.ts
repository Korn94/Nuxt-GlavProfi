// server/api/agreements/index.get.ts
import { defineEventHandler } from 'h3'
import { db } from '../../db'
import { agreements } from '../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const query = event.node.req?.url ? new URL(event.node.req.url, 'http://localhost') : null
  const masterId = query?.searchParams.get('masterId')

  let result = []

  if (masterId) {
    result = await db.select().from(agreements).where(eq(agreements.masterId, parseInt(masterId)))
  } else {
    result = await db.select().from(agreements)
  }

  return result
})

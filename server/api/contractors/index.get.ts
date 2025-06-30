// server/api/contractors/index.get.ts
import { defineEventHandler } from 'h3'
import { db } from '../../db'
import { masters, workers, foremans, offices } from '../../db/schema'
import { eq, or } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const url = new URL(event.node.req.url!, `http://${event.node.req.headers.host}`)
  const type = url.searchParams.get('type')?.toLowerCase() || ''

  try {
    let contractors = []

    if (type === 'master') {
      const data = await db.select().from(masters)
      contractors = data.map(item => ({ ...item, type: 'master' }))
    } else if (type === 'worker') {
      const data = await db.select().from(workers)
      contractors = data.map(item => ({ ...item, type: 'worker' }))
    } else if (type === 'foreman') {
      const data = await db.select().from(foremans)
      contractors = data.map(item => ({ ...item, type: 'foreman' }))
    } else if (type === 'office') {
      const data = await db.select().from(offices)
      contractors = data.map(item => ({ ...item, type: 'office' }))
    } else {
      const [allMasters, allWorkers, allForemans, allOffices] = await Promise.all([
        db.select().from(masters),
        db.select().from(workers),
        db.select().from(foremans),
        db.select().from(offices)
      ])

      contractors = [
        ...allMasters.map(item => ({ ...item, type: 'master' })),
        ...allWorkers.map(item => ({ ...item, type: 'worker' })),
        ...allForemans.map(item => ({ ...item, type: 'foreman' })),
        ...allOffices.map(item => ({ ...item, type: 'office' }))
      ]
    }

    return contractors
  } catch (error) {
    console.error('Ошибка получения контрагентов:', error)
    throw new Error('Ошибка сервера при получении контрагентов')
  }
})

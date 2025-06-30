// server/api/analytics/index.get.ts
import { defineEventHandler, getQuery } from 'h3';
import { db } from '../../db';
import { comings, expenses, works, materials, objects } from '../../db/schema';
import { and, eq, gte, lte } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const start = query.start as string;
  const end = query.end as string;
  const objectId = query.objectId ? parseInt(query.objectId as string) : null;
  const contractorId = query.contractorId ? parseInt(query.contractorId as string) : null;
  const type = query.type as string;

  try {
    let finalCondition: any | undefined;

    if (start && end) {
      // Преобразование строки в Date
      const startDate = new Date(start);
      const endDate = new Date(end);

      finalCondition = and(finalCondition, gte(comings.operationDate, startDate), lte(comings.operationDate, endDate));
    }

    if (objectId) {
      finalCondition = and(finalCondition, eq(comings.objectId, objectId));
    }

    // Если фильтр не пуст, используем condition
    const allComings = finalCondition !== undefined
      ? await db.select().from(comings).where(finalCondition)
      : await db.select().from(comings);

    const allExpenses = finalCondition !== undefined
      ? await db.select().from(expenses).where(finalCondition)
      : await db.select().from(expenses);

    const allMaterials = finalCondition !== undefined
      ? await db.select().from(materials).where(finalCondition)
      : await db.select().from(materials);

    const allWorks = finalCondition !== undefined
      ? await db.select().from(works).where(finalCondition)
      : await db.select().from(works);

    return {
      totalIncome: allComings.reduce((sum, c) => sum + parseFloat(c.amount), 0),
      totalExpenses: allExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0),
      netProfit: 0,
      balance: 0,
      incomeData: [],
      expensesByCategory: [],
      profitDistribution: [],
      workStats: [],
      topWorks: [],
    };
  } catch (error) {
    console.error('Ошибка получения аналитики:', error);
    throw new Error('Не удалось получить данные аналитики');
  }
});
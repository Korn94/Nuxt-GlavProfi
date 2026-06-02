// server/api/price/[entity]/reorder.post.ts
import { defineApi } from '../../../utils/defineApi'
import { db } from '../../../db'
import { getRouterParam, readBody, createError } from 'h3'
import { eq } from 'drizzle-orm'
import {
  pricePages,
  priceCategories,
  priceSubCategories,
  priceItems,
  priceItemDetails,
  priceAdditionalItems
} from '../../../db/schema'

// ========================================
// 📋 СЛОВАРИ СУЩНОСТЕЙ
// ========================================

const tables: Record<string, any> = {
  pages: pricePages,
  categories: priceCategories,
  subcategories: priceSubCategories,
  items: priceItems,
  details: priceItemDetails,
  dopworks: priceAdditionalItems
}

const entityNames: Record<string, string> = {
  pages: 'страниц',
  categories: 'категорий',
  subcategories: 'подкатегорий',
  items: 'работ',
  details: 'деталей',
  dopworks: 'доп. работ'
}

// ========================================
// 🔧 ТИПЫ ДЛЯ ТЕЛА ЗАПРОСА
// ========================================

interface ReorderItem {
  id: number
  order: number
}

interface ReorderBody {
  items: ReorderItem[]
}

// ========================================
// ✅ ВАЛИДАЦИЯ ВХОДНЫХ ДАННЫХ
// ========================================

function validateReorderBody(body: unknown): ReorderBody {
  if (!body || typeof body !== 'object') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Некорректное тело запроса'
    })
  }

  const { items } = body as { items?: unknown }

  if (!Array.isArray(items)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Поле "items" должно быть массивом'
    })
  }

  if (items.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Массив "items" не может быть пустым'
    })
  }

  // Проверяем каждый элемент массива
  for (const item of items) {
    if (!item || typeof item !== 'object') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Каждый элемент "items" должен быть объектом'
      })
    }

    const { id, order } = item as { id?: unknown; order?: unknown }

    if (typeof id !== 'number' || !Number.isInteger(id) || id <= 0) {
      throw createError({
        statusCode: 400,
        statusMessage: `Некорректный ID: ${id}. Ожидается положительное целое число`
      })
    }

    if (typeof order !== 'number' || !Number.isFinite(order)) {
      throw createError({
        statusCode: 400,
        statusMessage: `Некорректный order для ID ${id}. Ожидается число`
      })
    }
  }

  return { items: items as ReorderItem[] }
}

// ========================================
// 🎯 ОСНОВНОЙ ОБРАБОТЧИК
// ========================================

export default defineApi(async (event) => {
  const entityName = getRouterParam(event, 'entity')
  const table = tables[entityName!]
  const nameGenitive = entityNames[entityName!]

  if (!table) {
    throw createError({
      statusCode: 400,
      statusMessage: `Неизвестная сущность: ${entityName}`
    })
  }

  // Проверяем, что у таблицы есть поле order
  if (!table.order) {
    throw createError({
      statusCode: 400,
      statusMessage: `У сущности "${entityName}" нет поля order`
    })
  }

  // Валидируем тело запроса
  const body = await readBody(event)
  const { items } = validateReorderBody(body)

  console.log(`🔀 Массовое обновление порядка: ${items.length} записей (${nameGenitive})`)

  // ========================================
  // 🔒 АТОМАРНОЕ ОБНОВЛЕНИЕ В ТРАНЗАКЦИИ
  // ========================================
  try {
    await db.transaction(async (tx) => {
      for (const { id, order } of items) {
        // Округляем order до целого (поле в БД — int)
        const intOrder = Math.round(order)

        const result = await tx
          .update(table)
          .set({ 
            order: intOrder,
            updatedAt: new Date()
          })
          .where(eq(table.id, id))

        // Проверяем, что запись была найдена и обновлена
        // Drizzle возвращает информацию о количестве затронутых строк
        if (result && 'affectedRows' in result && result.affectedRows === 0) {
          throw createError({
            statusCode: 404,
            statusMessage: `Запись не найдена: ID ${id}`
          })
        }
      }
    })

    console.log(`✅ Порядок успешно обновлён: ${items.length} записей (${nameGenitive})`)

    return { 
      success: true, 
      updatedCount: items.length 
    }
  } catch (error: any) {
    // Пробрасываем H3-ошибки как есть
    if (error?.statusCode) {
      throw error
    }

    console.error(`❌ Ошибка обновления порядка (${nameGenitive}):`, error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Не удалось обновить порядок элементов'
    })
  }
})

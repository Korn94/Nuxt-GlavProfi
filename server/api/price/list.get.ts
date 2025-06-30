// server/api/price/list.get.ts
import { defineEventHandler, createError } from 'h3'
import { db } from '../../db'
import { eq } from 'drizzle-orm'
import { 
  pricePages, 
  priceCategories, 
  priceSubCategories, 
  priceItems, 
  priceItemDetails, 
  priceAdditionalItems 
} from '../../db/schema'

// Типы для работы с данными
interface Dopwork {
  id: number
  itemId: number
  label: string | null
  dopwork: string
  unit: string
  price: string
  order: number | null
  createdAt: Date | null
  updatedAt: Date
}

interface DopworkGroup {
  label: string | null
  works: Dopwork[]
}

export default defineEventHandler(async () => {
  try {
    // Получаем все данные с иерархией
    const pages = await db.select().from(pricePages)
    
    const fullStructure = await Promise.all(pages.map(async (page) => {
      const categories = await db.select().from(priceCategories)
        .where(eq(priceCategories.pageId, page.id))
        
      const enrichedCategories = await Promise.all(categories.map(async (category) => {
        const subcategories = await db.select().from(priceSubCategories)
          .where(eq(priceSubCategories.categoryId, category.id))
          
        const enrichedSubcategories = await Promise.all(subcategories.map(async (subcategory) => {
          const items = await db.select().from(priceItems)
            .where(eq(priceItems.subCategoryId, subcategory.id))
            
          const enrichedItems = await Promise.all(items.map(async (item) => {
            const details = await db.select().from(priceItemDetails)
              .where(eq(priceItemDetails.itemId, item.id))
              
            const dopworks = await db.select().from(priceAdditionalItems)
              .where(eq(priceAdditionalItems.itemId, item.id))
              
            return {
              ...item,
              details,
              dopworks: dopworks.reduce((acc: DopworkGroup[], dop: Dopwork) => {
                const group = acc.find(g => g.label === dop.label)
                if (group) {
                  group.works.push(dop)
                } else {
                  acc.push({ label: dop.label, works: [dop] })
                }
                return acc
              }, [])
            }
          }))
          
          return {
            ...subcategory,
            items: enrichedItems
          }
        }))
        
        return {
          ...category,
          subcategories: enrichedSubcategories
        }
      }))
      
      return {
        ...page,
        categories: enrichedCategories
      }
    }))
    
    return fullStructure
  } catch (error) {
    console.error('Ошибка получения полной структуры:', error)
    throw createError({ 
      statusCode: 500,
      statusMessage: 'Не удалось получить полную структуру прайс-листа'
    })
  }
})
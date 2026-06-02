// app/components/pages/public/prices/composables/index.ts
/**
 * Единая точка входа для всех composables, типов и хуков раздела прайс-листа.
 * 
 * Использование в компонентах:
 * @example
 * import {
 *   usePriceData,
 *   usePriceEdit,
 *   usePriceUI,
 *   type PriceWorkItem,
 *   type PriceCategory
 * } from './composables'
 */

// ========================================
// 📋 ТИПЫ (реэкспорт всех типов)
// ========================================

export type {
  // Базовые сущности
  PricePage,
  PriceCategory,
  PriceSubcategory,
  
  // Работы и их составляющие
  PriceItemType,
  PriceItemBase,
  PriceWorkItem,
  PriceDetailItem,
  PriceDopworkItem,
  PriceItem,
  
  // API типы
  ApiPricePagesResponse,
  ApiPriceListResponse,
  ApiCreateResponse,
  ApiUpdateResponse,
  ApiDeleteResponse,
  
  // Формы
  NewCategoryForm,
  NewSubcategoryForm,
  NewWorkForm,
  NewDetailForm,
  NewDopworkForm,
  
  // Служебные
  PriceEntity,
  ReorderItem,
  UpdateStatus,
  OptimisticResult
} from './types'

// ========================================
// 🎯 ПРОВАЙДЕРЫ (для инициализации в pages/prices/[category].vue)
// ========================================

export {
  // Провайдер UI-состояния (аккордеоны, поиск, фильтры)
  // ВАЖНО: должен вызываться ПЕРВЫМ
  providePriceUI,
  PRICE_UI_KEY
} from './providePriceUI'

export {
  // Провайдер данных (загрузка, CRUD, reorder)
  // ВАЖНО: должен вызываться ВТОРЫМ
  providePriceData,
  PRICE_DATA_KEY
} from './providePriceData'

export {
  // Провайдер состояния редактирования (inline-формы, hasUnsavedChanges)
  // ВАЖНО: должен вызываться ТРЕТЬИМ
  providePriceEdit,
  PRICE_EDIT_KEY
} from './providePriceEdit'

// ========================================
// 🪝 ХУКИ (для использования в компонентах)
// ========================================

export {
  usePriceUI
} from './providePriceUI'

export {
  usePriceData
} from './providePriceData'

export {
  usePriceEdit
} from './providePriceEdit'

// ========================================
// 📋 ТИПЫ КОНТЕКСТОВ (для продвинутого использования)
// ========================================

export type {
  PriceUIContext
} from './providePriceUI'

export type {
  PriceDataContext
} from './providePriceData'

export type {
  PriceEditContext
} from './providePriceEdit'

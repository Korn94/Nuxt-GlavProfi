// stores\price\index.ts
/**
 * 📦 Баррельный файл: единая точка входа для всех Pinia-сторов и типов прайс-листа.
 *
 * ✅ Использование в компонентах:
 *
 * @example
 * // Импорт сторов
 * import { usePriceUIStore, usePriceDataStore, usePriceEditStore } from '~/stores/price'
 *
 * // Импорт типов
 * import type { PriceCategory, PriceWorkItem } from '~/stores/price'
 *
 * // Комбинированный импорт
 * import { usePriceDataStore, type ApiPriceListResponse } from '~/stores/price'
 *
 * ❗ НЕ ИМПОРТИРУЙТЕ напрямую из файлов сторов в компонентах:
 * // ❌ Плохо:
 * import { usePriceDataStore } from '~/stores/price/usePriceDataStore'
 * // ✅ Хорошо:
 * import { usePriceDataStore } from '~/stores/price'
 */

// ========================================
// 🏪 СТОРЫ (реэкспорт всех Pinia-сторов)
// ========================================
export { usePriceUIStore } from './usePriceUIStore'
export { usePriceDataStore } from './usePriceDataStore'
export { usePriceEditStore } from './usePriceEditStore'

// ========================================
// 📋 ТИПЫ: Базовые сущности (соответствуют БД)
// ========================================
export type {
  PricePage,
  PriceCategory,
  PriceSubcategory,
  PriceItemType,
  PriceItemBase,
  PriceWorkItem,
  PriceDetailItem,
  PriceDopworkItem,
  PriceItem,
} from './types'

// ========================================
// 📥 ТИПЫ: API (запросы/ответы)
// ========================================
export type {
  ApiPricePagesResponse,
  ApiPriceListResponse,
  ApiCreateResponse,
  ApiUpdateResponse,
  ApiDeleteResponse,
} from './types'

// ========================================
// ✏️ ТИПЫ: Формы для создания записей
// ========================================
export type {
  NewCategoryForm,
  NewSubcategoryForm,
  NewWorkForm,
  NewDetailForm,
  NewDopworkForm,
} from './types'

// ========================================
// 🔧 ТИПЫ: Служебные (для операций)
// ========================================
export type {
  PriceEntity,
  ReorderItem,
  UpdateStatus,
  OptimisticResult,
  PricePayload,
} from './types'

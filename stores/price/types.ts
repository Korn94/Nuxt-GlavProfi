// stores\price\types.ts
/**
 * Общие типы для Pinia-сторов раздела прайс-листа.
 * Единый источник истины для API, сторов и компонентов.
 */

// ========================================
// 🗂 БАЗОВЫЕ СУЩНОСТИ (соответствуют БД)
// ========================================

/**
 * Страница прайс-листа (отделочные работы, сантехника, электрика и т.д.)
 */
export interface PricePage {
  id: number
  title: string
  slug: string
  metaTitle?: string | null
  metaDescription?: string | null
  metaKeywords?: string | null
  order: number
  createdAt: string | Date
  updatedAt: string | Date
}

/**
 * Категория работ (например, "Подготовка основания")
 */
export interface PriceCategory {
  id: number
  pageId: number
  name: string
  order: number
  subcategories: PriceSubcategory[]
  createdAt: string | Date
  updatedAt: string | Date
}

/**
 * Подкатегория (например, "Демонтаж старого покрытия")
 */
export interface PriceSubcategory {
  id: number
  categoryId: number
  name: string
  order: number
  items: PriceWorkItem[]
  createdAt: string | Date
  updatedAt: string | Date
}

// ========================================
// 💼 РАБОТЫ И ИХ СОСТАВЛЯЮЩИЕ
// ========================================

/**
 * Дискриминатор типа элемента прайса.
 */
export type PriceItemType = 'item' | 'detail' | 'dopwork'

/**
 * Базовые поля, общие для всех элементов прайса
 */
export interface PriceItemBase {
  id: number
  unit: string
  price: number | string
  order: number
  createdAt?: string | Date
  updatedAt?: string | Date
  // Клиентские UI-поля (не приходят с сервера)
  isCopied?: boolean
}

/**
 * Основная работа (например, "Демонтаж ламината")
 */
export interface PriceWorkItem extends PriceItemBase {
  subCategoryId: number
  name: string
  type: 'item'
  details: PriceDetailItem[]
  dopworks: PriceDopworkItem[]
}

/**
 * Деталь работы (расшифровка, например, "Разборка ламината")
 */
export interface PriceDetailItem extends PriceItemBase {
  itemId: number
  name: string
  type: 'detail'
}

/**
 * Дополнительная работа (например, "Покраска в 1 слой")
 *
 * ВАЖНО: dopworks возвращаются ПЛОСКИМ массивом (без группировки по label).
 * Группировка по label делается на клиенте в UI-слое, если нужна.
 */
export interface PriceDopworkItem extends PriceItemBase {
  itemId: number
  label: string | null
  dopwork: string
  type: 'dopwork'
}

/**
 * Union-тип для любого элемента прайса.
 */
export type PriceItem = PriceWorkItem | PriceDetailItem | PriceDopworkItem

// ========================================
// 📥 API: Типы ответов сервера
// ========================================

/**
 * Ответ эндпоинта GET /api/price/pages
 */
export type ApiPricePagesResponse = PricePage[]

/**
 * Ответ эндпоинта GET /api/price/list/[slug]
 * Возвращает страницу со вложенным деревом категорий
 */
export interface ApiPriceListResponse extends PricePage {
  categories: PriceCategory[]
}

/**
 * Ответ POST-запросов на создание записей.
 */
export interface ApiCreateResponse {
  id: number
}

/**
 * Ответ PUT-запросов на обновление.
 */
export type ApiUpdateResponse<T> = T

/**
 * Ответ DELETE-запросов.
 */
export interface ApiDeleteResponse {
  success: true
}

// ========================================
// ✏️ ФОРМЫ: Типы данных для создания
// ========================================

export interface NewCategoryForm {
  name: string
  pageId: number | null
}

export interface NewSubcategoryForm {
  name: string
  categoryId: number
}

export interface NewWorkForm {
  name: string
  unit: string
  price: string | number
  subCategoryId: number
}

export interface NewDetailForm {
  name: string
  unit: string
  price: string | number
  itemId: number
}

export interface NewDopworkForm {
  label: string
  dopwork: string
  unit: string
  price: string | number
  itemId: number
}

// ========================================
// 🔧 СЛУЖЕБНЫЕ ТИПЫ
// ========================================

/**
 * Имя сущности прайса (для универсальных эндпоинтов)
 */
export type PriceEntity =
  | 'pages'
  | 'categories'
  | 'subcategories'
  | 'items'
  | 'details'
  | 'dopworks'

/**
 * Операция изменения порядка (для drag & drop)
 */
export interface ReorderItem {
  id: number
  order: number
}

/**
 * Статус оптимистичного обновления.
 */
export type UpdateStatus = 'idle' | 'pending' | 'success' | 'error'

/**
 * Результат оптимистичной операции (для отката в случае ошибки)
 */
export interface OptimisticResult<T> {
  status: UpdateStatus
  data?: T
  error?: string
  rollback?: () => void
}

/**
 * Payload от useAsyncData (передаётся в DataStore при загрузке)
 */
export interface PricePayload {
  priceData: ApiPriceListResponse | null
  isAdminUser: boolean
}

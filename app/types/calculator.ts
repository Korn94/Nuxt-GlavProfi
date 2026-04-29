// app/types/calculator.ts

// -----------------------------------------------------------------------------
// 1. Базовые типы и константы
// -----------------------------------------------------------------------------

/** Зоны расчёта */
export type CalculatorSection = 'floor' | 'walls' | 'ceiling'

/** Нормализованные единицы измерения */
export type WorkUnit = 'm2' | 'linear' | 'piece'

/** Значение опции в покрытии (например, размер плитки) */
export interface OptionValue {
  value: string
  label: string
  priceModifier?: number // Коэффициент изменения цены (если нужно)
  itemId?: number        // Прямой ID работы в БД для этого варианта
}

/** Описание одной настройки покрытия */
export interface FinishOptionConfig {
  label: string          // Название настройки (например, "Размер плитки")
  type: 'select' | 'radio' // Тип UI элемента
  values: OptionValue[]  // Доступные варианты
}

/** Конфигурация одной группы покрытий (например, "Плитка на стены") */
export interface FinishGroupConfig {
  id: string             // Уникальный ID (например, 'tile_walls')
  name: string           // Название для отображения
  section: CalculatorSection // К какой секции относится
  icon?: string          // Эмодзи или иконка
  
  // База: массив ID работ, которые ВСЕГДА входят в это покрытие (Грунт -> Укладка -> Затирка)
  baseItemIds: number[]

  // Допы: массив ID работ или тегов, которые можно добавить через кнопку "Добавить доп."
  // В реализации мы можем фильтровать работы по этим ID или тегам
  extraItemIds: number[] 

  // Настройки: опции, влияющие на выбор базовой работы или цену (например, размер плитки)
  options?: Record<string, FinishOptionConfig>
}

// -----------------------------------------------------------------------------
// 2. Модели данных (сопоставление с БД)
// -----------------------------------------------------------------------------

/** Сырая позиция из API/БД */
export interface DBPriceItem {
  id: number
  name: string
  unit: string
  price: string
  sub_category_id: number
}

/** Нормализованная позиция для фронтенд-логики */
export interface NormalizedWorkItem {
  id: number
  name: string
  normalizedUnit: WorkUnit
  pricePerUnit: number
  subCategoryId: number
  section: CalculatorSection
  // Теги могут понадобиться для фильтрации допов, если мы не хотим хардкодить ID
  tags?: string[] 
  isDemolition?: boolean
}

/** Ответ от API с категориями и работами */
export interface PriceApiResponse {
  categories: Array<{
    id: number
    name: string
    subcategories?: Array<{
      id: number
      name: string
      items?: DBPriceItem[]
    }>
  }>
}

// -----------------------------------------------------------------------------
// 3. Состояние калькулятора (Input)
// -----------------------------------------------------------------------------

/** Параметры помещения */
export interface Dimensions {
  floorArea: number        // было: area → floorArea
  height: number
  perimeter: number | null
  wallArea: number | null  // NEW: площадь стен (авто или ручная)
  isWallAreaManual: boolean // NEW: флаг ручного ввода
}

/** Один экземпляр добавленного покрытия (карточка в интерфейсе) */
export interface SurfaceInstance {
  instanceId: string       // Уникальный ID экземпляра (uuid)
  finishGroupId: string    // Ссылка на конфиг из FINISH_GROUPS (например, 'tile_walls')
  
  // Выбранные опции (например, { tileSize: '60x60' })
  options: Record<string, string> 
  
  // Вручную введенный объем/площадь для этого покрытия
  area: number 
  
  // ID работ из базы, которые пользователь исключил из состава (если реализует чекбоксы внутри)
  // В текущей логике мы это не обсуждали детально, но оставим на будущее
  excludedItemIds: number[]
  extras: Array<{ itemId: number; qty: number }> 
}

/** Главное состояние калькулятора */
export interface CalculatorState {
  section: CalculatorSection
  dimensions: Dimensions
  
  // 1. Демонтаж/подготовка (список выбранных работ с количеством)
  demolitionWorks: Array<{ itemId: number; quantity: number }>
  
  // 2. Активные покрытия (список инстансов)
  surfaceInstances: SurfaceInstance[]
  
  // 3. Штучные доп. работы (общий пул, не привязанный к конкретному покрытию)
  pieceWorks: Array<{ itemId: number; quantity: number }>
}

// -----------------------------------------------------------------------------
// 4. Результат расчёта (Output)
// -----------------------------------------------------------------------------

/** Строка сметы */
export interface CalculationLine {
  id: number           // ID работы из БД (или составной ключ для допов)
  name: string
  unit: WorkUnit
  quantity: number
  pricePerUnit: number
  total: number
  finishGroupId?: string // К какому покрытию относится (для группировки в итогах)
  isExtra?: boolean    // Является ли доп. работой
}

/** Итоговая сводка */
export interface CalculationResult {
  lines: CalculationLine[]
  summary: {
    grandTotal: number
  }
}

// -----------------------------------------------------------------------------
// 5. Вспомогательные маппинги
// -----------------------------------------------------------------------------

export type UnitMapper = Record<string, WorkUnit>

/** Маппинг единиц из БД → внутренние типы */
export const UNIT_MAP: UnitMapper = {
  'м²': 'm2', 'м2': 'm2', 'кв.м': 'm2', 'кв.м.': 'm2', 'м.кв': 'm2', 'м² +': 'm2',
  'м.п.': 'linear', 'м.п': 'linear', 'пог.м': 'linear', 'пог.м.': 'linear', 
  'м.п. +': 'linear', 'п.м +': 'linear', 'п.м.': 'linear', 'п.м': 'linear',
  'шт': 'piece', 'шт.': 'piece', 'штук': 'piece', 'компл': 'piece', 'комплект': 'piece',
  'узел': 'piece', 'контур': 'piece', 'система': 'piece', 'линия': 'piece',
  'от': 'piece', 'от / случай': 'piece', 'точка': 'piece', 'участок': 'piece',
  'стояк': 'piece', 'объект': 'piece', 'зона': 'piece', 'радиатор': 'piece',
  'входит в стоимость': 'piece', 'координация бесплатно': 'piece',
  // Добавлено из анализа БД:
  'бесплатно': 'piece'
} as const

// server/db/schema.ts
import { mysqlTable, serial, varchar, text, decimal, datetime, int, boolean, bigint, index } from 'drizzle-orm/mysql-core'
import { sql } from 'drizzle-orm'

// Таблица пользователей
export const users = mysqlTable('users', {
  id: serial('id').primaryKey(),
  telegramId: int('telegram_id').unique(),
  login: varchar('login', { length: 255 }).unique().notNull(),
  password: varchar('password', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  role: varchar('role', { 
    length: 50,
    enum: ['admin', 'manager', 'foreman', 'master', 'worker']
  }).default('worker').notNull(),
  contractorType: varchar('contractor_type', {
    length: 50,
    enum: ['master', 'worker', 'foreman']
  }),
  contractorId: int('contractor_id'),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime('updated_at') .default(sql`CURRENT_TIMESTAMP`) .notNull() .$type<Date>()
})

// Таблица объектов
export const objects = mysqlTable('objects', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  status: varchar('status', {
    length: 50,
    enum: ['active', 'waiting', 'completed']
  }).default('active').notNull(),

  address: text('address'), // Адрес объекта
  comment: text('comment'),
  startDate: datetime('start_date', { mode: 'string' }), // Дата начала (можно хранить как DATE или DATETIME)
  plannedEndDate: datetime('planned_end_date', { mode: 'string' }), // Плановая дата завершения
  completedDate: datetime('completed_date', { mode: 'string' }), // Фактическая дата завершения
  source: varchar('source', {
    length: 50,
    enum: [
      'Avito',
      'Сарафанка',
      'Сайт',
      'Сайт + Директ',
      'Вновь обратившийся',
      'Прочее'
    ]
  }), // Источник объекта

  totalWorks: decimal('total_works', { precision: 10, scale: 2 }).default('0.00').notNull(),
  totalIncome: decimal('total_income', { precision: 10, scale: 2 }).default('0.00').notNull(),
  profit: decimal('profit', { precision: 10, scale: 2 }).default('0.00').notNull(),
  totalBalance: decimal('total_balance', { precision: 10, scale: 2 }).default('0.00').notNull(),
  foremanId: int('foreman_id'),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime('updated_at') .default(sql`CURRENT_TIMESTAMP`) .notNull() .$type<Date>()
})

export const objectContracts = mysqlTable('object_contracts', {
  id: serial('id').primaryKey(),

  // Связь с объектом
  objectId: bigint('object_id', { mode: 'number', unsigned: true })
    .notNull()
    .references(() => objects.id),

  type: varchar('type', {
    length: 20,
    enum: [
      'unassigned',  // Не выбрано (по умолчанию)
      'none',    // Договор не нужен
      'edo',     // ЭДО
      'paper',   // Бумажный
      'invoice'  // Счёт-договор
    ]
  }).default('unassigned'), // по умолчанию NULL

  // Статус
  status: varchar('status', {
    length: 20,
    enum: [
      'prepared',     // Подготовлен
      'sent',         // Отправлен клиенту
      'awaiting',     // Ожидает подписи
      'signed',       // Подписан
      'cancelled'     // Отменён
    ]
  }).default('prepared').notNull(),

  // Дата изменения статуса
  statusDate: datetime('status_date', { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),

  // Комментарий (например, кто отправил, номер, ссылка на PDF)
  comment: text('comment'),

  // Дата создания
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime('updated_at') .default(sql`CURRENT_TIMESTAMP`) .notNull() .$type<Date>()
}, (table) => ({
  objectIndex: index('object_idx').on(table.objectId),
  statusIndex: index('status_idx').on(table.status)
}))

// Таблица: Счета (как документы)
export const objectInvoices = mysqlTable('object_invoices', {
  id: serial('id').primaryKey(),

  // Привязка к объекту
  objectId: bigint('object_id', { mode: 'number', unsigned: true })
    .notNull()
    .references(() => objects.id),

  // Название счёта (например, "Аванс", "Закрывающий", "Доп. работа по электрике")
  name: varchar('name', { length: 255 }).notNull(),

  // Сумма (совпадает с coming.amount, но не связана напрямую)
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),

  // Комментарий
  comment: text('comment'),

  // Статус документа
  status: varchar('status', {
    length: 20,
    enum: [
      'prepared',   // Подготовлен
      'sent',       // Отправлен
      'paid'        // Оплачен
    ]
  }).default('prepared').notNull(),

  // Дата изменения статуса
  statusDate: datetime('status_date', { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),

  // Подтип (для фильтрации)
  subtype: varchar('subtype', {
    length: 20,
    enum: [
      'advance',
      'intermediate',
      'final',
      'additional'
    ]
  }),

  // Порядок отображения
  order: int('order').default(0),

  // Дата создания
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime('updated_at') .default(sql`CURRENT_TIMESTAMP`) .notNull() .$type<Date>()
}, (table) => ({
  objectIndex: index('object_idx').on(table.objectId),
  statusIndex: index('status_idx').on(table.status),
  orderIndex: index('order_idx').on(table.objectId, table.order)
}))

export const objectBudget = mysqlTable('object_budget', {
  id: serial('id').primaryKey(),

  // Привязка к объекту
  objectId: bigint('object_id', { mode: 'number', unsigned: true })
    .notNull()
    .references(() => objects.id),

  // Название: "Основная смета", "Утепление пола", "Электрика по потолку" и т.п.
  name: varchar('name', { length: 255 }).notNull(),

  // Сумма (в рублях)
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),

  // Комментарий (опционально)
  comment: text('comment'),

  // Порядок отображения (чтобы первая была "основная")
  order: int('order').default(0),

  // Ход работ
  workProgress: varchar('work_progress', {
    length: 20,
    enum: [
      'queued',     // На очереди
      'in_progress',// В работе
      'completed',  // Выполнено
      'cancelled'   // Отменено
    ]
  }).default('queued').notNull(),

  // Статус акта
  actStatus: varchar('act_status', {
    length: 20,
    enum: [
      'none',        // Не применимо / ещё не нужно
      'required',    // Нужно сделать (после "Выполнено")
      'awaiting',    // Ждёт подписи
      'signed'       // Подписан
    ]
  }).default('none').notNull(),

  // Дата создания
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime('updated_at') .default(sql`CURRENT_TIMESTAMP`) .notNull() .$type<Date>()
}, (table) => ({
  // Индекс для быстрого поиска по объекту
  objectIndex: index('object_idx').on(table.objectId),
  // Составной индекс: объект + порядок
  orderIndex: index('order_idx').on(table.objectId, table.order)
}))

// Таблица материалов
export const materials = mysqlTable('materials', {
  id: serial('id').primaryKey(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  comment: text('comment'),
  objectId: int('object_id').notNull(),
  hasReceipt: boolean('has_receipt').default(false),
  type: varchar('type', {
    length: 50,
    enum: ['incoming', 'outgoing']
  }).default('incoming').notNull(),
  operationDate: datetime('operation_date').default(sql`CURRENT_TIMESTAMP`),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime('updated_at') .default(sql`CURRENT_TIMESTAMP`) .notNull() .$type<Date>()
})

// Таблица приходов
export const comings = mysqlTable('comings', {
  id: serial('id').primaryKey(),
  amount: decimal('amount', { precision: 10, scale: 2 }).default('0.00').notNull(),
  comment: text('comment'),
  paymentDate: datetime('payment_date').default(sql`CURRENT_TIMESTAMP`),
  operationDate: datetime('operation_date').default(sql`CURRENT_TIMESTAMP`),
  objectId: int('object_id').notNull(),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime('updated_at') .default(sql`CURRENT_TIMESTAMP`) .notNull() .$type<Date>()
})

// Таблица расходов
export const expenses = mysqlTable('expenses', {
  id: serial('id').primaryKey(),
  amount: decimal('amount', { precision: 10, scale: 2 }).default('0.00').notNull(),
  comment: text('comment'),
  contractorId: int('contractor_id'),
  contractorType: varchar('contractor_type', {
    length: 50,
    enum: ['master', 'worker', 'foreman', 'office']
  }),
  expenseType: varchar('expense_type', {
    length: 50,
    enum: ['Работа', 'Налог', 'Зарплата', 'Реклама', 'Кредит', 'Топливо', 'ГлавПрофи']
  }).default('Работа'),
  paymentDate: datetime('payment_date').default(sql`CURRENT_TIMESTAMP`),
  operationDate: datetime('operation_date').default(sql`CURRENT_TIMESTAMP`),
  objectId: int('object_id'),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime('updated_at') .default(sql`CURRENT_TIMESTAMP`) .notNull() .$type<Date>()
})

// Таблица работ
export const works = mysqlTable('works', {
  id: serial('id').primaryKey(),
  workerAmount: decimal('worker_amount', { precision: 10, scale: 2 }).default('0.00').notNull(),    // Сумма работ (мастеру)
  comment: text('comment'),
  contractorId: int('contractor_id').notNull(),                                                  // ID контрагента (мастер/рабочий)
  contractorType: varchar('contractor_type', {                                                   // Тип контрагента
    length: 50,
    enum: ['master', 'worker']
  }).notNull(),
  workTypes: varchar('work_types', {                                                            // Вид работы
    length: 50,
    enum: [
      'Отделка', 'Электрика', 'Плитка', 'Сантехника', 'Перегородки ГКЛ',
      'Сварка', 'Бетонные работы', 'Кровля', 'Фасад', 'Перегородки Камень',
      'Демонтаж', 'Мусор', 'Прочее'
    ]
  }).default('Прочее'),
  foremanId: int('foreman_id'),                                                                 // Ссылка на прораба
  accepted: boolean('accepted').default(false),                                                 // Принята ли работа заказчиком
  acceptedDate: datetime('accepted_date'),                                                     // Дата принятия
  rejectedReason: text('rejected_reason'),                                                      // Причина отклонения
  paid: boolean('paid').default(false),                                                         // Оплачена ли работа
  paymentDate: datetime('payment_date').default(sql`CURRENT_TIMESTAMP`),                        // Дата оплаты
  operationDate: datetime('operation_date').default(sql`CURRENT_TIMESTAMP`),                     // Дата создания работы
  objectId: int('object_id').notNull(),                                                        // Ссылка на объект
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),                            // Дата создания записи
  updatedAt: datetime('updated_at') .default(sql`CURRENT_TIMESTAMP`) .notNull() .$type<Date>()
})

// Таблица мастеров
export const masters = mysqlTable('masters', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 255 }),
  comment: text('comment'),
  balance: decimal('balance', { precision: 10, scale: 2 }).default('0.00').notNull(),
  userId: bigint('userId', { mode: 'number', unsigned: true }).references(() => users.id),
  isOnSalary: boolean('is_on_salary').default(false), // Участвует ли в автоматической зарплате
  salaryAmount: decimal('salary_amount', { precision: 10, scale: 2 }).default('0.00'), // Сумма зарплаты
  salaryDay: int('salary_day').default(10), // День месяца для списания
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime('updated_at') .default(sql`CURRENT_TIMESTAMP`) .notNull() .$type<Date>()
})

// Таблица рабочих
export const workers = mysqlTable('workers', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 255 }),
  comment: text('comment'),
  balance: decimal('balance', { precision: 10, scale: 2 }).default('0.00').notNull(),
  isNoName: boolean('is_no_name').default(false),
  works: text('works'),
  userId: bigint('userId', { mode: 'number', unsigned: true }).references(() => users.id),
  isOnSalary: boolean('is_on_salary').default(false), // Участвует ли в автоматической зарплате
  salaryAmount: decimal('salary_amount', { precision: 10, scale: 2 }).default('0.00'), // Сумма зарплаты
  salaryDay: int('salary_day').default(10), // День месяца для списания
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime('updated_at') .default(sql`CURRENT_TIMESTAMP`) .notNull() .$type<Date>()
})

// Таблица прорабов
export const foremans = mysqlTable('foremans', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 255 }),
  comment: text('comment'),
  balance: decimal('balance', { precision: 10, scale: 2 }).default('0.00').notNull(),
  userId: bigint('userId', { mode: 'number', unsigned: true }).references(() => users.id),
  isOnSalary: boolean('is_on_salary').default(false), // Участвует ли в автоматической зарплате
  salaryAmount: decimal('salary_amount', { precision: 10, scale: 2 }).default('0.00'), // Сумма зарплаты
  salaryDay: int('salary_day').default(10), // День месяца для списания
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime('updated_at') .default(sql`CURRENT_TIMESTAMP`) .notNull() .$type<Date>()
})

export const offices = mysqlTable('offices', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 255 }),
  comment: text('comment'),
  balance: decimal('balance', { precision: 10, scale: 2 }).default('0.00').notNull(),
  userId: bigint('userId', { mode: 'number', unsigned: true }).references(() => users.id),
  isOnSalary: boolean('is_on_salary').default(false), // Участвует ли в автоматической зарплате
  salaryAmount: decimal('salary_amount', { precision: 10, scale: 2 }).default('0.00'), // Сумма зарплаты
  salaryDay: int('salary_day').default(10), // День месяца для списания
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime('updated_at') .default(sql`CURRENT_TIMESTAMP`) .notNull() .$type<Date>()
})

// Истории списаний по зарплате
export const salaryDeductions = mysqlTable('salary_deductions', {
  id: serial('id').primaryKey(),
  contractorId: int('contractor_id').notNull(), // ID контрагента
  contractorType: varchar('contractor_type', { // Тип контрагента
    length: 50,
    enum: ['master', 'worker', 'foreman', 'office']
  }).notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(), // Сумма списания
  deductionDate: datetime('deduction_date').default(sql`CURRENT_TIMESTAMP`), // Дата списания
  status: varchar('status', { // Статус: 'completed', 'failed', 'skipped'
    length: 20,
    enum: ['pending', 'completed', 'failed', 'skipped']
  }).default('pending'),
  month: int('month').notNull(), // Месяц списания (1-12)
  year: int('year').notNull(), // Год списания
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`)
});

// Прайс лист
// 1. Страницы (Пол, Стены, Потолок)
export const pricePages = mysqlTable('price_pages', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(), // "Пол", "Стены"
  slug: varchar('slug', { length: 50 }).unique().notNull(), // "floor", "walls"
  metaTitle: varchar('meta_title', { length: 255 }), // Заголовок для SEO
  metaDescription: text('meta_description'),        // Описание для SEO
  metaKeywords: text('meta_keywords'),             // Ключевые слова
  order: int('order').default(0),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull().$type<Date>()
})

// 2. Категории (Подготовка основания, Монтаж напольных покрытий)
export const priceCategories = mysqlTable('price_categories', {
  id: serial('id').primaryKey(),
  pageId: int('page_id').notNull(), // Ссылка на страницу
  name: varchar('name', { length: 255 }).notNull(), // "Подготовка основания"
  order: int('order').default(0),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull().$type<Date>()
})

// 3. Подкатегории (Демонтаж старого покрытия, Удаление старой стяжки)
export const priceSubCategories = mysqlTable('price_sub_categories', {
  id: serial('id').primaryKey(),
  categoryId: int('category_id').notNull(), // Ссылка на категорию
  name: varchar('name', { length: 255 }).notNull(), // "Демонтаж старого покрытия"
  order: int('order').default(0),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull().$type<Date>()
})

// 4. Работы (Демонтаж ламината, Демонтаж линолеума)
export const priceItems = mysqlTable('price_items', {
  id: serial('id').primaryKey(),
  subCategoryId: int('sub_category_id').notNull(), // Ссылка на подкатегорию
  name: varchar('name', { length: 255 }).notNull(), // "Демонтаж ламината"
  unit: varchar('unit', { length: 50 }).notNull(), // "м²", "пог.м"
  price: decimal('price', { precision: 10, scale: 2 }).notNull(), // 1200.00
  order: int('order').default(0),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull().$type<Date>()
})

// 5. Расшифровка работ (Разборка ламината, Удаление подложки)
export const priceItemDetails = mysqlTable('price_item_details', {
  id: serial('id').primaryKey(),
  itemId: int('item_id').notNull(), // Ссылка на работу
  name: varchar('name', { length: 255 }).notNull(), // "Разборка ламината"
  unit: varchar('unit', { length: 50 }).notNull(), // "м²"
  price: decimal('price', { precision: 10, scale: 2 }).notNull(), // 300.00
  order: int('order').default(0),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull().$type<Date>()
})

// 6. Доп. работы (Покраска в 1 слой)
export const priceAdditionalItems = mysqlTable('price_additional_items', {
  id: serial('id').primaryKey(),
  itemId: int('item_id').notNull(), // Ссылка на работу
  label: varchar('label', { length: 255 }), // "Подготовка"
  dopwork: varchar('dopwork', { length: 255 }).notNull(), // "Покраска в 1 слой"
  unit: varchar('unit', { length: 50 }).notNull(), // "м²"
  price: decimal('price', { precision: 10, scale: 2 }).notNull(), // 250.00
  order: int('order').default(0),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull().$type<Date>()
})

// Данных о кейсах 
export const portfolioCases = mysqlTable('portfolio_cases', {
  id: serial('id').primaryKey(),
  isPublished: boolean('is_published').default(true), // Опубликован ли кейс
  title: varchar('title', { length: 255 }).notNull(), // Название кейса
  slug: varchar('slug', { length: 255 }).unique().notNull(), // URL-friendly версия названия
  category: varchar('category', {
    length: 50,
    enum: ['Кафе', 'Магазины', 'Клиники', 'Банки', 'Фитнес', 'Производственные',  'Фасады и Кровля', 'Прочее']
  }).notNull(),
  address: text('address').notNull(), // Краткое описание для объекта
  objectDescription: text('object_description').notNull(), // Краткое описание для объекта
  shortObject: text('short_object').notNull(), // Краткое описание для карточки
  space: decimal('space', { precision: 10, scale: 0 }).notNull(), // Площадь в м²
  duration: varchar('duration', { length: 50 }).notNull(), // Срок выполнения
  people: varchar('people', { length: 50 }).notNull(), // Количество людей
  shortDescription: text('short_description').notNull(), // Краткое описание для здания
  fullDescription: text('full_description'), // Полное описание для страницы кейса
  result: text('result'), // Описание результата
  metaTitle: varchar('meta_title', { length: 255 }), // Заголовок для SEO
  metaDescription: text('meta_description'), // Для SEO
  metaKeywords: text('meta_keywords'), // Для SEO
  order: int('order').default(0), // Порядок отображения
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull()
}, (table) => ({
  slugIndex: index('slug_index').on(table.slug),
  categoryIndex: index('category_index').on(table.category)
}))

// Хранения изображений кейсов
export const portfolioImages = mysqlTable('portfolio_images', {
  id: serial('id').primaryKey(),
  caseId: bigint('case_id', { mode: 'number', unsigned: true }).notNull().references(() => portfolioCases.id),
  url: varchar('url', { length: 255 }).notNull(), // Путь к изображению (например, '/uploads/ddx.jpg')
  type: varchar('type', { 
    length: 50,
    enum: ['main', 'thumbnail', 'gallery', 'before', 'after'] 
  }).notNull(), // Тип изображения
  pairGroup: varchar('pair_group', { length: 50 }), // Поле для группировки по парам фото "до" и "после"
  caption: varchar('caption', { length: 255 }), // Подпись к изображению
  alt: varchar('alt', { length: 255 }), // Альтернативный текст для изображения
  order: int('order').default(0) // Порядок отображения
}, (table) => ({
  caseIdIndex: index('case_id_index').on(table.caseId)
}))

// Хранения данных о видах работ для объектов
export const portfoCaseWorks = mysqlTable('portfolio_case_works', {
  id: serial('id').primaryKey(),
  caseId: bigint('case_id', { mode: 'number', unsigned: true }).notNull().references(() => portfolioCases.id),
  workType: varchar('work_type', { length: 50 }).notNull(),
  progress: int('progress').notNull(), // Процент выполных работ нами (0-100)
  order: int('order').default(0) // Порядок отображения
}, (table) => ({
  caseIdIndex: index('case_id_index').on(table.caseId)
}))

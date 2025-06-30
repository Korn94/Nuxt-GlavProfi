// server/db/schema.ts
import { mysqlTable, serial, varchar, text, decimal, datetime, int, boolean, bigint } from 'drizzle-orm/mysql-core'
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
  totalWorks: decimal('total_works', { precision: 10, scale: 2 }).default('0.00').notNull(),
  totalIncome: decimal('total_income', { precision: 10, scale: 2 }).default('0.00').notNull(),
  profit: decimal('profit', { precision: 10, scale: 2 }).default('0.00').notNull(),
  totalBalance: decimal('total_balance', { precision: 10, scale: 2 }).default('0.00').notNull(),
  foremanId: int('foreman_id'),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime('updated_at') .default(sql`CURRENT_TIMESTAMP`) .notNull() .$type<Date>()
})

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
  contractorId: int('contractor_id').notNull(),
  contractorType: varchar('contractor_type', {
    length: 50,
    enum: ['master', 'worker']
  }).notNull(),
  paymentDate: datetime('payment_date').default(sql`CURRENT_TIMESTAMP`),
  operationDate: datetime('operation_date').default(sql`CURRENT_TIMESTAMP`),
  objectId: int('object_id'),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime('updated_at') .default(sql`CURRENT_TIMESTAMP`) .notNull() .$type<Date>()
})

// Таблица работ
export const works = mysqlTable('works', {
  id: serial('id').primaryKey(),
  customerAmount: decimal('customer_amount', { precision: 10, scale: 2 }).default('0.00').notNull(), // Сумма сметы (заказчик)
  workerAmount: decimal('worker_amount', { precision: 10, scale: 2 }).default('0.00').notNull(),    // Сумма работ (мастеру)
  profit: decimal('profit', { precision: 10, scale: 2 }).default('0.00').notNull(),               // Прибыль (customerAmount - workerAmount)
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
      'Сварка', 'Бетонные работы', 'Кровля', 'Перегородки Камень',
      'Демонтаж', 'Мусор', 'Прочее'
    ]
  }).default('Прочее'),
  foremanId: int('foreman_id'),                                                                 // Ссылка на прораба
  accepted: boolean('accepted').default(false),                                                 // Принята ли работа заказчиком
  acceptedDate: datetime('accepted_date'),                                                     // Дата принятия
  rejectedReason: text('rejected_reason'),                                                      // Причина отклонения
  foremanProfit: decimal('foreman_profit', { precision: 10, scale: 2 }).default('0.00'),         // 8% от profit
  paid: boolean('paid').default(false),                                                         // Оплачена ли работа
  paymentDate: datetime('payment_date').default(sql`CURRENT_TIMESTAMP`),                        // Дата оплаты
  operationDate: datetime('operation_date').default(sql`CURRENT_TIMESTAMP`),                     // Дата создания работы
  objectId: int('object_id').notNull(),                                                        // Ссылка на объект
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),                            // Дата создания записи
  updatedAt: datetime('updated_at') .default(sql`CURRENT_TIMESTAMP`) .notNull() .$type<Date>()
})

// Процент от работ прорабов
export const foremanProfitHistory = mysqlTable('foreman_profit_history', {
  id: serial('id').primaryKey(),
  workId: int('work_id').notNull(),                                                             // Ссылка на работу
  objectId: int('object_id').notNull(),                                                         // Ссылка на объект
  foremanId: int('foreman_id').notNull(),                                                       // Ссылка на прораба
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),                              // Сумма начисления
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`)                              // Дата начисления
});

// Таблица договоренностей
export const agreements = mysqlTable('agreements', {
  id: serial('id').primaryKey(),
  text: text('text').notNull(),
  date: datetime('date').default(sql`CURRENT_TIMESTAMP`),
  status: varchar('status', {
    length: 50,
    enum: ['active', 'completed']
  }).default('active').notNull(),
  masterId: int('master_id'),
  workerId: int('worker_id'),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
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
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime('updated_at') .default(sql`CURRENT_TIMESTAMP`) .notNull() .$type<Date>()
})

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

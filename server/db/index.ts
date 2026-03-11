// server/db/index.ts
import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import * as schema from './schema'
import './relations'

// ✅ Читаем переменные с приоритетом: NUXT_ > DB_ > default
// Это работает и при сборке, и в рантайме, и без загрузки .env
const dbConfig = {
  host: process.env.NUXT_DB_HOST || 'localhost',
  port: Number(process.env.NUXT_DB_PORT) || 3306,
  user: process.env.NUXT_DB_USER,
  password: process.env.NUXT_DB_PASSWORD,
  database: process.env.NUXT_DB_NAME,
}

// Создаем пул соединений
const pool = mysql.createPool({
  host: dbConfig.host,
  port: dbConfig.port,
  user: dbConfig.user,
  password: dbConfig.password,
  database: dbConfig.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 30000,
  idleTimeout: 60000
})

// Устанавливаем часовой пояс сессии на Московское время (UTC+3)
pool.on('connection', (connection) => {
  connection.query("SET time_zone = '+03:00'")
})

// Инициализируем Drizzle ORM
export const db = drizzle(pool, { schema, mode: 'default' })

// Экспортируем все таблицы из схемы для удобного использования
export const {
  users,
  userSessions,
  objects,
  objectContracts,
  objectBudget,
  objectActs,
  objectInvoices,
  materials,
  comings,
  expenses,
  works,
  masters,
  workers,
  foremans,
  offices,
  salaryDeductions,
  pricePages,
  priceCategories,
  priceSubCategories,
  priceItems,
  priceItemDetails,
  priceAdditionalItems,
  portfolioCases,
  portfolioImages,
  portfoCaseWorks,
  // Новые таблицы доски задач
  boards,
  boardsTasks,
  boardsSubtasks,
  boardsTags,
  boardsTasksTags,
  boardsAttachments,
  boardsComments,
  boardsActivityLog
} = schema

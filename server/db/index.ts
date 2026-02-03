// server/db/index.ts
import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import * as schema from './schema'
import './relations'

// Создаем пул соединений
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,       // Максимальное количество соединений
  queueLimit: 0,             // Без ограничения очереди
  connectTimeout: 30000,     // Таймаут получения соединения (30 сек)
  idleTimeout: 60000         // Время простоя перед закрытием (60 сек)
})

// Устанавливаем часовой пояс сессии на Московское время (UTC+3)
pool.on('connection', (connection) => {
  connection.query("SET time_zone = '+03:00'")
})

// Инициализируем Drizzle ORM
export const db = drizzle(pool, { schema, mode: 'default' })

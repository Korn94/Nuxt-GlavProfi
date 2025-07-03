// drizzle.config.ts

import type { Config } from 'drizzle-kit'

export default {
  schema: './server/db/schema.ts',
  out: './migrations',
  dialect: 'mysql',
  dbCredentials: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'nuxt_crm',
  }
} satisfies Config

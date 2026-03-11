// drizzle.config.ts

import type { Config } from 'drizzle-kit'

export default {
  schema: './server/db/schema.ts',
  out: './migrations',
  dialect: 'mysql',
  dbCredentials: {
    host: process.env.NUXT_DB_HOST || process.env.DB_HOST || 'localhost',
    port: Number(process.env.NUXT_DB_PORT || process.env.DB_PORT) || 3306,
    user: process.env.NUXT_DB_USER || process.env.DB_USER,
    password: process.env.NUXT_DB_PASSWORD || process.env.DB_PASSWORD,
    database: process.env.NUXT_DB_NAME || process.env.DB_NAME || 'nuxt_crm',
  }
} satisfies Config

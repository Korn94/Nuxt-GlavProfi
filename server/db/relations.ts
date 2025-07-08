// server/db/relations.ts
import { relations } from 'drizzle-orm'
import {
  users,
  objects,
  materials,
  comings,
  expenses,
  works,
  masters,
  workers,
  foremans,
} from './schema'

export const usersRelations = relations(users, ({ many }) => ({
  masters: many(masters),
  workers: many(workers),
  foremans: many(foremans),
}))

export const objectsRelations = relations(objects, ({ many }) => ({
  materials: many(materials),
  comings: many(comings),
  expenses: many(expenses),
  works: many(works),
}))

export const materialsRelations = relations(materials, ({ one }) => ({
  object: one(objects, {
    fields: [materials.objectId],
    references: [objects.id],
  }),
}))

export const comingsRelations = relations(comings, ({ one }) => ({
  object: one(objects, {
    fields: [comings.objectId],
    references: [objects.id],
  }),
}))

export const expensesRelations = relations(expenses, ({ one }) => ({
  object: one(objects, {
    fields: [expenses.objectId],
    references: [objects.id],
  }),
}))

export const worksRelations = relations(works, ({ one }) => ({
  object: one(objects, {
    fields: [works.objectId],
    references: [objects.id],
  }),
}))

export const foremansRelations = relations(foremans, ({ one }) => ({
  user: one(users, {
    fields: [foremans.userId],
    references: [users.id],
  }),
}))
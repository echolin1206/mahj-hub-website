// JYB Mahjong tables — Postgres (Vercel Postgres / Neon)
import { pgTable, serial, varchar, integer, timestamp } from "drizzle-orm/pg-core";

/** Telegram users who unlocked the full game via Stars payment */
export const entitlements = pgTable("entitlements", {
  id: serial("id").primaryKey(),
  telegramUserId: varchar("telegram_user_id", { length: 64 }).notNull().unique(),
  stars: integer("stars").notNull().default(0),
  payload: varchar("payload", { length: 255 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Entitlement = typeof entitlements.$inferSelect;

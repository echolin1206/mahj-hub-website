// Serverless DB connection — Vercel Postgres (Neon) over HTTP, safe for
// serverless functions (no persistent TCP pool).
import { drizzle } from "drizzle-orm/vercel-postgres";
import { sql } from "@vercel/postgres";
import * as schema from "../db/schema.js";

function createDb() {
  return drizzle(sql, { schema });
}

let instance: ReturnType<typeof createDb> | null = null;

export function getDb() {
  if (!instance) {
    instance = createDb();
  }
  return instance;
}

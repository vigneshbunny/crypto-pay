import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { drizzle as drizzleSQLite } from 'drizzle-orm/better-sqlite3';
import BetterSqlite3 from 'better-sqlite3';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Check if we're using SQLite (local development) or PostgreSQL (production)
const isLocalDevelopment = process.env.DATABASE_URL?.startsWith('file:') || !process.env.DATABASE_URL;

let db: any;
let pool: any = null;

if (isLocalDevelopment) {
  // Use SQLite for local development
  const sqlite = new BetterSqlite3('./dev.db');
  db = drizzleSQLite(sqlite, { schema });
} else {
  // Use PostgreSQL for production
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL must be set. Did you forget to provision a database?",
    );
  }
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
  db = drizzle(pool, { schema });
}

export { db, pool };
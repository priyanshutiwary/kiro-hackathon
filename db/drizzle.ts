import { config } from "dotenv";
import { drizzle } from 'drizzle-orm/neon-http';
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http';

config({ path: ".env" }); // or .env.local

// Lazy initialization to avoid connecting during build time
let _db: NeonHttpDatabase | null = null;

export const db = new Proxy({} as NeonHttpDatabase, {
  get(target, prop) {
    // Initialize db only when first accessed (runtime, not build time)
    if (!_db) {
      if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL is not defined');
      }
      _db = drizzle(process.env.DATABASE_URL);
    }
    return Reflect.get(_db, prop);
  }
});

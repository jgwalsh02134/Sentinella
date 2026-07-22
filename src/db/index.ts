import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

/**
 * node-postgres connects lazily, so constructing the pool without a
 * DATABASE_URL (e.g. during `next build`) is safe — it only fails if a
 * query is actually attempted without configuration.
 */
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export const db = drizzle(pool, { schema });

import "server-only";

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "@/lib/db/schema";

/**
 * Server-only Postgres client.
 *
 * Uses a singleton `pg.Pool` so Next.js dev mode and serverless invocations
 * share connections. The pool is created lazily on first import and never
 * touches the client bundle (`server-only` enforces that at compile time).
 */

declare global {
  var __ultradash_pg_pool__: Pool | undefined;
}

function readDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env.local and set DATABASE_URL.",
    );
  }
  return url;
}

function getPool(): Pool {
  if (!globalThis.__ultradash_pg_pool__) {
    globalThis.__ultradash_pg_pool__ = new Pool({
      connectionString: readDatabaseUrl(),
      max: Number(process.env.DATABASE_POOL_MAX ?? "10"),
    });
  }
  return globalThis.__ultradash_pg_pool__;
}

export const pool = getPool();

export const db = drizzle({ client: pool, schema });

export { schema };

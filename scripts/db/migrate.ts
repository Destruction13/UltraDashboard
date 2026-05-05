/**
 * Apply all pending migrations to the dashboard database.
 *
 * Usage:
 *   npm run db:migrate
 *
 * Reads `DATABASE_URL` from the environment via `dotenv`. Runs synchronously
 * (one connection) so it can be invoked from CI, the Dockerfile entrypoint,
 * or by hand.
 */
import "dotenv/config";

import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to run migrations.");
  }

  const pool = new Pool({ connectionString: databaseUrl, max: 1 });
  const db = drizzle({ client: pool });

  console.log("[db:migrate] applying migrations from ./drizzle");
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("[db:migrate] done");

  await pool.end();
}

main().catch((error) => {
  console.error("[db:migrate] failed:", error);
  process.exitCode = 1;
});

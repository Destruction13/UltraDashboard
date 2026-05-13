import "server-only";

import Database from "better-sqlite3";

/**
 * Read-only SQLite adapter for OmniRoute.
 *
 * OmniRoute owns its own SQLite file on the VPS (`/root/.omniroute/storage.sqlite`),
 * which is mounted read-only into the dashboard container at the path declared in
 * `OMNIROUTE_SQLITE_PATH`. UltraDashboard never writes here — it only reads
 * provider connections, combos, and call logs for the OmniRoute UI pages.
 *
 * The connection is cached on `globalThis` so Next.js dev mode and serverless
 * invocations share a single read-only handle.
 */

declare global {
  var __ultradash_omniroute_db__: Database.Database | undefined;
}

export class OmniRouteUnavailableError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "OmniRouteUnavailableError";
  }
}

function readSqlitePath(): string {
  const path = process.env.OMNIROUTE_SQLITE_PATH;
  if (!path) {
    throw new OmniRouteUnavailableError(
      "OMNIROUTE_SQLITE_PATH is not set. Mount OmniRoute's storage.sqlite into the container and set the env var.",
    );
  }
  return path;
}

export function getOmniRouteDb(): Database.Database {
  if (globalThis.__ultradash_omniroute_db__) {
    return globalThis.__ultradash_omniroute_db__;
  }
  try {
    const db = new Database(readSqlitePath(), {
      readonly: true,
      fileMustExist: true,
    });
    // Hot-read tuning: WAL mode reads piggy-back on OmniRoute's own write process,
    // so we just enable mmap + a roomy cache for the read side.
    db.pragma("query_only = ON");
    db.pragma("mmap_size = 268435456"); // 256 MiB
    db.pragma("cache_size = -65536"); // 64 MiB
    globalThis.__ultradash_omniroute_db__ = db;
    return db;
  } catch (error) {
    throw new OmniRouteUnavailableError(
      `Failed to open OmniRoute SQLite store at ${process.env.OMNIROUTE_SQLITE_PATH}`,
      error,
    );
  }
}

export function tryGetOmniRouteDb(): Database.Database | null {
  try {
    return getOmniRouteDb();
  } catch {
    return null;
  }
}

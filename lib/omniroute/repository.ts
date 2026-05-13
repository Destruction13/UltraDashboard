import "server-only";

import { OmniRouteUnavailableError, tryGetOmniRouteDb } from "@/lib/omniroute/db";
import type {
  OmniRouteHealthStatus,
  OmniRouteLiveRun,
  OmniRouteOverview,
  OmniRouteProvider,
  OmniRouteRoute,
  OmniRouteTopProvider,
  OmniRouteWindow,
} from "@/lib/omniroute/types";

/**
 * Repository that turns OmniRoute's raw SQLite rows into the normalized
 * domain shapes consumed by the dashboard UI and the agent API.
 *
 * Every public function in this file MUST be safe to call when OmniRoute is
 * unavailable — it returns empty results / a degraded overview rather than
 * throwing, so the UI keeps rendering with an inline "OmniRoute offline"
 * banner instead of a 500.
 */

interface ProviderConnectionRow {
  id: string;
  provider: string;
  auth_type: string | null;
  name: string | null;
  email: string | null;
  display_name: string | null;
  priority: number | null;
  is_active: number | null;
  test_status: string | null;
  last_error: string | null;
  last_error_at: string | null;
  rate_limited_until: string | null;
  backoff_level: number | null;
  last_used_at: string | null;
  group: string | null;
  max_concurrent: number | null;
  default_model: string | null;
  created_at: string;
  updated_at: string;
}

interface ComboRow {
  id: string;
  name: string;
  sort_order: number | null;
  system_message: string | null;
  tool_filter_regex: string | null;
  data: string;
  created_at: string;
  updated_at: string;
}

interface CallLogRow {
  id: string;
  timestamp: string;
  method: string | null;
  path: string | null;
  status: number | null;
  model: string | null;
  requested_model: string | null;
  provider: string | null;
  account: string | null;
  connection_id: string | null;
  duration: number | null;
  tokens_in: number | null;
  tokens_out: number | null;
  tokens_cache_read: number | null;
  tokens_cache_creation: number | null;
  tokens_reasoning: number | null;
  source_format: string | null;
  target_format: string | null;
  combo_name: string | null;
  combo_step_id: string | null;
  error_summary: string | null;
}

function deriveHealth(row: ProviderConnectionRow): OmniRouteHealthStatus {
  if (!row.is_active) return "unknown";
  if (row.rate_limited_until && Date.parse(row.rate_limited_until) > Date.now()) {
    return "rate_limited";
  }
  if (row.last_error_at && row.test_status !== "active") {
    return "error";
  }
  if ((row.backoff_level ?? 0) > 0) {
    return "degraded";
  }
  if (row.test_status === "active") return "active";
  return "unknown";
}

function pickDisplayName(row: ProviderConnectionRow): string {
  return row.display_name ?? row.name ?? row.email ?? row.id;
}

function mapProvider(row: ProviderConnectionRow): OmniRouteProvider {
  return {
    id: row.id,
    provider: row.provider,
    authType: row.auth_type,
    displayName: pickDisplayName(row),
    email: row.email,
    priority: row.priority ?? 0,
    isActive: Boolean(row.is_active),
    health: deriveHealth(row),
    lastError: row.last_error,
    lastErrorAt: row.last_error_at,
    rateLimitedUntil: row.rate_limited_until,
    backoffLevel: row.backoff_level ?? 0,
    lastUsedAt: row.last_used_at,
    group: row.group ?? null,
    maxConcurrent: row.max_concurrent ?? null,
    defaultModel: row.default_model,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapRoute(row: ComboRow): OmniRouteRoute {
  let stepCount: number | null = null;
  try {
    const parsed = JSON.parse(row.data) as unknown;
    if (parsed && typeof parsed === "object" && "steps" in parsed) {
      const steps = (parsed as { steps?: unknown }).steps;
      if (Array.isArray(steps)) stepCount = steps.length;
    }
  } catch {
    stepCount = null;
  }
  return {
    id: row.id,
    name: row.name,
    sortOrder: row.sort_order ?? 0,
    systemMessage: row.system_message,
    toolFilterRegex: row.tool_filter_regex,
    stepCount,
    rawData: row.data,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapLiveRun(row: CallLogRow): OmniRouteLiveRun {
  return {
    id: row.id,
    timestamp: row.timestamp,
    method: row.method,
    path: row.path,
    status: row.status,
    model: row.model,
    requestedModel: row.requested_model,
    provider: row.provider,
    account: row.account,
    connectionId: row.connection_id,
    durationMs: row.duration ?? 0,
    tokensIn: row.tokens_in ?? 0,
    tokensOut: row.tokens_out ?? 0,
    tokensCacheRead: row.tokens_cache_read,
    tokensCacheCreation: row.tokens_cache_creation,
    tokensReasoning: row.tokens_reasoning,
    sourceFormat: row.source_format,
    targetFormat: row.target_format,
    comboName: row.combo_name,
    comboStepId: row.combo_step_id,
    errorSummary: row.error_summary,
  };
}

function emptyWindow(hours: number): OmniRouteWindow {
  return {
    hours,
    callCount: 0,
    successCount: 0,
    errorCount: 0,
    successRate: null,
    avgDurationMs: 0,
    tokensIn: 0,
    tokensOut: 0,
    topProviders: [],
  };
}

function buildWindow(hours: number): OmniRouteWindow | null {
  const db = tryGetOmniRouteDb();
  if (!db) return null;
  const since = new Date(Date.now() - hours * 3600 * 1000).toISOString();
  const totals = db
    .prepare<[string], {
      call_count: number;
      success_count: number;
      error_count: number;
      avg_duration: number | null;
      tokens_in: number | null;
      tokens_out: number | null;
    }>(
      `SELECT
         COUNT(*) AS call_count,
         SUM(CASE WHEN status >= 200 AND status < 400 THEN 1 ELSE 0 END) AS success_count,
         SUM(CASE WHEN status >= 400 OR status IS NULL THEN 1 ELSE 0 END) AS error_count,
         AVG(duration) AS avg_duration,
         SUM(tokens_in) AS tokens_in,
         SUM(tokens_out) AS tokens_out
       FROM call_logs
       WHERE timestamp >= ?`,
    )
    .get(since);
  const top = db
    .prepare<[string], {
      provider: string | null;
      call_count: number;
      success_count: number;
      error_count: number;
      avg_duration: number | null;
      tokens_in: number | null;
      tokens_out: number | null;
    }>(
      `SELECT provider,
              COUNT(*) AS call_count,
              SUM(CASE WHEN status >= 200 AND status < 400 THEN 1 ELSE 0 END) AS success_count,
              SUM(CASE WHEN status >= 400 OR status IS NULL THEN 1 ELSE 0 END) AS error_count,
              AVG(duration) AS avg_duration,
              SUM(tokens_in) AS tokens_in,
              SUM(tokens_out) AS tokens_out
       FROM call_logs
       WHERE timestamp >= ? AND provider IS NOT NULL
       GROUP BY provider
       ORDER BY call_count DESC
       LIMIT 5`,
    )
    .all(since);

  if (!totals) return emptyWindow(hours);

  const callCount = totals.call_count ?? 0;
  const successCount = totals.success_count ?? 0;
  const errorCount = totals.error_count ?? 0;
  return {
    hours,
    callCount,
    successCount,
    errorCount,
    successRate: callCount > 0 ? successCount / callCount : null,
    avgDurationMs: Math.round(totals.avg_duration ?? 0),
    tokensIn: totals.tokens_in ?? 0,
    tokensOut: totals.tokens_out ?? 0,
    topProviders: top.map<OmniRouteTopProvider>((row) => ({
      provider: row.provider ?? "unknown",
      callCount: row.call_count,
      successCount: row.success_count,
      errorCount: row.error_count,
      avgDurationMs: Math.round(row.avg_duration ?? 0),
      tokensIn: row.tokens_in ?? 0,
      tokensOut: row.tokens_out ?? 0,
    })),
  };
}

export function getOverview(): OmniRouteOverview {
  const generatedAt = new Date().toISOString();
  const db = tryGetOmniRouteDb();
  if (!db) {
    return {
      generatedAt,
      available: false,
      storagePath: process.env.OMNIROUTE_SQLITE_PATH ?? null,
      providers: {
        total: 0,
        active: 0,
        inactive: 0,
        uniqueProviders: 0,
        rateLimited: 0,
        withErrors: 0,
      },
      routes: { total: 0 },
      windows: { last24h: emptyWindow(24), last7d: emptyWindow(168) },
      recent: { lastCallAt: null, lastSuccessAt: null, lastErrorAt: null },
    };
  }

  const providersRow = db
    .prepare<[], {
      total: number;
      active: number;
      unique_providers: number;
      rate_limited: number;
      with_errors: number;
    }>(
      `SELECT
         COUNT(*) AS total,
         SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) AS active,
         COUNT(DISTINCT provider) AS unique_providers,
         SUM(CASE WHEN rate_limited_until IS NOT NULL AND rate_limited_until > datetime('now')
                  THEN 1 ELSE 0 END) AS rate_limited,
         SUM(CASE WHEN last_error_at IS NOT NULL AND test_status != 'active' THEN 1 ELSE 0 END) AS with_errors
       FROM provider_connections`,
    )
    .get();

  const routesRow = db
    .prepare<[], { total: number }>(`SELECT COUNT(*) AS total FROM combos`)
    .get();

  const recentRow = db
    .prepare<[], {
      last_call_at: string | null;
      last_success_at: string | null;
      last_error_at: string | null;
    }>(
      `SELECT
         MAX(timestamp) AS last_call_at,
         MAX(CASE WHEN status >= 200 AND status < 400 THEN timestamp END) AS last_success_at,
         MAX(CASE WHEN status >= 400 OR status IS NULL THEN timestamp END) AS last_error_at
       FROM call_logs`,
    )
    .get();

  const total = providersRow?.total ?? 0;
  const active = providersRow?.active ?? 0;

  return {
    generatedAt,
    available: true,
    storagePath: process.env.OMNIROUTE_SQLITE_PATH ?? null,
    providers: {
      total,
      active,
      inactive: total - active,
      uniqueProviders: providersRow?.unique_providers ?? 0,
      rateLimited: providersRow?.rate_limited ?? 0,
      withErrors: providersRow?.with_errors ?? 0,
    },
    routes: { total: routesRow?.total ?? 0 },
    windows: {
      last24h: buildWindow(24) ?? emptyWindow(24),
      last7d: buildWindow(168) ?? emptyWindow(168),
    },
    recent: {
      lastCallAt: recentRow?.last_call_at ?? null,
      lastSuccessAt: recentRow?.last_success_at ?? null,
      lastErrorAt: recentRow?.last_error_at ?? null,
    },
  };
}

export interface ListProvidersOptions {
  /** Filter by provider family (codex / openai / …). */
  provider?: string;
  /** Filter by health bucket. */
  health?: OmniRouteHealthStatus;
  /** Filter by enabled flag. */
  isActive?: boolean;
  /** Search by display name / email / id (case-insensitive `LIKE`). */
  q?: string;
  limit?: number;
  offset?: number;
}

export function listProviders(options: ListProvidersOptions = {}): {
  items: OmniRouteProvider[];
  total: number;
} {
  const db = tryGetOmniRouteDb();
  if (!db) return { items: [], total: 0 };

  const limit = Math.max(1, Math.min(options.limit ?? 50, 500));
  const offset = Math.max(0, options.offset ?? 0);
  const wheres: string[] = [];
  const params: (string | number)[] = [];
  if (options.provider) {
    wheres.push("provider = ?");
    params.push(options.provider);
  }
  if (typeof options.isActive === "boolean") {
    wheres.push("is_active = ?");
    params.push(options.isActive ? 1 : 0);
  }
  if (options.q) {
    wheres.push(
      "(LOWER(COALESCE(display_name,'')) LIKE ? OR LOWER(COALESCE(name,'')) LIKE ? OR LOWER(COALESCE(email,'')) LIKE ? OR LOWER(id) LIKE ?)",
    );
    const needle = `%${options.q.toLowerCase()}%`;
    params.push(needle, needle, needle, needle);
  }
  const baseWhereSql = wheres.length > 0 ? `WHERE ${wheres.join(" AND ")}` : "";

  // `health` is derived from several columns and a comparison against "now",
  // so we cannot push it into the base WHERE. Instead, we wrap the base query
  // in a subquery that materializes the computed health bucket, then apply
  // the health predicate on the outer SELECT — both for the page rows AND
  // for the count. This way pagination + totals stay consistent.
  const innerSelect = `
    SELECT
      id, provider, auth_type, name, email, display_name, priority, is_active,
      test_status, last_error, last_error_at, rate_limited_until, backoff_level,
      last_used_at, "group" AS "group", max_concurrent, default_model,
      created_at, updated_at,
      CASE
        WHEN is_active = 0 THEN 'unknown'
        WHEN rate_limited_until IS NOT NULL AND rate_limited_until > ? THEN 'rate_limited'
        WHEN last_error_at IS NOT NULL AND COALESCE(test_status, '') <> 'active' THEN 'error'
        WHEN COALESCE(backoff_level, 0) > 0 THEN 'degraded'
        WHEN test_status = 'active' THEN 'active'
        ELSE 'unknown'
      END AS computed_health
    FROM provider_connections
    ${baseWhereSql}
  `;

  const nowIso = new Date().toISOString();
  const outerWheres: string[] = [];
  const outerParams: (string | number)[] = [];
  if (options.health) {
    outerWheres.push("computed_health = ?");
    outerParams.push(options.health);
  }
  const outerWhereSql = outerWheres.length > 0 ? `WHERE ${outerWheres.join(" AND ")}` : "";

  const totalRow = db
    .prepare<(string | number)[], { total: number }>(
      `SELECT COUNT(*) AS total FROM (${innerSelect}) ${outerWhereSql}`,
    )
    .get(nowIso, ...params, ...outerParams);

  const rows = db
    .prepare<(string | number)[], ProviderConnectionRow>(
      `SELECT id, provider, auth_type, name, email, display_name, priority, is_active,
              test_status, last_error, last_error_at, rate_limited_until, backoff_level,
              last_used_at, "group", max_concurrent, default_model, created_at, updated_at
         FROM (${innerSelect})
         ${outerWhereSql}
         ORDER BY is_active DESC, priority DESC, COALESCE(last_used_at,'') DESC
         LIMIT ? OFFSET ?`,
    )
    .all(nowIso, ...params, ...outerParams, limit, offset);

  return {
    items: rows.map(mapProvider),
    total: totalRow?.total ?? rows.length,
  };
}

export interface ListRoutesOptions {
  q?: string;
  limit?: number;
  offset?: number;
}

export function listRoutes(options: ListRoutesOptions = {}): {
  items: OmniRouteRoute[];
  total: number;
} {
  const db = tryGetOmniRouteDb();
  if (!db) return { items: [], total: 0 };

  const limit = Math.max(1, Math.min(options.limit ?? 50, 500));
  const offset = Math.max(0, options.offset ?? 0);

  let whereSql = "";
  const params: (string | number)[] = [];
  if (options.q) {
    whereSql = `WHERE LOWER(name) LIKE ?`;
    params.push(`%${options.q.toLowerCase()}%`);
  }

  const totalRow = db
    .prepare<typeof params, { total: number }>(
      `SELECT COUNT(*) AS total FROM combos ${whereSql}`,
    )
    .get(...params);

  const rows = db
    .prepare<typeof params, ComboRow>(
      `SELECT id, name, sort_order, system_message, tool_filter_regex, data, created_at, updated_at
         FROM combos
         ${whereSql}
         ORDER BY sort_order ASC, name ASC
         LIMIT ? OFFSET ?`,
    )
    .all(...params, limit, offset);

  return { items: rows.map(mapRoute), total: totalRow?.total ?? rows.length };
}

export interface ListLiveRunsOptions {
  provider?: string;
  /** ISO timestamp lower bound (inclusive). */
  since?: string;
  /** Match by HTTP status range — "2xx" / "4xx" / "5xx" or a specific number. */
  statusFilter?: "2xx" | "4xx" | "5xx" | number;
  /** Match by free-form path substring. */
  pathContains?: string;
  /** Free-form search across model / account / combo name. */
  q?: string;
  /** Only failing rows (status >= 400 or null). */
  errorsOnly?: boolean;
  limit?: number;
  offset?: number;
}

export function listLiveRuns(options: ListLiveRunsOptions = {}): {
  items: OmniRouteLiveRun[];
  total: number;
} {
  const db = tryGetOmniRouteDb();
  if (!db) return { items: [], total: 0 };

  const limit = Math.max(1, Math.min(options.limit ?? 25, 500));
  const offset = Math.max(0, options.offset ?? 0);
  const wheres: string[] = [];
  const params: (string | number)[] = [];

  if (options.provider) {
    wheres.push("provider = ?");
    params.push(options.provider);
  }
  if (options.since) {
    wheres.push("timestamp >= ?");
    params.push(options.since);
  }
  if (typeof options.statusFilter === "number") {
    wheres.push("status = ?");
    params.push(options.statusFilter);
  } else if (options.statusFilter === "2xx") {
    wheres.push("status >= 200 AND status < 300");
  } else if (options.statusFilter === "4xx") {
    wheres.push("status >= 400 AND status < 500");
  } else if (options.statusFilter === "5xx") {
    wheres.push("status >= 500 AND status < 600");
  }
  if (options.errorsOnly) {
    wheres.push("(status IS NULL OR status >= 400)");
  }
  if (options.pathContains) {
    wheres.push("LOWER(COALESCE(path,'')) LIKE ?");
    params.push(`%${options.pathContains.toLowerCase()}%`);
  }
  if (options.q) {
    wheres.push(
      "(LOWER(COALESCE(model,'')) LIKE ? OR LOWER(COALESCE(account,'')) LIKE ? OR LOWER(COALESCE(combo_name,'')) LIKE ?)",
    );
    const needle = `%${options.q.toLowerCase()}%`;
    params.push(needle, needle, needle);
  }
  const whereSql = wheres.length > 0 ? `WHERE ${wheres.join(" AND ")}` : "";

  const totalRow = db
    .prepare<typeof params, { total: number }>(
      `SELECT COUNT(*) AS total FROM call_logs ${whereSql}`,
    )
    .get(...params);

  const rows = db
    .prepare<typeof params, CallLogRow>(
      `SELECT id, timestamp, method, path, status, model, requested_model, provider, account,
              connection_id, duration, tokens_in, tokens_out, tokens_cache_read,
              tokens_cache_creation, tokens_reasoning, source_format, target_format,
              combo_name, combo_step_id, error_summary
         FROM call_logs
         ${whereSql}
         ORDER BY timestamp DESC
         LIMIT ? OFFSET ?`,
    )
    .all(...params, limit, offset);

  return { items: rows.map(mapLiveRun), total: totalRow?.total ?? rows.length };
}

export function getProviderById(id: string): OmniRouteProvider | null {
  const db = tryGetOmniRouteDb();
  if (!db) return null;
  const row = db
    .prepare<[string], ProviderConnectionRow>(
      `SELECT id, provider, auth_type, name, email, display_name, priority, is_active,
              test_status, last_error, last_error_at, rate_limited_until, backoff_level,
              last_used_at, "group" AS "group", max_concurrent, default_model, created_at, updated_at
         FROM provider_connections
         WHERE id = ?`,
    )
    .get(id);
  return row ? mapProvider(row) : null;
}

export function checkOmniRouteAvailable(): { available: boolean; error?: string } {
  try {
    const db = tryGetOmniRouteDb();
    if (!db) return { available: false, error: "OmniRoute SQLite is not configured." };
    db.prepare("SELECT 1").get();
    return { available: true };
  } catch (error) {
    if (error instanceof OmniRouteUnavailableError) {
      return { available: false, error: error.message };
    }
    return { available: false, error: error instanceof Error ? error.message : String(error) };
  }
}

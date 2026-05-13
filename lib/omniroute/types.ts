import "server-only";

/**
 * Domain types for the OmniRoute read-only mirror.
 *
 * These are the shapes UltraDashboard renders / exposes via the internal API.
 * They are normalized views over OmniRoute's `storage.sqlite` tables — never
 * the raw row shape, so OmniRoute can evolve its schema without breaking the
 * dashboard contract.
 */

export type OmniRouteHealthStatus = "active" | "degraded" | "rate_limited" | "error" | "unknown";

export interface OmniRouteProvider {
  /** OmniRoute connection id (uuid). */
  id: string;
  /** Provider family (e.g. "codex", "openai", "anthropic"). */
  provider: string;
  /** Auth mode (oauth / api_key / etc.). May be null in older rows. */
  authType: string | null;
  /** Operator-supplied display name; falls back to `name`/`email`. */
  displayName: string;
  /** Account email associated with the provider connection, if any. */
  email: string | null;
  /** Numerical priority — higher = preferred by the router. */
  priority: number;
  /** Whether the connection is enabled. */
  isActive: boolean;
  /** Normalized health status, derived from `test_status` + rate-limit columns. */
  health: OmniRouteHealthStatus;
  /** Last error description, if any. */
  lastError: string | null;
  /** ISO timestamp of the last error. */
  lastErrorAt: string | null;
  /** ISO timestamp until which the connection is rate-limited (if any). */
  rateLimitedUntil: string | null;
  /** Backoff level (router-driven exponential). */
  backoffLevel: number;
  /** Last time the connection served a request. */
  lastUsedAt: string | null;
  /** Logical group / tier (operator-defined). */
  group: string | null;
  /** Cap on concurrent requests through this connection (null = unbounded). */
  maxConcurrent: number | null;
  /** Default model OmniRoute picks for this connection, if pinned. */
  defaultModel: string | null;
  /** ISO timestamp of creation. */
  createdAt: string;
  /** ISO timestamp of last update. */
  updatedAt: string;
}

export interface OmniRouteRoute {
  /** Combo id. */
  id: string;
  /** Operator-defined combo name. */
  name: string;
  /** Order key — lower sorts first in the router. */
  sortOrder: number;
  /** Free-form system message attached to this combo. */
  systemMessage: string | null;
  /** Regex used to filter tool calls before serving. */
  toolFilterRegex: string | null;
  /** Number of steps inside the combo's `data` JSON, when parseable. */
  stepCount: number | null;
  /** Raw combo `data` JSON string, returned unparsed. */
  rawData: string;
  /** ISO timestamps. */
  createdAt: string;
  updatedAt: string;
}

export interface OmniRouteLiveRun {
  /** Call log id (uuid). */
  id: string;
  /** ISO timestamp of when the request was logged. */
  timestamp: string;
  /** HTTP method, e.g. "POST". */
  method: string | null;
  /** Request path, e.g. "/v1/responses". */
  path: string | null;
  /** Upstream HTTP status. */
  status: number | null;
  /** Effective model used. */
  model: string | null;
  /** Model the client requested before any rewriting. */
  requestedModel: string | null;
  /** Provider family. */
  provider: string | null;
  /** Account label (already masked by OmniRoute). */
  account: string | null;
  /** Underlying connection id. */
  connectionId: string | null;
  /** Total duration in ms. */
  durationMs: number;
  /** Token counts. */
  tokensIn: number;
  tokensOut: number;
  tokensCacheRead: number | null;
  tokensCacheCreation: number | null;
  tokensReasoning: number | null;
  /** Source / target wire formats (e.g. openai → anthropic). */
  sourceFormat: string | null;
  targetFormat: string | null;
  /** Combo metadata, if the run was part of a combo. */
  comboName: string | null;
  comboStepId: string | null;
  /** Operator-friendly error summary. */
  errorSummary: string | null;
}

export interface OmniRouteTopProvider {
  provider: string;
  callCount: number;
  successCount: number;
  errorCount: number;
  avgDurationMs: number;
  tokensIn: number;
  tokensOut: number;
}

export interface OmniRouteWindow {
  /** Window length in hours (24, 168, …). Useful to label charts. */
  hours: number;
  callCount: number;
  successCount: number;
  errorCount: number;
  /** Decimal success ratio, 0..1. `null` when callCount == 0. */
  successRate: number | null;
  avgDurationMs: number;
  tokensIn: number;
  tokensOut: number;
  topProviders: OmniRouteTopProvider[];
}

export interface OmniRouteOverview {
  /** ISO timestamp the snapshot was generated. */
  generatedAt: string;
  /** Whether the underlying SQLite was reachable. */
  available: boolean;
  /** Path the dashboard tried to open (for diagnostics). */
  storagePath: string | null;
  /** Provider connections summary. */
  providers: {
    total: number;
    active: number;
    inactive: number;
    uniqueProviders: number;
    rateLimited: number;
    withErrors: number;
  };
  /** Combos summary. */
  routes: {
    total: number;
  };
  /** Rolling traffic windows. */
  windows: {
    last24h: OmniRouteWindow;
    last7d: OmniRouteWindow;
  };
  /** Most recent call timestamps & counts so the UI can show "live" pulses. */
  recent: {
    lastCallAt: string | null;
    lastSuccessAt: string | null;
    lastErrorAt: string | null;
  };
}

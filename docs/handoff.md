# UltraDashboard V1 handoff

This is the short-form orientation for the next contributor (human or agent).
For implementation status, see [implementation-tracker.md](implementation-tracker.md).
For ops, see [runbook-vps.md](runbook-vps.md). For API contracts, see
[agent-integration.md](agent-integration.md).

## What UltraDashboard is

A private control panel for two things:

1. **AccountManager** — typed storage for `root accounts → linked service
   accounts` across the `GitHub`, `Google`, and `Zoho` families. Notes,
   instruction documents, tags, TOTP rendering, archive flags. Backed by
   Postgres; secrets resolved live through a Vaultwarden `bw serve` bridge.
2. **OmniRoute mirror** — a read-only view of the OmniRoute proxy's
   `storage.sqlite`. The dashboard never writes to OmniRoute; it just renders
   providers, routes, and recent call logs.

Both surfaces are unioned by a JSON API at `/api/internal/*` so external
agents can drive the dashboard without UI scraping.

## Architecture at a glance

```
Browser (SSH-tunneled)
  └─ Next.js App Router (app/)
       ├─ /overview            — landing KPIs + family roll-up
       ├─ /omniroute/*         — OmniRoute mirror (Overview/Providers/Routes/Live-runs)
       ├─ /account-manager/*   — family tabs, root accounts, linked services
       └─ /api/internal/*      — agent API (accounts, omniroute, import/export)
            └─ lib/account-manager/repository.ts   ← Postgres (Drizzle)
            └─ lib/omniroute/repository.ts         ← SQLite snapshot (better-sqlite3 readonly)
            └─ lib/vaultwarden/client.ts           ← bw serve bridge
```

Key constraints:

- The dashboard is **read-only against OmniRoute**. The container can't even
  reach OmniRoute's live directory — only the host-produced snapshot.
- The dashboard is **read/write against Postgres** and **read-only against
  Vaultwarden** (no items are created via the bridge yet; only resolved).
- The dashboard binds **only to `127.0.0.1`** on the VPS. The perimeter is the
  SSH tunnel.

## Repository layout

```
app/                     # Next.js App Router pages + API routes
components/              # UI primitives (shadcn + custom shell)
lib/
  account-manager/       # Repository, families catalog, Vaultwarden bridge
  omniroute/             # SQLite adapter, repository, types, formatters
  db/                    # Drizzle schema + migration helpers
  vaultwarden/           # bw serve client
docs/                    # This folder
drizzle/                 # Generated SQL migrations
scripts/deploy/          # VPS bootstrap, snapshot, bw relay
```

## Local development

```bash
cp .env.example .env       # fill in DATABASE_URL, OMNIROUTE_SQLITE_PATH, BW_SERVE_URL
npm install
npm run db:push            # apply migrations to local Postgres
npm run db:seed            # seed families + linked-service catalog
npm run dev                # http://localhost:3000
```

If you don't have OmniRoute locally, the dashboard degrades gracefully — the
`/omniroute` pages render an offline banner and the `/api/internal/omniroute/*`
endpoints return empty lists (or `503` for `/overview`).

## Common tasks

- **Adding a new linked-service catalog entry**: edit `lib/db/catalog.ts`,
  bump `LINKED_SERVICE_CATALOG`, then run `npm run db:seed`. The new entry will
  show up in family tabs automatically.
- **Adding a new OmniRoute column to the UI**: types live in
  `lib/omniroute/types.ts`. Add the field there, then plumb it through
  `lib/omniroute/repository.ts`. The page-level components are intentionally
  thin; they just iterate over the repository result.
- **Wiring a new agent endpoint**: drop it under `app/api/internal/*/route.ts`.
  Validate query params with Zod (the existing endpoints all do this), and
  return `503` when the underlying store is unreachable so agents can retry.
- **Bumping the snapshot cadence**: edit `scripts/deploy/install_omniroute_snapshot_timer.sh`
  (the `OnUnitActiveSec=` line) and re-run the script on the VPS.

## What's intentionally deferred

- Hourly Postgres mirror of OmniRoute summaries (raw snapshot reads are
  <50 ms, no signal yet).
- OAuth importers (the spec moved to API-first import via
  `POST /api/internal/import` instead).
- Multi-user auth (perimeter-trust through SSH covers the only operator).
- Public-facing TLS / domain (would defeat the SSH-tunnel posture without
  adding value while there's a single operator).

If any of these become real, the codebase has the structure for them:
add a sync job → enqueue from a route handler → write to a new Postgres
table. Add an auth layer → wrap `app/layout.tsx` with a server-side session
check.

## How to be quickly productive

1. Run the local dev loop above.
2. Read `lib/omniroute/repository.ts` end-to-end — it's the densest file and
   demonstrates the "graceful degradation" pattern used everywhere.
3. Read `lib/account-manager/repository.ts` `getRootAccountDetail` — it's the
   one function that touches Postgres + Vaultwarden + the linked-service
   catalog at once.
4. Open `/overview`, `/omniroute`, `/account-manager/github` against the live
   VPS through the SSH tunnel to see what the user actually sees.
5. Update `docs/implementation-tracker.md` whenever you finish a slice.

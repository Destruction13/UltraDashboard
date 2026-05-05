# UltraDashboard

Private internal dashboard for OmniRoute and AccountManager. Runs alongside
OmniRoute on the same VPS and is reachable only through the agreed tunnel or
private perimeter path. **V1 is perimeter-trusted; do not expose it to the
public internet.**

## Documentation

The product docs are the source of truth — read them before changing scope.

- [`docs/ultradashboard-spec.md`](docs/ultradashboard-spec.md) — full V1
  product and technical spec
- [`docs/ultradashboard-master-prompt.md`](docs/ultradashboard-master-prompt.md) —
  main implementation prompt for the coding agent
- [`docs/ultradashboard-bootstrap-prompt.md`](docs/ultradashboard-bootstrap-prompt.md) —
  short prompt to paste into a fresh agent session
- [`docs/implementation-tracker.md`](docs/implementation-tracker.md) — live
  progress tracker and handoff log
- [`docs/ultradashboard-preliminary-architecture.md`](docs/ultradashboard-preliminary-architecture.md) —
  earlier architecture draft and validated discovery notes

## Stack

- `Next.js` 15 with the App Router and TypeScript
- `Tailwind CSS` v3 with shadcn/ui-compatible primitives
- `next-themes` for dark / light theme support
- Bilingual shell (Russian / English) via a custom locale provider
- Postgres for the dashboard-owned database (added in Phase 1)
- Read-only SQLite adapter against OmniRoute's `storage.sqlite` (added in
  Phase 5)

## Local development

```bash
# 1. Install dependencies
npm install

# 2. Copy and edit environment variables
cp .env.example .env.local

# 3. Start the dev server
npm run dev
# -> http://localhost:3000  (redirects to /overview)
```

### Useful scripts

| Script             | What it does                                          |
| ------------------ | ----------------------------------------------------- |
| `npm run dev`      | Start the Next.js dev server.                         |
| `npm run build`    | Build the production bundle (`standalone` output).    |
| `npm run start`    | Start the production server.                          |
| `npm run lint`     | Run `next lint`.                                      |
| `npm run typecheck`| Run `tsc --noEmit`.                                   |
| `npm run format`   | Run Prettier on the repo.                             |

## Deployment skeleton

V1 deploys as a small `Docker Compose` stack on the same VPS as OmniRoute.

```bash
docker compose up -d --build
```

The compose file mounts OmniRoute's local SQLite store **read-only** so the
adapter cannot write into it. See [`docker-compose.yml`](docker-compose.yml)
for the exact mount path and environment overrides.

## Status

Phase 0 (foundation) is in progress. Live status lives in
[`docs/implementation-tracker.md`](docs/implementation-tracker.md).

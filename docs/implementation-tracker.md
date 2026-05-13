# UltraDashboard implementation tracker

This file is the live status board for UltraDashboard V1. Every coding session
must update it so another Devin or ClaudeCode run can continue work without
reconstructing context from scratch.

## Status legend

Use the markers below consistently.

- `[ ]` not started
- `[~]` in progress or partially complete
- `[x]` complete and verified
- `[!]` blocked

## Current strategy

The tracker follows the approved V1 spec. The current implementation strategy
is to build UltraDashboard as a separate `Next.js` app with `TypeScript`,
`shadcn/ui`, and Postgres, while reading OmniRoute through a read-only adapter
against its local `storage.sqlite` and resolving live secrets through a
localhost-only Vaultwarden `bw serve` bridge.

## Phase checklist

Use this checklist as the canonical implementation sequence unless a real
blocker forces a temporary deviation.

### Phase 0: foundation

This phase prepares the repo for feature work.

- [x] Initialize the `Next.js` App Router project with TypeScript.
- [x] Add the core dependency stack and project scripts.
- [x] Add `shadcn/ui`, theme support, and a bilingual shell scaffold.
- [x] Add `.env.example`, deployment skeleton files, and `Docker Compose`.

### Phase 1: data layer

This phase creates the dashboard-owned persistence model.

- [x] Add Postgres connectivity.
- [x] Create migrations for all core UltraDashboard tables.
- [x] Seed the `GitHub`, `Google`, and `Zoho` service families.
- [x] Seed the first-wave linked service catalog: `ChatGPT`, `Codex`,
  `GitHub`, and `Devin`.

### Phase 2: shell and navigation

This phase builds the product frame.

- [x] Build the `Overview`, `OmniRoute`, and `AccountManager` route skeletons.
- [x] Build the top navigation and layout system.
- [x] Implement dark and light themes.
- [x] Add premium visual direction and shared UI primitives.

### Phase 3: AccountManager core

This phase makes account operations usable.

- [x] Build family tabs for `GitHub`, `Google`, and `Zoho`.
- [x] Build root account list views.
- [x] Build root account detail views.
- [x] Build linked service account CRUD flows.
- [x] Add search and tag filtering.

### Phase 4: secrets and instructions

This phase creates the main operational workflow.

- [x] Implement server-side TOTP generation.
- [x] Build the left credential panel with visible secrets and copy actions.
- [x] Build the right roadmap renderer.
- [x] Add editing flows for notes and instruction content.

### Phase 5: OmniRoute integration

This phase connects the app to real OmniRoute data.

- [x] Implement the read-only SQLite adapter (`lib/omniroute/db.ts`,
  `lib/omniroute/repository.ts`).
- [x] Implement OmniRoute snapshot refresh on the host
  (`scripts/deploy/omniroute_snapshot.sh` + `omniroute-snapshot.timer`,
  every 60 s). Required because OmniRoute's live `storage.sqlite` uses WAL
  journaling and would need a writable directory inside the container.
- [~] Persist normalized provider summaries to Postgres. _Deferred — reads
  against the snapshot are already sub-50 ms; revisit if traffic grows._
- [x] Add sync failure handling that preserves the last good snapshot
  (degraded reads return empty lists + `OmniRouteOfflineBanner`; the
  `VACUUM INTO` -> atomic `mv` pattern guarantees readers never see a
  half-written snapshot).

### Phase 6: overview and OmniRoute UI

This phase turns synced data into usable product surfaces.

- [x] Build the OmniRoute page with provider summary UI (`/omniroute`).
- [x] Build dedicated Providers / Routes / Live runs pages
  (`/omniroute/providers`, `/omniroute/routes`, `/omniroute/live-runs`).
- [~] Build Overview summary cards and orientation content on `/overview`.
  _Existing `/overview` still uses placeholder KPIs; new Phase 5 data is
  exposed inside `/omniroute` instead. Roll up into `/overview` later._
- [x] Add manual refresh flows where required by the spec (search/filter
  forms perform a fresh server-render on submit; no client cache to bust).

### Phase 7: internal API for agents

This phase makes the dashboard automatable.

- [x] Add services and accounts listing endpoints.
- [x] Add full account card and TOTP endpoints.
- [x] Add notes and instructions update endpoints.
- [x] Add OmniRoute summary, providers, routes, and live-runs endpoints
  (`/api/internal/omniroute/{overview,providers,routes,live-runs}`).

### Phase 8: polish and release readiness

This phase closes the loop before handoff or release.

- [ ] Tighten empty states, loading states, and error states.
- [ ] Run the most relevant verification for each finished slice.
- [ ] Write deployment and VPS runbook docs.
- [ ] Leave a final implementation and handoff summary.

## Open blockers

List real blockers here. Remove or update them when they are resolved.

- None yet.

## Next recommended task

The next recommended task is **Vaultwarden-backed AccountManager persistence**.
The app now has a working synthetic root-account flow, live item detail cards,
copy actions, roadmap rendering, and internal API reads through `bw serve`.
The next slice should replace the synthetic bridge-only listing with real
dashboard-owned `root_accounts` and `linked_service_accounts` records that
store `vault_item_id`, plus finish tag filtering and editing flows.

## Session log

Append one entry per work session. Keep entries concise but specific enough for
the next agent to continue work immediately.

### Session template

Use this template for new entries.

```text
Date:
Owner:
Focus:
Files changed:
Verification:
Status changes in tracker:
Open issues or risks:
Next recommended task:
```

### Session history

#### May 5, 2026

Date: May 5, 2026
Owner: Codex
Focus: Discovery, architecture, spec, and handoff package.
Files changed:
- `docs/ultradashboard-preliminary-architecture.md`
- `docs/ultradashboard-spec.md`
- `docs/ultradashboard-master-prompt.md`
- `docs/ultradashboard-bootstrap-prompt.md`
- `docs/implementation-tracker.md`
Verification:
- Reviewed the generated docs for scope alignment and cross-file consistency.
- Validated OmniRoute integration assumptions against the live OmniRoute VPS.
Status changes in tracker:
- Tracker created.
- No implementation phase items started yet.
Open issues or risks:
- V1 intentionally uses a high-risk secret storage posture because the product
  is perimeter-trusted and private.
- OmniRoute management HTTP APIs are gated, so the default plan is the
  read-only SQLite adapter path.
Next recommended task:
- Start Phase 0 by initializing the `Next.js` App Router project with
  TypeScript.

#### May 5, 2026 (Phase 0 foundation)

Date: May 5, 2026
Owner: Devin (Claude)
Focus: Phase 0 — foundation scaffolding for UltraDashboard V1.
Files changed:
- `package.json`, `tsconfig.json`, `next.config.mjs`, `next-env.d.ts`
- `postcss.config.mjs`, `tailwind.config.ts`, `components.json`
- `.eslintrc.json`, `.prettierrc.json`, `.gitignore`, `.dockerignore`
- `.env.example`, `Dockerfile`, `docker-compose.yml`
- `app/globals.css`, `app/layout.tsx`, `app/page.tsx`, `app/not-found.tsx`
- `app/overview/page.tsx`, `app/omniroute/page.tsx`
- `app/account-manager/{page,layout}.tsx`,
  `app/account-manager/[family]/page.tsx`
- `components/providers/{theme,locale}-provider.tsx`
- `components/shell/{top-nav,theme-toggle,locale-toggle,glass-panel,shader-background}.tsx`
- `components/ui/{button,dropdown-menu}.tsx`
- `lib/cn.ts`, `lib/i18n/{locales,dictionaries,cookie,cookie-client}.ts`
- `public/favicon.svg`, `README.md`
Verification:
- `npm install` — clean install, no peer-dependency conflicts.
- `npm run typecheck` — passes (`tsc --noEmit`).
- `npm run lint` — passes (`next lint`, no warnings or errors).
- `npm run build` — production build succeeds with `output: "standalone"`;
  all 10 routes generated, including `/account-manager/[family]` for
  `github`, `google`, and `zoho` via `generateStaticParams`.
Status changes in tracker:
- Phase 0 fully marked `[x]`.
- Next recommended task pointer moved from Phase 0 to Phase 1.
Open issues or risks:
- Magic MCP / 21st.dev integration is not installed in the org marketplace.
  Premium components are currently hand-built using shadcn primitives plus
  a CSS-only shader-backed atmosphere (`components/shell/shader-background.tsx`).
  When the user provisions a 21st.dev / Magic MCP API key, future Phase 2
  work can pull richer premium blocks; the existing primitives are designed
  to be drop-in replaceable.
- DB libraries (Postgres client, Drizzle ORM) intentionally not added in
  Phase 0 to keep the dependency surface minimal — they belong to Phase 1.
- Inter / JetBrains Mono fonts are loaded via `next/font/google`; the build
  attempts to fetch them at compile time, which means the build host needs
  network access to Google Fonts. If a future build environment is offline,
  swap to `next/font/local` with bundled font files.
Next recommended task:
- Start Phase 1 by adding Postgres connectivity (Drizzle ORM + `pg`),
  creating the migrations folder, and wiring up `DATABASE_URL` in a
  server-only DB client. Then move on to migrations for the core entities
  defined in `docs/ultradashboard-spec.md` (`service_families`,
  `root_accounts`, `linked_service_accounts`, `tags`,
  `linked_service_account_tags`, `instruction_documents`,
  `omniroute_provider_snapshots`, `omniroute_sync_runs`).

#### May 5, 2026 (Phase 1 data layer)

Date: May 5, 2026
Owner: Devin (Claude)
Focus: Phase 1 — Postgres connectivity, schema migrations, and seed data.
Files changed:
- `package.json` (add `drizzle-orm`, `pg`, `@types/pg`, `drizzle-kit`,
  `dotenv`, `tsx` and `db:generate / db:migrate / db:seed / db:studio`
  scripts)
- `drizzle.config.ts` (snake_case casing, schema/output paths)
- `lib/db/schema.ts` (full V1 schema for the 8 spec entities)
- `lib/db/index.ts` (server-only `pg.Pool` singleton + Drizzle client)
- `lib/db/catalog.ts` (typed first-wave linked service catalog +
  `InstructionDocumentContent` content shape from the spec)
- `scripts/db/migrate.ts` (CLI migration runner)
- `scripts/db/seed.ts` (idempotent seed for families + starter tags +
  catalog logging)
- `drizzle/0000_0001_initial_schema.sql` and `drizzle/meta/*` (generated)
- `docs/implementation-tracker.md` (status updates + this entry)
Verification:
- `npx drizzle-kit generate` — produced one migration covering all 8 tables
  with PKs, FKs, and indexes.
- Spun up `postgres:16-alpine` on port 5433 in Docker.
- `npm run db:migrate` — applied the migration cleanly.
- `npm run db:seed` — inserted 3 families and 6 starter tags. Re-running
  the seed kept the row counts stable (idempotency confirmed via
  `SELECT count(*)`).
- Confirmed the 8 tables exist via `\dt` and inspected `service_families`
  + `tags` rows.
- `npm run typecheck`, `npm run lint`, `npm run build` — all green.
- Tore down the test container after verification.
Status changes in tracker:
- All 4 Phase 1 items flipped to `[x]`.
- "Next recommended task" pointer advanced to Phase 2.
Open issues or risks:
- Secrets stored in plain form in `linked_service_accounts.password_plaintext`
  and `linked_service_accounts.totp_secret_plaintext` per the spec's accepted
  V1 trust posture. Encryption at rest is explicitly deferred. Server code
  must keep these columns out of logs.
- The first-wave linked service catalog is exported from `lib/db/catalog.ts`
  as a typed reference shape; it is intentionally NOT pre-seeded as rows in
  `linked_service_accounts` because every linked service must be bound to a
  real `root_account` (created during Phase 3 AccountManager flows).
- Drizzle's `next/font/google` build still needs network access to Google
  Fonts — this remains the same risk noted in the Phase 0 entry.
Next recommended task:
- Start Phase 2 by deepening the premium visual treatment of the existing
  shell: richer glass / shader compositions on `/overview` and
  `/omniroute`, shared layout primitives for upcoming AccountManager
  pages, and polished empty / loading states. Phase 3 (AccountManager
  CRUD) can begin in parallel against the now-live schema.

#### May 5, 2026 (Phase 2 shell + primitives)

Date: May 5, 2026
Owner: Devin (Claude)
Focus: Phase 2 — premium visual deepening + shared layout primitives.
Files changed:
- `app/globals.css` (animated `aurora-drift`, `aurora-seam`, `shimmer-bar`,
  `glass-panel--rail`, scrollbar utility, tag color tokens, `prefers-reduced-motion`
  guards)
- `components/shell/shader-background.tsx` (4-layer aurora with slow drift,
  reduced-motion aware)
- `components/shell/top-nav.tsx` (active-state ring + relative wrapping for
  the aurora seam under the sticky nav)
- `components/shell/{page-shell,section-header,kpi-tile,empty-state,tab-bar,two-column-detail,phase-tag}.tsx`
  (new shared primitives)
- `components/ui/{badge,skeleton,card}.tsx` (new shadcn-compatible primitives)
- `lib/i18n/dictionaries.ts` (new shell strings: pending-state copy,
  perimeter-trust badge text)
- `app/overview/page.tsx`, `app/omniroute/page.tsx` (refactored to use
  `<PageShell>` + `<KpiTile>` + `<EmptyState>` + `<PhaseTag>`)
- `app/account-manager/layout.tsx` (uses `<TabBar>` for animated family tabs
  with active background and bottom seam)
- `app/account-manager/[family]/page.tsx` (rebuilt with sticky tags rail,
  search input scaffold, row skeletons, and a dedicated `<EmptyState>`)
Verification:
- `npm run typecheck` — clean.
- `npm run lint` — clean.
- `npm run build` — production build succeeds; same 10 routes; first-load JS
  unchanged for static routes; `/overview` slightly larger (164 B → still
  <110 kB total) due to the new icons and `<KpiTile>` skeletons.
Status changes in tracker:
- All 4 Phase 2 items flipped to `[x]`.
- "Next recommended task" pointer advanced from Phase 2 to Phase 3.
Open issues or risks:
- The shader is still pure CSS. When a real WebGL shader (or Magic MCP /
  21st.dev block) is provisioned, swap the body of
  `components/shell/shader-background.tsx` — every layout primitive sits on
  top of it without any other hookup.
- The disabled `<input type="search">` and disabled "Create root account"
  button on the family page are deliberately non-functional placeholders
  for Phase 3 — they exist so the layout doesn't shift when the live
  controls land.
- `<TabBar>` accepts `href: string` and casts to `Route` at the `<Link>`
  call site. Next.js typed routes do not narrow dynamic-segment routes
  like `/account-manager/[family]` to a literal `Route` union, so the cast
  is intentional. Consumers must still pass real route strings.
Next recommended task:
- Start Phase 3 by replacing the family-page placeholders with real data
  from Phase 1: read `service_families` + `root_accounts` (server
  component), render with `<RowSkeleton>` removed and a real list, then
  build the linked-service detail card using `<TwoColumnDetail>` (left =
  credentials, right = `instruction_documents.content_json` rendered into
  the Phase 4 roadmap blocks).

#### May 5, 2026 (Phase 2.1 design rework with 21st.dev / Magic MCP)

Date: May 5, 2026
Owner: Devin (Claude)
Focus: Phase 2.1 — premium design rework using real 21st.dev / Magic MCP
inspiration blocks (per user feedback: hand-rolled shadcn glass scored 2/10).
Files changed:
- `package.json` (added `three`, `framer-motion`, `@types/three`)
- `components/shell/shader-canvas.tsx` (new — WebGL aurora shader, adapted
  from 21st.dev "Animated Shader Background"; tuned for dashboard with
  slower drift, lower amplitude, theme-token-driven palette,
  `prefers-reduced-motion` and visibility-pause guards)
- `components/shell/glow-card.tsx` (new — mouse-tracking gradient halo +
  hover scale, adapted from 21st.dev "Animated Card")
- `components/shell/stat-card.tsx` (new — moving halo + rotating ray +
  text-shadow pulse on the value, adapted from 21st.dev "Stat Card")
- `components/shell/sliding-tabs.tsx` (new — animated indicator with
  framer-motion spring + glow blur layer; adapted from 21st.dev
  "Sliding Tabs", driven by `usePathname()` and Next.js `<Link>`)
- `components/shell/animated-button.tsx` (new — motion variants + shimmer
  pass + magnetic glow, adapted from 21st.dev "Animated Gradient Button")
- `components/shell/scroll-reveal.tsx` (new — Apple-style fade + lift on
  viewport entry, honours `prefers-reduced-motion`)
- `components/shell/shader-background.tsx` (now layers WebGL canvas on top
  of the CSS gradients + masked dot grid + grain)
- `components/shell/top-nav.tsx` (tube-light layoutId indicator + brand
  badge hover-glow)
- `components/shell/page-shell.tsx` (gradient title clip + scroll-reveal
  on header + content; new optional `hero` slot)
- `components/shell/kpi-tile.tsx` (now a thin compatibility wrapper that
  renders `<StatCard>`, exposes `tone` prop)
- `components/shell/tab-bar.tsx` (now a thin compatibility wrapper that
  renders `<SlidingTabs>`)
- `app/overview/page.tsx` (StatCard tones + GlowCard module navigators
  with mouse-tracked halo + scroll-reveal sections)
- `app/omniroute/page.tsx` (StatCard tones + GlowCard skeleton modules
  with hover lift + scroll-reveal)
- `app/account-manager/layout.tsx` (gradient title + scroll-reveal stages)
- `app/account-manager/[family]/page.tsx` (GlowCard list panel + animated
  tag rail with hover transitions)
Verification:
- `npm run typecheck` — clean (`tsc --noEmit`).
- `npm run lint` — clean (`next lint`).
- `npm run build` — production build succeeds; all 10 routes generated.
  Bundle: shared chunks 102 kB; `/overview` 2.36 kB / 154 kB first-load
  (delta from Phase 2 covered by `three.js` + framer-motion premium
  surfaces).
Status changes in tracker:
- All Phase 2 items remain `[x]` (unchanged).
- "Next recommended task" pointer remains Phase 3 (AccountManager core),
  unchanged.
Open issues or risks:
- WebGL shader runs on the client only; SSR renders the static gradient +
  dot grid + grain layers (legible without JS).
- 21st.dev API key (`TWENTY_FIRST_API_KEY`) is requested with
  `should_save=true, save_scope="org"` so future sessions can keep
  pulling premium components from Magic MCP without re-prompting.
- Existing call-sites (`<KpiTile>`, `<TabBar>`) keep their previous prop
  shape; they delegate to the new `<StatCard>` and `<SlidingTabs>` so no
  feature code outside the shell needed to change.
Next recommended task:
- Same as Phase 2: Phase 3 (AccountManager core). The redesigned shell
  now waits on user design approval before code starts on Phase 3.

#### May 10, 2026 (Vaultwarden vertical slice)

Date: May 10, 2026
Owner: Codex
Focus: Vaultwarden-first AccountManager integration through localhost
`bw serve`, plus the first agent-facing API slice.
Files changed:
- `.env.example`, `README.md`
- `app/account-manager/[family]/page.tsx`
- `app/account-manager/[family]/[rootAccountId]/page.tsx`
- `app/account-manager/[family]/[rootAccountId]/services/[linkedServiceId]/page.tsx`
- `app/api/internal/services/route.ts`
- `app/api/internal/services/[familySlug]/accounts/route.ts`
- `app/api/internal/root-accounts/[rootAccountId]/route.ts`
- `app/api/internal/linked-service-accounts/[accountId]/route.ts`
- `app/api/internal/linked-service-accounts/[accountId]/totp/route.ts`
- `components/account-manager/{copy-button,roadmap-renderer}.tsx`
- `lib/account-manager/{families,vaultwarden-bridge}.ts`
- `lib/vaultwarden/{config,client}.ts`
- `docs/implementation-tracker.md`, `docs/ultradashboard-spec.md`
Verification:
- `npm run typecheck` — passes after `next build` refreshes `.next/types`.
- `npm run lint` — passes.
- `npm run build` — passes.
Status changes in tracker:
- Phase 3 family tabs, root list views, and root detail views marked `[x]`.
- Phase 3 search and tag filtering marked `[~]` because search is live, while
  tag filtering still waits on persistent account records.
- Phase 4 TOTP generation, credential panel, and roadmap renderer marked `[x]`
  through the Vaultwarden bridge-backed detail view.
- Phase 7 services/accounts listing and full account card + TOTP endpoints
  marked `[x]`.
Open issues or risks:
- The current AccountManager read path is intentionally synthetic: one
  Vaultwarden bridge root account appears in every family tab until real
  `root_accounts` / `linked_service_accounts` rows are bound to `vault_item_id`.
- The approved V1 spec originally assumed plaintext secret columns in
  Postgres. The runtime now prefers Vaultwarden as the live secret source, so
  a follow-up schema migration is still needed to make the persistence model
  match the bridge-backed implementation cleanly.
- The Vaultwarden bridge depends on the bot account staying unlocked in the
  VPS-local `bw serve` systemd service. If that bridge goes down, the detail
  cards fall back to the configured/unconfigured states instead of exposing
  stale secret copies.
Next recommended task:
- Persist real AccountManager entities with `vault_item_id`, finish tag
  filtering, and add note/instruction editing flows on top of the new
  Vaultwarden-first read path.

#### May 10, 2026 (Phase 3 + 4 completion: persistence layer)

Date: May 10, 2026
Owner: Devin
Focus: Phase 3 + Phase 4 completion — DB-backed AccountManager persistence,
linked service CRUD, notes/instruction editing flows, internal API mutation
endpoints, and tag filtering on top of the existing Vaultwarden bridge.
Files changed:
- `lib/db/schema.ts` (added `vault_item_id` column + index on
  `linked_service_accounts`; documented plaintext columns as legacy
  fallback).
- `drizzle/0001_add_vault_item_id.sql` (new migration).
- `lib/account-manager/repository.ts` (new — read + write data access
  layer; credential resolution that prefers Vaultwarden through
  `vault_item_id` and falls back to the plaintext columns; tag,
  instruction, and search helpers).
- `lib/account-manager/actions.ts` (new — server actions for create /
  update / archive / delete flows for both root and linked service
  accounts, plus notes and instruction editing actions).
- `app/account-manager/[family]/page.tsx` (DB-backed root account list,
  tag filter chips, "+ New root" inline form; the Vaultwarden bridge
  card is now a discovery affordance underneath the real list).
- `app/account-manager/[family]/[rootAccountId]/page.tsx` (DB-backed root
  account detail page with metric cards, linked services list, and a
  "+ New linked service" inline form; falls back to the bridge view
  when the synthetic `vaultwarden-bridge` ID is in the URL).
- `app/account-manager/[family]/[rootAccountId]/services/[linkedServiceId]/page.tsx`
  (DB-backed linked service detail page with hybrid credential read,
  inline notes editing, inline instruction JSON editing, archive
  button; falls back to the bridge view when the synthetic
  `vaultwarden-bridge` root ID is in the URL).
- `components/account-manager/{create-root-account-form,create-linked-service-form,edit-notes-form,edit-instructions-form,archive-linked-service-button}.tsx`
  (new client components wired to server actions).
- `components/ui/{input,label,textarea}.tsx` (new minimal shadcn-style
  primitives needed by the forms).
- `app/api/internal/root-accounts/route.ts` (new — POST creates a root
  account).
- `app/api/internal/root-accounts/[rootAccountId]/linked-services/route.ts`
  (new — POST creates a linked service under a root account).
- `app/api/internal/linked-service-accounts/[accountId]/route.ts` (added
  PATCH and DELETE; GET now prefers DB lookup and falls back to the
  Vaultwarden bridge for synthetic IDs).
- `app/api/internal/linked-service-accounts/[accountId]/notes/route.ts`
  (new — PATCH replaces operator notes).
- `app/api/internal/linked-service-accounts/[accountId]/instructions/route.ts`
  (new — PATCH upserts the instruction document with `version: 1`,
  `blocks: [...]` validation).
- `app/api/internal/linked-service-accounts/[accountId]/archive/route.ts`
  (new — POST archives a linked service).
- `app/api/internal/tags/route.ts` (new — GET lists all tags).
- `app/api/internal/search/route.ts` (new — GET cross-family search by
  free-text query and / or tag slug).
Verification:
- `npm run typecheck` — clean.
- `npm run lint` — clean.
- `npm run build` — production build succeeds, all 14 routes generated.
- `npm run db:migrate` — applies `0001_add_vault_item_id.sql` cleanly.
- `npm run db:seed` — service families, tags, catalog seeded.
- Smoke tests against `npm run start` on port 3030: created a root
  account via POST `/api/internal/root-accounts`, attached a ChatGPT
  linked service via POST `/api/internal/root-accounts/{id}/linked-services`
  with `tagSlugs=["primary","agent"]`, edited notes via PATCH
  `/notes`, upserted an instruction document via PATCH
  `/instructions`, archived via POST `/archive`, and finally deleted
  via DELETE — all returned the expected DTOs and HTTP codes.
  `GET /api/internal/search?q=Smoke` and `?tag=agent` returned the
  test row before cleanup.
Status changes in tracker:
- Phase 3 linked service CRUD flows marked `[x]`.
- Phase 3 search and tag filtering marked `[x]` (real DB-backed tag
  filter chips on family page + cross-family search endpoint).
- Phase 4 editing flows for notes and instruction content marked `[x]`
  (inline forms on linked service detail page + matching internal API).
- Phase 7 notes and instructions update endpoints marked `[x]` (plus
  new mutation endpoints for root + linked service CRUD and tag/search
  reads).
Open issues or risks:
- Plaintext password / TOTP columns remain in `linked_service_accounts`
  to satisfy the legacy spec contract. They are now documented as a
  fallback path; new records should set `vault_item_id` and leave the
  plaintext columns null.
- Instruction editing accepts arbitrary JSON shape under the
  `version: 1`, `blocks: [...]` envelope. The roadmap renderer only
  supports the documented block types (overview, steps, tips,
  warnings, links); unknown block types are silently ignored.
- Bridge fallback view stays in place for the synthetic
  `vaultwarden-bridge` root ID so existing operator muscle memory keeps
  working until items are migrated into real linked services.
Next recommended task:
- Phase 5 (OmniRoute integration): implement the read-only SQLite
  adapter against OmniRoute's `storage.sqlite`, then add the hourly
  sync that normalizes provider summaries into Postgres.

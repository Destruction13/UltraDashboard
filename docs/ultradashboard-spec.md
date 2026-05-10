# UltraDashboard specification

This specification defines V1 of UltraDashboard as of May 5, 2026. It is the
build-ready product and technical reference for implementation. It turns the
validated discovery work into a concrete scope, architecture, data model,
screen map, API contract, sync design, and acceptance criteria.

UltraDashboard is a private internal dashboard for two trusted operators and
their trusted agents. It runs on the same VPS as OmniRoute and is reachable
only through the agreed tunnel or private perimeter path. It is not a public
SaaS app, and V1 does not target untrusted users.

## Executive summary

UltraDashboard combines two core modules in one premium internal interface:

- **OmniRoute**: a read-focused control surface for provider availability,
  quotas, tunnel information, endpoints, and operational context.
- **AccountManager**: a structured account workspace for root identities,
  linked service accounts, secrets, TOTP, notes, tags, and human-readable
  usage roadmaps.

The product exists to let two collaborators and their agents share sensitive
operational data in one place, move faster when testing and registering new
services, and avoid scattered instructions, ad hoc secret storage, and brittle
handoffs.

## Product goals

V1 must deliver these outcomes:

- Provide one private dashboard for OmniRoute access context and account ops.
- Make secrets, TOTP codes, and instructions immediately usable in the UI.
- Let trusted agents consume the same information through UI automation or an
  internal API.
- Render instructions as clean premium roadmap content, not raw ugly Markdown.
- Pull OmniRoute summary data every hour without depending on manual refresh.
- Support creation and maintenance of account records from inside the product.

## Non-goals

V1 deliberately does not include the following:

- Multi-user RBAC.
- Public internet access.
- Mobile application support.
- Complex analytics or historical reporting suites.
- Centralized log ingestion.
- Secret auto-rotation.
- Broad third-party integration coverage.
- A custom MCP server for external agents.

## Users and trust model

The only intended human users in V1 are the two project operators. The only
intended machine users in V1 are trusted agents running on behalf of those two
operators.

V1 uses a perimeter trust model:

- If you can reach UltraDashboard, you are already inside the trusted path.
- Agents may read the same secrets that humans can read.
- No fine-grained role model exists in V1.
- No per-agent token model is required in V1.

> **Warning:** This trust model is acceptable only if the app is never exposed
> as a normal public website. The dashboard stores highly sensitive data.

## Validated OmniRoute constraints

The live OmniRoute server was inspected over SSH on May 5, 2026. The following
facts are considered verified inputs to this spec:

- OmniRoute is running as a Next.js management app on port `20128`.
- The app redirects from `/` to `/dashboard`.
- Key management routes return `401` without an authenticated session.
- OmniRoute maintains a live local SQLite store at
  `/root/.omniroute/storage.sqlite`.
- That store already contains relevant tables, including
  `provider_connections`, `quota_snapshots`, and `usage_history`.
- Current provider data includes at least `codex`, `chatgpt-web`, `github`,
  `devin`, and `groq`.

These findings drive the V1 integration decision.

## Primary product decisions

The following decisions are fixed for V1.

### OmniRoute adapter strategy

UltraDashboard uses a read-only OmniRoute adapter with this priority order:

1. Read directly from OmniRoute's local `storage.sqlite` by default.
2. Add authenticated OmniRoute API usage later if it reduces maintenance or
   unlocks missing fields.

This is the most efficient V1 path because the HTTP management API is gated,
while the local data store already exposes the required operational data.

### Tunnel workflow

UltraDashboard does not try to raise a local SSH tunnel from the browser. V1
instead shows a tunnel information card with:

- host reference
- local or remote endpoint reference
- access notes
- copy actions
- related OmniRoute endpoint data

### Secret source of truth

UltraDashboard may maintain account metadata in its own Postgres database, but
the preferred live source of truth for credentials is Vaultwarden when the
Vaultwarden bridge is configured.

The approved bridge shape is:

- Vaultwarden stores the live login, password, login URL, and TOTP secret.
- A localhost-only `bw serve` bridge exposes those records to UltraDashboard on
  the same VPS.
- UltraDashboard reads the current TOTP from that bridge at request time.

This lets the UI show real credentials without forcing the happy path to copy
live secrets into the dashboard database.

### Secrets visibility

Secrets are visible directly in the account detail view. The card shows:

- login or email
- password
- current TOTP code
- tags
- notes
- service metadata

When Vaultwarden is enabled, the card reads those values from Vaultwarden
through the local bridge. The raw TOTP shared secret is still not displayed by
default in the main presentation layer. The UI prioritizes the current usable
OTP.

### Detail layout

The linked service account detail page uses a two-column layout:

- left column: credentials, actions, tags, notes, service metadata
- right column: roadmap and usage instructions

### First-wave service model

The top-level account families in V1 are:

- `GitHub`
- `Google`
- `Zoho`

The first-wave linked service catalog that can hang under those families is:

- `ChatGPT`
- `Codex`
- `GitHub`
- `Devin`

This catalog is shared, but not every root account must have every linked
service.

## Information architecture

The top-level shell uses three primary routes:

1. **Overview**
2. **OmniRoute**
3. **AccountManager**

Inside **AccountManager**, the family tabs are:

- **GitHub**
- **Google**
- **Zoho**

The entity hierarchy is:

`service family -> root account -> linked service account`

Example:

`Google -> personal Google identity -> ChatGPT -> credential card`

## Functional requirements

### Overview module

The Overview page is the landing page and orientation layer. It must answer
what the service is, how to use it, and where to go next.

The page must include:

- short service description
- module cards for OmniRoute and AccountManager
- top-level status summary for last OmniRoute sync
- quick counts for account families and linked service accounts
- a compact card with tunnel and endpoint context
- recent or pinned guidance blocks

The page must not become an analytics dashboard. It is an orientation surface.

### OmniRoute module

The OmniRoute page is an operational summary, not a clone of OmniRoute.

The page must show:

- OmniRoute endpoint reference
- tunnel information card
- last sync time
- provider summary table or cards
- remaining quota signals by provider
- provider active or inactive status
- manual refresh action
- copy actions for endpoint values or config snippets

The page may show provider notes derived from adapter logic, such as quota
health or no recent snapshot.

The page must not ingest full logs in V1.

### AccountManager module

AccountManager is the main working area for account operations. It must support
these capabilities in V1:

- list service families
- list root accounts inside a family
- open a root account detail page
- list linked service accounts under a root account
- open a linked service account detail page
- create a root account
- create a linked service account
- edit linked service account data
- archive linked service accounts
- delete linked service accounts
- edit tags
- edit notes
- edit instructions
- fetch the current TOTP code from the configured secret source

### Linked service account detail view

The linked service account detail view is the most important page in the app.
It must make working data instantly available.

The left column must include:

- service name
- root account reference
- login or email
- password
- current TOTP code
- login URL if present
- tags
- notes
- created or updated metadata
- copy actions

The right column must include:

- roadmap title
- short summary
- step-by-step usage checklist
- helper notes or warnings
- relevant links
- service-specific usage patterns

## UI and design requirements

The UI must look like a premium internal tool with clear craft. V1 may use
`shadcn/ui`, `21st.dev`, Magic MCP-driven component sourcing, and similar
design tooling during implementation, but the final result must feel visually
coherent.

The visual direction is:

- futuristic glass panels
- shader-backed atmosphere
- precise spacing and alignment
- clean card structure
- strong typography hierarchy
- bilingual shell support
- both dark and light themes

The UI must avoid:

- generic admin-dashboard styling
- default-looking Tailwind boilerplate
- raw Markdown presentation for instructions
- inconsistent component aesthetics

### UX rules

The product must optimize for fast use by people and agents.

- Important values must support one-click copy.
- Dense tables are acceptable if spacing and alignment remain clean.
- Search and tag filtering must be available in AccountManager.
- Navigation depth must stay predictable.
- Instruction content must remain readable without switching context.

## Data model

UltraDashboard must use its own Postgres database. It must not share write
tables with OmniRoute.

The current Phase 1 schema still contains plaintext secret columns from the
original plan. When the Vaultwarden bridge is configured, the runtime may treat
those columns as unused legacy fallback and read live secrets directly from
Vaultwarden instead. A follow-up schema migration can replace that fallback
with a first-class `vault_item_id` reference.

### Core entities

The minimum V1 schema is:

#### `service_families`

- `id`
- `slug`
- `name`
- `description`
- `sort_order`
- `is_active`
- `created_at`
- `updated_at`

Examples include `github`, `google`, and `zoho`.

#### `root_accounts`

- `id`
- `service_family_id`
- `display_name`
- `primary_email`
- `username`
- `status`
- `notes`
- `archived_at`
- `created_at`
- `updated_at`

This table represents the base identity inside a family.

#### `linked_service_accounts`

- `id`
- `root_account_id`
- `service_name`
- `service_slug`
- `login_or_email`
- `password_plaintext`
- `totp_secret_plaintext`
- `login_url`
- `status`
- `notes`
- `archived_at`
- `created_at`
- `updated_at`

This table stores the working account record used by humans and agents.

#### `tags`

- `id`
- `slug`
- `label`
- `color_token`
- `created_at`
- `updated_at`

#### `linked_service_account_tags`

- `linked_service_account_id`
- `tag_id`

#### `instruction_documents`

- `id`
- `linked_service_account_id`
- `title`
- `summary`
- `content_json`
- `created_at`
- `updated_at`

#### `omniroute_provider_snapshots`

- `id`
- `provider_name`
- `total_accounts`
- `active_accounts`
- `available_windows`
- `exhausted_windows`
- `average_remaining_pct`
- `display_endpoint`
- `source_last_snapshot_at`
- `synced_at`
- `raw_summary_json`

#### `omniroute_sync_runs`

- `id`
- `started_at`
- `finished_at`
- `status`
- `error_message`
- `source_type`
- `stats_json`

### Instruction document format

`instruction_documents.content_json` must store structured roadmap content.
The baseline schema is:

```json
{
  "version": 1,
  "blocks": [
    {
      "type": "overview",
      "text": "What this account is used for."
    },
    {
      "type": "steps",
      "items": [
        {
          "title": "Open login page",
          "body": "Use the stored login URL and credentials."
        }
      ]
    },
    {
      "type": "tips",
      "items": ["Use TOTP from the left panel when prompted."]
    },
    {
      "type": "links",
      "items": [
        {
          "label": "Open service",
          "url": "https://example.com"
        }
      ]
    }
  ]
}
```

This structure supports premium rendering without forcing raw Markdown output.

## OmniRoute integration design

### Source of truth

For V1, the OmniRoute adapter reads from:

- `/root/.omniroute/storage.sqlite`

The adapter is read-only.

### Source tables used by V1

The adapter may read these tables:

- `provider_connections`
- `quota_snapshots`
- `usage_history`
- `provider_nodes`

### Provider summary logic

The hourly sync job must compute a normalized provider summary for each known
provider. The baseline rules are:

1. Count total connections from `provider_connections` per provider.
2. Count active connections from `provider_connections.is_active`.
3. Resolve the latest `quota_snapshots` row for each connection and window.
4. Count non-exhausted latest windows as available windows.
5. Count exhausted latest windows as exhausted windows.
6. Compute average remaining percentage for the latest rows.
7. Persist a dashboard-owned summary snapshot in Postgres.

### Endpoint display

The OmniRoute page must show the user-facing endpoint reference configured for
the deployment. If the value is static, it may come from UltraDashboard env.
If it becomes derivable later from OmniRoute config or provider node data, the
adapter may populate it dynamically.

### Sync schedule

The sync runner must execute every hour. It may also run on demand through a
manual refresh action in the UI.

If a sync fails, the dashboard must:

- keep the last successful snapshot visible
- show the last successful sync time
- show the failed sync state in the UI
- avoid deleting previous data

## TOTP design

UltraDashboard must return the current TOTP code through a server-side secret
bridge.

V1 requirements:

- Prefer Vaultwarden as the live source of truth for TOTP secrets when the
  bridge is configured.
- Generate or retrieve the current code server-side on demand.
- Return the current code and expiry window to the UI.
- Support agent access through the internal API.

V1 does not integrate with `2fun` by default.

## Internal API contract

UltraDashboard must provide an internal API for trusted agents. The namespace
should live under `/api/internal` or an equivalent private route group.

The minimum V1 operations are:

### Services and accounts

- `GET /api/internal/services`
- `GET /api/internal/services/:familySlug/accounts`
- `GET /api/internal/root-accounts/:rootAccountId`
- `POST /api/internal/root-accounts`
- `POST /api/internal/root-accounts/:rootAccountId/linked-services`
- `GET /api/internal/linked-service-accounts/:accountId`
- `PATCH /api/internal/linked-service-accounts/:accountId`
- `DELETE /api/internal/linked-service-accounts/:accountId`
- `POST /api/internal/linked-service-accounts/:accountId/archive`

### Tags and search

- `GET /api/internal/tags`
- `GET /api/internal/search?tag=...`

### Instructions and notes

- `PATCH /api/internal/linked-service-accounts/:accountId/notes`
- `PATCH /api/internal/linked-service-accounts/:accountId/instructions`

### TOTP

- `GET /api/internal/linked-service-accounts/:accountId/totp`

### OmniRoute

- `GET /api/internal/omniroute/summary`
- `GET /api/internal/omniroute/providers`
- `POST /api/internal/omniroute/sync`

### Response rules

The internal API must:

- return JSON only
- use stable ids
- include timestamps where relevant
- keep error messages clear but not verbose with secrets

## Page-by-page requirements

### `/`

This route redirects to `/overview`.

### `/overview`

This page must include:

- a product intro section
- cards linking to OmniRoute and AccountManager
- a compact OmniRoute sync summary
- account totals by family
- a tunnel info panel
- pinned guidance or quick instructions

### `/omniroute`

This page must include:

- headline status section
- tunnel information card
- endpoint and copy actions
- last sync state
- provider summary cards or table
- manual refresh action

### `/account-manager`

This route opens the AccountManager shell and defaults to the first family tab.

### `/account-manager/[family]`

This page must include:

- family header
- search
- tag filtering
- root account table
- create root account action

### `/account-manager/[family]/[rootAccountId]`

This page must include:

- root account metadata
- list of linked service accounts
- create linked service account action
- quick actions for edit and archive

### `/account-manager/[family]/[rootAccountId]/services/[linkedServiceId]`

This page is the primary working detail view. It must include:

- left credential column
- right instruction roadmap column
- edit actions
- copy actions
- visible password
- visible current OTP

## Search and filtering

AccountManager must support these V1 search behaviors:

- search by root account display name
- search by linked service login or email
- filter by tag
- filter by service family

Search does not need full-text sophistication in V1. Standard indexed string
matching is enough.

## Deployment architecture

V1 deployment uses the same VPS as OmniRoute. The recommended deployment model
is `Docker Compose` with separate services for:

- `ultradashboard-web`
- `ultradashboard-db`

The app must also mount or otherwise access OmniRoute's local storage path in a
read-only manner for the adapter job.

### Environment variables

The dashboard will need at least:

- `DATABASE_URL`
- `ULTRADASHBOARD_BASE_URL`
- `OMNIROUTE_SQLITE_PATH`
- `OMNIROUTE_DISPLAY_ENDPOINT`
- `OMNIROUTE_TUNNEL_INFO_JSON`
- `SYNC_CRON_OR_INTERVAL`
- `VAULTWARDEN_BASE_URL`
- `VAULTWARDEN_INTERNAL_ACCESS_MODE`
- `BW_SERVE_URL`
- `VAULTWARDEN_TEST_ITEM_ID`
- `DEFAULT_LOCALE`

If a minimal auth layer is added later, it must use separate env keys.

## Security and risk acceptance

V1 stores highly sensitive operational data. The user explicitly accepted a
high-risk storage posture for speed. This must be recorded as a conscious
decision.

### Accepted V1 posture

- live secrets may be resolved from a localhost-only Vaultwarden bridge
- legacy plaintext secret columns may still exist in the dashboard DB until a
  cleanup migration lands
- no per-user auth model inside the app
- no per-agent token model
- access controlled by tunnel or perimeter only

### Minimum required safeguards

- bind the app only to the trusted network path
- keep the app off the open public internet
- disable analytics and third-party trackers
- never log passwords or TOTP secrets
- keep OmniRoute adapter access read-only
- keep UltraDashboard DB separate from OmniRoute DB
- keep `bw serve` bound to localhost only

### Deferred hardening

The following improvements are recommended for a future version but are not in
scope for V1:

- secret encryption at rest
- app-level authentication
- audit history
- per-agent credentials
- fine-grained access control

## Recommended implementation plan

The implementation order for ClaudeCode or multiple Devin sessions is:

1. Scaffold Next.js app shell, themes, layout, and route structure.
2. Add Postgres integration and migrations for core dashboard tables.
3. Implement AccountManager CRUD flows and data access.
4. Implement TOTP generation and detail card actions.
5. Implement instruction document model and premium roadmap renderer.
6. Implement OmniRoute SQLite adapter and sync runner.
7. Build OmniRoute page and Overview summaries.
8. Expose internal agent API.
9. Add deployment assets and VPS runbook.

## Acceptance criteria

V1 is complete only when all of the following are true.

### Core shell

- The app has working routes for Overview, OmniRoute, and AccountManager.
- Dark and light themes both render correctly.
- The shell supports language toggling for interface labels.

### OmniRoute

- The dashboard can read OmniRoute provider data from the configured SQLite
  path.
- The hourly sync persists normalized provider summaries to Postgres.
- The OmniRoute page shows provider name, active state summary, remaining quota
  signal, last sync time, and endpoint context.
- A failed sync does not wipe prior provider summaries.

### AccountManager

- A user can create, edit, archive, and delete linked service accounts.
- A user can browse GitHub, Google, and Zoho families.
- A user can open a linked service account and immediately see login, password,
  and current OTP.
- Tags can be attached and used for filtering.
- Instructions render as a structured roadmap, not raw Markdown.

### Agent access

- An agent can list services and accounts through the internal API.
- An agent can fetch the full account card and current OTP.
- An agent can read OmniRoute summary data through the internal API.
- An agent can update notes and instruction content.

### Deployment

- The app can run on the OmniRoute VPS without breaking OmniRoute.
- OmniRoute storage is accessed read-only.
- The app is reachable only through the intended private access path.

## Open decisions intentionally deferred

The following items remain open for future versions or later project phases:

- whether to add minimal app auth beyond the tunnel
- whether to encrypt secrets at rest
- whether to version instructions
- whether to expose raw TOTP shared secrets in advanced mode
- whether to add export or backup workflows
- whether to consume OmniRoute authenticated APIs instead of SQLite later

## Build note for the next artifact

This specification is the source document for the next artifact: a master
execution prompt and handoff protocol for ClaudeCode Opus 4.7 and multiple
Devin accounts. That prompt should reference this spec instead of redefining
product scope from scratch.
